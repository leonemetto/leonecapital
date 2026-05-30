// paystack-webhook — receives every Paystack event for our account.
//
// Design priorities, in order:
//   1. NEVER grant Pro access from client code. Only this function (running with
//      service-role privilege) writes to subscriptions.
//   2. Verify HMAC SHA-512 of the raw body using PAYSTACK_SECRET_KEY before
//      doing anything else. A forged webhook must 401.
//   3. Idempotency via webhook_events PK = paystack event id. A retried event
//      hits a unique-violation and returns 200 without reprocessing.
//   4. Replay defense: reject events whose paystack created_at is >5 min old.
//      (Paystack itself doesn't add anti-replay; we do.)
//   5. ALWAYS return 200 to Paystack except on signature failure (401) or
//      bad-JSON (400). Internal errors are logged + 200'd so Paystack stops
//      retrying. The reconcile cron picks up anything we mishandled.
//   6. Resend emails are fire-and-forget (EdgeRuntime.waitUntil) so a slow SMTP
//      can't hold up the webhook ack.
//
// Required secrets:
//   PAYSTACK_SECRET_KEY              — sk_test_xxx / sk_live_xxx (used for HMAC)
//   PAYSTACK_SECRET_KEY_PREVIOUS     — optional, for 24h rotation window
//   RESEND_API_KEY                   — for transactional emails
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto)
//
// Deploy with verify_jwt = false — Paystack does not send a Supabase JWT.
// We verify Paystack's signature instead.

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { verifyPaystackSignature } from "../_shared/paystack-hmac.ts";

// deno-lint-ignore no-explicit-any
type Json = any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-paystack-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const REPLAY_WINDOW_SECONDS = 5 * 60;

// Best-effort fire-and-forget across runtimes that have EdgeRuntime.waitUntil
// (Supabase) and those that don't (local dev).
function waitUntil(p: Promise<unknown>) {
  // deno-lint-ignore no-explicit-any
  const er = (globalThis as any).EdgeRuntime;
  if (er?.waitUntil) er.waitUntil(p);
  else p.catch((e) => console.warn("background task failed", e));
}

function jsonResponse(body: Json, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

// ─── Resend transactional emails (best-effort) ────────────────────────────
async function sendEmail(opts: {
  apiKey: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}): Promise<void> {
  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "EdgeFlow <noreply@edgeflow.capital>",
      to: [opts.to],
      reply_to: opts.replyTo ?? "support@edgeflow.capital",
      subject: opts.subject,
      text: opts.text,
      html: opts.html ?? `<pre style="font-family:system-ui;white-space:pre-wrap">${opts.text}</pre>`,
    }),
  });
  if (!resp.ok) {
    const body = await resp.text();
    console.warn("resend send failed", resp.status, body);
  }
}

// ─── Date helpers ─────────────────────────────────────────────────────────
function addCycle(from: Date, cycle: "monthly" | "annual"): Date {
  const d = new Date(from);
  if (cycle === "annual") d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d;
}

function parseDate(v: unknown): Date | null {
  if (!v) return null;
  const d = new Date(v as string);
  return isNaN(d.getTime()) ? null : d;
}

// ─── Channel inference ────────────────────────────────────────────────────
function mapChannel(c: string | undefined | null): "card" | "mpesa" | "bank" | "apple_pay" | "other" {
  if (!c) return "other";
  const x = c.toLowerCase();
  if (x.includes("mobile_money") || x.includes("mpesa")) return "mpesa";
  if (x.includes("card")) return "card";
  if (x.includes("bank")) return "bank";
  if (x.includes("apple")) return "apple_pay";
  return "other";
}

// ─── Per-event handlers ───────────────────────────────────────────────────
// Each handler is idempotent on its own (besides the webhook_events guard).

