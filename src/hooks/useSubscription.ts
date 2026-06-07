import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type SubscriptionTier = 'free' | 'pro' | 'elite';
export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'cancelling'
  | 'cancelled'
  | 'expired';

export interface UseSubscriptionResult {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  hasSubscription: boolean;
  isPro: boolean;
  isElite: boolean;
  isFree: boolean;
  isActive: boolean;
  hasProAccess: boolean;
  isTrialing: boolean;
  trialEndsAt: Date | null;
  isTrialExpired: boolean;
  currentPeriodEnd: Date | null;
  isLoading: boolean;
}

type SubscriptionRow = {
  id?: string | null;
  plan?: string | null;
  status?: string | null;
  current_period_end?: string | null;
};

export function useSubscription(): UseSubscriptionResult {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      // A user can have historical 'cancelled' rows alongside an 'active' one.
      // Sort by created_at desc + limit 1 to fetch the relevant subscription.
      const { data, error } = await supabase
        .from('subscriptions')
        .select('id, plan, status, current_period_end')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as SubscriptionRow | null;
    },
    enabled: !!user?.id,
    staleTime: 0, // always fresh — a stale "free" after payment is a bad user experience
    gcTime: 60 * 1000,
  });

  const tier = (data?.plan ?? 'free') as SubscriptionTier;
  const status = (data?.status ?? 'active') as SubscriptionStatus;
  const currentPeriodEnd = data?.current_period_end ? new Date(data.current_period_end) : null;
  const isTrialing = tier === 'pro' && status === 'trialing';
  const isTrialExpired = isTrialing && (!currentPeriodEnd || currentPeriodEnd.getTime() <= Date.now());
  // Active access includes cancellation grace period and past_due retry window.
  const isActive =
    status === 'active' ||
    status === 'cancelling' ||
    status === 'past_due' ||
    (status === 'trialing' && !isTrialExpired);
  const hasProAccess = (tier === 'pro' || tier === 'elite') && isActive;

  return {
    tier,
    status,
    hasSubscription: !!data?.id,
    isPro: hasProAccess,
    isElite: tier === 'elite' && isActive,
    isFree: tier === 'free' || !isActive,
    isActive,
    hasProAccess,
    isTrialing,
    trialEndsAt: isTrialing ? currentPeriodEnd : null,
    isTrialExpired,
    currentPeriodEnd,
    isLoading,
  };
}

export function useInvalidateSubscription() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['subscription'] });
}
