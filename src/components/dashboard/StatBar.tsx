import { useMemo } from 'react';
import { Analytics } from '@/lib/analytics';
import { Trade } from '@/types/trade';
import { getDailyPnl } from '@/lib/analytics';
import { cn } from '@/lib/utils';

interface StatBarProps {
  stats: Analytics;
  trades: Trade[];
}

// null = no trades that day (muted), 0 = breakeven (muted), positive = green, negative = red
function MicroSparkline({ values }: { values: (number | null)[] }) {
  const numericValues = values.filter((v): v is number => v !== null && v !== 0);
  const max = Math.max(...numericValues.map(Math.abs), 1);

  return (
    <svg width={40} height={16} className="mt-1">
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
              fill="currentColor"
              className="text-muted-foreground/25"
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
            fill={v > 0 ? 'hsl(var(--profit))' : 'hsl(var(--loss))'}
            opacity={0.8}
          />
        );
      })}
    </svg>
  );
}

const stats_config = [
  { key: 'winRate',      label: 'WIN RATE',      format: (v: number) => `${v.toFixed(1)}%`,                                            color: ''    },
  { key: 'netPnl',      label: 'TOTAL P&L',     format: (v: number) => `$${v.toFixed(0)}`,                                            color: 'pnl' },
  { key: 'profitFactor', label: 'PROFIT FACTOR', format: (v: number) => v >= 999 ? '∞' : v.toFixed(2),                                color: ''    },
  { key: 'avgR',         label: 'AVG R',          format: (v: number) => `${v.toFixed(2)}R`,                                           color: ''    },
  { key: 'maxDrawdown',  label: 'MAX DRAWDOWN',  format: (v: number) => v === 0 ? '$0' : `-$${v.toFixed(0)}`,                         color: 'dd'  },
] as const;

export function StatBar({ stats, trades }: StatBarProps) {
  // Build a true 7-day window ending today; missing days get null (muted)
  const sparklines = useMemo(() => {
    const dailyPnl = getDailyPnl(trades);
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().split('T')[0];
      const entry = dailyPnl.get(key);
      return entry !== undefined ? entry.pnl : null;
    });
  }, [trades]);

  const values: Record<string, number> = {
    winRate:      stats.winRate,
    netPnl:       stats.netPnl,
    profitFactor: stats.profitFactor,
    avgR:         stats.avgRWin > 0 ? stats.avgRWin : stats.rExpectancy,
    maxDrawdown:  stats.maxDrawdown,
  };

  return (
    <div className="flex items-stretch rounded-xl bg-card border border-border/60">
      {stats_config.map((cfg, i) => {
        const v = values[cfg.key];
        let valueColor = 'text-foreground';
        if (cfg.color === 'pnl') {
          valueColor = v > 0 ? 'text-profit' : v < 0 ? 'text-loss' : 'text-foreground';
        } else if (cfg.color === 'dd') {
          valueColor = v > 0 ? 'text-loss' : 'text-foreground';
        }

        return (
          <div key={cfg.key} className="flex-1 flex items-center">
            <div className="flex-1 py-3 px-4 flex flex-col items-center">
              <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                {cfg.label}
              </span>
              <span className={cn('text-[28px] leading-tight font-bold font-mono tabular-nums', valueColor)}>
                {cfg.format(v)}
              </span>
              {cfg.key === 'netPnl' && <MicroSparkline values={sparklines} />}
            </div>
            {i < stats_config.length - 1 && (
              <div className="w-px h-10 bg-border/60" />
            )}
          </div>
        );
      })}
    </div>
  );
}
