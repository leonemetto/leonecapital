import { calculateAnalytics, getStrategyPerformance, getSessionPerformance } from '@/lib/analytics';
import { dedupeTradesByGroup } from '@/lib/mirroredTrades';

/**
 * The ANALYTICS SUMMARY block sent to Atlas with every message. Moved here
 * unchanged from the Atlas page so the panel and the page share one builder.
 */

export function buildTradesSummary(rawTrades: any[], accounts: any[], countBreakevenInWinRate = true) {
  if (rawTrades.length === 0) return 'No trades logged yet.';
  // Atlas reasons about decisions, not executions. Collapse mirrored groups so a
  // trader who took 50 EURUSD longs across 3 mirrored accounts is described as
  // "50 trades" — not 150. The Per-Account section below still uses raw legs so
  // per-account P&L stays accurate.
  const trades = dedupeTradesByGroup(rawTrades);
  const analytics = calculateAnalytics(rawTrades, { countBreakevenInWinRate });
  const strategies = getStrategyPerformance(rawTrades);
  const sessions = getSessionPerformance(rawTrades);
  const instrumentMap = new Map<string, { wins: number; losses: number; pnl: number; total: number }>();
  const directionMap = new Map<string, { wins: number; losses: number; pnl: number; total: number }>();
  const instrumentDirectionMap = new Map<string, { wins: number; losses: number; pnl: number; total: number }>();
  const instrumentSessionMap = new Map<string, { wins: number; losses: number; pnl: number; total: number }>();
  const accountLookup = new Map(accounts.map((a: any) => [a.id, a.name]));
  const accountMap = new Map<string, { name: string; wins: number; losses: number; breakeven: number; pnl: number; total: number }>();
  const planMap = new Map<string, { wins: number; losses: number; pnl: number; total: number }>();
  const emotionMap = new Map<number, { wins: number; losses: number; pnl: number; total: number }>();
  const htfMap = new Map<string, { wins: number; losses: number; pnl: number; total: number }>();
  const monthMap = new Map<string, { wins: number; losses: number; pnl: number; total: number }>();

  for (const t of trades) {
    const ic = instrumentMap.get(t.instrument) || { wins: 0, losses: 0, pnl: 0, total: 0 };
    ic.total++; if (t.outcome === 'win') ic.wins++; else if (t.outcome === 'loss') ic.losses++;
    ic.pnl += t.pnl; instrumentMap.set(t.instrument, ic);

    const dc = directionMap.get(t.direction) || { wins: 0, losses: 0, pnl: 0, total: 0 };
    dc.total++; if (t.outcome === 'win') dc.wins++; else if (t.outcome === 'loss') dc.losses++;
    dc.pnl += t.pnl; directionMap.set(t.direction, dc);

    const idKey = `${t.instrument} ${t.direction}`;
    const idc = instrumentDirectionMap.get(idKey) || { wins: 0, losses: 0, pnl: 0, total: 0 };
    idc.total++; if (t.outcome === 'win') idc.wins++; else if (t.outcome === 'loss') idc.losses++;
    idc.pnl += t.pnl; instrumentDirectionMap.set(idKey, idc);

    if (t.session) {
      const isKey = `${t.instrument} / ${t.session}`;
      const isc = instrumentSessionMap.get(isKey) || { wins: 0, losses: 0, pnl: 0, total: 0 };
      isc.total++; if (t.outcome === 'win') isc.wins++; else if (t.outcome === 'loss') isc.losses++;
      isc.pnl += t.pnl; instrumentSessionMap.set(isKey, isc);
    }

    // Account map uses raw legs below — skip here. Deduped row has no accountId.

    if (t.followedPlan === true || t.followedPlan === false) {
      const key = t.followedPlan ? 'On-plan (Followed Plan = YES)' : 'Off-plan (Followed Plan = NO)';
      const pc = planMap.get(key) || { wins: 0, losses: 0, pnl: 0, total: 0 };
      pc.total++; if (t.outcome === 'win') pc.wins++; else if (t.outcome === 'loss') pc.losses++;
      pc.pnl += t.pnl; planMap.set(key, pc);
    }

    if (typeof t.emotionalState === 'number' && t.emotionalState >= 1 && t.emotionalState <= 5) {
      const ec = emotionMap.get(t.emotionalState) || { wins: 0, losses: 0, pnl: 0, total: 0 };
      ec.total++; if (t.outcome === 'win') ec.wins++; else if (t.outcome === 'loss') ec.losses++;
      ec.pnl += t.pnl; emotionMap.set(t.emotionalState, ec);
    }

    if (t.htfBias) {
      const aligned = (t.direction === 'long' && t.htfBias === 'Bullish') || (t.direction === 'short' && t.htfBias === 'Bearish');
      const key = aligned ? 'HTF-aligned' : (t.htfBias === 'Neutral' ? 'HTF-neutral' : 'HTF-counter');
      const hc = htfMap.get(key) || { wins: 0, losses: 0, pnl: 0, total: 0 };
      hc.total++; if (t.outcome === 'win') hc.wins++; else if (t.outcome === 'loss') hc.losses++;
      hc.pnl += t.pnl; htfMap.set(key, hc);
    }

    if (t.date) {
      const ym = String(t.date).slice(0, 7);
      const mc = monthMap.get(ym) || { wins: 0, losses: 0, pnl: 0, total: 0 };
      mc.total++; if (t.outcome === 'win') mc.wins++; else if (t.outcome === 'loss') mc.losses++;
      mc.pnl += t.pnl; monthMap.set(ym, mc);
    }
  }

  // Per-account totals are MONETARY — iterate raw legs so each mirrored leg is counted.
  for (const t of rawTrades) {
    const acctId = t.accountId || 'unassigned';
    const acctName = t.accountId ? (accountLookup.get(t.accountId) || 'Unknown') : 'Unassigned';
    const ac = accountMap.get(acctId) || { name: acctName, wins: 0, losses: 0, breakeven: 0, pnl: 0, total: 0 };
    ac.total++; if (t.outcome === 'win') ac.wins++; else if (t.outcome === 'loss') ac.losses++; else ac.breakeven++;
    ac.pnl += t.pnl; accountMap.set(acctId, ac);
  }

  const earliest = trades.length > 0 ? trades[trades.length - 1].date : '';
  const latest = trades.length > 0 ? trades[0].date : '';
  const fmt = (v: { wins: number; losses: number; pnl: number; total: number }) =>
    `${v.total} trades, ${v.total > 0 ? ((v.wins / v.total) * 100).toFixed(1) : 0}% WR, $${v.pnl.toFixed(2)} P&L`;

  // Surface mirrored grouping so Atlas can talk about decisions vs executions correctly.
  const mirroredGroups = new Set(rawTrades.filter((t: any) => t.tradeGroupId).map((t: any) => t.tradeGroupId)).size;
  const mirroredLegs = rawTrades.filter((t: any) => t.tradeGroupId).length;

  return [
    earliest && latest ? `Trade period: ${earliest} → ${latest}` : '',
    mirroredGroups > 0
      ? `Mirrored trades: ${mirroredGroups} groups across ${mirroredLegs} account executions. "Total trades" below counts decisions (deduped), per-account P&L counts each execution.`
      : '',
    `Total trades: ${analytics.totalTrades}`, `Win rate: ${analytics.winRate.toFixed(1)}%`,
    `Net P&L: $${analytics.netPnl.toFixed(2)}`, `Avg win: $${analytics.avgWin.toFixed(2)}, Avg loss: $${analytics.avgLoss.toFixed(2)}`,
    `Profit factor: ${analytics.profitFactor}`, `Max drawdown: $${analytics.maxDrawdown}`,
    `Current streak: ${analytics.currentStreak.count} ${analytics.currentStreak.type}`,
    '', 'BY STRATEGY:', ...strategies.map(s => `  ${s.strategy}: ${s.total} trades, ${s.winRate}% WR, $${s.pnl} P&L`),
    '', 'BY SESSION:', ...sessions.map(s => `  ${s.session}: ${s.total} trades, ${s.winRate}% WR, $${s.pnl} P&L`),
    '', 'BY INSTRUMENT:', ...Array.from(instrumentMap.entries()).map(([k, v]) => `  ${k}: ${fmt(v)}`),
    '', 'BY DIRECTION:', ...Array.from(directionMap.entries()).map(([k, v]) => `  ${k}: ${fmt(v)}`),
    '', 'BY INSTRUMENT × DIRECTION:', ...Array.from(instrumentDirectionMap.entries()).map(([k, v]) => `  ${k}: ${fmt(v)}`),
    '', 'BY INSTRUMENT × SESSION:', ...Array.from(instrumentSessionMap.entries()).map(([k, v]) => `  ${k}: ${fmt(v)}`),
    '', 'BY PLAN COMPLIANCE (Followed Plan field):',
    ...(planMap.size > 0
      ? Array.from(planMap.entries()).map(([k, v]) => `  ${k}: ${fmt(v)}`)
      : ['  No Followed Plan data logged on trades.']),
    '', 'BY EMOTIONAL STATE (1=worst, 5=best):',
    ...(emotionMap.size > 0
      ? (() => {
          const low = { wins: 0, losses: 0, pnl: 0, total: 0 };
          const high = { wins: 0, losses: 0, pnl: 0, total: 0 };
          for (const [k, v] of emotionMap.entries()) {
            if (k <= 2) { low.wins += v.wins; low.losses += v.losses; low.pnl += v.pnl; low.total += v.total; }
            if (k >= 4) { high.wins += v.wins; high.losses += v.losses; high.pnl += v.pnl; high.total += v.total; }
          }
          const rows = Array.from(emotionMap.entries()).sort((a, b) => a[0] - b[0]).map(([k, v]) => `  State ${k}: ${fmt(v)}`);
          if (low.total > 0) rows.push(`  States 1-2 combined: ${fmt(low)}`);
          if (high.total > 0) rows.push(`  States 4-5 combined: ${fmt(high)}`);
          return rows;
        })()
      : ['  No emotional state logged on trades.']),
    '', 'BY HTF BIAS ALIGNMENT (direction vs logged HTF bias):',
    ...(htfMap.size > 0
      ? Array.from(htfMap.entries()).map(([k, v]) => `  ${k}: ${fmt(v)}`)
      : ['  No HTF bias logged on trades.']),
    '', 'BY MONTH:',
    ...Array.from(monthMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([k, v]) => `  ${k}: ${fmt(v)}`),
    '', 'BY ACCOUNT:', ...Array.from(accountMap.values()).map(a => `  ${a.name}: ${a.total} trades, ${a.wins}W/${a.losses}L/${a.breakeven}BE, ${a.total > 0 ? ((a.wins / a.total) * 100).toFixed(1) : 0}% WR, $${a.pnl.toFixed(2)} P&L`),
  ].join('\n');
}