async function handleChargeSuccess(supa: SupabaseClient, evt: Json, resendKey: string) {
  const data = evt.data ?? {};
  const reference: string | undefined = data.reference;
  const customerEmail: string | undefined = data.customer?.email;
  const channel = mapChannel(data.channel);
  const amount: number = data.amount ?? 0;
  const currency: string = data.currency ?? "USD";
  const paidAt = parseDate(data.paid_at ?? data.paidAt) ?? new Date();
  const metadata = data.metadata ?? {};
  const userIdHint: string | undefined = metadata.user_id;
  const planHint: string | undefined = metadata.plan;
  const cycleHint: string | undefined = metadata.billing_cycle;
  const intentIdHint: string | undefined = metadata.intent_id;

  if (!reference) {
    console.warn("charge.success without reference, ignoring");
    return;
  }

  // 1. Resolve the pending_intent for this reference (path for first charge).
  //    A renewal charge won't have an intent — we'll match by sub id instead.
  const { data: intent } = await supa
    .from("pending_intents")
    .select("*")
    .eq("paystack_reference", reference)
    .maybeSingle();

  // 2. Find or create the subscription row.
  let subId: string | null = null;
  let isFirstCharge = false;

  if (intent) {
    // First charge for this checkout
    const existing = await supa
      .from("subscriptions")
      .select("id, plan, status")
      .eq("user_id", intent.user_id)
      .in("status", ["active", "past_due", "cancelling"])
      .maybeSingle();

    if (existing.data) {
      // Defensive: somehow user paid again while still active. Update intent and skip.
      console.warn("charge.success but user already has active sub", existing.data);
      subId = existing.data.id;
    } else {
      const periodEnd = addCycle(paidAt, intent.billing_cycle);
      const insert = await supa
        .from("subscriptions")
        .insert({
          user_id: intent.user_id,
          plan: intent.plan,
          billing_cycle: intent.billing_cycle,
          amount: intent.amount,
          currency: intent.currency,
          channel,
          status: "active",
          started_at: paidAt.toISOString(),
          current_period_start: paidAt.toISOString(),
          current_period_end: periodEnd.toISOString(),
          terms_version_accepted: intent.terms_version_accepted,
          refunds_version_accepted: intent.refunds_version_accepted,
          privacy_version_accepted: intent.privacy_version_accepted,
          ip_at_signup: intent.ip_at_signup,
          user_agent_at_signup: intent.user_agent_at_signup,
          consent_checkbox_text: intent.consent_checkbox_text,
        })
        .select("id")
        .single();
      if (insert.error) {
        console.error("subscription insert failed", insert.error);
        return;
      }
      subId = insert.data.id;
      isFirstCharge = true;
    }

    // Mark the intent completed
    await supa
      .from("pending_intents")
      .update({ status: "completed", completed_at: paidAt.toISOString() })
      .eq("id", intent.id);
  } else if (userIdHint) {
    // Renewal path — look up the existing sub by user_id (no paystack_sub_id yet
    // for renewals on plans that don't include it in the charge event)
    const existing = await supa
      .from("subscriptions")
      .select("id, current_period_end, billing_cycle, status")
      .eq("user_id", userIdHint)
      .in("status", ["active", "past_due", "cancelling"])
      .maybeSingle();
    if (existing.data) {
      const newStart = paidAt;
      const newEnd = addCycle(newStart, existing.data.billing_cycle);
      await supa
        .from("subscriptions")
        .update({
          status: "active",
          current_period_start: newStart.toISOString(),
          current_period_end: newEnd.toISOString(),
        })
        .eq("id", existing.data.id);
      subId = existing.data.id;
    }
  }

  // 3. Welcome email — only on the first charge for a brand-new subscription
  if (isFirstCharge && customerEmail) {
    const planLabel = planHint === "elite" ? "Elite" : "Pro";
    const cycleLabel = cycleHint === "annual" ? "annually" : "monthly";
    const amountDisplay = currency === "KES"
      ? `KES ${(amount / 100).toLocaleString()}`
      : `$${(amount / 100).toFixed(2)}`;
    waitUntil(sendEmail({
      apiKey: resendKey,
      to: customerEmail,
      subject: `Welcome to EdgeFlow ${planLabel}`,
      text: [
        `Welcome to EdgeFlow ${planLabel}.`,
        ``,
        `You were charged ${amountDisplay} and your subscription renews ${cycleLabel}.`,
        ``,
        `You can manage or cancel at any time from Settings → Subscription.`,
        ``,
        `Our refund policy is at https://edgeflow.capital/refunds — the first month is refundable for 7 days, no questions asked.`,
        ``,
        `If anything looks wrong with this charge, reply to this email before contacting your bank. We respond within 2 business days and resolve eligible refunds faster than any chargeback process.`,
        ``,
        `— Leone`,
        `Founder, EdgeFlow`,
      ].join("\n"),
    }));
  }
}

