import { createContext, useContext, ReactNode } from 'react';
import { useTrades as useTradesHook } from '@/hooks/useTrades';

type TradesContextType = ReturnType<typeof useTradesHook>;

const TradesContext = createContext<TradesContextType | null>(null);

export function TradesProvider({ children }: { children: ReactNode }) {
  const trades = useTradesHook();
  return (
    <TradesContext.Provider value={trades}>
      {children}
    </TradesContext.Provider>
  );
}

export function useSharedTrades(): TradesContextType {
  const ctx = useContext(TradesContext);
  if (!ctx) throw new Error('useSharedTrades must be used within TradesProvider');
  return ctx;
}
