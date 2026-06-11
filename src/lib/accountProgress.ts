import type { TradingAccount } from '@/types/account';
import type { Trade } from '@/types/trade';

export function getAccountTrades(accountId: string, trades: Trade[], startDate?: string) {
  return trades.filter(trade => trade.accountId === accountId && (!startDate || trade.date >= startDate));
}

export function getAccountBalance(account: TradingAccount, trades: Trade[]) {
  const tradePnl = getAccountTrades(account.id, trades).reduce((sum, trade) => sum + trade.pnl, 0);
  return account.currentBalance + tradePnl + (account.balanceAdjustment ?? 0);
}

export function getAccountTargetProgress(account: TradingAccount, trades: Trade[]) {
  const targetBase = account.type === 'prop' && account.challengeSize
    ? account.challengeSize
    : account.startingBalance;
  const target = account.type === 'prop'
    ? targetBase * ((account.profitTargetPct ?? 10) / 100)
    : account.startingBalance * 0.1;
  const progressTrades = account.type === 'prop'
    ? getAccountTrades(account.id, trades, account.challengeStartDate)
    : getAccountTrades(account.id, trades);
  const pnl = account.type === 'prop'
    ? progressTrades.reduce((sum, trade) => sum + trade.pnl, 0)
    : getAccountBalance(account, trades) - account.startingBalance;
  const progress = target > 0 ? Math.max(0, Math.min(100, (pnl / target) * 100)) : 0;

  return {
    target,
    pnl,
    progress,
    trades: progressTrades,
  };
}
