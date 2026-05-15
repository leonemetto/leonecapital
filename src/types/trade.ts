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
  screenshotUrl?: string;
  createdAt: string;
  tradeGroupId?: string;
}

export type TradeFormData = Omit<Trade, 'id' | 'createdAt'>;

/** Per-account leg of a mirrored trade. Account-specific by definition. */
export interface MirroredLeg {
  accountId: string;
  pnl: number;
}

/** Payload for logging a mirrored trade across N accounts. */
export interface MirroredTradeFormData extends Omit<TradeFormData, 'accountId' | 'pnl'> {
  legs: MirroredLeg[];
}

export const INSTRUMENTS = [
  'XAUUSD', 'NAS100', 'US30', 'SPX500', 'EUR/USD', 'GBP/USD', 'USD/JPY',
  'GBP/JPY', 'AUD/USD', 'USD/CAD', 'BTC/USD', 'ETH/USD', 'SOL/USD',
] as const;

export const STRATEGIES = [
  'Trend Continuation', 'Breakout', 'Support/Resistance', 'Reversal', 'Momentum', 'Scalp',
] as const;

export const SESSIONS = [
  'London', 'New York', 'Asian', 'London/NY Overlap', 'Off-hours',
] as const;

export const HTF_BIASES = ['Bullish', 'Bearish', 'Neutral'] as const;
