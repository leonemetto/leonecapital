import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flask } from '@phosphor-icons/react';
import { Meter, Pill, Segmented, Stat, Surface } from '@/components/ef/primitives';
import {
  calculateAnalytics, detectBehavioralPatterns, getCurrentRiskStatus, getExpectancyByField,
  getExpectancyByPlanAdherence, type ExpectancyBreakdown,
} from '@/lib/analytics';
import { useSettings } from '@/contexts/SettingsContext';
import { cn } from '@/lib/utils';
import { fmtMoney, fmtPct, fmtR, fmtSignedMoney, toneOf, TONE_CLASS } from '@/lib/format';
import type { Trade } from '@/types/trade';

type Dimension = 'instrument' | 'session' | 'direction' | 'strategy' | 'htfBias' | 'emotionalState' | 'confidenceLevel' | 'followedPlan';
type Metric = 'pnl' | 'expectancy' | 'winRate';
type SortKey = 'key' | 'trades' | 'winRate' | 'avgR' | 'expectancy' | 'pnl';

const DIMENSIONS: { value: Dimension; label: string }[] = [
  { value: 'instrument', label: 'Instrument' },
  { value: 'session', label: 'Session' },
  { value: 'direction', label: 'Side' },
  { value: 'strategy', label: 'Setup' },
  { value: 'htfBias', label: 'Bias' },
  { value: 'emotionalState', label: 'Emotion' },
  { value: 'confidenceLevel', label: 'Confidence' },
  { value: 'followedPlan', label: 'Plan' },
];

const BEHAVIOUR_MIN_TRADES = 20;

function displayKey(dimension: Dimension, key: string): string {
  if (dimension === 'direction') return key === 'long' ? 'Long' : key === 'short' ? 'Short' : key;
  if (dimension === 'emotionalState' || dimension === 'confidenceLevel') return `${key} of 5`;
  if (dimension === 'followedPlan') return key === 'Plan Followed' ? 'On plan' : 'Off plan';
  return key;
}

/** The value the what-if screen expects for this segment. */
function simulateKey(dimension: Dimension, key: string): string {
  if (dimension === 'followedPlan') return key === 'Plan Followed' ? 'Yes' : 'No';
  return key;
}

const isLeak = (r: ExpectancyBreakdown) => r.pnl < 0 && r.expectancy < 0 && r.trades >= 3;

/**
 * One dimension at a time: a chart of the chosen metric over its segments,
 * and one sortable table beneath. Replaces seven stacked tables.
 */
