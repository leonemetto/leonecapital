import { describe, it, expect } from 'vitest';
import {
  splitPnlByCopyWeight,
  dedupeTradesByGroup,
  groupTradesForDisplay,
  getAccountCopyWeight,
} from '@/lib/mirroredTrades';
import type { Trade } from '@/types/trade';

const makeTrade = (overrides: Partial<Trade> = {}): Trade => ({
  id: overrides.id ?? `t_${Math.random().toString(36).slice(2)}`,
  date: '2026-05-15',
  instrument: 'EURUSD',
  direction: 'long',
  strategy: 'Breakout',
  session: 'London',
  outcome: 'win',
  pnl: 100,
  notes: '',
  createdAt: '2026-05-15T10:00:00Z',
  ...overrides,
});

describe('splitPnlByCopyWeight', () => {
  it('splits proportionally by copy weight (1:2:4)', () => {
    const result = splitPnlByCopyWeight(700, [
      { id: 'a', copyWeight: 1 },
      { id: 'b', copyWeight: 2 },
      { id: 'c', copyWeight: 4 },
    ]);
    expect(result.a).toBe(100);
    expect(result.b).toBe(200);
    expect(result.c).toBe(400);
  });

  it('defaults missing/zero copy weight to 1', () => {
    const result = splitPnlByCopyWeight(300, [
      { id: 'a', copyWeight: 0 },
      { id: 'b', copyWeight: 1 },
      { id: 'c', copyWeight: -5 }, // negative also treated as 1
    ]);
    // All effective weight 1 → equal split.
    expect(result.a).toBe(100);
    expect(result.b).toBe(100);
    expect(result.c).toBe(100);
  });

  it('handles negative total P&L (losing trade)', () => {
    const result = splitPnlByCopyWeight(-150, [
      { id: 'a', copyWeight: 1 },
      { id: 'b', copyWeight: 2 },
    ]);
    expect(result.a).toBe(-50);
    expect(result.b).toBe(-100);
  });

  it('handles zero total P&L (breakeven)', () => {
    const result = splitPnlByCopyWeight(0, [
      { id: 'a', copyWeight: 1 },
      { id: 'b', copyWeight: 3 },
    ]);
    expect(result.a).toBe(0);
    expect(result.b).toBe(0);
  });

  it('residual goes to last leg to ensure exact total', () => {
    // 100 / 3 weights of 1 each = 33.33 each. Rounded to 33.33, 33.33, 33.34.
    const result = splitPnlByCopyWeight(100, [
      { id: 'a', copyWeight: 1 },
      { id: 'b', copyWeight: 1 },
      { id: 'c', copyWeight: 1 },
    ]);
    const sum = result.a + result.b + result.c;
    expect(sum).toBeCloseTo(100, 2);
    // Last leg absorbs the residual.
    expect(result.c).toBeGreaterThanOrEqual(result.a);
  });

  it('returns empty object for no accounts', () => {
    expect(splitPnlByCopyWeight(100, [])).toEqual({});
  });

  // Quantity is applied at the call site (effective weight = copyWeight × quantity).
  // This documents the contract: callers MUST multiply quantity in before passing.
  it('treats pre-multiplied effective weights correctly', () => {
    // FTMO 50k Pool: balance 50000, qty 20 → effective 1,000,000
    // FTMO 100k Pool: balance 100000, qty 5 → effective 500,000
    // Total $1.5M of capital, split 2:1
    const result = splitPnlByCopyWeight(750, [
      { id: 'pool50', copyWeight: 1_000_000 },
      { id: 'pool100', copyWeight: 500_000 },
    ]);
    expect(result.pool50).toBe(500);
    expect(result.pool100).toBe(250);
  });

  // Documents the TradeForm contract: split by starting_balance × quantity.
  // copy_weight stays at default 1 for normal users; balance drives the split.
  it('balance-based split: $50k + $100k accounts → 1:2 ratio', () => {
    const result = splitPnlByCopyWeight(900, [
      { id: 'a', copyWeight: 50000 },  // $50k account, qty 1
      { id: 'b', copyWeight: 100000 }, // $100k account, qty 1
    ]);
    expect(result.a).toBe(300);
    expect(result.b).toBe(600);
  });
});

