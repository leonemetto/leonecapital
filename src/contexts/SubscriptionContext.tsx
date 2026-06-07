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
  const [trialAttemptFinishedForUser, setTrialAttemptFinishedForUser] = useState<string | null>(null);
  const attemptedForUser = useRef<string | null>(null);
  const needsTrial =
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