export function BreakdownTab({ trades }: { trades: Trade[] }) {
  const navigate = useNavigate();
  const { countBreakevenInWinRate } = useSettings();
  const [dimension, setDimension] = useState<Dimension>('instrument');
  const [metric, setMetric] = useState<Metric>('pnl');
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'pnl', dir: 'desc' });

  const stats = useMemo(() => calculateAnalytics(trades, { countBreakevenInWinRate }), [trades, countBreakevenInWinRate]);
  const risk = useMemo(() => getCurrentRiskStatus(trades), [trades]);
  const behaviour = useMemo(() => detectBehavioralPatterns(trades), [trades]);

  const rows = useMemo(() => {
    const raw = dimension === 'followedPlan' ? getExpectancyByPlanAdherence(trades) : getExpectancyByField(trades, dimension);
    return raw.filter(r => r.key !== 'Unknown' && r.key !== '' && r.key !== 'undefined' && r.trades >= 2);
  }, [trades, dimension]);

  const sorted = useMemo(() => {
    const dir = sort.dir === 'desc' ? -1 : 1;
    return [...rows].sort((a, b) => (sort.key === 'key' ? a.key.localeCompare(b.key) : (a[sort.key] as number) - (b[sort.key] as number)) * dir);
  }, [rows, sort]);

  // The chart keeps a stable order (best to worst on the chosen metric).
  const charted = useMemo(() => [...rows].sort((a, b) => b[metric] - a[metric]).slice(0, 12), [rows, metric]);

  const toggleSort = (key: SortKey) =>
    setSort(prev => (prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }));

  const simulate = (key: string) =>
    navigate(`/insights/what-if?field=${encodeURIComponent(dimension)}&key=${encodeURIComponent(simulateKey(dimension, key))}&exclude=true`);

  const canSimulate = dimension === 'instrument' || dimension === 'session' || dimension === 'htfBias' || dimension === 'followedPlan';
  const riskTone = risk.status === 'red' ? 'neg' : risk.status === 'yellow' ? 'warn' : 'flat';
  const riskLabel = risk.status === 'red' ? 'Risk alert' : risk.status === 'yellow' ? 'Caution' : 'All clear';
  let firstLeakShown = false;

  return (
    <div className="flex flex-col gap-3">
      {/* Standing numbers */}
      <Surface>
        <div className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:gap-8">
          <div className="flex min-w-0 items-start gap-3 lg:w-[34%]">
            <span
              aria-hidden
              className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', risk.status === 'red' ? 'bg-ef-neg' : risk.status === 'yellow' ? 'bg-ef-warn' : 'bg-ef-pos')}
            />
            <div className="min-w-0">
              <p className="m-0 flex items-center gap-2 text-[13.5px] font-medium text-ef-ink">
                {riskLabel}
                {risk.drawdownR > 0 && <Pill tone={riskTone}>{risk.drawdownR}R off the peak</Pill>}
              </p>
              <p className="m-0 mt-0.5 text-[12.5px] leading-snug text-ef-ink-3">{risk.message}</p>
            </div>
          </div>
          <dl className="m-0 grid flex-1 grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-5">
            <Stat label="Expectancy" value={stats.rExpectancy ? fmtR(stats.rExpectancy, 2) : '—'} tone={stats.rExpectancy ? toneOf(stats.rExpectancy) : undefined} />
            <Stat label="Avg win" value={stats.avgRWin ? fmtR(stats.avgRWin, 2) : fmtMoney(stats.avgWin)} />
            <Stat label="Avg loss" value={stats.avgRLoss ? fmtR(-stats.avgRLoss, 2) : fmtMoney(stats.avgLoss)} />
            <Stat label="Profit factor" value={stats.totalTrades ? (stats.profitFactor >= 999 ? '∞' : stats.profitFactor.toFixed(2)) : '—'} />
            <Stat label="Max drawdown" value={stats.maxDrawdown > 0 ? fmtMoney(stats.maxDrawdown) : '—'} />
          </dl>
        </div>
      </Surface>

      {/* Breakdown */}
      <Surface>
        <div className="flex flex-col gap-3 px-5 pb-4 pt-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="ef-scroll-quiet -mx-1 flex gap-1 overflow-x-auto px-1" role="radiogroup" aria-label="Break down by">
            {DIMENSIONS.map(d => (
              <button
                key={d.value}
                type="button"
                role="radio"
                aria-checked={dimension === d.value}
                data-active={dimension === d.value}
                onClick={() => setDimension(d.value)}
                className="ef-chip shrink-0"
              >
                {d.label}
              </button>
            ))}
          </div>
          <Segmented<Metric>
            ariaLabel="Metric"
            value={metric}
            onChange={setMetric}
            options={[
              { value: 'pnl', label: 'Net P&L' },
              { value: 'expectancy', label: 'Expectancy' },
              { value: 'winRate', label: 'Win rate' },
            ]}
            className="self-start"
          />
        </div>

        {rows.length === 0 ? (
          <p className="m-0 border-t border-ef-line px-5 py-10 text-center text-[13px] text-ef-ink-3">
            Not enough tagged trades to break down by {DIMENSIONS.find(d => d.value === dimension)?.label.toLowerCase()} yet. A segment needs at least two trades.
          </p>
        ) : (
          <>
            <BarChart rows={charted} metric={metric} label={k => displayKey(dimension, k)} />

            <div className="overflow-x-auto border-t border-ef-line">
              <table className="ef-table">
                <thead>
                  <tr>
                    <Th k="key" sort={sort} onSort={toggleSort}>{DIMENSIONS.find(d => d.value === dimension)?.label}</Th>
                    <Th k="trades" sort={sort} onSort={toggleSort} right>Trades</Th>
                    <Th k="winRate" sort={sort} onSort={toggleSort} right>Win rate</Th>
                    <Th k="avgR" sort={sort} onSort={toggleSort} right>Avg R</Th>
                    <Th k="expectancy" sort={sort} onSort={toggleSort} right>Expectancy</Th>
                    <Th k="pnl" sort={sort} onSort={toggleSort} right>Net P&amp;L</Th>
                    {canSimulate && <th aria-label="Actions" className="w-[128px]" />}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(r => {
                    const leak = isLeak(r);
                    const tourBadge = leak && !firstLeakShown;
                    if (tourBadge) firstLeakShown = true;
                    return (
                      <tr key={r.key} className="h-11">
                        <td>
                          <span className="flex items-center gap-2">
                            <span className="font-medium text-ef-ink">{displayKey(dimension, r.key)}</span>
                            {leak && <span data-tour={tourBadge ? 'leak-badge' : undefined}><Pill tone="neg">Leak</Pill></span>}
                            {r.sampleWarning && <span className="text-[11px] text-ef-ink-4" title="Fewer than 10 trades. Treat this as a hint.">small sample</span>}
                          </span>
                        </td>
                        <td className="num text-ef-ink-2">{r.trades}</td>
                        <td className="num text-ef-ink-2">{fmtPct(r.winRate)}</td>
                        <td className={cn('num', TONE_CLASS[toneOf(r.avgR)])}>{fmtR(r.avgR, 2)}</td>
                        <td className={cn('num', TONE_CLASS[toneOf(r.expectancy)])}>{fmtR(r.expectancy, 2)}</td>
                        <td className={cn('num font-medium', TONE_CLASS[toneOf(r.pnl)])}>{fmtSignedMoney(r.pnl)}</td>
                        {canSimulate && (
                          <td className="!pr-3 text-right">
                            <button
                              type="button"
                              data-tour={tourBadge ? 'simulate-btn' : undefined}
                              onClick={() => simulate(r.key)}
                              className="ef-btn ef-btn-ghost ef-btn-sm"
                              title={`See your results without ${displayKey(dimension, r.key)}`}
                            >
                              <Flask className="h-3.5 w-3.5" /> Test without
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Surface>

      {/* Behaviour */}
      <Surface>
        <div className="flex items-center justify-between px-5 pb-2 pt-4">
          <p className="ef-label m-0">Behaviour patterns</p>
          {behaviour.length > 0 && <span className="ef-num text-[11.5px] text-ef-ink-3">{behaviour.length}</span>}
        </div>
        {trades.length < BEHAVIOUR_MIN_TRADES ? (
          <div className="px-5 pb-5">
            <p className="m-0 text-[13px] text-ef-ink-2">
              {BEHAVIOUR_MIN_TRADES - trades.length} more {BEHAVIOUR_MIN_TRADES - trades.length === 1 ? 'trade' : 'trades'} until pattern detection has enough to work with.
            </p>
            <div className="mt-3 flex items-center gap-3">
              <Meter value={trades.length} max={BEHAVIOUR_MIN_TRADES} tone="ink" className="max-w-[240px]" label="Trades logged toward pattern detection" />
              <span className="ef-num text-[11.5px] text-ef-ink-3">{trades.length} of {BEHAVIOUR_MIN_TRADES}</span>
            </div>
          </div>
        ) : behaviour.length === 0 ? (
          <p className="m-0 px-5 pb-5 text-[13px] text-ef-ink-3">No revenge trading, overtrading or loss clustering stands out in this range.</p>
        ) : (
          <ul className="m-0 list-none px-5 pb-2">
            {behaviour.map((b, i) => (
              <li key={`${b.type}-${i}`} className="flex items-start gap-3 border-t border-ef-line py-3 first:border-t-0">
                <span
                  aria-hidden
                  className={cn('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', b.severity === 'high' ? 'bg-ef-neg' : b.severity === 'medium' ? 'bg-ef-warn' : 'bg-ef-ink-4')}
                />
                <div className="min-w-0 flex-1">
                  <p className="m-0 text-[13px] leading-snug text-ef-ink">{b.message}</p>
                  <p className="ef-num m-0 mt-1 text-[11.5px] text-ef-ink-3">{b.stat}</p>
                </div>
                {b.type === 'plan-deviation' && (
                  <button type="button" onClick={() => navigate('/insights/what-if?field=followedPlan&key=No&exclude=true')} className="ef-btn ef-btn-secondary ef-btn-sm shrink-0">
                    Test without
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Surface>
    </div>
  );
}

function Th({
  k, sort, onSort, children, right,
}: {
  k: SortKey;
  sort: { key: SortKey; dir: 'asc' | 'desc' };
  onSort: (key: SortKey) => void;
  children: React.ReactNode;
  right?: boolean;
}) {
  const active = sort.key === k;
  return (
    <th aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'} style={right ? { textAlign: 'right' } : undefined}>
      <button
        type="button"
        onClick={() => onSort(k)}
        className={cn('ef-focus -mx-1 inline-flex items-center gap-1 rounded-[4px] px-1 uppercase tracking-[0.12em] transition-colors', active ? 'text-ef-ink' : 'hover:text-ef-ink-2')}
      >
        {children}
        <span aria-hidden className={cn('text-[9px]', !active && 'opacity-0')}>{sort.dir === 'asc' ? '▲' : '▼'}</span>
      </button>
    </th>
  );
}

/* A column per segment, rising or falling from a shared zero line. */
function BarChart({ rows, metric, label }: { rows: ExpectancyBreakdown[]; metric: Metric; label: (key: string) => string }) {
  const values = rows.map(r => r[metric]);
  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const zero = (max / span) * 100; // distance of the zero line from the top, in %
  const format = (v: number) => (metric === 'pnl' ? fmtSignedMoney(v) : metric === 'expectancy' ? fmtR(v, 2) : fmtPct(v));
  const title = metric === 'pnl' ? 'Net P&L' : metric === 'expectancy' ? 'Expectancy' : 'Win rate';

  return (
    <div className="px-5 pb-4" role="img" aria-label={`${title} by segment: ${rows.map(r => `${label(r.key)} ${format(r[metric])}`).join(', ')}`}>
      <div className="relative mb-6 mt-6 h-[148px]">
        <div aria-hidden className="absolute inset-x-0 h-px bg-ef-line-strong" style={{ top: `${zero}%` }} />
        <div className="absolute inset-0 flex items-stretch gap-2">
          {rows.map(r => {
            const v = r[metric];
            const size = (Math.abs(v) / span) * 100;
            const up = v >= 0;
            return (
              <div key={r.key} className="group relative min-w-0 flex-1" title={`${label(r.key)}: ${format(v)}`}>
                <div
                  className="absolute left-1/2 w-full max-w-[44px] -translate-x-1/2 rounded-[2px] transition-opacity group-hover:opacity-80"
                  style={{
                    top: up ? `${zero - size}%` : `${zero}%`,
                    height: `max(2px, ${size}%)`,
                    background: metric === 'winRate' ? 'var(--ef-ink-2)' : up ? 'var(--ef-pos)' : 'var(--ef-neg)',
                  }}
                />
                <span
                  className={cn('ef-num absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[10.5px]', metric === 'winRate' ? 'text-ef-ink-3' : TONE_CLASS[toneOf(v)])}
                  style={up ? { top: `calc(${zero - size}% - 16px)` } : { top: `calc(${zero + size}% + 3px)` }}
                >
                  {format(v)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-2 flex gap-2" aria-hidden>
        {rows.map(r => (
          <span key={r.key} className="min-w-0 flex-1 truncate text-center text-[11px] text-ef-ink-3">{label(r.key)}</span>
        ))}
      </div>
    </div>
  );
}
