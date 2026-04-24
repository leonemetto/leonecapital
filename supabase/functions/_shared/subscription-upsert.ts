import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export type SubscriptionTier = "free" | "pro" | "elite";
export type SubscriptionStatus = "active" | "canceled" | "past_due" | "trialing";

export interface SubscriptionUpsertParams {
  userId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  provider: "lemon_squeezy" | "intasend";
  providerSubscriptionId: string;
  currentPeriodEnd: Date | null;
}

export async function upsertSubscription(
  supabase: SupabaseClient,
  params: SubscriptionUpsertParams
): Promise<void> {
  // Validate user exists in auth.users before writing
  const { data: user, error: userError } = await supabase.auth.admin.getUserById(params.userId);
  if (userError || !user?.user) {
    throw new Error(`User ${params.userId} not found in auth.users`);
  }

  const { error } = await supabase.from("subscriptions").upsert(
    {
      user_id: params.userId,
      tier: params.tier,
      status: params.status,
      provider: params.provider,
      provider_subscription_id: params.providerSubscriptionId,
      current_period_end: params.currentPeriodEnd?.toISOString() ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) throw new Error(`Failed to upsert subscription: ${error.message}`);
}
