// lemon-webhook — receives every Lemon Squeezy event for our store.
//
// Defense-in-depth:
//   1. HMAC SHA-256 verification of the raw body (LS sends x-signature header)
//   2. Idempotency via webhook_events PK = LS event id. A retried event hits
//      a 23505 unique violation on insert, which we treat as already-processed
//      and return 200.
//   3. Replay defense: reject events whose attributes.created_at is >5 min old
//      (catches replayed events that pass signature but are stale).
//
// Event routing — we care about subscription_* and order_refunded:
//   subscription_created             -> UPSERT sub as active
//   subscription_updated             -> UPSERT sub (status follows LS)
//   subscription_payment_success     -> mark active, extend period end
//   subscription_payment_failed      -> mark past_due
//   subscription_payment_recovered   -> mark active (from past_due)
//   subscription_payment_refunded    -> record refund + possibly revoke
//   subscription_cancelled           -> mark cancelling (access until ends_at)
//   subscription_resumed             -> mark active
//   subscription_expired             -> mark cancelled or expired
//   order_refunded                   -> same as payment_refunded
//
// verify_jwt=false in config.toml — LS doesn't send a JWT. Auth is HMAC.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { verifyLemonSignature } from "../_shared/lemon-hmac.ts";
import { upsertSubscriptionFromLemon } from "../_shared/lemon-subscription-state.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("method not allowed", { status: 405 });
  }

  // 1) Read raw body BEFORE any parse — required for HMAC
  const rawBody = await req.text();
  const signatureHeader = req.headers.get("x-signature") ?? "";
  const eventName = req.headers.get("x-event-name") ?? "";

  // 2) Verify signature (current + previous secret for rotation overlap)
  const secrets = [
    Deno.env.get("LEMONSQUEEZY_WEBHOOK_SECRET") ?? "",
    Deno.env.get("LEMONSQUEEZY_WEBHOOK_SECRET_PREVIOUS") ?? "",
  ].filter(Boolean);
  if (secrets.length === 0) {
    console.error("no webhook secret configured");
    return new Response("misconfigured", { status: 500 });
  }
  const valid = await verifyLemonSignature(rawBody, signatureHeader, secrets);
  if (!valid) {
    console.warn("invalid signature; event=", eventName);
    return new Response("invalid signature", { status: 401 });
  }

  // 3) Parse + extract metadata
  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response("invalid json", { status: 400 });
  }

  const eventId: string | undefined =
    payload?.meta?.webhook_id || // some LS versions
    payload?.meta?.event_id ||
    // Fallback: hash of (event_name + entity_id + created_at) — best-effort
    `${eventName}-${payload?.data?.id}-${payload?.data?.attributes?.created_at}`;
  if (!eventId) {
    console.warn("unable to derive event id; rejecting");
    return new Response("missing event id", { status: 400 });
  }

  const eventCreatedAt: string | null = payload?.data?.attributes?.created_at ?? null;

  // 4) Replay defense — reject events older than 5 min
  if (eventCreatedAt) {
    const ageMs = Date.now() - new Date(eventCreatedAt).getTime();
    if (ageMs > 5 * 60 * 1000) {
      console.warn("event too old; possible replay", { eventId, eventCreatedAt });
      return new Response("event too old", { status: 401 });
    }
  }

  const supa = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // 5) Idempotency — insert webhook_events row. Unique violation = already
  //    processed, return 200 with no further work.
  const { error: insertErr } = await supa.from("webhook_events").insert({
    id: eventId,
    provider: "lemonsqueezy",
    event_type: eventName,
    raw_payload: payload,
    signature_verified: true,
    provider_event_created_at: eventCreatedAt,
  });
  if (insertErr) {
    if ((insertErr as { code?: string }).code === "23505") {
      // Duplicate — already processed earlier. Return 200 so LS stops retrying.
      return new Response("ok (duplicate)", { status: 200 });
    }
    console.error("webhook_events insert failed", insertErr);
    return new Response("db error", { status: 500 });
  }

  // 6) Route the event. We want the subscription row to be UPSERTed before
  //    any side effects (emails, refund inserts) so the most important
  //    invariant — "user can read isPro=true" — is satisfied first.
  let processingError: string | null = null;
  try {
    await routeEvent(supa, eventName, payload);
  } catch (e) {
    processingError = e instanceof Error ? e.message : String(e);
    console.error("routing failed", { eventName, eventId, error: processingError });
  }

  // 7) Mark processed (or record the error so we can re-process later)
  await supa
    .from("webhook_events")
    .update({
      processed_at: new Date().toISOString(),
      processing_error: processingError,
    })
    .eq("id", eventId);

  // Always return 200 if we got this far — error rows are surfaced via the
  // unprocessed/processing_error index for follow-up, not by hammering LS retries.
  return new Response("ok", { status: 200 });
});

