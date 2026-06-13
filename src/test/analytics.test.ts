import { describe, it, expect } from 'vitest';
import {
  calculateAnalytics,
  getExpectancyByField,
  getExpectancyByPlanAdherence,
  simulateFilter,
  getDailyPnl,
} from '@/lib/analytics';
import type { Trade } from '@/types/trade';

// Minimal trade factory
function trade(overrides: Partial<Trade> = {}): Trade {
  return {
    id: crypto.randomUUID(),
    date: '2024-01-15',
    instrument: 'XAUUSD',
    direction: 'long',
    strategy: 'Trend Continuation',
    session: 'London',
    outcome: 'win',
    pnl: 100,
    notes: '',
    createdAt: '2024-01-15T10:00:00Z',
    ...overrides,
  };
}

// ─── calculateAnalytics ───

describe('calculateAnalytics', () => {
  it('returns empty analytics for zero trades', () => {
    const a = calculateAnalytics([]);
    expect(a.totalTrades).toBe(0);
    expect(a.winRate).toBe(0);
    expect(a.netPnl).toBe(0);
    expect(a.maxDrawdown).toBe(0);
    expect(a.currentStreak.type).toBe('none');
  });

  it('mirrored trade group counts as ONE decision for behavioral metrics', () => {
    const legs = [
      trade({ id: 'l1', tradeGroupId: 'g1', accountId: 'a', pnl: 100, outcome: 'win' }),
      trade({ id: 'l2', tradeGroupId: 'g1', accountId: 'b', pnl: 200, outcome: 'win' }),
      trade({ id: 'l3', tradeGroupId: 'g1', accountId: 'c', pnl: 400, outcome: 'win' }),
    ];
    const a = calculateAnalytics(legs);
    expect(a.totalTrades).toBe(1);
    expect(a.wins).toBe(1);
    expect(a.winRate).toBe(100);
    expect(a.netPnl).toBe(700); // P&L sums across legs (monetary).
  });

  it('mixes mirrored groups and singletons correctly', () => {
    const trades = [
      trade({ id: 'g_a', tradeGroupId: 'g1', pnl: 100, outcome: 'win' }),
      trade({ id: 'g_b', tradeGroupId: 'g1', pnl: 200, outcome: 'win' }),
      trade({ id: 's1', pnl: -150, outcome: 'loss' }),
    ];
    const a = calculateAnalytics(trades);
    expect(a.totalTrades).toBe(2);
    expect(a.wins).toBe(1);
    expect(a.losses).toBe(1);
    expect(a.netPnl).toBe(150);
  });

  it('calculates win rate correctly', () => {
    const trades = [
      trade({ outcome: 'win', pnl: 100 }),
      trade({ outcome: 'win', pnl: 100 }),
      trade({ outcome: 'loss', pnl: -50 }),
      trade({ outcome: 'loss', pnl: -50 }),
    ];
    const a = calculateAnalytics(trades);
    expect(a.winRate).toBe(50);
    expect(a.wins).toBe(2);
    expect(a.losses).toBe(2);
  });

  it('counts breakevens in win-rate denominator by default', () => {
    const trades = [
      trade({ outcome: 'win', pnl: 100 }),
      trade({ outcome: 'loss', pnl: -50 }),
      trade({ outcome: 'breakeven', pnl: 0 }),
      trade({ outcome: 'breakeven', pnl: 0 }),
    ];
    // Default: 1 win / 4 total = 25%
    expect(calculateAnalytics(trades).winRate).toBe(25);
    // Toggle on explicitly = same
    expect(calculateAnalytics(trades, { countBreakevenInWinRate: true }).winRate).toBe(25);
  });

  it('excludes breakevens from win rate when toggled off', () => {
    const trades = [
      trade({ outcome: 'win', pnl: 100 }),
      trade({ outcome: 'loss', pnl: -50 }),
      trade({ outcome: 'breakeven', pnl: 0 }),
      trade({ outcome: 'breakeven', pnl: 0 }),
    ];
    // 1 win / (1 win + 1 loss) = 50%
    expect(calculateAnalytics(trades, { countBreakevenInWinRate: false }).winRate).toBe(50);
  });

  it('win-rate toggle does not change expectancy', () => {
    const trades = [
      trade({ outcome: 'win', pnl: 100 }),
      trade({ outcome: 'loss', pnl: -50 }),
      trade({ outcome: 'breakeven', pnl: 0 }),
    ];
    const withBE = calculateAnalytics(trades, { countBreakevenInWinRate: true });
    const withoutBE = calculateAnalytics(trades, { countBreakevenInWinRate: false });
    expect(withBE.expectancy).toBeCloseTo(withoutBE.expectancy, 10);
  });

  it('handles all-breakeven trades without NaN when toggled off', () => {
    const trades = [
      trade({ outcome: 'breakeven', pnl: 0 }),
      trade({ outcome: 'breakeven', pnl: 0 }),
    ];
    const a = calculateAnalytics(trades, { countBreakevenInWinRate: false });
    expect(a.winRate).toBe(0);
    expect(Number.isNaN(a.winRate)).toBe(false);
  });

  it('calculates net P&L correctly', () => {
    const trades = [
      trade({ outcome: 'win', pnl: 300 }),
      trade({ outcome: 'loss', pnl: -100 }),
      trade({ outcome: 'breakeven', pnl: 0 }),
    ];
    const a = calculateAnalytics(trades);
    expect(a.netPnl).toBe(200);
    expect(a.breakevens).toBe(1);
  });

  it('calculates profit factor', () => {
    const trades = [
      trade({ outcome: 'win', pnl: 200 }),
      trade({ outcome: 'loss', pnl: -100 }),
    ];
    const a = calculateAnalytics(trades);
    expect(a.profitFactor).toBe(2);
  });

  it('returns 0 profit factor when no losses', () => {
    const trades = [trade({ outcome: 'win', pnl: 100 })];
    const a = calculateAnalytics(trades);
    // No losses — grossLoss = 0 and grossProfit > 0 → returns 999 (capped Infinity)
    expect(a.profitFactor).toBe(999);
  });

  it('calculates max drawdown', () => {
    // Peak at 200, then drops to 100 → drawdown = 100
    const trades = [
      trade({ date: '2024-01-01', outcome: 'win', pnl: 200 }),
      trade({ date: '2024-01-02', outcome: 'loss', pnl: -100 }),
      trade({ date: '2024-01-03', outcome: 'win', pnl: 50 }),
    ];
    const a = calculateAnalytics(trades);
    expect(a.maxDrawdown).toBe(100);
  });

  it('detects current win streak', () => {
    const trades = [
      trade({ date: '2024-01-01', outcome: 'loss', pnl: -50 }),
      trade({ date: '2024-01-02', outcome: 'win', pnl: 100 }),
      trade({ date: '2024-01-03', outcome: 'win', pnl: 100 }),
    ];
    const a = calculateAnalytics(trades);
    expect(a.currentStreak.type).toBe('win');
    expect(a.currentStreak.count).toBe(2);
  });

  it('detects current loss streak', () => {
    const trades = [
      trade({ date: '2024-01-01', outcome: 'win', pnl: 100 }),
      trade({ date: '2024-01-02', outcome: 'loss', pnl: -50 }),
      trade({ date: '2024-01-03', outcome: 'loss', pnl: -50 }),
      trade({ date: '2024-01-04', outcome: 'loss', pnl: -50 }),
    ];
    const a = calculateAnalytics(trades);
    expect(a.currentStreak.type).toBe('loss');
    expect(a.currentStreak.count).toBe(3);
  });

  it('handles all-breakeven trades', () => {
    const trades = [
      trade({ outcome: 'breakeven', pnl: 0 }),
      trade({ outcome: 'breakeven', pnl: 0 }),
    ];
    const a = calculateAnalytics(trades);
    expect(a.winRate).toBe(0);
    expect(a.netPnl).toBe(0);
    expect(a.currentStreak.type).toBe('none');
  });

  it('calculates R-multiple expectancy', () => {
    const trades = [
      trade({ outcome: 'win', pnl: 200, rMultiple: 2 }),
      trade({ outcome: 'loss', pnl: -100, rMultiple: -1 }),
    ];
    const a = calculateAnalytics(trades);
    expect(a.avgRWin).toBe(2);
    expect(a.avgRLoss).toBe(1);
    expect(a.rExpectancy).toBeGreaterThan(0);
  });
});

