import { createContext, useContext, ReactNode } from 'react';
import { useSubscription, UseSubscriptionResult } from '@/hooks/useSubscription';

const SubscriptionContext = createContext<UseSubscriptionResult | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const subscription = useSubscription();
  return (
    <SubscriptionContext.Provider value={subscription}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSharedSubscription(): UseSubscriptionResult {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSharedSubscription must be used within SubscriptionProvider');
  return ctx;
}
