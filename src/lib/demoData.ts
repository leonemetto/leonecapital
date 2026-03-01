import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';

const INSTRUMENTS = ['XAUUSD', 'NAS100', 'US30', 'EUR/USD', 'GBP/USD', 'GBP/JPY', 'BTC/USD'];
const SESSIONS = ['London', 'New York', 'Asian', 'London/NY Overlap'];
const STRATEGIES = ['CISD', 'IFVG', 'Both'];
const BIASES = ['Bullish', 'Bearish', 'Neutral'];
const DIRECTIONS = ['long', 'short'];
const OUTCOMES = ['win', 'loss', 'breakeven'];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rand(min: number, max: number) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

export async function insertDemoTrades(accountId: string): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const trades = [];
  const count = 35;

  for (let i = 0; i < count; i++) {
    const outcome = pick(OUTCOMES);
    const pnl = outcome === 'win' ? rand(20, 350) : outcome === 'loss' ? rand(-250, -15) : 0;
    const rMultiple = outcome === 'win' ? rand(0.5, 4) : outcome === 'loss' ? rand(-2, -0.3) : 0;
    const followedPlan = Math.random() > 0.3;
    const emotionalState = Math.floor(Math.random() * 5) + 1;
    const confidenceLevel = Math.floor(Math.random() * 5) + 1;

    trades.push({
      user_id: user.id,
      account_id: accountId,
      date: format(subDays(new Date(), Math.floor(Math.random() * 30)), 'yyyy-MM-dd'),
      instrument: pick(INSTRUMENTS),
      direction: pick(DIRECTIONS),
      strategy: pick(STRATEGIES),
      session: pick(SESSIONS),
      outcome,
      pnl,
      r_multiple: rMultiple,
      risk_percent: rand(0.25, 2),
      htf_bias: pick(BIASES),
      emotional_state: emotionalState,
      confidence_level: confidenceLevel,
      time_in_trade: Math.floor(Math.random() * 120) + 5,
      followed_plan: followedPlan,
      notes: '',
    });
  }

  const { error } = await supabase.from('trades').insert(trades as any);
  if (error) throw error;
  return count;
}
