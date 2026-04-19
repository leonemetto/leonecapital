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
  tone: 'mint' | 'peach' | 'slate' | 'warm';
  label: string;
  value: string;
  delta?: string;
  deltaTone?: 'pos' | 'neg' | 'neutral';
  foot?: string;
  sparkData?: number[];
  sparkColor?: string;
  featured?: boolean;
  trendUp?: boolean | null;
}

function StatCard({ tone, label, value, delta, deltaTone, foot, sparkData, sparkColor, featured, trendUp }: CardProps) {
  const wash = {
    mint:  'bg-[var(--ef-pos-wash)] border-[color-mix(in_oklab,var(--ef-pos)_18%,transparent)]',
    peach: 'bg-[var(--ef-neg-wash)] border-[color-mix(in_oklab,var(--ef-neg)_18%,transparent)]',
    slate: 'bg-[var(--ef-cool-wash)] border-[color-mix(in_oklab,oklch(0.6_0.1_240)_15%,transparent)]',
    warm:  'bg-[var(--ef-warn-wash)] border-[color-mix(in_oklab,oklch(0.7_0.14_75)_15%,transparent)]',
  }[tone];

  const deltaColor =
    deltaTone === 'pos' ? 'text-[var(--ef-pos)]' :
    deltaTone === 'neg' ? 'text-[var(--ef-neg)]' :
    'text-[var(--ef-ink-2)]';

  const valueFontSize = featured ? 38 : 26;
  const minH = featured ? 158 : 126;

  return (
    <div
      className={cn('rounded-[14px] border flex flex-col justify-between overflow-hidden', wash)}
      style={{ padding: 24, minHeight: minH }}
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <div
            className="font-mono uppercase text-[var(--ef-ink-3)]"
            style={{ fontSize: 11, letterSpacing: '0.04em' }}
          >
            {label}
          </div>
          {/* Trend arrow pill */}
          {trendUp !== null && trendUp !== undefined && (
            <div
              className={cn('flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-mono')}
              style={{
                fontSize: 10,
                background: trendUp ? 'var(--ef-pos-wash)' : 'var(--ef-neg-wash)',
                color: trendUp ? 'var(--ef-pos)' : 'var(--ef-neg)',
                border: `1px solid ${trendUp ? 'color-mix(in oklab, var(--ef-pos) 22%, transparent)' : 'color-mix(in oklab, var(--ef-neg) 22%, transparent)'}`,
              }}
            >
              {trendUp
                ? <ArrowUp className="h-2.5 w-2.5" weight="bold" />
                : <ArrowDown className="h-2.5 w-2.5" weight="bold" />
              }
              {trendUp ? 'up' : 'dn'}
            </div>
          )}
        </div>
        <div
          className="font-mono leading-none mt-2 text-[var(--ef-ink)]"
          style={{
            fontSize: valueFontSize,
            letterSpacing: '-0.02em',
            fontVariantNumeric: 'tabular-nums',
            fontWeight: featured ? 600 : 500,
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
          <span className={cn('flex items-center gap-1 font-mono', deltaColor)} style={{ fontSize: 12 }}>
            {deltaTone === 'pos' && <ArrowUp className="h-3 w-3" weight="bold" />}
            {deltaTone === 'neg' && <ArrowDown className="h-3 w-3" weight="bold" />}
            {delta}
          </span>
        )}
        {foot && (
          <span className="font-mono text-[var(--ef-ink-4)]" style={{ fontSize: 11 }}>
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

  // Trend direction: last 3 vs first 3 of spark
  const balanceTrend = balanceSpark.length >= 4
    ? (balanceSpark[balanceSpark.length - 1] > balanceSpark[0] ? true : balanceSpark[balanceSpark.length - 1] < balanceSpark[0] ? false : null)
    : null;

  const dailyTrend = dailySpark.length >= 4
    ? (() => {
        const recent = dailySpark.slice(-3).reduce((a, b) => a + b, 0);
        const older = dailySpark.slice(0, 3).reduce((a, b) => a + b, 0);
        return recent > older ? true : recent < older ? false : null;
      })()
    : null;

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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-[14px]">
      <StatCard
        featured
        tone="mint"
        label="Account balance"
        value={'$' + currentBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        delta={`${balanceDeltaPct >= 0 ? '+' : ''}${balanceDeltaPct.toFixed(1)}%`}
        deltaTone={balanceDeltaPct > 0 ? 'pos' : balanceDeltaPct < 0 ? 'neg' : 'neutral'}
        foot={`${trades.length} trades`}
        sparkData={balanceSpark}
        sparkColor={stats.netPnl >= 0 ? 'var(--ef-pos)' : 'var(--ef-neg)'}
        trendUp={balanceTrend}
      />
      <StatCard
        tone="peach"
        label="Win rate · all time"
        value={stats.winRate.toFixed(1) + '%'}
        delta={`${stats.wins}W · ${stats.losses}L`}
        deltaTone={stats.winRate >= 50 ? 'pos' : 'neg'}
        sparkData={dailySpark}
        sparkColor="oklch(0.58 0.18 25)"
        trendUp={dailyTrend}
      />
      <StatCard
        tone="slate"
        label="Profit factor"
        value={stats.profitFactor >= 999 ? '∞' : stats.profitFactor.toFixed(2)}
        delta={stats.profitFactor < 1 ? 'below breakeven' : stats.profitFactor >= 1.5 ? 'strong edge' : 'marginal edge'}
        deltaTone={stats.profitFactor >= 1 ? 'pos' : 'neg'}
        sparkData={dailySpark}
        sparkColor="oklch(0.58 0.18 25)"
        trendUp={stats.profitFactor >= 1 ? true : false}
      />
      <StatCard
        tone="warm"
        label="Expectancy / trade"
        value={'$' + expectancyPerTrade.toFixed(2)}
        delta={streakText}
        deltaTone={streakTone}
        foot={`avg R: ${stats.rExpectancy >= 0 ? '+' : ''}${stats.rExpectancy.toFixed(2)}R`}
        sparkData={dailySpark}
        sparkColor="oklch(0.55 0.12 75)"
        trendUp={expectancyPerTrade > 0 ? true : expectancyPerTrade < 0 ? false : null}
      />
    </div>
  );
}
