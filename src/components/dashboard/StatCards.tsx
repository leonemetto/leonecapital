import { useMemo } from 'react';
import { Analytics, getDailyPnl } from '@/lib/analytics';
import { Trade } from '@/types/trade';
import { ArrowUp, ArrowDown, TrendUp, ChartPie, Target, Warning } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface Props {
  stats: Analytics;
  trades: Trade[];
}

function Sparkline({ values, color }: { values: (number | null)[]; color: string }) {
  const nums = values.filter((v): v is number => v !== null && v !== 0);
  const max = Math.max(...nums.map(Math.abs), 1);
  return (
    <svg width={56} height={22} className="mt-auto shrink-0">
      {values.map((v, i) => {
        if (v === null || v === 0) {
          return <rect key={i} x={i * 8} y={10} width={5} rx={1} height={2} fill="currentColor" className="opacity-15" />;
        }
        const h = Math.max((Math.abs(v) / max) * 20, 2);
        return (
          <rect key={i} x={i * 8} y={22 - h} width={5} rx={1} height={h}
            fill={color} opacity={0.75} />
        );
      })}
    </svg>
  );
}

interface CardProps {
  tone: 'mint' | 'peach' | 'slate' | 'warm';
  label: string;
  value: string;
  delta?: string;
  deltaDir?: 'up' | 'down' | 'neutral';
  foot?: string;
  sparkValues?: (number | null)[];
  sparkColor?: string;
  icon: React.ReactNode;
}

function StatCard({ tone, label, value, delta, deltaDir, foot, sparkValues, sparkColor, icon }: CardProps) {
  const wash = {
    mint:  'bg-[var(--ef-pos-wash)] border-[color-mix(in_oklab,var(--ef-pos)_18%,transparent)]',
    peach: 'bg-[var(--ef-neg-wash)] border-[color-mix(in_oklab,var(--ef-neg)_18%,transparent)]',
    slate: 'bg-[var(--ef-cool-wash)] border-[color-mix(in_oklab,oklch(0.6_0.1_240)_15%,transparent)]',
    warm:  'bg-[var(--ef-warn-wash)] border-[color-mix(in_oklab,oklch(0.7_0.14_75)_15%,transparent)]',
  }[tone];

  const iconColor = {
    mint:  'text-[var(--ef-pos)]',
    peach: 'text-[var(--ef-neg)]',
    slate: 'text-[oklch(0.52_0.12_240)]',
    warm:  'text-[oklch(0.52_0.14_75)]',
  }[tone];

  const deltaColor =
    deltaDir === 'up' ? 'text-[var(--ef-pos)]' :
    deltaDir === 'down' ? 'text-[var(--ef-neg)]' :
    'text-[var(--ef-ink-3)]';

  return (
    <div className={cn('rounded-xl border p-5 flex flex-col gap-2 min-h-[120px]', wash)}>
      <div className="flex items-center justify-between">
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--ef-ink-3)]">{label}</span>
        <span className={cn('opacity-60', iconColor)}>{icon}</span>
      </div>

      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-[26px] font-bold leading-none tracking-tight text-[var(--ef-ink)] font-mono"
            style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
            {value}
          </div>
          {delta && (
            <div className={cn('flex items-center gap-1 mt-1.5 text-[11px] font-mono', deltaColor)}>
              {deltaDir === 'up' && <ArrowUp className="h-3 w-3" weight="bold" />}
              {deltaDir === 'down' && <ArrowDown className="h-3 w-3" weight="bold" />}
              {delta}
            </div>
          )}
          {foot && (
            <div className="text-[10.5px] text-[var(--ef-ink-4)] font-mono mt-0.5">{foot}</div>
          )}
        </div>
        {sparkValues && sparkColor && (
          <Sparkline values={sparkValues} color={sparkColor} />
        )}
      </div>
    </div>
  );
}

export function StatCards({ stats, trades }: Props) {
  const sparklines = useMemo(() => {
    const map = getDailyPnl(trades);
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().split('T')[0];
      const entry = map.get(key);
      return entry !== undefined ? entry.pnl : null;
    });
  }, [trades]);

  const avgR = stats.avgRWin > 0 ? stats.avgRWin : stats.rExpectancy;

  const winDelta = stats.winRate >= 50
    ? `Above 50% threshold`
    : `${(50 - stats.winRate).toFixed(1)}% below 50%`;

  const pnlDelta = stats.netPnl === 0 ? 'Breakeven' :
    `${stats.netPnl > 0 ? '+' : ''}${((stats.netPnl / (trades.length || 1)) * 1).toFixed(0)} avg/trade`;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        tone="mint"
        label="Win Rate"
        value={`${stats.winRate.toFixed(1)}%`}
        delta={winDelta}
        deltaDir={stats.winRate >= 50 ? 'up' : 'down'}
        foot={`${trades.filter(t => t.outcome === 'win').length}W · ${trades.filter(t => t.outcome === 'loss').length}L`}
        icon={<Target className="h-4 w-4" weight="fill" />}
      />
      <StatCard
        tone="peach"
        label="Total P&L"
        value={`${stats.netPnl >= 0 ? '+' : ''}$${Math.abs(stats.netPnl).toFixed(0)}`}
        delta={pnlelta(stats.netPnl)}
        deltaDir={stats.netPnl > 0 ? 'up' : stats.netPnl < 0 ? 'down' : 'neutral'}
        sparkValues={sparklines}
        sparkColor={stats.netPnl >= 0 ? 'var(--ef-pos)' : 'var(--ef-neg)'}
        icon={<TrendUp className="h-4 w-4" weight="fill" />}
      />
      <StatCard
        tone="slate"
        label="Profit Factor"
        value={stats.profitFactor >= 999 ? '∞' : stats.profitFactor.toFixed(2)}
        delta={stats.profitFactor >= 1.5 ? 'Strong edge' : stats.profitFactor >= 1 ? 'Marginal edge' : 'Below breakeven'}
        deltaDir={stats.profitFactor >= 1.5 ? 'up' : stats.profitFactor >= 1 ? 'neutral' : 'down'}
        icon={<ChartPie className="h-4 w-4" weight="fill" />}
      />
      <StatCard
        tone="warm"
        label="Max Drawdown"
        value={stats.maxDrawdown === 0 ? '$0' : `-$${stats.maxDrawdown.toFixed(0)}`}
        delta={avgR !== 0 ? `Avg R: ${avgR >= 0 ? '+' : ''}${avgR.toFixed(2)}R` : undefined}
        deltaDir={avgR > 0 ? 'up' : avgR < 0 ? 'down' : 'neutral'}
        foot={stats.currentStreak !== 0 ? `${stats.currentStreak > 0 ? '+' : ''}${stats.currentStreak} streak` : 'No streak'}
        icon={<Warning className="h-4 w-4" weight="fill" />}
      />
    </div>
  );
}

// tiny helper to avoid inlining in JSX
function pnlelta(pnl: number) {
  if (pnl === 0) return 'Breakeven';
  return pnl > 0 ? 'Net profitable' : 'Net loss';
}
