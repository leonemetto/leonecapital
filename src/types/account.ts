export interface TradingAccount {
  id: string;
  name: string;
  type: 'live' | 'demo' | 'prop';
  startingBalance: number;
  currentBalance: number;
  currency: string;
  createdAt: string;
  // Prop firm challenge fields (only used when type === 'prop')
  challengeSize?: number;
  profitTargetPct?: number;
  maxDailyDdPct?: number;
  maxTotalDdPct?: number;
  trailingDrawdown?: boolean;
  challengeStartDate?: string;
  /** Net balance adjustment: negative = withdrawals, positive = deposits. Applied to displayed balance without affecting PnL metrics. */
  balanceAdjustment: number;
  /** Copy weight used to split mirrored trade P&L proportionally. Default 1. */
  copyWeight: number;
  /** Number of identical funded accounts this row represents. Default 1.
   * Trader with 20 mirrored FTMO 50k accounts sets quantity = 20 instead of
   * creating 20 separate rows. Effective mirror weight = copyWeight × quantity. */
  quantity: number;
}

export type AccountFormData = Omit<TradingAccount, 'id' | 'createdAt'>;

export const ACCOUNT_TYPES = ['live', 'demo', 'prop'] as const;
export const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD'] as const;
