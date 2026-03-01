import { Trade } from '@/types/trade';

// ─── Core Analytics ───
export interface Analytics {
  totalTrades: number;
  wins: number;
  losses: number;
  breakevens: number;
  winRate: number;
  netPnl: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  expectancy: number;
  maxDrawdown: number;
  currentStreak: { type: 'win' | 'loss' | 'none'; count: number };
  avgRWin: number;
  avgRLoss: number;
  rExpectancy: number;
}

export function calculateAnalytics(trades: Trade[]): Analytics {
  const empty: Analytics = {
    totalTrades: 0, wins: 0, losses: 0, breakevens: 0, winRate: 0,
    netPnl: 0, avgWin: 0, avgLoss: 0, profitFactor: 0,
    expectancy: 0, maxDrawdown: 0, currentStreak: { type: 'none', count: 0 },
    avgRWin: 0, avgRLoss: 0, rExpectancy: 0,
  };
  if (trades.length === 0) return empty;

  const wins = trades.filter(t => t.outcome === 'win');
  const losses = trades.filter(t => t.outcome === 'loss');
  const breakevens = trades.filter(t => t.outcome === 'breakeven');
  const totalTrades = trades.length;
  const winRate = (wins.length / totalTrades) * 100;
  const netPnl = trades.reduce((s, t) => s + t.pnl, 0);
  const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((s, t) => s + t.pnl, 0) / losses.length : 0;
  const grossProfit = wins.reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
  const expectancy = (winRate / 100) * avgWin + (1 - winRate / 100) * avgLoss;

  // R-Multiple analytics
  const winsWithR = wins.filter(t => t.rMultiple != null);
  const lossesWithR = losses.filter(t => t.rMultiple != null);
  const avgRWin = winsWithR.length > 0 ? winsWithR.reduce((s, t) => s + (t.rMultiple || 0), 0) / winsWithR.length : 0;
  const avgRLoss = lossesWithR.length > 0 ? lossesWithR.reduce((s, t) => s + Math.abs(t.rMultiple || 0), 0) / lossesWithR.length : 0;
  const tradesWithR = trades.filter(t => t.rMultiple != null);
  const rWinRate = tradesWithR.length > 0 ? tradesWithR.filter(t => t.outcome === 'win').length / tradesWithR.length : 0;
  const rExpectancy = tradesWithR.length > 0 ? (rWinRate * avgRWin) - ((1 - rWinRate) * avgRLoss) : 0;

  const sorted = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  let peak = 0, maxDrawdown = 0, running = 0;
  for (const t of sorted) {
    running += t.pnl;
    if (running > peak) peak = running;
    const dd = peak - running;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  const byDate = [...trades].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  let streakType: 'win' | 'loss' | 'none' = 'none';
  let streakCount = 0;
  if (byDate.length > 0 && byDate[0].outcome !== 'breakeven') {
    streakType = byDate[0].outcome as 'win' | 'loss';
    for (const t of byDate) {
      if (t.outcome === streakType) streakCount++;
      else break;
    }
  }

  return {
    totalTrades, wins: wins.length, losses: losses.length, breakevens: breakevens.length,
    winRate, netPnl, avgWin, avgLoss,
    profitFactor: profitFactor === Infinity ? 999 : Number(profitFactor.toFixed(2)),
    expectancy: Number(expectancy.toFixed(2)), maxDrawdown: Number(maxDrawdown.toFixed(2)),
    currentStreak: { type: streakType, count: streakCount },
    avgRWin: Number(avgRWin.toFixed(2)), avgRLoss: Number(avgRLoss.toFixed(2)),
    rExpectancy: Number(rExpectancy.toFixed(3)),
  };
}

// ─── Expectancy Breakdown Engine ───
export interface ExpectancyBreakdown {
  key: string;
  trades: number;
  wins: number;
  losses: number;
  winRate: number;
  avgR: number;
  expectancy: number;
  pnl: number;
  sampleWarning: boolean;
}

function computeBreakdown(label: string, subset: Trade[]): ExpectancyBreakdown {
  const total = subset.length;
  const wins = subset.filter(t => t.outcome === 'win').length;
  const losses = subset.filter(t => t.outcome === 'loss').length;
  const winRate = total > 0 ? (wins / total) * 100 : 0;
  const pnl = subset.reduce((s, t) => s + t.pnl, 0);
  const withR = subset.filter(t => t.rMultiple != null);
  const avgR = withR.length > 0 ? withR.reduce((s, t) => s + (t.rMultiple || 0), 0) / withR.length : 0;
  const winsR = withR.filter(t => t.outcome === 'win');
  const lossesR = withR.filter(t => t.outcome === 'loss');
  const avgRWin = winsR.length > 0 ? winsR.reduce((s, t) => s + (t.rMultiple || 0), 0) / winsR.length : 0;
  const avgRLoss = lossesR.length > 0 ? lossesR.reduce((s, t) => s + Math.abs(t.rMultiple || 0), 0) / lossesR.length : 0;
  const wr = withR.length > 0 ? winsR.length / withR.length : winRate / 100;
  const expectancy = withR.length > 0 ? (wr * avgRWin) - ((1 - wr) * avgRLoss) : (winRate / 100) * (pnl > 0 ? pnl / Math.max(wins, 1) : 0);

  return {
    key: label,
    trades: total,
    wins,
    losses,
    winRate: Number(winRate.toFixed(1)),
    avgR: Number(avgR.toFixed(2)),
    expectancy: Number(expectancy.toFixed(3)),
    pnl: Number(pnl.toFixed(2)),
    sampleWarning: total < 10,
  };
}

export function getExpectancyByField(trades: Trade[], field: keyof Trade): ExpectancyBreakdown[] {
  const groups = new Map<string, Trade[]>();
  for (const t of trades) {
    const val = String(t[field] ?? 'Unknown');
    if (!val || val === 'undefined') continue;
    if (!groups.has(val)) groups.set(val, []);
    groups.get(val)!.push(t);
  }
  return Array.from(groups.entries())
    .map(([key, subset]) => computeBreakdown(key, subset))
    .sort((a, b) => b.expectancy - a.expectancy);
}

export function getExpectancyByPlanAdherence(trades: Trade[]): ExpectancyBreakdown[] {
  const followed = trades.filter(t => t.followedPlan === true);
  const notFollowed = trades.filter(t => t.followedPlan === false);
  const results: ExpectancyBreakdown[] = [];
  if (followed.length > 0) results.push(computeBreakdown('Plan Followed', followed));
  if (notFollowed.length > 0) results.push(computeBreakdown('Plan Violated', notFollowed));
  return results;
}

// ─── Behavioral Pattern Detection ───
export interface BehavioralInsight {
  type: 'revenge' | 'overtrading' | 'clustering' | 'emotional' | 'post-loss' | 'plan-deviation';
  severity: 'high' | 'medium' | 'low';
  message: string;
  stat: string;
}

export function detectBehavioralPatterns(trades: Trade[]): BehavioralInsight[] {
  if (trades.length < 5) return [];
  const insights: BehavioralInsight[] = [];
  const sorted = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // 1. Revenge trading: multiple trades within same day after a loss
  const byDay = new Map<string, Trade[]>();
  for (const t of sorted) {
    const day = t.date.split('T')[0];
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(t);
  }
  let revengeDays = 0;
  let revengeTotal = 0;
  for (const [, dayTrades] of byDay) {
    if (dayTrades.length < 2) continue;
    for (let i = 1; i < dayTrades.length; i++) {
      if (dayTrades[i - 1].outcome === 'loss') {
        revengeDays++;
        const followUp = dayTrades[i];
        if (followUp.outcome === 'loss') revengeTotal++;
      }
    }
  }
  if (revengeDays >= 3) {
    const lossRate = revengeTotal > 0 ? ((revengeTotal / revengeDays) * 100).toFixed(0) : '0';
    insights.push({
      type: 'revenge',
      severity: parseInt(lossRate) > 60 ? 'high' : 'medium',
      message: `Detected ${revengeDays} instances of trading immediately after a loss on the same day.`,
      stat: `${lossRate}% of follow-up trades were also losses`,
    });
  }

  // 2. Overtrading by day
  const tradeCounts = Array.from(byDay.values()).map(d => d.length);
  const avgPerDay = tradeCounts.reduce((s, c) => s + c, 0) / tradeCounts.length;
  const heavyDays = tradeCounts.filter(c => c > avgPerDay * 2).length;
  if (heavyDays >= 2) {
    insights.push({
      type: 'overtrading',
      severity: heavyDays > 5 ? 'high' : 'medium',
      message: `${heavyDays} days with 2x+ your average daily volume (avg: ${avgPerDay.toFixed(1)} trades/day).`,
      stat: `Overtrading days had ${((Array.from(byDay.values()).filter(d => d.length > avgPerDay * 2).reduce((s, d) => s + d.filter(t => t.outcome === 'loss').length, 0) / Math.max(heavyDays, 1))).toFixed(1)} avg losses`,
    });
  }

  // 3. Loss clustering
  let maxConsecLosses = 0;
  let currentConsec = 0;
  for (const t of sorted) {
    if (t.outcome === 'loss') {
      currentConsec++;
      maxConsecLosses = Math.max(maxConsecLosses, currentConsec);
    } else {
      currentConsec = 0;
    }
  }
  if (maxConsecLosses >= 3) {
    insights.push({
      type: 'clustering',
      severity: maxConsecLosses >= 5 ? 'high' : 'medium',
      message: `Maximum consecutive loss streak: ${maxConsecLosses} trades.`,
      stat: `Consider reducing size after 2 consecutive losses`,
    });
  }

  // 4. Emotional state vs performance
  const withEmotion = trades.filter(t => t.emotionalState != null);
  if (withEmotion.length >= 10) {
    const lowEmotion = withEmotion.filter(t => (t.emotionalState || 0) <= 2);
    const highEmotion = withEmotion.filter(t => (t.emotionalState || 0) >= 4);
    const lowWR = lowEmotion.length > 0 ? (lowEmotion.filter(t => t.outcome === 'win').length / lowEmotion.length * 100) : 0;
    const highWR = highEmotion.length > 0 ? (highEmotion.filter(t => t.outcome === 'win').length / highEmotion.length * 100) : 0;
    if (lowEmotion.length >= 3 && highEmotion.length >= 3 && Math.abs(lowWR - highWR) > 15) {
      insights.push({
        type: 'emotional',
        severity: Math.abs(lowWR - highWR) > 30 ? 'high' : 'medium',
        message: `Emotional state strongly correlates with outcomes.`,
        stat: `Low emotion (1-2): ${lowWR.toFixed(0)}% WR vs High (4-5): ${highWR.toFixed(0)}% WR`,
      });
    }
  }

  // 5. Performance after consecutive losses
  let postLossTrades: Trade[] = [];
  for (let i = 2; i < sorted.length; i++) {
    if (sorted[i - 1].outcome === 'loss' && sorted[i - 2].outcome === 'loss') {
      postLossTrades.push(sorted[i]);
    }
  }
  if (postLossTrades.length >= 3) {
    const violations = postLossTrades.filter(t => t.followedPlan === false).length;
    const violationRate = (violations / postLossTrades.length * 100).toFixed(0);
    const postLossWR = (postLossTrades.filter(t => t.outcome === 'win').length / postLossTrades.length * 100).toFixed(0);
    insights.push({
      type: 'post-loss',
      severity: parseInt(violationRate) > 50 ? 'high' : 'medium',
      message: `After 2 consecutive losses, your next trade has a ${postLossWR}% win rate.`,
      stat: violations > 0 ? `${violationRate}% probability of rule violation after 2 losses` : `${postLossTrades.length} trades sampled`,
    });
  }

  // 6. Plan deviation patterns
  const withPlan = trades.filter(t => t.followedPlan != null);
  if (withPlan.length >= 10) {
    const followed = withPlan.filter(t => t.followedPlan === true);
    const violated = withPlan.filter(t => t.followedPlan === false);
    const fWR = followed.length > 0 ? (followed.filter(t => t.outcome === 'win').length / followed.length * 100) : 0;
    const vWR = violated.length > 0 ? (violated.filter(t => t.outcome === 'win').length / violated.length * 100) : 0;
    if (violated.length >= 3 && fWR - vWR > 10) {
      insights.push({
        type: 'plan-deviation',
        severity: fWR - vWR > 25 ? 'high' : 'medium',
        message: `Plan adherence directly impacts win rate.`,
        stat: `Following plan: ${fWR.toFixed(0)}% WR vs Violating: ${vWR.toFixed(0)}% WR`,
      });
    }
  }

  return insights.sort((a, b) => {
    const sev = { high: 0, medium: 1, low: 2 };
    return sev[a.severity] - sev[b.severity];
  });
}

// ─── Strategy Optimization Simulator ───
export interface SimulationResult {
  label: string;
  originalTrades: number;
  filteredTrades: number;
  originalWinRate: number;
  filteredWinRate: number;
  originalExpectancy: number;
  filteredExpectancy: number;
  originalPnl: number;
  filteredPnl: number;
  improvementPct: number;
  equityCurve: { date: string; balance: number }[];
}

export function simulateFilter(trades: Trade[], filters: {
  htfBias?: string;
  minConfidence?: number;
  followedPlan?: boolean;
  sessions?: string[];
  minEmotionalState?: number;
}): SimulationResult {
  let filtered = [...trades];
  const labels: string[] = [];

  if (filters.htfBias) {
    filtered = filtered.filter(t => t.htfBias === filters.htfBias);
    labels.push(`HTF ${filters.htfBias}`);
  }
  if (filters.minConfidence) {
    filtered = filtered.filter(t => (t.confidenceLevel || 0) >= filters.minConfidence!);
    labels.push(`Confidence ≥${filters.minConfidence}`);
  }
  if (filters.followedPlan !== undefined) {
    filtered = filtered.filter(t => t.followedPlan === filters.followedPlan);
    labels.push(filters.followedPlan ? 'Plan followed' : 'Plan violated');
  }
  if (filters.sessions && filters.sessions.length > 0) {
    filtered = filtered.filter(t => filters.sessions!.includes(t.session));
    labels.push(filters.sessions.join(', '));
  }
  if (filters.minEmotionalState) {
    filtered = filtered.filter(t => (t.emotionalState || 0) >= filters.minEmotionalState!);
    labels.push(`Emotion ≥${filters.minEmotionalState}`);
  }

  const origStats = calculateAnalytics(trades);
  const filtStats = calculateAnalytics(filtered);

  const sortedFiltered = [...filtered].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  let balance = 0;
  const equityCurve = sortedFiltered.map(t => {
    balance += t.pnl;
    return { date: t.date.split('T')[0], balance: Number(balance.toFixed(2)) };
  });

  const origPnl = origStats.netPnl;
  const filtPnl = filtStats.netPnl;
  const improvementPct = origPnl !== 0 ? ((filtPnl - origPnl) / Math.abs(origPnl)) * 100 : filtPnl > 0 ? 100 : 0;

  return {
    label: labels.length > 0 ? labels.join(' + ') : 'No filters',
    originalTrades: trades.length,
    filteredTrades: filtered.length,
    originalWinRate: origStats.winRate,
    filteredWinRate: filtStats.winRate,
    originalExpectancy: origStats.rExpectancy || origStats.expectancy,
    filteredExpectancy: filtStats.rExpectancy || filtStats.expectancy,
    originalPnl: origStats.netPnl,
    filteredPnl: filtStats.netPnl,
    improvementPct: Number(improvementPct.toFixed(1)),
    equityCurve,
  };
}

// ─── Drawdown & Risk Status ───
export type RiskStatus = 'green' | 'yellow' | 'red';

export function getCurrentRiskStatus(trades: Trade[]): { status: RiskStatus; drawdownR: number; message: string } {
  if (trades.length < 3) return { status: 'green', drawdownR: 0, message: 'Insufficient data' };

  const sorted = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const withR = sorted.filter(t => t.rMultiple != null);

  let peak = 0, running = 0, maxDD = 0, currentDD = 0;
  const source = withR.length >= 5 ? withR : sorted;
  const useR = withR.length >= 5;

  for (const t of source) {
    running += useR ? (t.rMultiple || 0) : t.pnl;
    if (running > peak) peak = running;
    const dd = peak - running;
    if (dd > maxDD) maxDD = dd;
    currentDD = dd;
  }

  // Check recent streak
  const recent = sorted.slice(-5);
  const recentLosses = recent.filter(t => t.outcome === 'loss').length;

  let status: RiskStatus = 'green';
  let message = 'Performance within normal parameters.';

  if (currentDD > maxDD * 0.8 || recentLosses >= 4) {
    status = 'red';
    message = useR
      ? `Currently in a -${currentDD.toFixed(1)}R drawdown. Reduce risk to 0.5% until expectancy stabilizes.`
      : `Currently in a -$${currentDD.toFixed(0)} drawdown. Reduce position sizing.`;
  } else if (currentDD > maxDD * 0.5 || recentLosses >= 3) {
    status = 'yellow';
    message = 'Approaching drawdown threshold. Monitor next trades closely.';
  }

  return { status, drawdownR: Number(currentDD.toFixed(2)), message };
}

// ─── Existing helpers ───
export function getEquityCurve(trades: Trade[]) {
  const sorted = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  let balance = 0;
  return sorted.map(t => {
    balance += t.pnl;
    return { date: t.date.split('T')[0], balance: Number(balance.toFixed(2)), pnl: t.pnl };
  });
}

export function getStrategyPerformance(trades: Trade[]) {
  const map = new Map<string, { wins: number; losses: number; pnl: number; total: number }>();
  for (const t of trades) {
    const key = t.strategy || 'Unknown';
    const cur = map.get(key) || { wins: 0, losses: 0, pnl: 0, total: 0 };
    cur.total++;
    if (t.outcome === 'win') cur.wins++;
    else if (t.outcome === 'loss') cur.losses++;
    cur.pnl += t.pnl;
    map.set(key, cur);
  }
  return Array.from(map.entries()).map(([strategy, d]) => ({
    strategy, ...d,
    winRate: d.total > 0 ? Number(((d.wins / d.total) * 100).toFixed(1)) : 0,
    pnl: Number(d.pnl.toFixed(2)),
  }));
}

export function getSessionPerformance(trades: Trade[]) {
  const map = new Map<string, { wins: number; losses: number; pnl: number; total: number }>();
  for (const t of trades) {
    const key = t.session || 'Unknown';
    const cur = map.get(key) || { wins: 0, losses: 0, pnl: 0, total: 0 };
    cur.total++;
    if (t.outcome === 'win') cur.wins++;
    else if (t.outcome === 'loss') cur.losses++;
    cur.pnl += t.pnl;
    map.set(key, cur);
  }
  return Array.from(map.entries()).map(([session, d]) => ({
    session, ...d,
    winRate: d.total > 0 ? Number(((d.wins / d.total) * 100).toFixed(1)) : 0,
    pnl: Number(d.pnl.toFixed(2)),
  }));
}

export function getDailyPnl(trades: Trade[]) {
  const map = new Map<string, { pnl: number; trades: number }>();
  for (const t of trades) {
    const day = t.date.split('T')[0];
    const cur = map.get(day) || { pnl: 0, trades: 0 };
    cur.pnl += t.pnl;
    cur.trades++;
    map.set(day, cur);
  }
  return map;
}

export function exportTradesCSV(trades: Trade[]) {
  const headers = ['Date', 'Instrument', 'Direction', 'Strategy', 'Session', 'P&L ($)', 'R-Multiple', 'Risk %', 'HTF Bias', 'Emotional State', 'Confidence', 'Time (min)', 'Followed Plan', 'Outcome', 'Notes'];
  const rows = trades.map(t => [
    t.date, t.instrument, t.direction, t.strategy, t.session,
    t.pnl, t.rMultiple ?? '', t.riskPercent ?? '', t.htfBias ?? '',
    t.emotionalState ?? '', t.confidenceLevel ?? '', t.timeInTrade ?? '',
    t.followedPlan != null ? (t.followedPlan ? 'Yes' : 'No') : '',
    t.outcome,
    `"${(t.notes || '').replace(/"/g, '""')}"`,
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `edgeflow_trades_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
