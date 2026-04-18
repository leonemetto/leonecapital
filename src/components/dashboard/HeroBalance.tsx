import { useMemo } from 'react';
import { Analytics, getDailyPnl } from '@/lib/analytics';
import { Trade } from '@/types/trade';
import { TradingAccount } from '@/types/account';
import { cn } from '@/lib/utils';

interface Props {
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
    <svg width={48} height={20} className="shrink-0">
      {values.map((v, i) => {
        if (v === null || v === 0) {
          return (
            <rect key={i} x={i * 7} y={9} width={5} rx={1} height={2}
              fill="currentColor" className="opacity-15" />
          );
        }
        const h = Math.max((Math.abs(v) / max) * 18, 2);
        return (
          <rect key={i} x={i * 7} y={20 - h} width={5} rx={1} height={h}
            fill={v > 0 ? 'var(--ef-pos)' : 'var(--ef-neg)'} opacity={0.8} />
        );
      })}
    </svg>
  );
}

export function HeroBalance({ nickname, stats, trades, accounts, selectedAccountId }: Props) {
  const startingBalance = useMemo(() => {
    if (selectedAccountId === '__all__') {
      return accounts.reduce((sum, a) => sum + (a.startingBalance ?? 0), 0);
    }
    return accounts.find(a => a.id === selectedAccountId)?.startingBalance ?? 0;
  }, [accounts, selectedAccountId]);

  const currentBalance = startingBalance + stats.netPnl;

  const today = new Date().toISOString().slice(0, 10);
  const dailyPnl = useMemo(() => {
    return trades.filter(t => t.date === today).reduce((s, t) => s + t.pnl, 0);
  }, [trades, today]);

  const dailyPct = startingBalance > 0 ? (dailyPnl / startingBalance) * 100 : 0;
  const dailyPositive = dailyPnl >= 0;

  const sparklines = useMemo(() => {
    const map = getDailyPnl(trades);
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().split('T')[0];
      const entry = map.get(key);
      return entry !== undefined ? entry.pnl : null;
    });
  }, [trades]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="pb-5 mb-1">
      <p className="text-[13px] text-muted-foreground mb-3">
        {greeting}, {nickname || 'Trader'}
      </p>

      <div className="flex items-end justify-between gap-4">
        {/* Balance block */}
        <div>
          <div className="flex items-baseline gap-3">
            <span
              className="text-[52px] leading-none font-bold text-foreground font-mono"
              style={{ letterSpacing: '-3px', fontVariantNumeric: 'tabular-nums' }}
            >
              ${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground/60">
              Total Equity
            </span>
            <span className={cn(
              'text-[13px] font-mono font-semibold',
              dailyPositive ? 'text-[var(--ef-pos)]' : 'text-[var(--ef-neg)]'
            )}>
              {dailyPositive ? '+' : ''}${dailyPnl.toFixed(2)}
            </span>
            <span className={cn(
              'text-[11px] font-mono',
              dailyPositive ? 'text-[var(--ef-pos)]/60' : 'text-[var(--ef-neg)]/60'
            )}>
              {dailyPositive ? '+' : ''}{dailyPct.toFixed(2)}% today
            </span>
          </div>
        </div>

        {/* 7-day sparkline */}
        <MicroSparkline values={sparklines} />
      </div>
    </div>
  );
}
