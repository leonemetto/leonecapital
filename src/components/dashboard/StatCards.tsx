import { useMemo } from 'react';
import { Analytics, getDailyPnl } from '@/lib/analytics';
import { Trade } from '@/types/trade';
import { ArrowUp, ArrowDown } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface Props {
  stats: Analytics;
  trades: Trade[];
  startingBalance?: number;
}

function LineSpark({ data, color, height = 34 }: { data: number[]; color: string; height?: number }) {
  if (!data.length || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const W = 100;
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * W,
    height - ((v - min) / range) * height,
  ]);
  const d = 'M ' + pts.map(p => p.join(' ')).join(' L ');
  const area = d + ` L ${W} ${height} L 0 ${height} Z`;
  return (
    <svg
      viewBox={`0 0 ${W} ${height}`}
      preserveAspectRatio="none"
      width="100%"
      height={height}
      style={{ display: 'block' }}
    >
      <path d={area} fill={color} opacity="0.14" />
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

interface CardProps {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: 'pos' | 'neg' | 'neutral';
  foot?: string;
  sparkData?: number[];
  sparkColor?: string;
  last?: boolean;
}

function StatCard({ label, value, delta, deltaTone, foot, sparkData, sparkColor, last }: CardProps) {
  const deltaColor =
    deltaTone === 'pos' ? 'var(--ef-pos)' :
    deltaTone === 'neg' ? 'var(--ef-neg)' :
    'var(--ef-ink-3)';

  return (
    <div
      style={{
        padding: '20px 22px',
        minHeight: 118,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: 'var(--ef-bg-elev)',
        borderRight: last ? 'none' : '1px solid var(--ef-line)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div>
        <div
          className="font-mono uppercase"
          style={{ fontSize: 11, color: 'var(--ef-ink-3)', letterSpacing: '0.04em' }}
        >
          {label}
        </div>
        <div
          className="font-mono leading-none"
          style={{
            fontSize: 26,
            letterSpacing: '-0.02em',
            fontVariantNumeric: 'tabular-nums',
            fontWeight: 500,
            color: 'var(--ef-ink)',
            marginTop: 8,
          }}
        >
          {value}
        </div>
      </div>

      {sparkData && sparkColor && (
        <div style={{ marginTop: 10, height: 34 }}>
          <LineSpark data={sparkData} color={sparkColor} />
        </div>
      )}

      <div className="flex items-center gap-2" style={{ marginTop: 8 }}>
        {delta && (
          <span
            className="flex items-center gap-1 font-mono"
            style={{ fontSize: 12, color: deltaColor }}
          >
            {deltaTone === 'pos' && <ArrowUp className="h-3 w-3" weight="bold" />}
            {deltaTone === 'neg' && <ArrowDown className="h-3 w-3" weight="bold" />}
            {delta}
          </span>
        )}
        {foot && (
          <span className="font-mono" style={{ fontSize: 11, color: 'var(--ef-ink-4)' }}>
            {foot}
          </span>
        )}
      </div>
    </div>
  );
}

export function StatCards({ stats, trades, startingBalance = 0 }: Props) {
  const currentBalance = startingBalance + stats.netPnl;

  const { balanceSpark, dailySpark } = useMemo(() => {
    const map = getDailyPnl(trades);
    const today = new Date();
    const days = Array.from({ length: 8 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (7 - i));
      return d.toISOString().split('T')[0];
    });

    const sortedDates = [...new Set(trades.map(t => t.date))].sort();
    const cumByDate = new Map<string, number>();
    let cum = 0;
    for (const date of sortedDates) {
      cum += map.get(date)?.pnl ?? 0;
      cumByDate.set(date, cum);
    }

    const balanceSpark = days.map(day => {
      const lastDate = sortedDates.filter(d => d <= day).pop();
      return startingBalance + (lastDate ? (cumByDate.get(lastDate) ?? 0) : 0);
    });

    const dailySpark = days.map(day => map.get(day)?.pnl ?? 0);
    return { balanceSpark, dailySpark };
  }, [trades, startingBalance]);

  const streak = stats.currentStreak;
  const streakText =
    streak.type === 'none' ? 'No streak' :
    streak.type === 'win' ? `+${streak.count} win streak` :
    `${streak.count} loss streak`;
  const streakTone: 'pos' | 'neg' | 'neutral' =
    streak.type === 'win' ? 'pos' : streak.type === 'loss' ? 'neg' : 'neutral';

  const balanceDeltaPct = startingBalance > 0 ? (stats.netPnl / startingBalance) * 100 : 0;
  const expectancyPerTrade = trades.length > 0 ? stats.netPnl / trades.length : 0;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        border: '1px solid var(--ef-line)',
        borderRadius: 14,
        overflow: 'hidden',
        marginBottom: 14,
      }}
    >
      <StatCard
        label="Account balance"
        value={'$' + currentBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        delta={`${balanceDeltaPct >= 0 ? '+' : ''}${balanceDeltaPct.toFixed(1)}% · all time`}
        deltaTone={balanceDeltaPct > 0 ? 'pos' : balanceDeltaPct < 0 ? 'neg' : 'neutral'}
        foot={`${trades.length} trades`}
        sparkData={balanceSpark}
        sparkColor={stats.netPnl >= 0 ? 'var(--ef-pos)' : 'var(--ef-neg)'}
      />
      <StatCard
        label="Win rate · all time"
        value={stats.winRate.toFixed(1) + '%'}
        delta={`${stats.wins}W · ${stats.losses}L`}
        deltaTone={stats.winRate >= 50 ? 'pos' : 'neg'}
        sparkData={dailySpark}
        sparkColor="oklch(0.58 0.18 25)"
      />
      <StatCard
        label="Profit factor"
        value={stats.profitFactor >= 999 ? '∞' : stats.profitFactor.toFixed(2)}
        delta={stats.profitFactor < 1 ? 'below breakeven' : stats.profitFactor >= 1.5 ? 'strong edge' : 'marginal edge'}
        deltaTone={stats.profitFactor >= 1 ? 'pos' : 'neg'}
        sparkData={dailySpark}
        sparkColor="oklch(0.58 0.18 25)"
      />
      <StatCard
        label="Expectancy / trade"
        value={'$' + expectancyPerTrade.toFixed(2)}
        delta={streakText}
        deltaTone={streakTone}
        foot={`avg R: ${stats.rExpectancy >= 0 ? '+' : ''}${stats.rExpectancy.toFixed(2)}R`}
        sparkData={dailySpark}
        sparkColor="oklch(0.55 0.12 75)"
        last
      />
    </div>
  );
}
