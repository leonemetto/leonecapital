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
  profitFactor: number;
  expectancy: number;
  maxDrawdown: number;
  currentStreak: { type: 'win' | 'loss' | 'none'; count: number };
}

export function calculateAnalytics(trades: Trade[]): Analytics {
  const empty: Analytics = {
    totalTrades: 0, wins: 0, losses: 0, breakevens: 0, winRate: 0,
    netPnl: 0, avgWin: 0, avgLoss: 0, profitFactor: 0,
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
    winRate, netPnl, avgWin, avgLoss,
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
  const headers = ['Date', 'Instrument', 'Direction', 'Strategy', 'Session', 'P&L ($)', 'R-Multiple', 'Outcome', 'Notes'];
  const rows = trades.map(t => [
    t.date, t.instrument, t.direction, t.strategy, t.session,
    t.pnl, t.rMultiple ?? '', t.outcome,
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
