// Sample data for the dev-only preview (see PreviewGate). Deterministic so
// screenshots are comparable from one run to the next.
import type { Trade } from '@/types/trade';
import type { TradingAccount } from '@/types/account';

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const iso = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const previewAccounts: TradingAccount[] = [
  {
    id: 'acc-prop', name: 'Apex 50k', type: 'prop', startingBalance: 50000, currentBalance: 50000, currency: 'USD',
    createdAt: new Date(Date.now() - 40 * 86_400_000).toISOString(), challengeSize: 50000, profitTargetPct: 8,
    maxDailyDdPct: 4, maxTotalDdPct: 8, trailingDrawdown: false,
    challengeStartDate: iso(new Date(Date.now() - 18 * 86_400_000)), balanceAdjustment: 0, copyWeight: 1, quantity: 1,
  },
  {
    id: 'acc-live', name: 'IBKR Live', type: 'live', startingBalance: 12000, currentBalance: 12000, currency: 'USD',
    createdAt: new Date(Date.now() - 120 * 86_400_000).toISOString(), balanceAdjustment: 0, copyWeight: 1, quantity: 1,
  },
];

// [instrument, direction, session, setup, win probability, avg win, avg loss]
const PROFILES: [string, 'long' | 'short', string, string, number, number, number][] = [
  ['NAS100', 'long', 'London', 'Trend Continuation', 0.68, 262, 118],
  ['NAS100', 'long', 'New York', 'Breakout', 0.58, 214, 126],
  ['EUR/USD', 'short', 'London', 'Support/Resistance', 0.6, 148, 96],
  ['GBP/JPY', 'long', 'London', 'Breakout', 0.52, 284, 142],
  ['XAUUSD', 'short', 'London', 'Reversal', 0.27, 172, 134],
  ['XAUUSD', 'long', 'Asian', 'Trend Continuation', 0.3, 128, 117],
  ['US30', 'short', 'New York', 'Momentum', 0.44, 196, 151],
  ['EUR/USD', 'long', 'New York', 'Trend Continuation', 0.5, 121, 104],
];

const NOTES = [
  'Clean entry on the retest, held to target.',
  'Entered before confirmation. Stopped out.',
  'Moved the stop to breakeven too early.',
  'Patient entry, sized correctly.',
  'Chased after missing the first move.',
  '',
  '',
];

export function buildPreviewTrades(): Trade[] {
  const rand = mulberry32(20261004);
  const trades: Trade[] = [];
  const today = new Date();
  let n = 0;

  for (let back = 74; back >= 0; back--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - back);
    const dow = d.getDay();
    const isToday = back === 0;
    // Markets are closed at the weekend; the preview still shows two trades "today".
    if (!isToday && (dow === 0 || dow === 6)) continue;
    const count = isToday ? 2 : rand() < 0.28 ? 0 : rand() < 0.62 ? 1 : rand() < 0.8 ? 2 : 3;

    for (let i = 0; i < count; i++) {
      const [instrument, direction, session, strategy, pWin, avgWin, avgLoss] = PROFILES[Math.floor(rand() * PROFILES.length)];
      const roll = rand();
      const outcome: Trade['outcome'] = roll < pWin ? 'win' : roll < pWin + 0.06 ? 'breakeven' : 'loss';
      const scale = 0.55 + rand() * 0.95;
      const pnl = outcome === 'win' ? Math.round(avgWin * scale) : outcome === 'loss' ? -Math.round(avgLoss * scale) : 0;
      const r = outcome === 'win' ? +(0.8 + rand() * 2.4).toFixed(1) : outcome === 'loss' ? -+(0.6 + rand() * 0.6).toFixed(1) : 0;
      const offPlan = outcome === 'loss' ? rand() < 0.5 : rand() < 0.12;
      // The newest few trades are left untagged so the review queue has work in it.
      const untagged = back <= 3 && rand() < 0.7;
      const emotional = offPlan ? 1 + Math.floor(rand() * 2) : 3 + Math.floor(rand() * 3);
      n++;
      trades.push({
        id: `pv-${String(n).padStart(3, '0')}`,
        date: iso(d),
        instrument,
        direction,
        strategy,
        session,
        outcome,
        pnl,
        rMultiple: r,
        riskPercent: offPlan && rand() < 0.3 ? 2 : 1,
        htfBias: direction === 'long' ? (offPlan ? 'Bearish' : 'Bullish') : offPlan ? 'Bullish' : 'Bearish',
        emotionalState: emotional,
        confidenceLevel: Math.min(5, emotional + (rand() < 0.5 ? 0 : 1)),
        timeInTrade: 8 + Math.floor(rand() * 80),
        followedPlan: untagged ? undefined : !offPlan,
        notes: NOTES[Math.floor(rand() * NOTES.length)],
        accountId: rand() < 0.72 ? 'acc-prop' : 'acc-live',
        createdAt: new Date(d.getTime() + (9 + i * 2) * 3_600_000).toISOString(),
      });
    }
  }
  // Newest first, matching the order the trades query returns.
  return trades.reverse();
}

export const previewCriteria = [
  { id: 'c1', label: 'Trend clearly defined on the higher timeframe', category: 'Trend', isActive: true, sortOrder: 0 },
  { id: 'c2', label: 'Entry near key support or resistance', category: 'Structure', isActive: true, sortOrder: 1 },
  { id: 'c3', label: 'Risk-to-reward at least 1:2', category: 'Risk', isActive: true, sortOrder: 2 },
  { id: 'c4', label: 'Position size within the daily risk limit', category: 'Risk', isActive: true, sortOrder: 3 },
  { id: 'c5', label: 'No major news in the next 30 minutes', category: 'Risk', isActive: false, sortOrder: 4 },
];

export const previewGoals = { dailyTarget: 300, weeklyTarget: 1200, monthlyTarget: 4000, maxDailyLoss: 450 };

export const previewProfile = {
  id: 'pv-profile', userId: 'pv-user', nickname: 'Sam', avatarUrl: '', createdAt: new Date().toISOString(),
  onboardingCompleted: true, guideProgress: { sections: [] },
};