async function handleSubscriptionCreate(supa: SupabaseClient, evt: Json) {
  const data = evt.data ?? {};
  const subCode: string | undefined = data.subscription_code;
  const customerCode: string | undefined = data.customer?.customer_code;
  const authCode: string | undefined = data.authorization?.authorization_code;
  const planCode: string | undefined = data.plan?.plan_code;
  const customerEmail: string | undefined = data.customer?.email;
  const nextPayment = parseDate(data.next_payment_date);

  if (!subCode || !customerEmail) {
    console.warn("subscription.create missing fields", { subCode, customerEmail });
    return;
  }

  // Find sub by customer email + active status
  const { data: userRow } = await supa.auth.admin.listUsers({ page: 1, perPage: 1 });
  // ^ unused — auth admin list-by-email isn't in supa-js v2. Use a query instead.
  const { data: matched } = await supa
    .from("subscriptions")
    .select("id, user_id")
    .in("status", ["active", "past_due", "cancelling"])
    .is("paystack_subscription_id", null)
    .order("created_at", { ascending: false })
    .limit(10);

  // Pick the row that belongs to the email — query auth via service role
  let rowId: string | null = null;
  for (const row of matched ?? []) {
    const { data: u } = await supa.auth.admin.getUserById(row.user_id);
    if (u?.user?.email === customerEmail) {
      rowId = row.id;
      break;
    }
  }
  if (!rowId) {
    console.warn("subscription.create — no matching active sub row for", customerEmail);
    return;
  }

  const update: Record<string, unknown> = {
    paystack_subscription_id: subCode,
    paystack_customer_code: customerCode,
    paystack_authorization_code: authCode,
    paystack_plan_code: planCode,
  };
  if (nextPayment) update.current_period_end = nextPayment.toISOString();

  await supa.from("subscriptions").update(update).eq("id", rowId);
}

async function handleInvoicePaymentFailed(supa: SupabaseClient, evt: Json, resendKey: string) {
  const data = evt.data ?? {};
  const subCode: string | undefined = data.subscription?.subscription_code;
  const email: string | undefined = data.customer?.email;
  if (!subCode) return;

  await supa
    .from("subscriptions")
    .update({ status: "past_due" })
    .eq("paystack_subscription_id", subCode);

  if (email) {
    waitUntil(sendEmail({
      apiKey: resendKey,
      to: email,
      subject: "Your EdgeFlow payment didn't go through",
      text: [
        "Your most recent EdgeFlow renewal charge failed.",
        "",
        "Paystack will retry your card a few more times over the next 7 days. Your Pro/Elite access continues during this retry window.",
        "",
        "To update your card immediately, head to Settings → Subscription on edgeflow.capital.",
        "",
        "If you want help, reply to this email — we're here.",
        "",
        "— EdgeFlow",
      ].join("\n"),
    }));
  }
}

async function handleInvoiceUpdate(supa: SupabaseClient, evt: Json) {
  const data = evt.data ?? {};
  const subCode: string | undefined = data.subscription?.subscription_code;
  const status: string | undefined = data.status;
  const nextEnd = parseDate(data.period_end ?? data.subscription?.next_payment_date);
  if (!subCode) return;

  if (status === "success") {
    const update: Record<string, unknown> = { status: "active" };
    if (nextEnd) update.current_period_end = nextEnd.toISOString();
    await supa.from("subscriptions").update(update).eq("paystack_subscription_id", subCode);
  }
}

