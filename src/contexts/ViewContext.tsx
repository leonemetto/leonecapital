import { createContext, useContext, useMemo, useState, useCallback, ReactNode } from 'react';
import { useSharedTrades } from '@/contexts/TradesContext';
import { useSharedAccounts, ALL_ACCOUNTS } from '@/contexts/AccountsContext';
import type { Trade } from '@/types/trade';
import type { TradingAccount } from '@/types/account';
import { filterByRange, type RangeKey } from '@/lib/range';

const RANGE_KEY = 'ef-view-range';

interface ViewContextType {
  range: RangeKey;
  setRange: (range: RangeKey) => void;
  /** The account every screen is scoped to, or null for all accounts. */
  account: TradingAccount | null;
  /** Trades for the selected account, exactly as logged. */
  accountTrades: Trade[];
  /** Same trades with P&L multiplied by the account's mirror quantity. Use for money totals. */
  scaledTrades: Trade[];
  /** scaledTrades inside the selected range. */
  rangeTrades: Trade[];
  /** Base balance plus adjustments for the scope, before trade P&L. */
  baseBalance: number;
}

const ViewContext = createContext<ViewContextType | null>(null);

const mirrorQty = (a?: { quantity?: number }) => (a && a.quantity && a.quantity > 0 ? a.quantity : 1);

function readRange(): RangeKey {
  try {
    const v = localStorage.getItem(RANGE_KEY);
    if (v === 'week' || v === 'month' || v === 'quarter' || v === 'year' || v === 'all') return v;
  } catch {
    // ignore
  }
  return 'month';
}

export function ViewProvider({ children }: { children: ReactNode }) {
  const { trades } = useSharedTrades();
  const { accounts, selectedAccountId } = useSharedAccounts();
  const [range, setRangeState] = useState<RangeKey>(readRange);

  const setRange = useCallback((next: RangeKey) => {
    setRangeState(next);
    try {
      localStorage.setItem(RANGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  const account = useMemo(
    () => (selectedAccountId === ALL_ACCOUNTS ? null : accounts.find(a => a.id === selectedAccountId) ?? null),
    [accounts, selectedAccountId],
  );

  const accountTrades = useMemo(
    () => (account ? trades.filter(t => t.accountId === account.id) : trades),
    [trades, account],
  );

  // A trader running N identical funded accounts keeps one account row with
  // quantity = N. Money totals scale by that quantity; counts and ratios do not,
  // because rows are never duplicated.
  const scaledTrades = useMemo(() => {
    if (!accounts.some(a => mirrorQty(a) > 1)) return accountTrades;
    const qty = new Map(accounts.map(a => [a.id, mirrorQty(a)]));
    return accountTrades.map(t => {
      const q = t.accountId ? qty.get(t.accountId) ?? 1 : 1;
      return q === 1 ? t : { ...t, pnl: t.pnl * q };
    });
  }, [accountTrades, accounts]);

  const rangeTrades = useMemo(() => filterByRange(scaledTrades, range), [scaledTrades, range]);

  const baseBalance = useMemo(() => {
    const base = (a: TradingAccount) => ((a.currentBalance ?? 0) + (a.balanceAdjustment ?? 0)) * mirrorQty(a);
    return account ? base(account) : accounts.reduce((sum, a) => sum + base(a), 0);
  }, [accounts, account]);

  return (
    <ViewContext.Provider value={{ range, setRange, account, accountTrades, scaledTrades, rangeTrades, baseBalance }}>
      {children}
    </ViewContext.Provider>
  );
}

export function useView(): ViewContextType {
  const ctx = useContext(ViewContext);
  if (!ctx) throw new Error('useView must be used within ViewProvider');
  return ctx;
}
