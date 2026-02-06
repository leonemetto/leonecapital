export interface Trade {
  id: string;
  date: string;
  instrument: string;
  direction: 'long' | 'short';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  exitPrice: number;
  lotSize: number;
  riskAmount: number;
  pnl: number;
  rrRatio: number;
  rMultiple: number;
  strategy: string;
  setupType: string;
  emotionBefore: string;
  emotionAfter: string;
  notes: string;
  outcome: 'win' | 'loss' | 'breakeven';
  createdAt: string;
}

export type TradeFormData = Omit<Trade, 'id' | 'createdAt' | 'outcome' | 'rrRatio' | 'rMultiple'>;

export const INSTRUMENTS = [
  'XAUUSD', 'NAS100', 'US30', 'SPX500', 'EUR/USD', 'GBP/USD', 'USD/JPY',
  'GBP/JPY', 'AUD/USD', 'USD/CAD', 'BTC/USD', 'ETH/USD', 'SOL/USD',
] as const;

export const STRATEGIES = [
  'Scalp', 'Day Trade', 'Swing', 'Breakout', 'Trend Following',
  'Reversal', 'Range', 'News', 'Mean Reversion',
] as const;

export const SETUP_TYPES = [
  'Support/Resistance', 'Trendline Break', 'MA Cross', 'Fibonacci',
  'Supply/Demand', 'Order Block', 'Fair Value Gap', 'Chart Pattern',
  'Liquidity Sweep', 'Break of Structure',
] as const;

export const EMOTIONS = [
  'Confident', 'Calm', 'Focused', 'Neutral', 'Anxious',
  'FOMO', 'Revenge', 'Greedy', 'Fearful', 'Frustrated',
] as const;
