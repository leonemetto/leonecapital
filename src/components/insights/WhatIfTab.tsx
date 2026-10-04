import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ListChecks } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { EmptyState, Meter, Segmented, Surface } from '@/components/ef/primitives';
import { FIELD, FIELD_LABEL } from '@/components/ef/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { simulateFilter } from '@/lib/analytics';
import { LEAK_MIN_TRADES } from '@/lib/leaks';
import { useCriteria } from '@/hooks/useCriteria';
import { cn, parseLocalDate } from '@/lib/utils';
import { fmtMoney, fmtPct, fmtR, fmtSignedMoney, toneOf, TONE_CLASS } from '@/lib/format';
import { HTF_BIASES, type Trade } from '@/types/trade';

type Mode = 'remove' | 'keep';
type PlanFilter = 'any' | 'on' | 'off';
const ANY = '__any__';

interface State {
  mode: Mode;
  instrument: string;
  sessions: string[];
  htfBias: string;
  plan: PlanFilter;
  minConfidence: string;
  minEmotion: string;
}

const BLANK: State = { mode: 'keep', instrument: ANY, sessions: [], htfBias: ANY, plan: 'any', minConfidence: ANY, minEmotion: ANY };

function fromParams(params: URLSearchParams): State {
  const field = params.get('field');
  const key = params.get('key');
  if (!field || !key) return BLANK;
  const mode: Mode = params.get('exclude') === 'true' ? 'remove' : 'keep';
  const next: State = { ...BLANK, mode };
  if (field === 'instrument') next.instrument = key;
  else if (field === 'session') next.sessions = [key];
  else if (field === 'htfBias') next.htfBias = key;
  else if (field === 'followedPlan') next.plan = key === 'Yes' || key === 'true' ? 'on' : 'off';
  return next;
}

const shortDate = (d: string) => parseLocalDate(d).toLocaleDateString('en', { month: 'short', day: 'numeric' });

/**
 * "What if I had not taken these trades?" Filters sit on the left and the
 * result redraws as they change, so there is no run button to press.
 */
