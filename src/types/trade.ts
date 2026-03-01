export interface Trade {
  id: string;
  date: string;
  instrument: string;
  direction: 'long' | 'short';
  strategy: string;
  session: string;
  outcome: 'win' | 'loss' | 'breakeven';
  pnl: number;
  rMultiple?: number;
  riskPercent?: number;
  htfBias?: string;
  emotionalState?: number;
  confidenceLevel?: number;
  timeInTrade?: number;
  followedPlan?: boolean;
  notes: string;
  accountId?: string;
  createdAt: string;
}

export type TradeFormData = Omit<Trade, 'id' | 'createdAt'>;

export const INSTRUMENTS = [
  'XAUUSD', 'NAS100', 'US30', 'SPX500', 'EUR/USD', 'GBP/USD', 'USD/JPY',
  'GBP/JPY', 'AUD/USD', 'USD/CAD', 'BTC/USD', 'ETH/USD', 'SOL/USD',
] as const;

export const STRATEGIES = [
  'CISD', 'IFVG', 'Both',
] as const;

export const SESSIONS = [
  'London', 'New York', 'Asian', 'London/NY Overlap', 'Off-hours',
] as const;

export const HTF_BIASES = ['Bullish', 'Bearish', 'Neutral'] as const;