async function handleSubscriptionDisable(supa: SupabaseClient, evt: Json, resendKey: string) {
  const data = evt.data ?? {};
  const subCode: string | undefined = data.subscription_code;
  const email: string | undefined = data.customer?.email;
  // Paystack indicates failure-driven cancellations differently per channel.
  // We treat any disable with status='complete' and next_payment_date<now as
  // 'cancelled' (user cancel) and any other as 'expired' (failed payment).
  const reasonHint: string = (data.status ?? "").toLowerCase();
  const isFailedPayment = reasonHint.includes("non-renewing") === false && reasonHint.includes("complete") === false;

  if (!subCode) return;

  const newStatus = isFailedPayment ? "expired" : "cancelled";
  await supa
    .from("subscriptions")
    .update({
      status: newStatus,
      ended_at: new Date().toISOString(),
    })
    .eq("paystack_subscription_id", subCode);

  if (email) {
    waitUntil(sendEmail({
      apiKey: resendKey,
      to: email,
      subject: newStatus === "expired"
        ? "Your EdgeFlow subscription has ended"
        : "Your EdgeFlow subscription is now cancelled",
      text: newStatus === "expired"
        ? [
            "Your EdgeFlow subscription has been cancelled because we couldn't collect payment after several retries.",
            "",
            "Your trade data is safe — you can re-subscribe any time from edgeflow.capital and pick up where you left off.",
            "",
            "If you'd like help (or this is a mistake), reply to this email.",
            "",
            "— EdgeFlow",
          ].join("\n")
        : [
            "Your EdgeFlow subscription is now fully cancelled.",
            "",
            "Your trade data is safe and will stay on your account. You can resubscribe any time from edgeflow.capital.",
            "",
            "Thanks for trying EdgeFlow.",
            "",
            "— Leone",
            "Founder, EdgeFlow",
          ].join("\n"),
    }));
  }
}

async function handleSubscriptionNotRenew(supa: SupabaseClient, evt: Json) {
  const data = evt.data ?? {};
  const subCode: string | undefined = data.subscription_code;
  const nextPayment = parseDate(data.next_payment_date);
  if (!subCode) return;
  const update: Record<string, unknown> = {
    status: "cancelling",
    cancelled_at: new Date().toISOString(),
  };
  if (nextPayment) update.cancel_at = nextPayment.toISOString();
  await supa.from("subscriptions").update(update).eq("paystack_subscription_id", subCode);
}