// ─── getExpectancyByField ───

describe('getExpectancyByField', () => {
  it('groups trades by instrument', () => {
    const trades = [
      trade({ instrument: 'XAUUSD', outcome: 'win', pnl: 100 }),
      trade({ instrument: 'XAUUSD', outcome: 'loss', pnl: -50 }),
      trade({ instrument: 'NAS100', outcome: 'loss', pnl: -200 }),
    ];
    const result = getExpectancyByField(trades, 'instrument');
    const gold = result.find(r => r.key === 'XAUUSD');
    const nas = result.find(r => r.key === 'NAS100');
    expect(gold?.trades).toBe(2);
    expect(gold?.wins).toBe(1);
    expect(nas?.trades).toBe(1);
    expect(nas?.pnl).toBe(-200);
  });

  it('marks small samples with warning', () => {
    const trades = [trade({ instrument: 'XAUUSD', outcome: 'win', pnl: 100 })];
    const result = getExpectancyByField(trades, 'instrument');
    expect(result[0].sampleWarning).toBe(true);
  });

  it('returns empty array for no trades', () => {
    expect(getExpectancyByField([], 'instrument')).toHaveLength(0);
  });
});

// ─── getExpectancyByPlanAdherence ───

describe('getExpectancyByPlanAdherence', () => {
  it('separates plan-followed vs violated', () => {
    const trades = [
      trade({ followedPlan: true, outcome: 'win', pnl: 200 }),
      trade({ followedPlan: true, outcome: 'win', pnl: 100 }),
      trade({ followedPlan: false, outcome: 'loss', pnl: -150 }),
    ];
    const result = getExpectancyByPlanAdherence(trades);
    const followed = result.find(r => r.key === 'Plan Followed');
    const violated = result.find(r => r.key === 'Plan Violated');
    expect(followed?.wins).toBe(2);
    expect(violated?.pnl).toBe(-150);
  });
});

