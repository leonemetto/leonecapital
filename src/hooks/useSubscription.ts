import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type SubscriptionTier = 'free' | 'pro' | 'elite';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';

export interface UseSubscriptionResult {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  isPro: boolean;
  isElite: boolean;
  isFree: boolean;
  isActive: boolean;
  currentPeriodEnd: Date | null;
  isLoading: boolean;
}

export function useSubscription(): UseSubscriptionResult {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('subscriptions')
        .select('tier, status, current_period_end')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 0, // always fresh — a stale "free" after payment is a bad user experience
    gcTime: 60 * 1000,
  });

  const tier = (data?.tier ?? 'free') as SubscriptionTier;
  const status = (data?.status ?? 'active') as SubscriptionStatus;
  const isActive = status === 'active' || status === 'trialing';

  return {
    tier,
    status,
    isPro: (tier === 'pro' || tier === 'elite') && isActive,
    isElite: tier === 'elite' && isActive,
    isFree: tier === 'free' || !isActive,
    isActive,
    currentPeriodEnd: data?.current_period_end ? new Date(data.current_period_end) : null,
    isLoading,
  };
}

export function useInvalidateSubscription() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['subscription'] });
}
