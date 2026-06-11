import { describe, expect, it } from 'vitest';
import { getAccountBalance, getAccountTargetProgress } from '@/lib/accountProgress';
import type { TradingAccount } from '@/types/account';
import type { Trade } from '@/types/trade';

const account = (overrides: Partial<TradingAccount> = {}): TradingAccount => ({
  id: 'acct_1',
  name: 'Funded',
  type: 'prop',
  startingBalance: 5000,
  currentBalance: 5000,
  currency: 'USD',
  createdAt: '2026-06-01T00:00:00Z',
  challengeSize: 10000,
  profitTargetPct: 10,
  balanceAdjustment: 0,
  copyWeight: 1,
  quantity: 1,
  ...overrides,
});

const trade = (overrides: Partial<Trade> = {}): Trade => ({
  id: 'trade_1',
  date: '2026-06-02',
  instrument: 'XAUUSD',
  direction: 'long',
  outcome: 'win',
  pnl: 250,
  createdAt: '2026-06-02T12:00:00Z',
  accountId: 'acct_1',
  ...overrides,
});

describe('account progress helpers', () => {
  it('uses the same prop challenge target progress independent of account balance adjustments', () => {
    const prop = account({ challengeStartDate: '2026-06-05', balanceAdjustment: 300 });
    const trades = [
      trade({ id: 'old', date: '2026-06-03', pnl: 500 }),
      trade({ id: 'current', date: '2026-06-05', pnl: 250 }),
      trade({ id: 'loss', date: '2026-06-06', pnl: -50 }),
    ];

    const result = getAccountTargetProgress(prop, trades);

    expect(result.pnl).toBe(200);
    expect(result.target).toBe(1000);
    expect(result.progress).toBe(20);
  });

  it('includes all account trades and balance adjustments in displayed account balance', () => {
    const live = account({ type: 'live', challengeSize: undefined, balanceAdjustment: -100 });
    const trades = [
      trade({ id: 'win', pnl: 300 }),
      trade({ id: 'other-account', accountId: 'acct_2', pnl: 900 }),
    ];

    expect(getAccountBalance(live, trades)).toBe(5200);
  });
});
