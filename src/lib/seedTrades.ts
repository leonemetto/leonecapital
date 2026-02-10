import { Trade, INSTRUMENTS, STRATEGIES, SESSIONS } from '@/types/trade';

const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
const rand = (min: number, max: number) => Math.random() * (max - min) + min;

export function generateDemoTrades(): Trade[] {
  const trades: Trade[] = [];
  // Generate trades for Jan 5 – Feb 10, 2026 (weekdays only)
  const start = new Date(2026, 0, 5); // Jan 5
  const end = new Date(2026, 1, 10);  // Feb 10

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue; // skip weekends

    // 0-3 trades per day, weighted toward 1-2
    const count = Math.random() < 0.15 ? 0 : Math.random() < 0.5 ? 1 : Math.random() < 0.8 ? 2 : 3;

    for (let i = 0; i < count; i++) {
      const isWin = Math.random() < 0.55;
      const isBE = !isWin && Math.random() < 0.15;
      const outcome = isBE ? 'breakeven' : isWin ? 'win' : 'loss';
      const pnl = outcome === 'breakeven'
        ? 0
        : outcome === 'win'
          ? Math.round(rand(30, 500) * 100) / 100
          : -Math.round(rand(20, 300) * 100) / 100;

      const hour = 8 + Math.floor(Math.random() * 10);
      const minute = Math.floor(Math.random() * 60);
      const date = new Date(d);
      date.setHours(hour, minute, 0, 0);

      trades.push({
        id: crypto.randomUUID(),
        date: date.toISOString().slice(0, 16),
        instrument: pick(INSTRUMENTS),
        direction: Math.random() < 0.5 ? 'long' : 'short',
        strategy: pick(STRATEGIES),
        session: pick(SESSIONS),
        outcome,
        pnl,
        rMultiple: outcome !== 'breakeven' ? Math.round(rand(0.3, 3.5) * 10) / 10 : 0,
        notes: '',
        createdAt: new Date().toISOString(),
      });
    }
  }

  return trades;
}
