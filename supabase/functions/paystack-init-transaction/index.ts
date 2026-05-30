// paystack-init-transaction — called by the upgrade modal when the user clicks
// "Pay" after ticking the consent checkbox. Does the following, in order:
//
//   1. verify the JWT and extract the user id (auth gate)
//   2. read the request body (plan, billing_cycle, currency, consent versions)
//   3. enforce the free-plan gate: user must have logged ≥1 real (non-demo) trade
//      — this defends against "I didn't know what I was buying" chargebacks
//   4. resolve {plan_code, amount} from PAYSTACK_PLAN_CODES + local PRICING table
//   5. insert a pending_intents row capturing consent + IP + UA (chargeback evidence)
//   6. call Paystack /transaction/initialize with metadata pointing at the intent
//   7. return { authorization_url, reference } — the client redirects to that URL
//
// Required secrets:
//   PAYSTACK_SECRET_KEY        — sk_test_xxx / sk_live_xxx
//   PAYSTACK_PLAN_CODES        — JSON map of 8 plan codes (see _shared/paystack-plans.ts)
//   PAYSTACK_RETURN_URL        — defaults to https://edgeflow.capital/billing/return
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto)
//
// Deploy with verify_jwt = true (default) so unauthenticated calls 401 at the
// Supabase gateway before our code runs.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import {
  type BillingCycle,
  type Currency,
  type Plan,
  resolvePlanCode,
} from "../_shared/paystack-plans.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type InitRequest = {
  plan: Plan;
  billing_cycle: BillingCycle;
  currency: Currency;
  terms_version: string;
  refunds_version: string;
  privacy_version: string;
  consent_checkbox_text: string;
};

