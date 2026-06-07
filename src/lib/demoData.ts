// 25 realistic sample trades with intentional "leaky" segments
export interface DemoTrade {
  date: string;
  instrument: string;
  direction: 'long' | 'short';
  outcome: 'win' | 'loss' | 'breakeven';
  pnl: number;
  strategy: string;
  session: string;
  htf_bias: string;
  notes: string;
  r_multiple: number;
  risk_percent: number;
  confidence_level: number;
  emotional_state: number;
  followed_plan: boolean;
  time_in_trade: number;
}

export function generateDemoTrades(): DemoTrade[] {
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 30);

  const trades: DemoTrade[] = [
    // Profitable core: NAS100 London longs (strong edge)
    { date: d(baseDate, 0), instrument: 'NAS100', direction: 'long', outcome: 'win', pnl: 280, strategy: 'Trend Continuation', session: 'London', htf_bias: 'Bullish', notes: 'Clean breakout entry, held to target', r_multiple: 2.8, risk_percent: 1, confidence_level: 5, emotional_state: 5, followed_plan: true, time_in_trade: 45 },
    { date: d(baseDate, 1), instrument: 'NAS100', direction: 'long', outcome: 'win', pnl: 150, strategy: 'Trend Continuation', session: 'London', htf_bias: 'Bullish', notes: 'Solid momentum setup', r_multiple: 1.5, risk_percent: 1, confidence_level: 4, emotional_state: 4, followed_plan: true, time_in_trade: 30 },
    { date: d(baseDate, 3), instrument: 'NAS100', direction: 'long', outcome: 'win', pnl: 320, strategy: 'Breakout', session: 'London', htf_bias: 'Bullish', notes: 'Range breakout retest, strong momentum', r_multiple: 3.2, risk_percent: 1, confidence_level: 5, emotional_state: 5, followed_plan: true, time_in_trade: 60 },
    { date: d(baseDate, 7), instrument: 'NAS100', direction: 'long', outcome: 'win', pnl: 200, strategy: 'Trend Continuation', session: 'New York AM', htf_bias: 'Bullish', notes: 'NY session continuation', r_multiple: 2.0, risk_percent: 1, confidence_level: 4, emotional_state: 4, followed_plan: true, time_in_trade: 35 },

    // Leaky segment: XAUUSD longs (negative expectancy — intentional)
    { date: d(baseDate, 2), instrument: 'XAUUSD', direction: 'long', outcome: 'loss', pnl: -100, strategy: 'Trend Continuation', session: 'London', htf_bias: 'Bearish', notes: 'Traded against the trend', r_multiple: -1.0, risk_percent: 1, confidence_level: 3, emotional_state: 3, followed_plan: false, time_in_trade: 15 },
    { date: d(baseDate, 4), instrument: 'XAUUSD', direction: 'long', outcome: 'loss', pnl: -100, strategy: 'Trend Continuation', session: 'New York AM', htf_bias: 'Bearish', notes: 'FOMO entry, no confirmation', r_multiple: -1.0, risk_percent: 1, confidence_level: 2, emotional_state: 2, followed_plan: false, time_in_trade: 10 },
    { date: d(baseDate, 6), instrument: 'XAUUSD', direction: 'long', outcome: 'loss', pnl: -150, strategy: 'Breakout', session: 'London', htf_bias: 'Bearish', notes: 'Overtrading after loss streak', r_multiple: -1.5, risk_percent: 1, confidence_level: 2, emotional_state: 1, followed_plan: false, time_in_trade: 8 },
    { date: d(baseDate, 10), instrument: 'XAUUSD', direction: 'long', outcome: 'win', pnl: 80, strategy: 'Trend Continuation', session: 'London', htf_bias: 'Bullish', notes: 'Aligned with trend this time', r_multiple: 0.8, risk_percent: 1, confidence_level: 4, emotional_state: 4, followed_plan: true, time_in_trade: 25 },
    { date: d(baseDate, 14), instrument: 'XAUUSD', direction: 'long', outcome: 'loss', pnl: -100, strategy: 'Trend Continuation', session: 'Asian', htf_bias: 'Bearish', notes: 'Low volume session, choppy', r_multiple: -1.0, risk_percent: 1, confidence_level: 2, emotional_state: 2, followed_plan: false, time_in_trade: 12 },

    // EUR/USD mixed (slight positive edge)
    { date: d(baseDate, 5), instrument: 'EUR/USD', direction: 'short', outcome: 'win', pnl: 120, strategy: 'Support/Resistance', session: 'London', htf_bias: 'Bearish', notes: 'Clean resistance rejection', r_multiple: 1.2, risk_percent: 1, confidence_level: 4, emotional_state: 4, followed_plan: true, time_in_trade: 40 },
    { date: d(baseDate, 8), instrument: 'EUR/USD', direction: 'long', outcome: 'loss', pnl: -100, strategy: 'Trend Continuation', session: 'New York AM', htf_bias: 'Bullish', notes: 'Stopped out just before target', r_multiple: -1.0, risk_percent: 1, confidence_level: 3, emotional_state: 3, followed_plan: true, time_in_trade: 20 },
    { date: d(baseDate, 11), instrument: 'EUR/USD', direction: 'short', outcome: 'win', pnl: 180, strategy: 'Support/Resistance', session: 'London', htf_bias: 'Bearish', notes: 'Strong push off resistance', r_multiple: 1.8, risk_percent: 1, confidence_level: 5, emotional_state: 5, followed_plan: true, time_in_trade: 55 },
    { date: d(baseDate, 16), instrument: 'EUR/USD', direction: 'long', outcome: 'win', pnl: 90, strategy: 'Trend Continuation', session: 'London', htf_bias: 'Bullish', notes: 'Small win, exited too early', r_multiple: 0.9, risk_percent: 1, confidence_level: 3, emotional_state: 3, followed_plan: true, time_in_trade: 18 },

    // GBP/JPY high volatility (mixed)
    { date: d(baseDate, 9), instrument: 'GBP/JPY', direction: 'long', outcome: 'win', pnl: 350, strategy: 'Breakout', session: 'London', htf_bias: 'Bullish', notes: 'Big range expansion, held full target', r_multiple: 3.5, risk_percent: 1, confidence_level: 5, emotional_state: 5, followed_plan: true, time_in_trade: 90 },
    { date: d(baseDate, 12), instrument: 'GBP/JPY', direction: 'short', outcome: 'loss', pnl: -100, strategy: 'Reversal', session: 'New York AM', htf_bias: 'Bearish', notes: 'Reversed quickly against me', r_multiple: -1.0, risk_percent: 1, confidence_level: 3, emotional_state: 3, followed_plan: true, time_in_trade: 5 },
    { date: d(baseDate, 15), instrument: 'GBP/JPY', direction: 'long', outcome: 'win', pnl: 200, strategy: 'Breakout', session: 'London', htf_bias: 'Bullish', notes: 'Strong continuation trade', r_multiple: 2.0, risk_percent: 1, confidence_level: 4, emotional_state: 4, followed_plan: true, time_in_trade: 50 },
    { date: d(baseDate, 18), instrument: 'GBP/JPY', direction: 'short', outcome: 'loss', pnl: -200, strategy: 'Support/Resistance', session: 'Asian', htf_bias: 'Bearish', notes: 'Doubled risk - discipline mistake', r_multiple: -2.0, risk_percent: 2, confidence_level: 2, emotional_state: 1, followed_plan: false, time_in_trade: 7 },

    // More trades to reach 25
    { date: d(baseDate, 13), instrument: 'NAS100', direction: 'short', outcome: 'loss', pnl: -100, strategy: 'Reversal', session: 'New York PM', htf_bias: 'Bearish', notes: 'Late session chop, low follow-through', r_multiple: -1.0, risk_percent: 1, confidence_level: 2, emotional_state: 2, followed_plan: false, time_in_trade: 10 },
    { date: d(baseDate, 17), instrument: 'NAS100', direction: 'long', outcome: 'win', pnl: 180, strategy: 'Trend Continuation', session: 'London', htf_bias: 'Bullish', notes: 'High-quality setup, patient entry', r_multiple: 1.8, risk_percent: 1, confidence_level: 5, emotional_state: 5, followed_plan: true, time_in_trade: 40 },
    { date: d(baseDate, 19), instrument: 'EUR/USD', direction: 'short', outcome: 'win', pnl: 140, strategy: 'Support/Resistance', session: 'New York AM', htf_bias: 'Bearish', notes: 'News catalyst aligned with bias', r_multiple: 1.4, risk_percent: 1, confidence_level: 4, emotional_state: 4, followed_plan: true, time_in_trade: 30 },
    { date: d(baseDate, 20), instrument: 'XAUUSD', direction: 'short', outcome: 'win', pnl: 220, strategy: 'Breakout', session: 'London', htf_bias: 'Bearish', notes: 'Short side works better for me on gold', r_multiple: 2.2, risk_percent: 1, confidence_level: 5, emotional_state: 5, followed_plan: true, time_in_trade: 45 },
    { date: d(baseDate, 22), instrument: 'NAS100', direction: 'long', outcome: 'win', pnl: 250, strategy: 'Trend Continuation', session: 'London', htf_bias: 'Bullish', notes: 'Textbook momentum entry', r_multiple: 2.5, risk_percent: 1, confidence_level: 5, emotional_state: 5, followed_plan: true, time_in_trade: 50 },
    { date: d(baseDate, 24), instrument: 'GBP/JPY', direction: 'long', outcome: 'loss', pnl: -100, strategy: 'Trend Continuation', session: 'London', htf_bias: 'Bullish', notes: 'Fakeout, tight stop triggered', r_multiple: -1.0, risk_percent: 1, confidence_level: 3, emotional_state: 3, followed_plan: true, time_in_trade: 8 },
    { date: d(baseDate, 26), instrument: 'EUR/USD', direction: 'long', outcome: 'loss', pnl: -100, strategy: 'Trend Continuation', session: 'New York PM', htf_bias: 'Bullish', notes: 'Late session, should have waited', r_multiple: -1.0, risk_percent: 1, confidence_level: 2, emotional_state: 2, followed_plan: false, time_in_trade: 12 },
  ];

  return trades;
}

function d(base: Date, offset: number): string {
  const dt = new Date(base);
  dt.setDate(dt.getDate() + offset);
  return dt.toISOString().split('T')[0];
}
