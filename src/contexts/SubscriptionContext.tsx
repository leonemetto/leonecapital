import { createContext, useContext, ReactNode, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription, useInvalidateSubscription, UseSubscriptionResult } from '@/hooks/useSubscription';

const SubscriptionContext = createContext<UseSubscriptionResult | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const subscription = useSubscription();
  const invalidateSubscription = useInvalidateSubscription();
  const { user } = useAuth();
  const [startingTrial, setStartingTrial] = useState(false);
  const attemptedForUser = useRef<string | null>(null);

  useEffect(() => {
    const needsTrial = !subscription.hasSubscription || subscription.tier === 'free';
    if (!user?.id || subscription.isLoading || !needsTrial) return;
    if (attemptedForUser.current === user.id) return;

    attemptedForUser.current = user.id;
    setStartingTrial(true);
    supabase.functions.invoke('start-trial', { body: {} })
      .then(() => invalidateSubscription())
      .finally(() => setStartingTrial(false));
  }, [invalidateSubscription, subscription.hasSubscription, subscription.isLoading, subscription.tier, user?.id]);

  const value = {
    ...subscription,
    isLoading: subscription.isLoading || startingTrial,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSharedSubscription(): UseSubscriptionResult {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSharedSubscription must be used within SubscriptionProvider');
  return ctx;
}