async function handleRefundProcessed(supa: SupabaseClient, evt: Json, resendKey: string) {
  const data = evt.data ?? {};
  const refundId: string | undefined = data.id ?? data.refund_reference;
  const txReference: string | undefined = data.transaction_reference ?? data.transaction?.reference;
  const amount: number = data.amount ?? 0;
  const currency: string = data.currency ?? "USD";
  const customerEmail: string | undefined = data.customer?.email;

  if (!refundId) {
    console.warn("refund.processed missing refund id");
    return;
  }

  // Find sub by transaction reference → pending_intent → user
  let userId: string | null = null;
  let subId: string | null = null;
  let currentPeriodEnd: Date | null = null;
  if (txReference) {
    const { data: intent } = await supa
      .from("pending_intents")
      .select("user_id")
      .eq("paystack_reference", txReference)
      .maybeSingle();
    if (intent) userId = intent.user_id;
  }
  if (userId) {
    const { data: sub } = await supa
      .from("subscriptions")
      .select("id, current_period_end")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (sub) {
      subId = sub.id;
      currentPeriodEnd = parseDate(sub.current_period_end);
    }
  }

  if (!userId) {
    console.warn("refund.processed — could not resolve user", { txReference, refundId });
    return;
  }

  await supa.from("refunds_issued").insert({
    user_id: userId,
    subscription_id: subId,
    amount,
    currency,
    reason: "paystack_initiated",
    paystack_refund_id: refundId,
    issued_by: "paystack",
  });

  // If the refund happened within the current period, revoke access now.
  if (subId && currentPeriodEnd && currentPeriodEnd.getTime() > Date.now()) {
    await supa
      .from("subscriptions")
      .update({ status: "cancelled", ended_at: new Date().toISOString() })
      .eq("id", subId);
  }

  if (customerEmail) {
    const amountDisplay = currency === "KES"
      ? `KES ${(amount / 100).toLocaleString()}`
      : `$${(amount / 100).toFixed(2)}`;
    waitUntil(sendEmail({
      apiKey: resendKey,
      to: customerEmail,
      subject: "Your EdgeFlow refund has been processed",
      text: [
        `We've processed a refund of ${amountDisplay} to your original payment method.`,
        "",
        "Card refunds typically appear within 3–10 business days. M-Pesa refunds usually arrive within 24 hours.",
        "",
        "If you have any questions, reply to this email.",
        "",
        "— EdgeFlow",
      ].join("\n"),
    }));
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const paystackKey = Deno.env.get("PAYSTACK_SECRET_KEY");
  const paystackKeyPrev = Deno.env.get("PAYSTACK_SECRET_KEY_PREVIOUS") ?? undefined;
  const resendKey = Deno.env.get("RESEND_API_KEY") ?? "";
  if (!paystackKey) return jsonResponse({ error: "PAYSTACK_SECRET_KEY not configured" }, 500);

  // 1. Raw body BEFORE any parse — required for HMAC over exact bytes
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");
  const valid = await verifyPaystackSignature(rawBody, signature, paystackKey, paystackKeyPrev);
  if (!valid) {
    console.warn("paystack-webhook: invalid signature");
    return jsonResponse({ error: "invalid signature" }, 401);
  }

  // 2. Parse
  let evt: Json;
  try {
    evt = JSON.parse(rawBody);
  } catch {
    return jsonResponse({ error: "bad json" }, 400);
  }
  const eventType: string = evt?.event ?? evt?.type ?? "";
  const eventId: string | undefined = evt?.id ?? evt?.data?.id ?? evt?.data?.reference;
  const paystackCreatedAt = parseDate(evt?.created_at ?? evt?.data?.created_at);

  if (!eventType) {
    console.warn("paystack-webhook: missing event type");
    return jsonResponse({ ok: true, ignored: "no event type" });
  }

  // 3. Replay defense — reject events older than the window
  if (paystackCreatedAt) {
    const ageSec = (Date.now() - paystackCreatedAt.getTime()) / 1000;
    if (ageSec > REPLAY_WINDOW_SECONDS) {
      console.warn("paystack-webhook: replay-window reject", { eventType, ageSec });
      return jsonResponse({ error: "event too old" }, 401);
    }
  }

  const supa = createClient(supabaseUrl, serviceKey);

  // 4. Idempotency — insert the event id; duplicate raises 23505 → return 200 fast
  if (eventId) {
    const { error: insertErr } = await supa.from("webhook_events").insert({
      id: eventId,
      event_type: eventType,
      raw_payload: evt,
      signature_verified: true,
      paystack_created_at: paystackCreatedAt?.toISOString() ?? null,
    });
    if (insertErr) {
      // 23505 unique_violation = duplicate event, already processed
      if ((insertErr as { code?: string }).code === "23505") {
        return jsonResponse({ ok: true, duplicate: true });
      }
      console.error("webhook_events insert failed", insertErr);
      // Fall through and try to process anyway — losing the event is worse than dup work
    }
  }

  // 5. Route by event type
  try {
    switch (eventType) {
      case "charge.success":
        await handleChargeSuccess(supa, evt, resendKey);
        break;
      case "subscription.create":
        await handleSubscriptionCreate(supa, evt);
        break;
      case "subscription.disable":
        await handleSubscriptionDisable(supa, evt, resendKey);
        break;
      case "subscription.not_renew":
        await handleSubscriptionNotRenew(supa, evt);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(supa, evt, resendKey);
        break;
      case "invoice.update":
        await handleInvoiceUpdate(supa, evt);
        break;
      case "invoice.create":
        // informational
        break;
      case "refund.processed":
        await handleRefundProcessed(supa, evt, resendKey);
        break;
      default:
        console.log("paystack-webhook: unhandled event", eventType);
    }

    if (eventId) {
      await supa
        .from("webhook_events")
        .update({ processed_at: new Date().toISOString() })
        .eq("id", eventId);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("paystack-webhook: handler threw", eventType, msg);
    if (eventId) {
      await supa
        .from("webhook_events")
        .update({ processing_error: msg })
        .eq("id", eventId);
    }
    // Still return 200 — the cron will reconcile. Returning 500 just causes
    // Paystack to hammer us with retries that won't fix the underlying issue.
  }

  return jsonResponse({ ok: true });
});