function err(message: string, status: number, extra: Record<string, unknown> = {}) {
  return new Response(JSON.stringify({ error: message, ...extra }), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function isValidPlan(v: unknown): v is Plan {
  return v === "pro" || v === "elite";
}
function isValidCycle(v: unknown): v is BillingCycle {
  return v === "monthly" || v === "annual";
}
function isValidCurrency(v: unknown): v is Currency {
  return v === "KES" || v === "USD" || v === "EUR" || v === "GBP";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return err("method not allowed", 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const paystackKey = Deno.env.get("PAYSTACK_SECRET_KEY");
  const returnUrl = Deno.env.get("PAYSTACK_RETURN_URL") ?? "https://edgeflow.capital/billing/return";

  if (!paystackKey) return err("PAYSTACK_SECRET_KEY is not configured", 500);

  // ─── 1. Auth ────────────────────────────────────────────────────────────
  const authHeader = req.headers.get("authorization") ?? "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!jwt) return err("missing bearer token", 401);

  const authClient = createClient(supabaseUrl, serviceKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data: userResp, error: userErr } = await authClient.auth.getUser(jwt);
  if (userErr || !userResp.user) return err("invalid token", 401);
  const user = userResp.user;
  const userEmail = user.email;
  if (!userEmail) return err("user has no email on file", 400);

  // ─── 2. Body ────────────────────────────────────────────────────────────
  let body: InitRequest;
  try {
    body = await req.json();
  } catch {
    return err("invalid json body", 400);
  }
  if (!isValidPlan(body.plan)) return err("invalid plan", 400);
  if (!isValidCycle(body.billing_cycle)) return err("invalid billing_cycle", 400);
  if (!isValidCurrency(body.currency)) return err("invalid currency", 400);
  if (!body.terms_version || !body.refunds_version || !body.privacy_version) {
    return err("missing consent versions", 400);
  }
  if (!body.consent_checkbox_text || body.consent_checkbox_text.length < 10) {
    return err("missing or too-short consent_checkbox_text", 400);
  }

  // ─── 3. Free-plan gate ──────────────────────────────────────────────────
  // Service-role client bypasses RLS so we can count trades for any user.
  const adminClient = createClient(supabaseUrl, serviceKey);
  const { count: tradeCount, error: tradeErr } = await adminClient
    .from("trades")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_demo", false);
  if (tradeErr) {
    console.error("trade count failed", tradeErr);
    return err("failed to verify trade history", 500);
  }
  if ((tradeCount ?? 0) < 1) {
    return err(
      "Log at least one real trade before upgrading. This is for your protection — we want you to evaluate EdgeFlow on your data first.",
      403,
      { reason: "free_plan_gate" },
    );
  }

  // ─── 3.5. Block duplicate active subscriptions ──────────────────────────
  const { data: existingActive } = await adminClient
    .from("subscriptions")
    .select("id, plan, status")
    .eq("user_id", user.id)
    .in("status", ["active", "past_due", "cancelling"])
    .maybeSingle();
  if (existingActive) {
    return err(
      "You already have an active subscription. Manage it in Settings → Subscription.",
      409,
      { reason: "already_subscribed", existing_plan: existingActive.plan, existing_status: existingActive.status },
    );
  }

  // ─── 4. Plan code resolution ────────────────────────────────────────────
  const resolution = resolvePlanCode(body.plan, body.billing_cycle, body.currency);
  if ("error" in resolution) return err(resolution.error, 400);
  const { planCode, planKey, amount, billingCurrency } = resolution;

  // ─── 5. Audit row — capture consent BEFORE we hand the user to Paystack ─
  // If they pay and the webhook is delayed, the reconcile cron uses this row's
  // paystack_reference to look up what happened.
  const ipAtSignup = req.headers.get("cf-connecting-ip")
    ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? null;
  const userAgent = req.headers.get("user-agent")?.slice(0, 500) ?? null;
  const reference = `ef_${user.id.replace(/-/g, "").slice(0, 12)}_${Date.now()}`;

  const { data: intent, error: intentErr } = await adminClient
    .from("pending_intents")
    .insert({
      user_id: user.id,
      paystack_reference: reference,
      plan: body.plan,
      billing_cycle: body.billing_cycle,
      currency: billingCurrency,
      amount,
      status: "pending",
      terms_version_accepted: body.terms_version,
      refunds_version_accepted: body.refunds_version,
      privacy_version_accepted: body.privacy_version,
      ip_at_signup: ipAtSignup,
      user_agent_at_signup: userAgent,
      consent_checkbox_text: body.consent_checkbox_text,
    })
    .select("id")
    .single();
  if (intentErr || !intent) {
    console.error("pending_intents insert failed", intentErr);
    return err("failed to record purchase intent", 500);
  }

  // ─── 6. Call Paystack ───────────────────────────────────────────────────
  const paystackResp = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${paystackKey}`,
    },
    body: JSON.stringify({
      email: userEmail,
      amount,
      currency: billingCurrency,
      plan: planCode,
      reference,
      callback_url: returnUrl,
      metadata: {
        user_id: user.id,
        intent_id: intent.id,
        plan: body.plan,
        billing_cycle: body.billing_cycle,
        plan_key: planKey,
        custom_fields: [
          {
            display_name: "Plan",
            variable_name: "plan",
            value: `EdgeFlow ${body.plan === "pro" ? "Pro" : "Elite"} (${body.billing_cycle})`,
          },
        ],
      },
    }),
  });
  const paystackJson = await paystackResp.json();
  if (!paystackResp.ok || !paystackJson?.status) {
    console.error("paystack init failed", paystackJson);
    // Mark the intent as failed so the reconcile cron doesn't keep checking it.
    await adminClient
      .from("pending_intents")
      .update({ status: "failed", completed_at: new Date().toISOString() })
      .eq("id", intent.id);
    return err("payment provider could not initialise the transaction", 502, {
      paystack_error: paystackJson?.message,
    });
  }

  const data = paystackJson.data;
  return new Response(
    JSON.stringify({
      authorization_url: data.authorization_url,
      access_code: data.access_code,
      reference: data.reference,
    }),
    { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
  );
});
