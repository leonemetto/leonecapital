import { createContext, useContext, useMemo, ReactNode } from 'react';
import { useSharedTrades } from '@/contexts/TradesContext';
import { computeLeaks } from '@/components/dashboard/DashboardLeakDetection';
import type { DashboardLeak } from '@/components/dashboard/DashboardLeakDetection';

interface LeaksContextType {
  leaks: DashboardLeak[];
  newLeakCount: number;
}

const LeaksContext = createContext<LeaksContextType | null>(null);

export function LeaksProvider({ children }: { children: ReactNode }) {
  const { trades } = useSharedTrades();

  const leaks = useMemo(() => computeLeaks(trades), [trades]);

  const newLeakCount = useMemo(() => {
    if (trades.length < 15) return 0;
    const seen = parseInt(localStorage.getItem('leaks_last_seen_count') ?? '0', 10);
    return Math.max(0, leaks.length - seen);
  }, [leaks.length, trades.length]);

  return (
    <LeaksContext.Provider value={{ leaks, newLeakCount }}>
      {children}
    </LeaksContext.Provider>
  );
}

export function useLeaks(): LeaksContextType {
  const ctx = useContext(LeaksContext);
  if (!ctx) throw new Error('useLeaks must be used within LeaksProvider');
  return ctx;
}
