import { useMemo } from 'react';
import { TradingAccount } from '@/types/account';
import { Trade } from '@/types/trade';
import { cn } from '@/lib/utils';
import { Trophy, Warning, TrendDown, CalendarCheck } from '@phosphor-icons/react';

interface Props {
  account: TradingAccount;
  trades: Trade[];
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);
  return (
    <div className="h-1.5 w-full rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

export function PropFirmCard({ account, trades }: Props) {
  const accountTrades = useMemo(
    () => trades.filter(t => t.accountId === account.id),
    [trades, account.id]
  );

  const {
    challengeSize = account.startingBalance,
    profitTargetPct = 10,
    maxDailyDdPct = 5,
    maxTotalDdPct = 10,
    trailingDrawdown = false,
    challengeStartDate,
  } = account;

  const profitTarget = (challengeSize * profitTargetPct) / 100;
  const maxDailyLoss = (challengeSize * maxDailyDdPct) / 100;
  const maxTotalLoss = (challengeSize * maxTotalDdPct) / 100;

  // Net P&L from challenge start (or all trades if no start date)
  const challengeTrades = useMemo(() => {
    if (!challengeStartDate) return accountTrades;
    return accountTrades.filter(t => t.date >= challengeStartDate);
  }, [accountTrades, challengeStartDate]);

  const netPnl = useMemo(
    () => challengeTrades.reduce((s, t) => s + t.pnl, 0),
    [challengeTrades]
  );

  // Today's P&L
  const today = new Date().toISOString().slice(0, 10);
  const dailyPnl = useMemo(
    () => challengeTrades.filter(t => t.date === today).reduce((s, t) => s + t.pnl, 0),
    [challengeTrades, today]
  );

  // Trailing drawdown — track equity high watermark
  const trailingDdUsed = useMemo(() => {
    if (!trailingDrawdown) return Math.max(0, -netPnl); // static: just current drawdown from start
    let balance = challengeSize;
    let highWater = challengeSize;
    const sorted = [...challengeTrades].sort((a, b) => a.date.localeCompare(b.date));
    for (const t of sorted) {
      balance += t.pnl;
      if (balance > highWater) highWater = balance;
    }
    return Math.max(0, highWater - balance);
  }, [challengeTrades, challengeSize, trailingDrawdown]);

  // Consistency score: % of trading days that were net profitable
  const consistencyScore = useMemo(() => {
    const dayMap = new Map<string, number>();
    for (const t of challengeTrades) {
      dayMap.set(t.date, (dayMap.get(t.date) ?? 0) + t.pnl);
    }
    if (dayMap.size === 0) return null;
    const greenDays = [...dayMap.values()].filter(v => v > 0).length;
    return Math.round((greenDays / dayMap.size) * 100);
  }, [challengeTrades]);

  // Consecutive green days (current streak)
  const greenStreak = useMemo(() => {
    const dayMap = new Map<string, number>();
    for (const t of challengeTrades) {
      dayMap.set(t.date, (dayMap.get(t.date) ?? 0) + t.pnl);
    }
    const days = [...dayMap.entries()].sort(([a], [b]) => b.localeCompare(a));
    let streak = 0;
    for (const [, pnl] of days) {
      if (pnl > 0) streak++;
      else break;
    }
    return streak;
  }, [challengeTrades]);

  const profitPct = profitTarget > 0 ? (netPnl / profitTarget) * 100 : 0;
  const dailyDdPct = maxDailyLoss > 0 ? (Math.abs(Math.min(dailyPnl, 0)) / maxDailyLoss) * 100 : 0;
  const totalDdPct = maxTotalLoss > 0 ? (trailingDdUsed / maxTotalLoss) * 100 : 0;

  const profitColor = netPnl >= 0 ? '#10b981' : '#f87171';
  const dailyDdColor = dailyDdPct >= 100 ? '#f87171' : dailyDdPct >= 80 ? '#f59e0b' : '#10b981';
  const totalDdColor = totalDdPct >= 100 ? '#f87171' : totalDdPct >= 80 ? '#f59e0b' : '#10b981';

  const fmt = (v: number) => v.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div className="rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.07)] p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[10px] uppercase tracking-[0.1em] text-[rgba(255,255,255,0.3)] mb-0.5">Prop Challenge</p>
          <p className="text-sm font-semibold text-white">{account.name}</p>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/20">
          {trailingDrawdown ? 'Trailing DD' : 'Static DD'}
        </span>
      </div>

      {/* 4 metrics grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">

        {/* Profit Target */}
        <div className="rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Trophy className="h-3 w-3 text-[rgba(255,255,255,0.3)]" weight="fill" />
            <span className="text-[10px] uppercase tracking-[0.08em] text-[rgba(255,255,255,0.3)]">Profit Target</span>
          </div>
          <div className="flex items-baseline justify-between mb-2">
            <span className={cn('text-[22px] leading-none metric-number', netPnl >= 0 ? 'text-[#10b981]' : 'text-[#f87171]')}>
              {netPnl >= 0 ? '+' : '-'}${fmt(Math.abs(netPnl))}
            </span>
            <span className="text-[11px] text-[rgba(255,255,255,0.3)]">/ ${fmt(profitTarget)}</span>
          </div>
          <ProgressBar value={Math.max(netPnl, 0)} max={profitTarget} color={profitColor} />
          <p className="text-[10px] text-[rgba(255,255,255,0.3)] mt-1.5">
            {profitPct >= 100 ? '🎯 Target reached!' : `${Math.max(profitPct, 0).toFixed(1)}% of ${profitTargetPct}% goal`}
          </p>
        </div>

        {/* Daily Drawdown */}
        <div className="rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Warning className="h-3 w-3 text-[rgba(255,255,255,0.3)]" weight="fill" />
            <span className="text-[10px] uppercase tracking-[0.08em] text-[rgba(255,255,255,0.3)]">Daily Drawdown</span>
          </div>
          <div className="flex items-baseline justify-between mb-2">
            <span className={cn('text-[22px] leading-none metric-number', dailyPnl >= 0 ? 'text-white' : 'text-[#f87171]')}>
              {dailyPnl >= 0 ? '+' : '-'}${fmt(Math.abs(dailyPnl))}
            </span>
            <span className="text-[11px] text-[rgba(255,255,255,0.3)]">/ -${fmt(maxDailyLoss)}</span>
          </div>
          <ProgressBar value={Math.abs(Math.min(dailyPnl, 0))} max={maxDailyLoss} color={dailyDdColor} />
          <p className="text-[10px] mt-1.5" style={{ color: dailyDdColor }}>
            {dailyDdPct >= 100 ? '🚨 Daily limit breached' : dailyDdPct >= 80 ? `⚠️ ${dailyDdPct.toFixed(0)}% used — caution` : `${dailyDdPct.toFixed(0)}% used today`}
          </p>
        </div>

        {/* Max Drawdown (static or trailing) */}
        <div className="rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendDown className="h-3 w-3 text-[rgba(255,255,255,0.3)]" weight="fill" />
            <span className="text-[10px] uppercase tracking-[0.08em] text-[rgba(255,255,255,0.3)]">
              {trailingDrawdown ? 'Trailing DD' : 'Max Drawdown'}
            </span>
          </div>
          <div className="flex items-baseline justify-between mb-2">
            <span className={cn('text-[22px] leading-none metric-number', trailingDdUsed === 0 ? 'text-white' : 'text-[#f87171]')}>
              -${fmt(trailingDdUsed)}
            </span>
            <span className="text-[11px] text-[rgba(255,255,255,0.3)]">/ -${fmt(maxTotalLoss)}</span>
          </div>
          <ProgressBar value={trailingDdUsed} max={maxTotalLoss} color={totalDdColor} />
          <p className="text-[10px] mt-1.5" style={{ color: totalDdColor }}>
            {totalDdPct >= 100 ? '🚨 Max DD breached' : totalDdPct >= 80 ? `⚠️ ${totalDdPct.toFixed(0)}% used — high risk` : `${totalDdPct.toFixed(0)}% of ${maxTotalDdPct}% limit used`}
          </p>
        </div>

        {/* Consistency */}
        <div className="rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <CalendarCheck className="h-3 w-3 text-[rgba(255,255,255,0.3)]" weight="fill" />
            <span className="text-[10px] uppercase tracking-[0.08em] text-[rgba(255,255,255,0.3)]">Consistency</span>
          </div>
          {consistencyScore === null ? (
            <p className="text-[12px] text-[rgba(255,255,255,0.25)] mt-1">No trades logged yet</p>
          ) : (
            <>
              <div className="flex items-baseline justify-between mb-2">
                <span className={cn('text-[22px] leading-none metric-number', consistencyScore >= 60 ? 'text-[#10b981]' : consistencyScore >= 40 ? 'text-[#f59e0b]' : 'text-[#f87171]')}>
                  {consistencyScore}%
                </span>
                <span className="text-[11px] text-[rgba(255,255,255,0.3)]">green days</span>
              </div>
              <ProgressBar
                value={consistencyScore}
                max={100}
                color={consistencyScore >= 60 ? '#10b981' : consistencyScore >= 40 ? '#f59e0b' : '#f87171'}
              />
              <p className="text-[10px] text-[rgba(255,255,255,0.3)] mt-1.5">
                {greenStreak > 0 ? `${greenStreak} green day${greenStreak > 1 ? 's' : ''} in a row` : 'No current streak'}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Challenge stats footer */}
      <div className="flex items-center gap-4 pt-3 border-t border-[rgba(255,255,255,0.05)]">
        <div>
          <p className="text-[10px] text-[rgba(255,255,255,0.25)] uppercase tracking-wide">Account Size</p>
          <p className="text-[13px] font-semibold text-white metric-number">${fmt(challengeSize)}</p>
        </div>
        <div>
          <p className="text-[10px] text-[rgba(255,255,255,0.25)] uppercase tracking-wide">Trades Logged</p>
          <p className="text-[13px] font-semibold text-white metric-number">{challengeTrades.length}</p>
        </div>
        {challengeStartDate && (
          <div>
            <p className="text-[10px] text-[rgba(255,255,255,0.25)] uppercase tracking-wide">Challenge Start</p>
            <p className="text-[13px] font-semibold text-white">{challengeStartDate}</p>
          </div>
        )}
        <div className="flex-1" />
        <p className="text-[10px] text-[rgba(255,255,255,0.2)]">
          {trailingDrawdown ? 'Trailing drawdown from equity high' : 'Static drawdown from start balance'}
        </p>
      </div>
    </div>
  );
}
