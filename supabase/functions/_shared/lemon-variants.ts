// lemon-variants.ts — Resolve the {plan, billing_cycle} pair to a Lemon
// Squeezy variant_id, and resolve incoming variant_ids back to {plan,
// billing_cycle}. Single source of truth for both directions so the checkout
// init and the webhook agree.
//
// Values come from Supabase Edge Function secrets:
//   LEMONSQUEEZY_STORE_ID
//   LEMONSQUEEZY_VARIANT_PRO_MONTHLY
//   LEMONSQUEEZY_VARIANT_PRO_ANNUAL
//   LEMONSQUEEZY_VARIANT_ELITE_MONTHLY
//   LEMONSQUEEZY_VARIANT_ELITE_ANNUAL
//
// All pricing is USD. The LS Stripe Connect rail converts at checkout for
// non-USD cardholders. (Currency-specific variants can be added later if we
// want native KES pricing via Intasend as a separate provider.)

export type Plan = "pro" | "elite";
export type BillingCycle = "monthly" | "annual";

export interface VariantInfo {
  variantId: string;
  plan: Plan;
  billingCycle: BillingCycle;
  amountCents: number; // for our internal `amount` column (USD cents)
}

const PLAN_PRICING_USD_CENTS: Record<Plan, Record<BillingCycle, number>> = {
  pro:   { monthly:  1900, annual: 19000 },
  elite: { monthly:  3900, annual: 39000 },
};

export function getVariantId(plan: Plan, cycle: BillingCycle): string | null {
  const key = `LEMONSQUEEZY_VARIANT_${plan.toUpperCase()}_${cycle.toUpperCase()}`;
  return Deno.env.get(key) ?? null;
}

export function resolveCheckoutVariant(plan: Plan, cycle: BillingCycle): VariantInfo | null {
  const variantId = getVariantId(plan, cycle);
  if (!variantId) return null;
  return {
    variantId,
    plan,
    billingCycle: cycle,
    amountCents: PLAN_PRICING_USD_CENTS[plan][cycle],
  };
}

// Reverse direction: webhook arrives with an LS variant_id. Map it back to
// {plan, cycle, amount} so we can populate the subscriptions row correctly.
export function variantIdToInfo(variantId: string | number): VariantInfo | null {
  const id = String(variantId);
  const plans: Plan[] = ["pro", "elite"];
  const cycles: BillingCycle[] = ["monthly", "annual"];
  for (const p of plans) {
    for (const c of cycles) {
      if (getVariantId(p, c) === id) {
        return {
          variantId: id,
          plan: p,
          billingCycle: c,
          amountCents: PLAN_PRICING_USD_CENTS[p][c],
        };
      }
    }
  }
  return null;
}

export function getStoreId(): string | null {
  return Deno.env.get("LEMONSQUEEZY_STORE_ID") ?? null;
}