export function WhatIfTab({ trades, totalTrades }: { trades: Trade[]; totalTrades: number }) {
  const [params] = useSearchParams();
  const [state, setState] = useState<State>(() => fromParams(params));
  const { addCriteria } = useCriteria();
  const [adding, setAdding] = useState(false);

  // A link from Breakdown or Leaks arrives with the filter in the URL.
  useEffect(() => {
    if (params.get('field')) setState(fromParams(params));
  }, [params]);

  const set = <K extends keyof State>(key: K, value: State[K]) => setState(prev => ({ ...prev, [key]: value }));

  const instruments = useMemo(() => Array.from(new Set(trades.map(t => t.instrument))).sort(), [trades]);
  const sessions = useMemo(() => Array.from(new Set(trades.map(t => t.session).filter(Boolean))).sort(), [trades]);

  const segmentActive = state.instrument !== ANY || state.sessions.length > 0 || state.htfBias !== ANY || state.plan !== 'any';
  const thresholdActive = state.minConfidence !== ANY || state.minEmotion !== ANY;
  const active = segmentActive || thresholdActive;

  const result = useMemo(() => {
    if (!active) return null;
    return simulateFilter(trades, {
      instrument: state.instrument !== ANY ? state.instrument : undefined,
      sessions: state.sessions.length ? state.sessions : undefined,
      htfBias: state.htfBias !== ANY ? state.htfBias : undefined,
      followedPlan: state.plan === 'on' ? true : state.plan === 'off' ? false : undefined,
      minConfidence: state.minConfidence !== ANY ? parseInt(state.minConfidence) : undefined,
      minEmotionalState: state.minEmotion !== ANY ? parseInt(state.minEmotion) : undefined,
      exclude: state.mode === 'remove',
    });
  }, [trades, state, active]);

  const curve = useMemo(() => {
    if (!result) return [];
    const map = new Map<string, { date: string; current?: number; simulated?: number }>();
    for (const pt of result.originalEquityCurve) map.set(pt.date, { date: pt.date, current: pt.balance });
    for (const pt of result.equityCurve) map.set(pt.date, { ...(map.get(pt.date) ?? { date: pt.date }), simulated: pt.balance });
    // Carry each line forward so a day without a matching trade does not break it.
    let c = 0, s = 0;
    return Array.from(map.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(p => {
        c = p.current ?? c;
        s = p.simulated ?? s;
        return { date: p.date, current: c, simulated: s };
      });
  }, [result]);

  const describe = (): string => {
    const parts: string[] = [];
    if (state.instrument !== ANY) parts.push(state.instrument);
    if (state.sessions.length) parts.push(`${state.sessions.join(' and ')} session${state.sessions.length > 1 ? 's' : ''}`);
    if (state.htfBias !== ANY) parts.push(`${state.htfBias.toLowerCase()} bias`);
    if (state.plan === 'on') parts.push('on-plan trades');
    if (state.plan === 'off') parts.push('off-plan trades');
    if (state.minConfidence !== ANY) parts.push(`confidence ${state.minConfidence}+`);
    if (state.minEmotion !== ANY) parts.push(`emotional state ${state.minEmotion}+`);
    return parts.join(', ');
  };

  const sentence = (() => {
    if (!result) return '';
    const diff = result.filteredPnl - result.originalPnl;
    const removed = result.originalTrades - result.filteredTrades;
    if (result.filteredTrades === 0) return 'No trades are left with this filter. Loosen it to see a result.';
    if (state.mode === 'remove') {
      if (diff > 0) return `Without ${describe()}, your result is ${fmtMoney(diff)} better across ${removed} fewer trades.`;
      if (diff < 0) return `Removing ${describe()} would cost ${fmtMoney(Math.abs(diff))}. That segment is net profitable.`;
      return `Removing ${describe()} makes no difference to your result.`;
    }
    if (result.filteredPnl < 0) return `Trading only ${describe()} loses ${fmtMoney(Math.abs(result.filteredPnl))} over ${result.filteredTrades} trades.`;
    if (result.originalPnl > 0 && result.filteredPnl <= result.originalPnl) {
      return `${describe()} produces ${fmtMoney(result.filteredPnl)}, ${fmtPct((result.filteredPnl / result.originalPnl) * 100)} of your total, from ${result.filteredTrades} of ${result.originalTrades} trades.`;
    }
    return `Trading only ${describe()} gives ${fmtSignedMoney(result.filteredPnl)} against ${fmtSignedMoney(result.originalPnl)} overall.`;
  })();

  const rule = (() => {
    if (!active) return '';
    const parts: string[] = [];
    if (state.instrument !== ANY) parts.push(state.mode === 'remove' ? `No ${state.instrument} trades` : `Trade ${state.instrument} only`);
    if (state.sessions.length) parts.push(state.mode === 'remove' ? `No trades in the ${state.sessions.join(' or ')} session` : `Trade the ${state.sessions.join(' and ')} session only`);
    if (state.htfBias !== ANY) parts.push(state.mode === 'remove' ? `No trades when higher-timeframe bias is ${state.htfBias.toLowerCase()}` : `Only trade a ${state.htfBias.toLowerCase()} higher-timeframe bias`);
    if (state.plan !== 'any') parts.push('Every checklist item ticked before entry');
    if (state.minConfidence !== ANY) parts.push(`Only take setups rated ${state.minConfidence} or higher for confidence`);
    if (state.minEmotion !== ANY) parts.push(`No trades when emotional state is below ${state.minEmotion}`);
    return parts.join('; ');
  })();

  const addRule = async () => {
    if (!rule) return;
    setAdding(true);
    try {
      await addCriteria(rule, 'Edge');
      toast.success('Rule added to your plan');
    } catch (e: any) {
      toast.error(e?.message || 'Could not add the rule');
    } finally {
      setAdding(false);
    }
  };

  if (totalTrades < LEAK_MIN_TRADES) {
    return (
      <Surface>
        <EmptyState
          title={`${LEAK_MIN_TRADES - totalTrades} more ${LEAK_MIN_TRADES - totalTrades === 1 ? 'trade' : 'trades'} until what-if is useful`}
          body={`A simulation on a handful of trades says little. It opens at ${LEAK_MIN_TRADES} trades.`}
        >
          <div className="flex items-center gap-3">
            <Meter value={totalTrades} max={LEAK_MIN_TRADES} tone="ink" className="w-40" label="Trades logged toward what-if" />
            <span className="ef-num text-[11.5px] text-ef-ink-3">{totalTrades} of {LEAK_MIN_TRADES}</span>
          </div>
        </EmptyState>
      </Surface>
    );
  }

  const improved = !!result && result.filteredPnl > result.originalPnl;

  return (
    <div className="grid items-start gap-3 lg:grid-cols-[300px_minmax(0,1fr)]">
      {/* Filters */}
      <Surface className="p-5">
        <div className="flex items-center justify-between">
          <p className="ef-label m-0">Filter</p>
          {active && (
            <button type="button" onClick={() => setState({ ...BLANK, mode: state.mode })} className="text-[12px] text-ef-ink-3 underline-offset-2 hover:text-ef-ink hover:underline">
              Reset
            </button>
          )}
        </div>
        <Segmented<Mode>
          ariaLabel="What to do with matching trades"
          value={state.mode}
          onChange={v => set('mode', v)}
          options={[{ value: 'keep', label: 'Keep only' }, { value: 'remove', label: 'Remove' }]}
          className="mt-3 w-full [&>button]:flex-1"
        />
        <p className="m-0 mt-2 text-[11.5px] leading-relaxed text-ef-ink-3">
          {state.mode === 'keep' ? 'Shows your results had you taken only the matching trades.' : 'Shows your results without the matching trades.'}
        </p>

        <div className="mt-5 flex flex-col gap-4">
          <div>
            <label className={FIELD_LABEL} htmlFor="wi-instrument">Instrument</label>
            <Select value={state.instrument} onValueChange={v => set('instrument', v)}>
              <SelectTrigger id="wi-instrument" className={FIELD}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Any instrument</SelectItem>
                {instruments.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <span className={FIELD_LABEL}>Session</span>
            <div className="flex flex-wrap gap-1.5">
              {sessions.map(s => {
                const on = state.sessions.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={on}
                    data-active={on}
                    onClick={() => set('sessions', on ? state.sessions.filter(x => x !== s) : [...state.sessions, s])}
                    className="ef-chip"
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <span className={FIELD_LABEL}>Plan</span>
            <Segmented<PlanFilter>
              ariaLabel="Plan adherence"
              value={state.plan}
              onChange={v => set('plan', v)}
              options={[{ value: 'any', label: 'Any' }, { value: 'on', label: 'On plan' }, { value: 'off', label: 'Off plan' }]}
              className="w-full [&>button]:flex-1"
            />
          </div>
          <div>
            <label className={FIELD_LABEL} htmlFor="wi-bias">Higher-timeframe bias</label>
            <Select value={state.htfBias} onValueChange={v => set('htfBias', v)}>
              <SelectTrigger id="wi-bias" className={FIELD}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Any bias</SelectItem>
                {HTF_BIASES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={FIELD_LABEL} htmlFor="wi-conf">Min confidence</label>
              <Select value={state.minConfidence} onValueChange={v => set('minConfidence', v)}>
                <SelectTrigger id="wi-conf" className={FIELD}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY}>Any</SelectItem>
                  {[3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>{n}+ of 5</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className={FIELD_LABEL} htmlFor="wi-emotion">Min emotion</label>
              <Select value={state.minEmotion} onValueChange={v => set('minEmotion', v)}>
                <SelectTrigger id="wi-emotion" className={FIELD}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY}>Any</SelectItem>
                  {[3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>{n}+ of 5</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {thresholdActive && state.mode === 'remove' && (
            <p className="m-0 text-[11.5px] leading-relaxed text-ef-ink-3">Minimum confidence and emotion always keep the trades that meet them.</p>
          )}
        </div>
      </Surface>

      {/* Result */}
      <Surface>
        {!result ? (
          <EmptyState
            title="Pick a filter to test a change"
            body="Choose an instrument, a session or a plan filter on the left. The comparison draws here as you change it."
            className="py-16"
          />
        ) : (
          <>
            <div className="px-5 pb-4 pt-5">
              <p className="ef-label m-0">Result</p>
              <p className="m-0 mt-2 max-w-[60ch] text-[17px] font-medium leading-snug tracking-[-0.015em] text-ef-ink" style={{ textWrap: 'balance' }}>
                {sentence}
              </p>
            </div>

            <div className="grid grid-cols-2 border-y border-ef-line sm:grid-cols-5">
              <Compare label="Trades" now={String(result.originalTrades)} then={String(result.filteredTrades)} />
              <Compare label="Win rate" now={fmtPct(result.originalWinRate, 1)} then={fmtPct(result.filteredWinRate, 1)} good={result.filteredWinRate > result.originalWinRate} />
              <Compare label="Expectancy" now={fmtR(result.originalExpectancy, 2)} then={fmtR(result.filteredExpectancy, 2)} good={result.filteredExpectancy > result.originalExpectancy} />
              <Compare label="Net P&L" now={fmtSignedMoney(result.originalPnl)} then={fmtSignedMoney(result.filteredPnl)} good={improved} tone={toneOf(result.filteredPnl)} />
              <Compare label="Max drawdown" now={fmtMoney(result.originalMaxDrawdown)} then={fmtMoney(result.filteredMaxDrawdown)} good={result.filteredMaxDrawdown < result.originalMaxDrawdown} />
            </div>

            {curve.length > 1 && (
              <div className="px-5 pb-2 pt-4">
                <div className="mb-2 flex items-center gap-4 text-[11.5px] text-ef-ink-3">
                  <span className="flex items-center gap-1.5"><span aria-hidden className="h-0.5 w-4 bg-ef-ink" /> With the filter</span>
                  <span className="flex items-center gap-1.5">
                    <span aria-hidden className="h-0 w-4 border-t border-dashed border-ef-ink-3" /> As traded
                  </span>
                </div>
                <div
                  className="h-[260px]"
                  role="img"
                  aria-label={`Cumulative P&L as traded ends at ${fmtSignedMoney(result.originalPnl)}; with the filter it ends at ${fmtSignedMoney(result.filteredPnl)}.`}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={curve} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
                      <CartesianGrid stroke="var(--ef-line)" vertical={false} />
                      <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 10, fill: 'var(--ef-ink-4)', fontFamily: 'var(--ff-mono)' }} tickLine={false} axisLine={false} minTickGap={56} tickMargin={8} />
                      <YAxis hide domain={['auto', 'auto']} />
                      <Tooltip
                        cursor={{ stroke: 'var(--ef-line-strong)', strokeWidth: 1 }}
                        content={({ active: on, payload }) => {
                          if (!on || !payload?.length) return null;
                          const p = payload[0].payload as { date: string; current: number; simulated: number };
                          return (
                            <div className="rounded-control border border-ef-line bg-ef-elev px-3 py-2" style={{ boxShadow: 'var(--ef-shadow-pop)' }}>
                              <p className="ef-label m-0">{shortDate(p.date)}</p>
                              <p className="ef-num m-0 mt-1 text-[12.5px] text-ef-ink">With the filter {fmtSignedMoney(p.simulated)}</p>
                              <p className="ef-num m-0 text-[12.5px] text-ef-ink-3">As traded {fmtSignedMoney(p.current)}</p>
                            </div>
                          );
                        }}
                      />
                      <Line type="monotone" dataKey="current" stroke="var(--ef-ink-3)" strokeWidth={1.25} strokeDasharray="4 4" dot={false} isAnimationActive={false} />
                      <Line type="monotone" dataKey="simulated" stroke="var(--ef-ink)" strokeWidth={1.75} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 border-t border-ef-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="m-0 text-[11.5px] leading-relaxed text-ef-ink-4">
                Simulated on past trades. Ignores slippage, commissions and how you would have traded differently.
              </p>
              {improved && rule && (
                <button type="button" onClick={addRule} disabled={adding} className="ef-btn ef-btn-primary shrink-0">
                  <ListChecks className="h-3.5 w-3.5" /> {adding ? 'Adding…' : 'Add as a rule to Plan'}
                </button>
              )}
            </div>
          </>
        )}
      </Surface>
    </div>
  );
}

function Compare({ label, now, then, good, tone }: { label: string; now: string; then: string; good?: boolean; tone?: 'pos' | 'neg' | 'flat' }) {
  return (
    <div className="border-b border-r border-ef-line px-5 py-3.5 last:border-r-0 sm:border-b-0">
      <p className="ef-label m-0">{label}</p>
      <p className={cn('ef-num m-0 mt-2 text-[18px] font-medium leading-none tracking-[-0.03em]', tone ? TONE_CLASS[tone] : 'text-ef-ink')}>{then}</p>
      <p className={cn('ef-num m-0 mt-1.5 text-[11.5px]', good ? 'text-ef-pos' : 'text-ef-ink-4')}>
        {now === then ? 'unchanged' : `was ${now}`}
      </p>
    </div>
  );
}