describe('dedupeTradesByGroup', () => {
  it('passes singletons through unchanged', () => {
    const trades = [
      makeTrade({ id: '1', pnl: 50 }),
      makeTrade({ id: '2', pnl: -30 }),
    ];
    const result = dedupeTradesByGroup(trades);
    expect(result).toHaveLength(2);
    expect(result.map(t => t.pnl).sort()).toEqual([-30, 50]);
  });

  it('collapses a 3-leg group into one synthetic row with summed P&L', () => {
    const groupId = 'g1';
    const trades = [
      makeTrade({ id: 'l1', tradeGroupId: groupId, accountId: 'a', pnl: 100 }),
      makeTrade({ id: 'l2', tradeGroupId: groupId, accountId: 'b', pnl: 200 }),
      makeTrade({ id: 'l3', tradeGroupId: groupId, accountId: 'c', pnl: 400 }),
    ];
    const result = dedupeTradesByGroup(trades);
    expect(result).toHaveLength(1);
    expect(result[0].pnl).toBe(700);
    // accountId is cleared on synthetic rows — per-account filters can't match it.
    expect(result[0].accountId).toBeUndefined();
    expect(result[0].tradeGroupId).toBe(groupId);
  });

  it('averages R-multiple across legs (proportional → identical → average is same)', () => {
    const groupId = 'g1';
    const trades = [
      makeTrade({ id: 'l1', tradeGroupId: groupId, pnl: 100, rMultiple: 2 }),
      makeTrade({ id: 'l2', tradeGroupId: groupId, pnl: 200, rMultiple: 2 }),
    ];
    const result = dedupeTradesByGroup(trades);
    expect(result[0].rMultiple).toBe(2);
  });

  it('mixes singletons and grouped trades correctly', () => {
    const trades = [
      makeTrade({ id: '1', pnl: 50 }),
      makeTrade({ id: 'g_a', tradeGroupId: 'g1', pnl: 100 }),
      makeTrade({ id: 'g_b', tradeGroupId: 'g1', pnl: 200 }),
      makeTrade({ id: '2', pnl: -30 }),
    ];
    const result = dedupeTradesByGroup(trades);
    expect(result).toHaveLength(3); // 2 singletons + 1 group
    const groupRow = result.find(t => t.tradeGroupId === 'g1');
    expect(groupRow?.pnl).toBe(300);
  });
});

describe('groupTradesForDisplay', () => {
  it('returns one row per group regardless of leg count', () => {
    const trades = [
      makeTrade({ id: '1' }),
      makeTrade({ id: 'g1_a', tradeGroupId: 'g1' }),
      makeTrade({ id: 'g1_b', tradeGroupId: 'g1' }),
      makeTrade({ id: 'g1_c', tradeGroupId: 'g1' }),
    ];
    const rows = groupTradesForDisplay(trades);
    expect(rows).toHaveLength(2);
    const groupRow = rows.find(r => r.kind === 'group');
    expect(groupRow).toBeDefined();
    expect(groupRow?.kind === 'group' && groupRow.legs).toHaveLength(3);
  });

  it('preserves singleton order when interleaved', () => {
    const trades = [
      makeTrade({ id: '1' }),
      makeTrade({ id: '2' }),
      makeTrade({ id: '3' }),
    ];
    const rows = groupTradesForDisplay(trades);
    expect(rows.every(r => r.kind === 'single')).toBe(true);
    expect(rows).toHaveLength(3);
  });
});

describe('getAccountCopyWeight', () => {
  it('returns the account weight when found', () => {
    expect(getAccountCopyWeight(
      [{ id: 'a', copyWeight: 2.5, quantity: 1 } as any],
      'a'
    )).toBe(2.5);
  });

  it('returns 1 when account not found', () => {
    expect(getAccountCopyWeight([], 'missing')).toBe(1);
  });

  it('returns 1 when account has zero/negative weight', () => {
    expect(getAccountCopyWeight([{ id: 'a', copyWeight: 0 } as any], 'a')).toBe(1);
    expect(getAccountCopyWeight([{ id: 'a', copyWeight: -1 } as any], 'a')).toBe(1);
  });
});
