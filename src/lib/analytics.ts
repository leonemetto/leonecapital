import { Trade } from '@/types/trade';

export interface Analytics {
  totalTrades: number;
  wins: number;
  losses: number;
  breakevens: number;
  winRate: number;
  netPnl: number;
  avgWin: number;
  avgLoss: number;
  rrRatio: number;
  profitFactor: number;
  expectancy: number;
  maxDrawdown: number;
  currentStreak: { type: 'win' | 'loss' | 'none'; count: number };
}

export function calculateAnalytics(trades: Trade[]): Analytics {
  const empty: Analytics = {
    totalTrades: 0, wins: 0, losses: 0, breakevens: 0, winRate: 0,
    netPnl: 0, avgWin: 0, avgLoss: 0, rrRatio: 0, profitFactor: 0,
    expectancy: 0, maxDrawdown: 0, currentStreak: { type: 'none', count: 0 },
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
  const rrRatio = avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : 0;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
  const expectancy = (winRate / 100) * avgWin + (1 - winRate / 100) * avgLoss;

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
    winRate, netPnl, avgWin, avgLoss, rrRatio: Number(rrRatio.toFixed(2)),
    profitFactor: profitFactor === Infinity ? 999 : Number(profitFactor.toFixed(2)),
    expectancy: Number(expectancy.toFixed(2)), maxDrawdown: Number(maxDrawdown.toFixed(2)),
    currentStreak: { type: streakType, count: streakCount },
  };
}

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

export function getPairDistribution(trades: Trade[]) {
  const map = new Map<string, { count: number; pnl: number }>();
  for (const t of trades) {
    const cur = map.get(t.instrument) || { count: 0, pnl: 0 };
    cur.count++;
    cur.pnl += t.pnl;
    map.set(t.instrument, cur);
  }
  return Array.from(map.entries()).map(([instrument, d]) => ({
    instrument, ...d, pnl: Number(d.pnl.toFixed(2)),
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

export function generateInsights(trades: Trade[]): string[] {
  const insights: string[] = [];
  if (trades.length < 3) {
    insights.push('Log at least 3 trades to unlock performance insights.');
    return insights;
  }

  const strats = getStrategyPerformance(trades);
  if (strats.length > 0) {
    const best = [...strats].sort((a, b) => b.winRate - a.winRate)[0];
    insights.push(`Your best strategy is "${best.strategy}" with a ${best.winRate}% win rate across ${best.total} trades.`);
    if (strats.length > 1) {
      const worst = [...strats].sort((a, b) => a.winRate - b.winRate)[0];
      if (worst.strategy !== best.strategy) {
        insights.push(`Consider reviewing "${worst.strategy}" — it has only a ${worst.winRate}% win rate.`);
      }
    }
  }

  const pairs = getPairDistribution(trades);
  if (pairs.length > 0) {
    const bestPair = [...pairs].sort((a, b) => b.pnl - a.pnl)[0];
    insights.push(`Your most profitable instrument is ${bestPair.instrument} ($${bestPair.pnl.toFixed(2)} total P&L).`);
    if (pairs.length > 1) {
      const worstPair = [...pairs].sort((a, b) => a.pnl - b.pnl)[0];
      if (worstPair.pnl < 0) {
        insights.push(`${worstPair.instrument} is your worst performer at -$${Math.abs(worstPair.pnl).toFixed(2)}. Consider reducing exposure.`);
      }
    }
  }

  const emoMap = new Map<string, { wins: number; total: number }>();
  for (const t of trades) {
    const emo = t.emotionBefore || 'Unknown';
    const cur = emoMap.get(emo) || { wins: 0, total: 0 };
    cur.total++;
    if (t.outcome === 'win') cur.wins++;
    emoMap.set(emo, cur);
  }
  let worstEmo = '', worstWR = 100;
  emoMap.forEach((d, emo) => {
    if (d.total >= 2) {
      const wr = (d.wins / d.total) * 100;
      if (wr < worstWR) { worstWR = wr; worstEmo = emo; }
    }
  });
  if (worstEmo && worstWR < 50) {
    insights.push(`Your win rate drops to ${worstWR.toFixed(0)}% when feeling "${worstEmo}". Consider stepping back in those moments.`);
  }

  const avgRisk = trades.reduce((s, t) => s + t.riskAmount, 0) / trades.length;
  const highRisk = trades.filter(t => t.riskAmount > avgRisk * 1.5);
  if (highRisk.length >= 2) {
    const hrWR = (highRisk.filter(t => t.outcome === 'win').length / highRisk.length) * 100;
    if (hrWR < 45) {
      insights.push(`Your win rate drops to ${hrWR.toFixed(0)}% on high-risk trades (>$${(avgRisk * 1.5).toFixed(0)}). Consider reducing size.`);
    }
  }

  const hours = new Map<number, { wins: number; total: number }>();
  for (const t of trades) {
    const h = new Date(t.date).getHours();
    const cur = hours.get(h) || { wins: 0, total: 0 };
    cur.total++;
    if (t.outcome === 'win') cur.wins++;
    hours.set(h, cur);
  }
  let bestHour = -1, bestHourWR = 0;
  hours.forEach((d, h) => {
    if (d.total >= 2) {
      const wr = (d.wins / d.total) * 100;
      if (wr > bestHourWR) { bestHourWR = wr; bestHour = h; }
    }
  });
  if (bestHour >= 0 && bestHourWR > 60) {
    const endH = bestHour + 1;
    insights.push(`You perform best between ${bestHour}:00–${endH}:00 with a ${bestHourWR.toFixed(0)}% win rate.`);
  }

  return insights;
}

export function exportTradesCSV(trades: Trade[]) {
  const headers = ['Date', 'Instrument', 'Direction', 'Entry', 'Stop Loss', 'Take Profit', 'Exit', 'Lot Size', 'Risk ($)', 'P&L ($)', 'R:R', 'R-Multiple', 'Strategy', 'Setup', 'Emotion Before', 'Emotion After', 'Outcome', 'Notes'];
  const rows = trades.map(t => [
    t.date, t.instrument, t.direction, t.entryPrice, t.stopLoss, t.takeProfit,
    t.exitPrice, t.lotSize, t.riskAmount, t.pnl, t.rrRatio, t.rMultiple,
    t.strategy, t.setupType, t.emotionBefore, t.emotionAfter, t.outcome,
    `"${(t.notes || '').replace(/"/g, '""')}"`,
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `edgejournal_trades_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
