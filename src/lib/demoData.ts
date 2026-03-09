// 25 realistic sample trades with intentional "leaky" segments
export interface DemoTrade {
  date: string;
  instrument: string;
  direction: string;
  outcome: string;
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
    { date: d(baseDate, 0), instrument: 'NAS100', direction: 'Long', outcome: 'Win', pnl: 280, strategy: 'ICT OTE', session: 'London', htf_bias: 'Bullish FVG', notes: 'Clean OTE entry, held to target', r_multiple: 2.8, risk_percent: 1, confidence_level: 5, emotional_state: 5, followed_plan: true, time_in_trade: 45 },
    { date: d(baseDate, 1), instrument: 'NAS100', direction: 'Long', outcome: 'Win', pnl: 150, strategy: 'ICT OTE', session: 'London', htf_bias: 'Bullish FVG', notes: 'Solid setup', r_multiple: 1.5, risk_percent: 1, confidence_level: 4, emotional_state: 4, followed_plan: true, time_in_trade: 30 },
    { date: d(baseDate, 3), instrument: 'NAS100', direction: 'Long', outcome: 'Win', pnl: 320, strategy: 'Breaker Block', session: 'London', htf_bias: 'Bullish FVG', notes: 'Breaker retest, strong momentum', r_multiple: 3.2, risk_percent: 1, confidence_level: 5, emotional_state: 5, followed_plan: true, time_in_trade: 60 },
    { date: d(baseDate, 7), instrument: 'NAS100', direction: 'Long', outcome: 'Win', pnl: 200, strategy: 'ICT OTE', session: 'New York AM', htf_bias: 'Bullish FVG', notes: 'NY continuation', r_multiple: 2.0, risk_percent: 1, confidence_level: 4, emotional_state: 4, followed_plan: true, time_in_trade: 35 },

    // Leaky segment: XAUUSD longs (negative expectancy — intentional)
    { date: d(baseDate, 2), instrument: 'XAUUSD', direction: 'Long', outcome: 'Loss', pnl: -100, strategy: 'ICT OTE', session: 'London', htf_bias: 'Bearish FVG', notes: 'Traded against HTF bias', r_multiple: -1.0, risk_percent: 1, confidence_level: 3, emotional_state: 3, followed_plan: false, time_in_trade: 15 },
    { date: d(baseDate, 4), instrument: 'XAUUSD', direction: 'Long', outcome: 'Loss', pnl: -100, strategy: 'ICT OTE', session: 'New York AM', htf_bias: 'Bearish FVG', notes: 'FOMO entry, no confirmation', r_multiple: -1.0, risk_percent: 1, confidence_level: 2, emotional_state: 2, followed_plan: false, time_in_trade: 10 },
    { date: d(baseDate, 6), instrument: 'XAUUSD', direction: 'Long', outcome: 'Loss', pnl: -150, strategy: 'Breaker Block', session: 'London', htf_bias: 'Bearish FVG', notes: 'Overtrading after loss streak', r_multiple: -1.5, risk_percent: 1, confidence_level: 2, emotional_state: 1, followed_plan: false, time_in_trade: 8 },
    { date: d(baseDate, 10), instrument: 'XAUUSD', direction: 'Long', outcome: 'Win', pnl: 80, strategy: 'ICT OTE', session: 'London', htf_bias: 'Bullish FVG', notes: 'Aligned with bias this time', r_multiple: 0.8, risk_percent: 1, confidence_level: 4, emotional_state: 4, followed_plan: true, time_in_trade: 25 },
    { date: d(baseDate, 14), instrument: 'XAUUSD', direction: 'Long', outcome: 'Loss', pnl: -100, strategy: 'ICT OTE', session: 'Asian', htf_bias: 'Bearish FVG', notes: 'Low liquidity session', r_multiple: -1.0, risk_percent: 1, confidence_level: 2, emotional_state: 2, followed_plan: false, time_in_trade: 12 },

    // EUR/USD mixed (slight positive edge)
    { date: d(baseDate, 5), instrument: 'EUR/USD', direction: 'Short', outcome: 'Win', pnl: 120, strategy: 'Order Block', session: 'London', htf_bias: 'Bearish FVG', notes: 'Clean order block rejection', r_multiple: 1.2, risk_percent: 1, confidence_level: 4, emotional_state: 4, followed_plan: true, time_in_trade: 40 },
    { date: d(baseDate, 8), instrument: 'EUR/USD', direction: 'Long', outcome: 'Loss', pnl: -100, strategy: 'ICT OTE', session: 'New York AM', htf_bias: 'Bullish FVG', notes: 'Stopped out at BE almost', r_multiple: -1.0, risk_percent: 1, confidence_level: 3, emotional_state: 3, followed_plan: true, time_in_trade: 20 },
    { date: d(baseDate, 11), instrument: 'EUR/USD', direction: 'Short', outcome: 'Win', pnl: 180, strategy: 'Order Block', session: 'London', htf_bias: 'Bearish FVG', notes: 'Perfect institutional flow', r_multiple: 1.8, risk_percent: 1, confidence_level: 5, emotional_state: 5, followed_plan: true, time_in_trade: 55 },
    { date: d(baseDate, 16), instrument: 'EUR/USD', direction: 'Long', outcome: 'Win', pnl: 90, strategy: 'ICT OTE', session: 'London', htf_bias: 'Bullish FVG', notes: 'Small win, trailed too tight', r_multiple: 0.9, risk_percent: 1, confidence_level: 3, emotional_state: 3, followed_plan: true, time_in_trade: 18 },

