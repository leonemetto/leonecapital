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
}

export type AccountFormData = Omit<TradingAccount, 'id' | 'createdAt'>;

export const ACCOUNT_TYPES = ['live', 'demo', 'prop'] as const;
export const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD'] as const;
