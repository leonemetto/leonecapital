import { useMemo, useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader, PageBody } from '@/components/layout/PageHeader';
import { useSharedTrades } from '@/contexts/TradesContext';
import { useSharedAccounts } from '@/contexts/AccountsContext';
import {
  calculateAnalytics, getExpectancyByField, simulateFilter, SimulationResult,
} from '@/lib/analytics';
import { Trade, SESSIONS, HTF_BIASES } from '@/types/trade';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Pulse, Lightning, ShieldCheck, Scales, ArrowLeft } from '@phosphor-icons/react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const LEAK_DETECTION_MIN_TRADES = 15;

function StrategyOptimizer({ trades, preField, preKey, preExclude }: {
  trades: Trade[];
  preField?: string;
  preKey?: string;
  preExclude?: boolean;
}) {
  const [instrument, setInstrument] = useState<string>('__any__');
  const [htfBias, setHtfBias] = useState<string>('__any__');
  const [minConfidence, setMinConfidence] = useState<string>('__any__');
  const [followedPlan, setFollowedPlan] = useState<boolean>(false);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [minEmotion, setMinEmotion] = useState<string>('__any__');
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [hasAutoRun, setHasAutoRun] = useState(false);

  const instruments = useMemo(() => Array.from(new Set(trades.map(t => t.instrument))).sort(), [trades]);

  // Apply URL pre-filter once on mount
  useEffect(() => {
    if (!preField || !preKey || hasAutoRun) return;
    if (preField === 'instrument') setInstrument(preKey);
    else if (preField === 'session') setSelectedSessions([preKey]);
    else if (preField === 'htfBias') setHtfBias(preKey);
    else if (preField === 'followedPlan') setFollowedPlan(preKey === 'Yes' || preKey === 'true');

    const filterObj: Parameters<typeof simulateFilter>[1] = {};
    if (preField === 'instrument') filterObj.instrument = preKey;
    else if (preField === 'session') filterObj.sessions = [preKey];
    else if (preField === 'htfBias') filterObj.htfBias = preKey;
    else if (preField === 'followedPlan') filterObj.followedPlan = (preKey === 'Yes' || preKey === 'true') ? true : undefined;
    if (preExclude) filterObj.exclude = true;

    setResult(simulateFilter(trades, filterObj));
    setHasAutoRun(true);
  }, [preField, preKey, preExclude, trades, hasAutoRun]);

  const runSimulation = () => {
    setResult(simulateFilter(trades, {
      instrument: instrument !== '__any__' ? instrument : undefined,
      htfBias: htfBias !== '__any__' ? htfBias : undefined,
      minConfidence: minConfidence !== '__any__' ? parseInt(minConfidence) : undefined,
      followedPlan: followedPlan ? true : undefined,
      sessions: selectedSessions.length > 0 ? selectedSessions : undefined,
      minEmotionalState: minEmotion !== '__any__' ? parseInt(minEmotion) : undefined,
    }));
  };

  const toggleSession = (s: string) =>
    setSelectedSessions(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const insightText = useMemo(() => {
    if (!result) return '';
    if (preExclude && preKey) {
      const recovered = result.filteredPnl - result.originalPnl;
      const removedTrades = result.originalTrades - result.filteredTrades;
      if (recovered > 0)
        return `Removing ${preKey} recovers an estimated +$${recovered.toFixed(0)} across ${removedTrades} fewer trades`;
      if (recovered < 0)
        return `Removing ${preKey} would cost $${Math.abs(recovered).toFixed(0)} — this segment is net profitable`;
      return `Removing ${preKey} has no significant P&L impact`;
    }
    if (result.filteredPnl <= result.originalPnl && result.filteredPnl > 0 && result.originalPnl > 0)
      return `This setup accounts for ${((result.filteredPnl / result.originalPnl) * 100).toFixed(1)}% ($${result.filteredPnl.toFixed(0)}) of your total gains`;
    if (result.filteredPnl > result.originalPnl)
      return `Filter improves P&L by ${result.improvementPct}% — removing excluded trades adds $${(result.filteredPnl - result.originalPnl).toFixed(0)}`;
    if (result.filteredPnl < 0)
      return `This filter isolates a losing subset — $${Math.abs(result.filteredPnl).toFixed(0)} in losses from ${result.filteredTrades} trades`;
    return `${result.improvementPct > 0 ? '+' : ''}${result.improvementPct}% P&L change · ${result.label}`;
  }, [result, preExclude, preKey]);

  const drawdownReduced = result ? result.filteredMaxDrawdown < result.originalMaxDrawdown : false;
  const highExpectancy = result ? result.filteredExpectancy > 0.5 : false;

  const mergedCurveData = useMemo(() => {
    if (!result || result.originalEquityCurve.length === 0) return [];
    const map = new Map<string, { date: string; original: number; filtered?: number }>();
    for (const pt of result.originalEquityCurve) map.set(pt.date, { date: pt.date, original: pt.balance });
    for (const pt of result.equityCurve) {
      const existing = map.get(pt.date);
      if (existing) existing.filtered = pt.balance;
      else map.set(pt.date, { date: pt.date, original: 0, filtered: pt.balance });
    }
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [result]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Filter controls */}
      <div style={{
        background: 'var(--ef-bg-elev)',
        border: '1px solid var(--ef-line)',
        borderRadius: 12,
        padding: '20px 22px',
      }}>
        <div style={{ fontSize: 12, color: 'var(--ef-ink-3)', marginBottom: 18, lineHeight: 1.5 }}>
          Apply filters to see what your performance looks like if you only traded certain conditions.
          The <span style={{ color: 'var(--ef-pos)', fontWeight: 600 }}>green line</span> is your filtered strategy —
          the <span style={{ color: 'var(--ef-ink-3)' }}>dashed line</span> is your full history.
        </div>

        <div className="optimizer-filter-grid" style={{ marginBottom: 16 }}>
          {[
            { label: 'Instrument', value: instrument, onChange: setInstrument, options: [{ value: '__any__', label: 'Any instrument' }, ...instruments.map(i => ({ value: i, label: i }))] },
            { label: 'HTF Bias', value: htfBias, onChange: setHtfBias, options: [{ value: '__any__', label: 'Any bias' }, ...HTF_BIASES.map(b => ({ value: b, label: b }))] },
            { label: 'Min Confidence', value: minConfidence, onChange: setMinConfidence, options: [{ value: '__any__', label: 'Any' }, ...[3, 4, 5].map(n => ({ value: String(n), label: `${n}+ / 5` }))] },
            { label: 'Min Emotion', value: minEmotion, onChange: setMinEmotion, options: [{ value: '__any__', label: 'Any' }, ...[3, 4, 5].map(n => ({ value: String(n), label: `${n}+ / 5` }))] },
          ].map(({ label, value, onChange, options }) => (
            <div key={label}>
              <div className="font-mono" style={{ fontSize: 10, color: 'var(--ef-ink-4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                {label}
              </div>
              <Select value={value} onValueChange={onChange}>
                <SelectTrigger className="h-9 text-xs rounded-[8px]">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  {options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <div className="flex items-center gap-2">
            <Checkbox id="plan-only" checked={followedPlan} onCheckedChange={v => setFollowedPlan(!!v)} />
            <Label htmlFor="plan-only" style={{ fontSize: 13, color: 'var(--ef-ink-2)', cursor: 'pointer' }}>Plan followed only</Label>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {SESSIONS.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => toggleSession(s)}
                style={{
                  fontSize: 11, padding: '5px 11px', borderRadius: 999,
                  border: `1px solid ${selectedSessions.includes(s) ? 'var(--ef-ink)' : 'var(--ef-line)'}`,
                  background: selectedSessions.includes(s) ? 'var(--ef-ink)' : 'transparent',
                  color: selectedSessions.includes(s) ? 'var(--ef-bg)' : 'var(--ef-ink-3)',
                  fontWeight: selectedSessions.includes(s) ? 600 : 400,
                  cursor: 'pointer', transition: 'all .1s',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <Button
          size="sm"
          onClick={runSimulation}
          className="gap-2 rounded-[24px] font-semibold px-5"
          style={{ background: 'var(--ef-ink)', color: 'var(--ef-bg)' }}
        >
          <Pulse className="h-3.5 w-3.5" weight="bold" /> Run Simulation
        </Button>
      </div>

      {/* Results */}
      {result && result.filteredTrades === 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{
            background: 'var(--ef-bg-elev)', border: '1px solid var(--ef-line)',
            borderRadius: 12, padding: '32px 24px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--ef-ink)', marginBottom: 8 }}>No trades match this filter</div>
            <div style={{ fontSize: 13, color: 'var(--ef-ink-3)' }}>Try widening your criteria — fewer filters will match more trades.</div>
          </div>
        </motion.div>
      )}
      {result && result.filteredTrades > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Stat grid */}
          <div className="optimizer-stat-grid">
            {[
              { label: 'Trades',     orig: String(result.originalTrades),           filt: String(result.filteredTrades),           badge: false },
              { label: 'Win Rate',   orig: `${result.originalWinRate.toFixed(1)}%`,  filt: `${result.filteredWinRate.toFixed(1)}%`,  badge: false },
              { label: 'Expectancy', orig: result.originalExpectancy.toFixed(3),    filt: result.filteredExpectancy.toFixed(3),    badge: highExpectancy },
              { label: 'Net P&L',    orig: `$${result.originalPnl.toFixed(0)}`,     filt: `$${result.filteredPnl.toFixed(0)}`,     badge: false },
            ].map(m => (
              <div key={m.label} style={{
                background: 'var(--ef-bg-elev)', border: '1px solid var(--ef-line)',
                borderRadius: 10, padding: '14px 16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
                  <div className="font-mono" style={{ fontSize: 10, color: 'var(--ef-ink-4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{m.label}</div>
                  {m.badge && <Lightning size={11} color="var(--ef-pos)" />}
                </div>
                <div className="font-mono" style={{ fontSize: 11, color: 'var(--ef-ink-4)', textDecoration: 'line-through', marginBottom: 2 }}>{m.orig}</div>
                <div className="font-mono" style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--ef-ink)', lineHeight: 1 }}>{m.filt}</div>
              </div>
            ))}
          </div>

          {drawdownReduced && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 12, color: 'var(--ef-pos)', fontFamily: 'var(--ff-mono)',
              background: 'var(--ef-pos-wash)', borderRadius: 10,
              padding: '10px 16px', border: '1px solid color-mix(in oklab, var(--ef-pos) 20%, transparent)',
            }}>
              <ShieldCheck size={13} weight="regular" />
              Max drawdown reduced: ${result.originalMaxDrawdown.toFixed(0)} → ${result.filteredMaxDrawdown.toFixed(0)}
            </div>
          )}

          <div style={{
            textAlign: 'center', padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 500,
            background: result.filteredPnl >= result.originalPnl ? 'var(--ef-pos-wash)' : 'var(--ef-bg-elev)',
            color: result.filteredPnl >= result.originalPnl ? 'var(--ef-pos)' : 'var(--ef-ink-3)',
            border: `1px solid ${result.filteredPnl >= result.originalPnl ? 'color-mix(in oklab, var(--ef-pos) 20%, transparent)' : 'var(--ef-line)'}`,
          }}>
            {insightText}
          </div>

          {mergedCurveData.length > 0 && (
            <div style={{
              background: 'var(--ef-bg-elev)', border: '1px solid var(--ef-line)',
              borderRadius: 12, padding: '16px 4px 8px 0',
            }}>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mergedCurveData} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
                    <defs>
                      <linearGradient id="filteredGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.55 0.17 155)" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="oklch(0.55 0.17 155)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 4" stroke="var(--ef-line)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: 'var(--ef-ink-4)', fontSize: 9, fontFamily: 'var(--ff-mono)' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: 'var(--ef-ink-4)', fontSize: 9, fontFamily: 'var(--ff-mono)' }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} width={48} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--ef-ink)', border: 'none', borderRadius: 8,
                        color: 'var(--ef-bg)', fontSize: 11, fontFamily: 'var(--ff-mono)', padding: '8px 12px',
                      }}
                      labelStyle={{ opacity: 0.6, fontSize: 10 }}
                    />
                    <Area type="monotone" dataKey="original" stroke="var(--ef-ink-4)" strokeWidth={1} strokeDasharray="4 3" fill="none" name="All trades" />
                    <Area type="monotone" dataKey="filtered" stroke="oklch(0.55 0.17 155)" strokeWidth={1.8} fill="url(#filteredGrad)" name="Filtered strategy" connectNulls />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

export default function WhatIfSimulator() {
  const { trades } = useSharedTrades();
  const { accounts } = useSharedAccounts();
  const [searchParams] = useSearchParams();

  const preField   = searchParams.get('field')   ?? undefined;
  const preKey     = searchParams.get('key')     ?? undefined;
  const preExclude = searchParams.get('exclude') === 'true';

  const startingBalance = useMemo(
    () => accounts.reduce((sum, a) => sum + (a.startingBalance ?? 0), 0),
    [accounts]
  );

  const stats = useMemo(() => calculateAnalytics(trades), [trades]);
  const currentBalance = startingBalance + stats.netPnl;

  const preLabel = preField && preKey
    ? (preExclude
        ? `without ${preField === 'session' ? `${preKey} session` : preKey}`
        : `${preField === 'instrument' ? preKey : preField === 'session' ? `${preKey} session` : preKey}`)
    : null;

  if (trades.length < LEAK_DETECTION_MIN_TRADES) {
    return (
      <AppLayout>
        <PageHeader title="Strategy Optimizer" mb={24} />
        <PageBody>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 340, textAlign: 'center', gap: 14 }}>
          <Scales size={48} color="var(--ef-ink-4)" weight="light" />
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--ef-ink)', letterSpacing: '-0.01em' }}>
            {LEAK_DETECTION_MIN_TRADES - trades.length} more trades to unlock
          </div>
          <div style={{ fontSize: 13, color: 'var(--ef-ink-3)', maxWidth: 340, lineHeight: 1.6 }}>
            The Strategy Optimizer needs at least {LEAK_DETECTION_MIN_TRADES} trades to produce meaningful simulations.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <div style={{ width: 160, height: 5, borderRadius: 3, background: 'var(--ef-bg-sunken)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 3,
                background: 'var(--ef-pos)',
                width: `${Math.min((trades.length / LEAK_DETECTION_MIN_TRADES) * 100, 100)}%`,
                transition: 'width .3s',
              }} />
            </div>
            <span className="font-mono" style={{ fontSize: 12, color: 'var(--ef-ink-4)' }}>
              {trades.length} / {LEAK_DETECTION_MIN_TRADES}
            </span>
          </div>
          <Link to="/add-trade" style={{
            marginTop: 8, display: 'inline-flex', alignItems: 'center',
            padding: '8px 18px', borderRadius: 24,
            background: 'var(--ef-ink)', color: 'var(--ef-bg)',
            fontSize: 13, fontWeight: 600,
          }}>
            Log Trade →
          </Link>
        </div>
        </PageBody>
      </AppLayout>
    );
  }

  const headerActions = (
    <>
      {preField && (
        <Link
          to="/leak-detection"
          className="flex items-center gap-1.5 outline-none transition-colors"
          style={{
            height: 34, padding: '0 14px', borderRadius: 10,
            background: 'var(--ef-bg-elev)', border: '1px solid var(--ef-line)',
            fontSize: 13, fontWeight: 500, color: 'var(--ef-ink-2)',
          }}
        >
          <ArrowLeft size={13} /> Leaks
        </Link>
      )}
      <Link
        to="/analyst"
        className="flex items-center gap-1.5 outline-none transition-colors"
        style={{
          height: 34, padding: '0 14px', borderRadius: 10,
          background: 'var(--ef-bg-elev)', border: '1px solid var(--ef-line)',
          fontSize: 13, fontWeight: 500, color: 'var(--ef-ink-2)',
        }}
      >
        Analytics →
      </Link>
    </>
  );

  return (
    <AppLayout>
      <PageHeader
        title="Strategy Optimizer"
        subtitle={preLabel ? `Analysing: ${preLabel} · adjust filters and re-run` : 'apply filters to find your best-performing conditions'}
        disclaimer="Simulated results only. Does not account for slippage, commissions, or live market conditions."
        actions={headerActions}
        mb={24}
      />

      <PageBody>
        {/* Balance context */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            display: 'flex', gap: 0,
            border: '1px solid var(--ef-line)',
            borderRadius: 12, overflow: 'hidden',
            background: 'var(--ef-bg-elev)',
            marginBottom: 20,
          }}
        >
          {[
            { label: 'Trades analysed', value: String(trades.length) },
            { label: 'Current balance',  value: `$${currentBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
            { label: 'Net P&L',          value: `${stats.netPnl >= 0 ? '+' : ''}$${stats.netPnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, color: stats.netPnl >= 0 ? 'var(--ef-pos)' : 'var(--ef-neg)' },
            { label: 'Win rate',         value: `${stats.winRate.toFixed(1)}%` },
          ].map((item, i, arr) => (
            <div key={item.label} style={{
              flex: 1, padding: '14px 18px',
              borderRight: i < arr.length - 1 ? '1px solid var(--ef-line)' : 'none',
            }}>
              <div className="font-mono" style={{ fontSize: 10, color: 'var(--ef-ink-4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                {item.label}
              </div>
              <div className="font-mono" style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', color: (item as any).color ?? 'var(--ef-ink)', lineHeight: 1 }}>
                {item.value}
              </div>
            </div>
          ))}
        </motion.div>

        <StrategyOptimizer trades={trades} preField={preField} preKey={preKey} preExclude={preExclude} />
      </PageBody>
    </AppLayout>
  );
}
