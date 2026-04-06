import { useMemo } from 'react';
import { Analytics } from '@/lib/analytics';
import { Trade } from '@/types/trade';
import { getDailyPnl } from '@/lib/analytics';
import { cn } from '@/lib/utils';

interface StatBarProps {
  stats: Analytics;
  trades: Trade[];
}

function MicroSparkline({ values }: { values: number[] }) {
  const max = Math.max(...values.map(Math.abs), 1);
  return (
    <svg width={40} height={16} className="mt-1">
      {values.map((v, i) => {
        const h = Math.max((Math.abs(v) / max) * 14, 1.5);
        return (
          <rect
            key={i}
            x={i * 6}
            y={v >= 0 ? 16 - h : 16 - h}
            width={4}
            rx={1}
            height={h}
            className={v >= 0 ? 'fill-profit' : 'fill-loss'}
            opacity={0.85}
          />
        );
      })}
    </svg>
  );
}

const stats_config = [
  { key: 'winRate', label: 'WIN RATE', format: (v: number) => `${v.toFixed(1)}%`, color: '' },
  { key: 'netPnl', label: 'TOTAL P&L', format: (v: number) => `$${v.toFixed(0)}`, color: 'pnl' },
  { key: 'profitFactor', label: 'PROFIT FACTOR', format: (v: number) => v >= 999 ? '∞' : v.toFixed(2), color: '' },
  { key: 'avgR', label: 'AVG R', format: (v: number) => `${v.toFixed(2)}R`, color: '' },
  { key: 'maxDrawdown', label: 'MAX DRAWDOWN', format: (v: number) => `-$${v.toFixed(0)}`, color: 'dd' },
] as const;

export function StatBar({ stats, trades }: StatBarProps) {
  const sparklines = useMemo(() => {
    const dailyPnl = getDailyPnl(trades);
    const days = Array.from(dailyPnl.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, d]) => d.pnl);
    return days.slice(-7);
  }, [trades]);

  const values: Record<string, number> = {
    winRate: stats.winRate,
    netPnl: stats.netPnl,
    profitFactor: stats.profitFactor,
    avgR: stats.avgRWin > 0 ? stats.avgRWin : stats.rExpectancy,
    maxDrawdown: stats.maxDrawdown,
  };

  return (
    <div className="flex items-stretch rounded-[10px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.07)]">
      {stats_config.map((cfg, i) => {
        const v = values[cfg.key];
        let valueColor = 'text-foreground';
        if (cfg.color === 'pnl') {
          valueColor = v > 0 ? 'text-profit' : v < 0 ? 'text-loss' : 'text-foreground';
        } else if (cfg.color === 'dd') {
          valueColor = 'text-loss';
        }

        return (
          <div key={cfg.key} className="flex-1 flex items-center">
            <div className="flex-1 py-3 px-4 flex flex-col items-center">
              <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-[rgba(255,255,255,0.35)]">
                {cfg.label}
              </span>
              <span className={cn('text-[28px] leading-tight font-bold tabular-nums', valueColor)}>
                {cfg.format(v)}
              </span>
              {sparklines.length > 0 && <MicroSparkline values={sparklines} />}
            </div>
            {i < stats_config.length - 1 && (
              <div className="w-px h-12 bg-[rgba(255,255,255,0.08)]" />
            )}
          </div>
        );
      })}
    </div>
  );
}
