import { createContext, useContext, ReactNode, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription, useInvalidateSubscription, UseSubscriptionResult } from '@/hooks/useSubscription';
import { CARD_REQUIRED } from '@/config/billing';

const SubscriptionContext = createContext<UseSubscriptionResult | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const subscription = useSubscription();
  const invalidateSubscription = useInvalidateSubscription();
  const { user } = useAuth();
  const [startingTrial, setStartingTrial] = useState(false);
  const [trialAttemptFinishedForUser, setTrialAttemptFinishedForUser] = useState<string | null>(null);
  const attemptedForUser = useRef<string | null>(null);
  // Card-required model: never auto-grant a no-card trial. New users must add
  // a card via Lemon Squeezy checkout to start their trial. Existing users
  // already have a subscription row, so they are grandfathered untouched.
  const needsTrial =
    !CARD_REQUIRED &&
    !!user?.id &&
    !subscription.isLoading &&
    (!subscription.hasSubscription || subscription.tier === 'free') &&
    trialAttemptFinishedForUser !== user.id;

  useEffect(() => {
    if (!user?.id || !needsTrial) return;
    if (attemptedForUser.current === user.id) return;

    attemptedForUser.current = user.id;
    setStartingTrial(true);
    supabase.functions.invoke('start-trial', { body: {} })
      .then(() => invalidateSubscription())
      .finally(() => {
        setTrialAttemptFinishedForUser(user.id);
        setStartingTrial(false);
      });
  }, [invalidateSubscription, needsTrial, user?.id]);

  const value = {
    ...subscription,
    isLoading: subscription.isLoading || startingTrial || needsTrial,
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
