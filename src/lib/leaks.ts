import type { Trade } from '@/types/trade';
import { getExpectancyByField, getExpectancyByPlanAdherence } from '@/lib/analytics';
import { fmtR } from '@/lib/format';

export const LEAK_MIN_TRADES = 15;

export interface Leak {
  id: string;
  title: string;
  pattern: string;
  trades: number;
  winRate: number;
  pnl: number;
  impact: number;
  severity: 'critical' | 'high' | 'medium';
  note: string;
  tags: string[];
  /** The segment that defines this leak, so the trades behind it can be listed. */
  field: 'instrument' | 'session' | 'followedPlan';
  key: string;
}

const money = (n: number) => `$${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

/**
 * A segment is flagged when it has 3+ trades and a net loss beyond the
 * threshold. Results are ranked by money lost and capped at six.
 */
export function computeLeaks(trades: Trade[]): Leak[] {
  if (trades.length < 3) return [];
  const result: Leak[] = [];

  for (const l of getExpectancyByField(trades, 'instrument')) {
    if (l.pnl >= -50 || l.trades < 3) continue;
    result.push({
      id: `instrument-${l.key}`,
      title: `${l.key} setups`,
      pattern: `Negative expectancy · ${l.trades} trades · ${l.winRate.toFixed(0)}% win`,
      trades: l.trades,
      winRate: l.winRate,
      pnl: l.pnl,
      impact: Math.abs(l.pnl),
      severity: l.expectancy < -50 ? 'critical' : l.expectancy < -20 ? 'high' : 'medium',
      note: `Your ${l.key} trades average ${fmtR(l.expectancy)} per trade. Without them your result would be ${money(l.pnl)} higher.`,
      tags: [l.key, 'Instrument'],
      field: 'instrument',
      key: l.key,
    });
  }

  for (const l of getExpectancyByField(trades, 'session')) {
    if (l.pnl >= -50 || l.trades < 3 || !l.key || l.key === 'Unknown') continue;
    result.push({
      id: `session-${l.key}`,
      title: `${l.key} session`,
      pattern: `Negative expectancy · ${l.trades} trades · ${l.winRate.toFixed(0)}% win`,
      trades: l.trades,
      winRate: l.winRate,
      pnl: l.pnl,
      impact: Math.abs(l.pnl),
      severity: l.expectancy < -50 ? 'critical' : l.expectancy < -20 ? 'high' : 'medium',
      note: `Your ${l.key} session averages ${fmtR(l.expectancy)} per trade. Consider sitting it out or cutting size.`,
      tags: [l.key, 'Session'],
      field: 'session',
      key: l.key,
    });
  }

  const violated = getExpectancyByPlanAdherence(trades).find(p => p.key === 'Plan Violated');
  if (violated && violated.pnl < -100 && violated.trades >= 3) {
    result.push({
      id: 'discipline-plan',
      title: 'Plan violations',
      pattern: `Plan not followed · ${violated.trades} trades · ${violated.winRate.toFixed(0)}% win`,
      trades: violated.trades,
      winRate: violated.winRate,
      pnl: violated.pnl,
      impact: Math.abs(violated.pnl),
      severity: Math.abs(violated.pnl) > 500 ? 'critical' : 'high',
      note: 'These are trades you marked as off-plan. Your on-plan trades perform better.',
      tags: ['Discipline', 'Plan'],
      field: 'followedPlan',
      key: 'No',
    });
  }

  return result.sort((a, b) => b.impact - a.impact).slice(0, 6);
}

/** The trades that make up a leak, newest first. */
export function tradesForLeak(leak: Leak, trades: Trade[]): Trade[] {
  const match = (t: Trade) => {
    if (leak.field === 'instrument') return t.instrument === leak.key;
    if (leak.field === 'session') return t.session === leak.key;
    return t.followedPlan === false;
  };
  return trades.filter(match).sort((a, b) => b.date.localeCompare(a.date));
}
