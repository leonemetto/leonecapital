import { useMemo } from 'react';
import { Analytics, getDailyPnl } from '@/lib/analytics';
import { Trade } from '@/types/trade';
import { TradingAccount } from '@/types/account';
import { cn } from '@/lib/utils';

interface HeroBalanceProps {
  nickname: string;
  stats: Analytics;
  trades: Trade[];
  accounts: TradingAccount[];
  selectedAccountId: string;
}

function MicroSparkline({ values }: { values: (number | null)[] }) {
  const numericValues = values.filter((v): v is number => v !== null && v !== 0);
  const max = Math.max(...numericValues.map(Math.abs), 1);

  return (
    <svg width={40} height={16}>
      {values.map((v, i) => {
        if (v === null || v === 0) {
          return (
            <rect
              key={i}
              x={i * 6}
              y={7}
              width={4}
              rx={1}
              height={2}
              fill="rgba(255,255,255,0.18)"
            />
          );
        }
        const h = Math.max((Math.abs(v) / max) * 14, 2);
        return (
          <rect
            key={i}
            x={i * 6}
            y={16 - h}
            width={4}
            rx={1}
            height={h}
            fill={v > 0 ? '#10b981' : '#f87171'}
            opacity={0.85}
          />
        );
      })}
    </svg>
  );
}

export function HeroBalance({ nickname, stats, trades, accounts, selectedAccountId }: HeroBalanceProps) {
  const startingBalance = useMemo(() => {
    if (selectedAccountId === '__all__') {
      return accounts.reduce((sum, a) => sum + (a.startingBalance ?? 0), 0);
    }
    return accounts.find(a => a.id === selectedAccountId)?.startingBalance ?? 0;
  }, [accounts, selectedAccountId]);

  const currentBalance = startingBalance + stats.netPnl;

  const today = new Date().toISOString().slice(0, 10);
  const dailyPnl = useMemo(
    () => trades.filter(t => t.date === today).reduce((s, t) => s + t.pnl, 0),
    [trades, today]
  );
  const dailyPct = startingBalance > 0 ? (dailyPnl / startingBalance) * 100 : 0;

  const sparklineValues = useMemo(() => {
    const dailyMap = getDailyPnl(trades);
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().split('T')[0];
      const entry = dailyMap.get(key);
      return entry !== undefined ? entry.pnl : null;
    });
  }, [trades]);

  const dailyPositive = dailyPnl >= 0;
  const dailyColor = dailyPositive ? 'text-[#10b981]' : 'text-[#f87171]';

  const accountLabel = useMemo(() => {
    if (selectedAccountId === '__all__') return 'All Accounts';
    return accounts.find(a => a.id === selectedAccountId)?.name ?? 'Account';
  }, [accounts, selectedAccountId]);

  return (
    <div className="pb-5 mb-1">
      <p className="text-[13px] text-[rgba(255,255,255,0.3)] mb-3">
        Hey, {nickname || 'Trader'}
      </p>
      <div className="flex items-end justify-between gap-4">
        <div>
          <span className={cn(
            'text-[52px] font-bold font-mono tracking-[-2px] leading-none text-white'
          )}>
            ${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[10px] uppercase tracking-[0.1em] text-[rgba(255,255,255,0.25)]">
              {accountLabel}
            </span>
            <span className="text-[rgba(255,255,255,0.15)] text-[10px]">·</span>
            <span className={cn('text-[13px] font-mono tabular-nums', dailyColor)}>
              {dailyPositive ? '+' : ''}${dailyPnl.toFixed(2)}
            </span>
            <span className={cn('text-[11px] font-mono tabular-nums', dailyColor)}>
              ({dailyPositive ? '+' : ''}{dailyPct.toFixed(2)}%)
            </span>
            <span className="text-[10px] uppercase tracking-[0.08em] text-[rgba(255,255,255,0.2)]">today</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 pb-0.5">
          <MicroSparkline values={sparklineValues} />
          <span className="text-[9px] uppercase tracking-[0.08em] text-[rgba(255,255,255,0.2)]">7d</span>
        </div>
      </div>
    </div>
  );
}