async function routeEvent(supa: any, eventName: string, payload: any) {
  const data = payload?.data ?? {};
  const attrs = data?.attributes ?? {};
  const custom = payload?.meta?.custom_data ?? {};

  // Common LS payload extraction (subscription events)
  const subPayload = {
    subscriptionId: String(data.id ?? ""),
    customerId: String(attrs.customer_id ?? ""),
    variantId: String(attrs.variant_id ?? ""),
    status: String(attrs.status ?? "active"),
    renewsAt: attrs.renews_at ?? null,
    endsAt: attrs.ends_at ?? null,
    trialEndsAt: attrs.trial_ends_at ?? null,
    createdAt: attrs.created_at ?? new Date().toISOString(),
    cardBrand: attrs.card_brand ?? null,
    userId: custom.user_id ?? null,
    intentId: custom.intent_id ?? null,
  };

  switch (eventName) {
    case "subscription_created":
    case "subscription_updated":
    case "subscription_resumed":
    case "subscription_payment_recovered":
    case "subscription_payment_success": {
      await upsertSubscriptionFromLemon(supa, subPayload);
      return;
    }

    case "subscription_payment_failed": {
      // Force status to past_due regardless of what LS reports
      await upsertSubscriptionFromLemon(supa, { ...subPayload, status: "past_due" });
      return;
    }

    case "subscription_cancelled": {
      await upsertSubscriptionFromLemon(supa, { ...subPayload, status: "cancelled" });
      return;
    }

    case "subscription_expired": {
      await upsertSubscriptionFromLemon(supa, { ...subPayload, status: "expired" });
      return;
    }

    case "subscription_payment_refunded":
    case "order_refunded": {
      // Record the refund and revoke access if it's a full refund within the
      // current period. Partial refunds keep access.
      const refundId = String(data.id ?? attrs.refund_id ?? "");
      const amount = Number(attrs.total ?? attrs.amount ?? 0); // smallest unit
      const isFull = Boolean(attrs.refunded === true || attrs.fully_refunded === true);

      // Find the subscription via either custom_data.user_id or the order's
      // subscription_id attribute
      const subscriptionId = String(attrs.subscription_id ?? subPayload.subscriptionId ?? "");
      let userId = subPayload.userId;
      let internalSubRowId: string | null = null;

      if (subscriptionId) {
        const { data: subRow } = await supa
          .from("subscriptions")
          .select("id, user_id")
          .eq("provider", "lemonsqueezy")
          .eq("provider_subscription_id", subscriptionId)
          .maybeSingle();
        if (subRow) {
          internalSubRowId = subRow.id;
          userId = subRow.user_id;
        }
      }

      if (!userId) {
        throw new Error(`refund event missing user_id (sub=${subscriptionId}, refund=${refundId})`);
      }

      await supa.from("refunds_issued").insert({
        user_id: userId,
        subscription_id: internalSubRowId,
        amount,
        currency: (attrs.currency ?? "USD").toUpperCase(),
        reason: "customer_request",
        provider: "lemonsqueezy",
        provider_refund_id: refundId || null,
        issued_by: "webhook",
      });

      if (isFull && internalSubRowId) {
        await supa
          .from("subscriptions")
          .update({
            status: "cancelled",
            ended_at: new Date().toISOString(),
          })
          .eq("id", internalSubRowId);
      }
      return;
    }

    default:
      // Unknown event — log and acknowledge. We've already stored raw_payload
      // so we can re-process later if we add a handler.
      console.log("unrouted event", eventName);
  }
}
