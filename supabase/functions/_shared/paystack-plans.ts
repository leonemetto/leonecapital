// paystack-plans.ts — single source of truth for the {plan, cycle, currency}
// matrix. Used by paystack-init-transaction (to resolve plan_code + amount) and
// by paystack-webhook (to recognise which plan a charge belongs to).
//
// Amounts are in the SMALLEST DENOMINATION of the currency (cents for USD/EUR/GBP,
// "kobo" for KES — Paystack uses the same convention for every currency).
//
// PLAN CODES come from your Paystack dashboard. Set them via the Supabase secret
// PAYSTACK_PLAN_CODES as a single JSON string, e.g.:
//
//   {"pro_monthly_kes":"PLN_aaa","pro_monthly_usd":"PLN_bbb", ...}
//
// You'll create 8 plans on the Paystack dashboard (2 tiers × 2 cycles × 2 currencies).

export type Plan = "pro" | "elite";
export type BillingCycle = "monthly" | "annual";
export type Currency = "KES" | "USD" | "EUR" | "GBP";

export type PlanKey =
  | "pro_monthly_kes" | "pro_monthly_usd"
  | "pro_annual_kes"  | "pro_annual_usd"
  | "elite_monthly_kes" | "elite_monthly_usd"
  | "elite_annual_kes"  | "elite_annual_usd";

// Local pricing table. Used to populate pending_intents.amount + display amounts
// in receipts. Paystack itself enforces the real charge from the plan_code, so
// this table is informational — but it must match the Paystack plan amounts.
export const PRICING: Record<PlanKey, { amount: number; currency: Currency }> = {
  pro_monthly_kes:   { amount: 149_900,   currency: "KES" },  // KES 1,499 / mo
  pro_annual_kes:    { amount: 1_499_000, currency: "KES" },  // KES 14,990 / yr (≈16% off)
  pro_monthly_usd:   { amount: 1_900,     currency: "USD" },  // USD 19 / mo
  pro_annual_usd:    { amount: 19_000,    currency: "USD" },  // USD 190 / yr (≈16% off)
  elite_monthly_kes: { amount: 299_900,   currency: "KES" },  // KES 2,999 / mo
  elite_annual_kes:  { amount: 2_999_000, currency: "KES" },  // KES 29,990 / yr
  elite_monthly_usd: { amount: 3_900,     currency: "USD" },  // USD 39 / mo
  elite_annual_usd:  { amount: 39_000,    currency: "USD" },  // USD 390 / yr
};

export function planKey(plan: Plan, cycle: BillingCycle, currency: Currency): PlanKey | null {
  // KES is M-Pesa-only on Paystack. USD covers everyone else (intl card flow).
  // EUR/GBP customers pay in USD for simplicity — Paystack's USD plan charges
  // their card in USD and their bank handles FX.
  const billingCurrency: "kes" | "usd" = currency === "KES" ? "kes" : "usd";
  const key = `${plan}_${cycle}_${billingCurrency}` as PlanKey;
  return key in PRICING ? key : null;
}

export function loadPlanCodeMap(): Partial<Record<PlanKey, string>> {
  const raw = Deno.env.get("PAYSTACK_PLAN_CODES") ?? "{}";
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    return parsed as Partial<Record<PlanKey, string>>;
  } catch {
    return {};
  }
}

export function resolvePlanCode(plan: Plan, cycle: BillingCycle, currency: Currency): {
  planCode: string;
  planKey: PlanKey;
  amount: number;
  billingCurrency: Currency;
} | { error: string } {
  const key = planKey(plan, cycle, currency);
  if (!key) return { error: `unsupported plan combination: ${plan}/${cycle}/${currency}` };

  const codeMap = loadPlanCodeMap();
  const code = codeMap[key];
  if (!code) {
    return { error: `PAYSTACK_PLAN_CODES missing entry for "${key}". Set the secret in the Supabase dashboard.` };
  }

  const price = PRICING[key];
  return {
    planCode: code,
    planKey: key,
    amount: price.amount,
    billingCurrency: price.currency,
  };
}