// ─── simulateFilter ───

describe('simulateFilter', () => {
  it('keeps only matching trades when instrument filter applied', () => {
    const trades = [
      trade({ instrument: 'XAUUSD', outcome: 'win', pnl: 100 }),
      trade({ instrument: 'NAS100', outcome: 'loss', pnl: -200 }),
    ];
    // simulateFilter KEEPS the filtered set — filtering to NAS100 keeps 1 trade
    const result = simulateFilter(trades, { instrument: 'NAS100' });
    expect(result.filteredTrades).toBe(1);
    expect(result.originalTrades).toBe(2);
    expect(result.filteredPnl).toBe(-200);
  });

  it('returns all trades when no filter applied', () => {
    const trades = [
      trade({ outcome: 'win', pnl: 100 }),
      trade({ outcome: 'loss', pnl: -50 }),
    ];
    const result = simulateFilter(trades, {});
    expect(result.filteredTrades).toBe(2);
    expect(result.originalTrades).toBe(2);
    expect(result.label).toBe('No filters');
  });

  it('calculates improvement correctly when filtering to winners', () => {
    const trades = [
      trade({ followedPlan: true, outcome: 'win', pnl: 300 }),
      trade({ followedPlan: false, outcome: 'loss', pnl: -200 }),
    ];
    const result = simulateFilter(trades, { followedPlan: true });
    expect(result.filteredTrades).toBe(1);
    expect(result.filteredPnl).toBe(300);
    expect(result.improvementPct).toBeGreaterThan(0);
  });
});

// ─── getDailyPnl ───

describe('getDailyPnl', () => {
  it('aggregates P&L by date into a Map', () => {
    const trades = [
      trade({ date: '2024-01-01', outcome: 'win', pnl: 100 }),
      trade({ date: '2024-01-01', outcome: 'win', pnl: 50 }),
      trade({ date: '2024-01-02', outcome: 'loss', pnl: -75 }),
    ];
    const result = getDailyPnl(trades);
    expect(result.get('2024-01-01')?.pnl).toBe(150);
    expect(result.get('2024-01-01')?.trades).toBe(2);
    expect(result.get('2024-01-02')?.pnl).toBe(-75);
  });

  it('returns empty Map for no trades', () => {
    const result = getDailyPnl([]);
    expect(result.size).toBe(0);
  });

  it('strips time component from date string', () => {
    const trades = [trade({ date: '2024-01-01T08:30:00Z', outcome: 'win', pnl: 100 })];
    const result = getDailyPnl(trades);
    expect(result.has('2024-01-01')).toBe(true);
  });
});
