// lemon-subscription-state.ts — UPSERT helpers for the subscriptions table
// keyed on (provider, provider_subscription_id). All writes use service role
// (RLS bypassed by definition for the webhook).
//
// The partial unique index `subscriptions_one_active_per_user` enforces that
// only one row per user can be in {active, past_due, cancelling, trialing}
// at any time. If a user resubscribes after a previous cancellation, the
// historical 'cancelled' row stays and a new row gets inserted.

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { variantIdToInfo } from "./lemon-variants.ts";

export interface LemonSubscriptionPayload {
  // From LS data.id
  subscriptionId: string;
  // From LS data.attributes
  customerId: string;
  variantId: string;
  // LS native status: on_trial | active | paused | past_due | unpaid | cancelled | expired
  status: string;
  // LS attributes.renews_at when active; attributes.ends_at when cancelled
  renewsAt: string | null;
  endsAt: string | null;
  trialEndsAt: string | null;
  createdAt: string;
  cardBrand: string | null;
  // From LS meta.custom_data (forwarded from our checkout init)
  userId: string | null;
  intentId: string | null;
}

// Map LS native status -> our enum.
//   on_trial  -> trialing
//   active    -> active
//   past_due  -> past_due
//   paused    -> past_due  (we treat the same; no separate "paused" path)
//   unpaid    -> expired
//   cancelled -> cancelling if ends_at is in the future, cancelled otherwise
//   expired   -> expired
export function mapLemonStatus(lemonStatus: string, endsAt: string | null): string {
  const now = Date.now();
  const endsAtMs = endsAt ? new Date(endsAt).getTime() : null;
  const futureEnds = endsAtMs !== null && endsAtMs > now;

  switch (lemonStatus) {
    case "on_trial":  return "trialing";
    case "active":    return "active";
    case "past_due":  return "past_due";
    case "paused":    return "past_due";
    case "unpaid":    return "expired";
    case "cancelled": return futureEnds ? "cancelling" : "cancelled";
    case "expired":   return "expired";
    default:          return "active"; // unknown -> safe default; better than dropping the event
  }
}

// Upsert by (provider, provider_subscription_id). If the row doesn't exist
// and we have a user_id from custom_data, INSERT. Otherwise UPDATE.
export async function upsertSubscriptionFromLemon(
  supa: SupabaseClient,
  payload: LemonSubscriptionPayload,
): Promise<{ inserted: boolean; userId: string | null }> {
  const variantInfo = variantIdToInfo(payload.variantId);
  const mappedStatus = mapLemonStatus(payload.status, payload.endsAt);

  // Try to find an existing row by provider_subscription_id
  const { data: existing } = await supa
    .from("subscriptions")
    .select("id, user_id, plan, status")
    .eq("provider", "lemonsqueezy")
    .eq("provider_subscription_id", payload.subscriptionId)
    .maybeSingle();

  // Compute lifecycle timestamps
  const periodEnd = payload.renewsAt ?? payload.endsAt;
  const cancelAt = mappedStatus === "cancelling" ? payload.endsAt : null;
  const cancelledAt = mappedStatus === "cancelled" || mappedStatus === "cancelling"
    ? new Date().toISOString()
    : null;
  const endedAt = (mappedStatus === "cancelled" || mappedStatus === "expired")
    ? (payload.endsAt ?? new Date().toISOString())
    : null;

  if (existing) {
    // UPDATE — keep plan + user_id intact; refresh everything lifecycle-related
    const update: Record<string, unknown> = {
      status: mappedStatus,
      current_period_end: periodEnd,
      provider_customer_code: payload.customerId,
      provider_plan_code: payload.variantId,
      channel: payload.cardBrand ? "card" : null,
    };
    if (cancelAt) update.cancel_at = cancelAt;
    if (cancelledAt) update.cancelled_at = cancelledAt;
    if (endedAt) update.ended_at = endedAt;

    const { error } = await supa
      .from("subscriptions")
      .update(update)
      .eq("id", existing.id);
    if (error) throw error;
    return { inserted: false, userId: existing.user_id };
  }

  // INSERT — only possible if we know which user this is
  if (!payload.userId) {
    throw new Error(
      `subscription_created webhook missing custom_data.user_id and no existing row to UPDATE; sub=${payload.subscriptionId}`,
    );
  }

  // Capture consent versions from the matching pending_intent if present
  let consent: Record<string, unknown> = {};
  if (payload.intentId) {
    const { data: intent } = await supa
      .from("pending_intents")
      .select("terms_version_accepted, refunds_version_accepted, privacy_version_accepted, ip_at_signup, user_agent_at_signup, consent_checkbox_text, currency, amount, billing_cycle")
      .eq("id", payload.intentId)
      .maybeSingle();
    if (intent) consent = intent;
  }

  const insertRow: Record<string, unknown> = {
    user_id: payload.userId,
    plan: variantInfo?.plan ?? "pro",
    billing_cycle: variantInfo?.billingCycle ?? consent.billing_cycle ?? "monthly",
    amount: variantInfo?.amountCents ?? consent.amount ?? 1900,
    currency: consent.currency ?? "USD",
    channel: payload.cardBrand ? "card" : null,
    status: mappedStatus,
    started_at: payload.createdAt,
    current_period_start: payload.createdAt,
    current_period_end: periodEnd,
    cancel_at: cancelAt,
    cancelled_at: cancelledAt,
    ended_at: endedAt,
    provider: "lemonsqueezy",
    provider_subscription_id: payload.subscriptionId,
    provider_customer_code: payload.customerId,
    provider_plan_code: payload.variantId,
    terms_version_accepted: consent.terms_version_accepted ?? "unknown",
    refunds_version_accepted: consent.refunds_version_accepted ?? "unknown",
    privacy_version_accepted: consent.privacy_version_accepted ?? "unknown",
    ip_at_signup: consent.ip_at_signup ?? null,
    user_agent_at_signup: consent.user_agent_at_signup ?? null,
    consent_checkbox_text: consent.consent_checkbox_text ?? null,
  };

  // A no-card Pro trial creates a manual trial row first. When the user pays,
  // convert that current row into the Lemon Squeezy subscription instead of
  // inserting a second active row that would collide with the one-current-row
  // subscription index.
  const { data: currentUserRow } = await supa
    .from("subscriptions")
    .select("id, plan, status, provider")
    .eq("user_id", payload.userId)
    .in("status", ["trialing", "active"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (currentUserRow && currentUserRow.provider !== "lemonsqueezy") {
    const { error } = await supa
      .from("subscriptions")
      .update(insertRow)
      .eq("id", currentUserRow.id);
    if (error) throw error;

    if (payload.intentId) {
      await supa
        .from("pending_intents")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", payload.intentId);
    }

    return { inserted: true, userId: payload.userId };
  }

  const { error } = await supa.from("subscriptions").insert(insertRow);
  if (error) throw error;

  // Mark the originating pending_intent completed
  if (payload.intentId) {
    await supa
      .from("pending_intents")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", payload.intentId);
  }

  return { inserted: true, userId: payload.userId };
}