    // GBP/JPY high volatility (mixed)
    { date: d(baseDate, 9), instrument: 'GBP/JPY', direction: 'Long', outcome: 'Win', pnl: 350, strategy: 'Breaker Block', session: 'London', htf_bias: 'Bullish FVG', notes: 'Massive move, held full target', r_multiple: 3.5, risk_percent: 1, confidence_level: 5, emotional_state: 5, followed_plan: true, time_in_trade: 90 },
    { date: d(baseDate, 12), instrument: 'GBP/JPY', direction: 'Short', outcome: 'Loss', pnl: -100, strategy: 'ICT OTE', session: 'New York AM', htf_bias: 'Bearish FVG', notes: 'Reversed quickly', r_multiple: -1.0, risk_percent: 1, confidence_level: 3, emotional_state: 3, followed_plan: true, time_in_trade: 5 },
    { date: d(baseDate, 15), instrument: 'GBP/JPY', direction: 'Long', outcome: 'Win', pnl: 200, strategy: 'Breaker Block', session: 'London', htf_bias: 'Bullish FVG', notes: 'Strong continuation', r_multiple: 2.0, risk_percent: 1, confidence_level: 4, emotional_state: 4, followed_plan: true, time_in_trade: 50 },
    { date: d(baseDate, 18), instrument: 'GBP/JPY', direction: 'Short', outcome: 'Loss', pnl: -200, strategy: 'Order Block', session: 'Asian', htf_bias: 'Bearish FVG', notes: 'Doubled risk — mistake', r_multiple: -2.0, risk_percent: 2, confidence_level: 2, emotional_state: 1, followed_plan: false, time_in_trade: 7 },

    // More trades to reach 25
    { date: d(baseDate, 13), instrument: 'NAS100', direction: 'Short', outcome: 'Loss', pnl: -100, strategy: 'ICT OTE', session: 'New York PM', htf_bias: 'Bearish FVG', notes: 'Late session chop', r_multiple: -1.0, risk_percent: 1, confidence_level: 2, emotional_state: 2, followed_plan: false, time_in_trade: 10 },
    { date: d(baseDate, 17), instrument: 'NAS100', direction: 'Long', outcome: 'Win', pnl: 180, strategy: 'ICT OTE', session: 'London', htf_bias: 'Bullish FVG', notes: 'Clean A+ setup', r_multiple: 1.8, risk_percent: 1, confidence_level: 5, emotional_state: 5, followed_plan: true, time_in_trade: 40 },
    { date: d(baseDate, 19), instrument: 'EUR/USD', direction: 'Short', outcome: 'Win', pnl: 140, strategy: 'Order Block', session: 'New York AM', htf_bias: 'Bearish FVG', notes: 'News catalyst aligned', r_multiple: 1.4, risk_percent: 1, confidence_level: 4, emotional_state: 4, followed_plan: true, time_in_trade: 30 },
    { date: d(baseDate, 20), instrument: 'XAUUSD', direction: 'Short', outcome: 'Win', pnl: 220, strategy: 'Breaker Block', session: 'London', htf_bias: 'Bearish FVG', notes: 'Gold shorts work better for me', r_multiple: 2.2, risk_percent: 1, confidence_level: 5, emotional_state: 5, followed_plan: true, time_in_trade: 45 },
    { date: d(baseDate, 22), instrument: 'NAS100', direction: 'Long', outcome: 'Win', pnl: 250, strategy: 'ICT OTE', session: 'London', htf_bias: 'Bullish FVG', notes: 'Textbook OTE', r_multiple: 2.5, risk_percent: 1, confidence_level: 5, emotional_state: 5, followed_plan: true, time_in_trade: 50 },
    { date: d(baseDate, 24), instrument: 'GBP/JPY', direction: 'Long', outcome: 'Loss', pnl: -100, strategy: 'ICT OTE', session: 'London', htf_bias: 'Bullish FVG', notes: 'Fakeout, tight stop', r_multiple: -1.0, risk_percent: 1, confidence_level: 3, emotional_state: 3, followed_plan: true, time_in_trade: 8 },
    { date: d(baseDate, 26), instrument: 'EUR/USD', direction: 'Long', outcome: 'Loss', pnl: -100, strategy: 'ICT OTE', session: 'New York PM', htf_bias: 'Bullish FVG', notes: 'Late session, should have waited', r_multiple: -1.0, risk_percent: 1, confidence_level: 2, emotional_state: 2, followed_plan: false, time_in_trade: 12 },
  ];

  return trades;
}

function d(base: Date, offset: number): string {
  const dt = new Date(base);
  dt.setDate(dt.getDate() + offset);
  return dt.toISOString().split('T')[0];
}
