import { useMemo, useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';
import { useSharedTrades } from '@/contexts/TradesContext';
import { useSharedAccounts } from '@/contexts/AccountsContext';
import {
  calculateAnalytics, getExpectancyByField, getExpectancyByPlanAdherence,
  detectBehavioralPatterns, simulateFilter, getCurrentRiskStatus,
  ExpectancyBreakdown, BehavioralInsight, SimulationResult,
  getLeakDiagnostic,
} from '@/lib/analytics';
import { Trade, SESSIONS, HTF_BIASES } from '@/types/trade';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Pulse, Warning, ChartBar, Brain, Funnel, ShieldCheck, TrendDown, Lightning,
} from '@phosphor-icons/react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

// ─── Expectancy Table ───
function ExpectancyTable({
  title, data, field, onSimulate,
}: {
  title: string;
  data: ExpectancyBreakdown[];
  field?: string;
  onSimulate?: (key: string, field: string) => void;
}) {
  if (data.length === 0) return null;

  const maxAbsExpectancy = Math.max(...data.map(r => Math.abs(r.expectancy)), 0.001);
  const maxExp = Math.max(...data.map(r => r.expectancy));
  const minExp = Math.min(...data.map(r => r.expectancy));

  return (
    <div className="rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.07)] overflow-hidden">
      {/* Table header */}
      <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[rgba(255,255,255,0.4)]">{title}</p>
      </div>

      <div className="divide-y divide-[rgba(255,255,255,0.04)]">
        {/* Column labels */}
        <div className="grid grid-cols-[1fr_60px_60px_70px_70px_60px_32px] gap-2 px-6 py-2">
          {['Segment','Trades','Win%','Avg R','Expect.','P&L',''].map((h, i) => (
            <span key={i} className={cn(
              'text-[9px] font-semibold uppercase tracking-[0.1em] text-[rgba(255,255,255,0.2)]',
              i === 0 ? '' : 'text-right'
            )}>{h}</span>
          ))}
        </div>

        {/* Rows */}
        {data.map(row => {
          const isLeak = row.expectancy < 0;
          const isBest = data.length > 1 && row.expectancy === maxExp && maxExp > 0;
          const isWorst = data.length > 1 && row.expectancy === minExp && minExp < 0;
          const barWidth = Math.min((Math.abs(row.expectancy) / maxAbsExpectancy) * 100, 100);

          return (
            <div
              key={row.key}
              className={cn(
                'grid grid-cols-[1fr_60px_60px_70px_70px_60px_32px] gap-2 px-6 py-3.5 items-center transition-colors',
                isBest ? 'hover:bg-[rgba(16,185,129,0.04)]' : isWorst ? 'hover:bg-[rgba(248,113,113,0.04)]' : 'hover:bg-[rgba(255,255,255,0.02)]'
              )}
            >
              {/* Segment name */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={cn(
                  'w-0.5 h-5 rounded-full shrink-0',
                  isBest ? 'bg-[#10b981]' : isWorst ? 'bg-[#f87171]' : 'bg-[rgba(255,255,255,0.08)]'
                )} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-[rgba(255,255,255,0.85)] truncate">{row.key}</span>
                    {isLeak && (
                      <span className="inline-flex items-center gap-0.5 text-[8px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-full shrink-0">
                        <Warning className="h-2.5 w-2.5" weight="fill" /> LEAK
                      </span>
                    )}
                  </div>
                  {isLeak && field && (
                    <p className="text-[10px] text-[rgba(255,255,255,0.25)] mt-0.5 leading-tight">
                      {getLeakDiagnostic(field, row.key, row.expectancy, row.winRate)}
                    </p>
                  )}
                </div>
              </div>

              <span className="text-right text-[12px] font-mono text-[rgba(255,255,255,0.3)]">{row.trades}</span>

              <span className={cn('text-right text-[12px] font-mono font-semibold', row.winRate >= 50 ? 'text-[#10b981]' : 'text-[#f87171]')}>
                {row.winRate}%
              </span>

              <span className={cn('text-right text-[12px] font-mono', (row.avgR ?? 0) >= 0 ? 'text-[rgba(255,255,255,0.6)]' : 'text-[#f87171]')}>
                {row.avgR || '—'}
              </span>

              {/* Expectancy with bar */}
              <div className="relative flex items-center justify-end">
                <div
                  className={cn('absolute inset-y-0 right-0 rounded-sm opacity-[0.12]', row.expectancy > 0 ? 'bg-[#10b981]' : row.expectancy < 0 ? 'bg-[#f87171]' : '')}
                  style={{ width: `${barWidth}%` }}
                />
                <span className={cn('relative z-10 text-[12px] font-mono font-semibold', row.expectancy > 0 ? 'text-[#10b981]' : row.expectancy < 0 ? 'text-[#f87171]' : 'text-[rgba(255,255,255,0.5)]')}>
                  {row.expectancy}
                </span>
              </div>

              <span className={cn('text-right text-[12px] font-mono', row.pnl >= 0 ? 'text-[#10b981]' : 'text-[#f87171]')}>
                ${row.pnl}
              </span>

              <div className="flex justify-end">
                {onSimulate && field && (
                  <button
                    onClick={() => onSimulate(row.key, field)}
                    className={cn(
                      'p-1.5 rounded-lg transition-colors',
                      isLeak ? 'text-amber-400 hover:bg-amber-400/10' : 'text-[rgba(255,255,255,0.2)] hover:text-white hover:bg-[rgba(255,255,255,0.06)]'
                    )}
                    title="Simulate removing this filter"
                  >
                    <Lightning className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Behavioral Alerts ───
function BehavioralAlerts({ insights, tradeCount }: { insights: BehavioralInsight[]; tradeCount: number }) {
  const THRESHOLD = 20;

  if (tradeCount < THRESHOLD) {
    return (
      <div className="rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.07)] p-8 text-center">
        <Brain className="h-8 w-8 text-[rgba(255,255,255,0.15)] mx-auto mb-4" weight="regular" />
        <p className="text-[15px] font-semibold text-white mb-2">
          {THRESHOLD - tradeCount} more trades to unlock pattern detection
        </p>
        <p className="text-sm text-[rgba(255,255,255,0.35)] mb-6 max-w-sm mx-auto">
          EdgeFlow needs at least {THRESHOLD} trades to surface meaningful behavioral signals and psychological patterns.
        </p>
        <div className="flex items-center gap-3 max-w-xs mx-auto">
          <div className="flex-1 h-1.5 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all"
              style={{ width: `${Math.min((tradeCount / THRESHOLD) * 100, 100)}%` }}
            />
          </div>
          <span className="text-[12px] font-mono text-[rgba(255,255,255,0.3)] shrink-0">{tradeCount} / {THRESHOLD}</span>
        </div>
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.07)] p-8 text-center">
        <ShieldCheck className="h-8 w-8 text-[#10b981] mx-auto mb-3" weight="regular" />
        <p className="text-[15px] font-semibold text-white mb-1">No significant patterns detected</p>
        <p className="text-sm text-[rgba(255,255,255,0.35)]">Keep logging consistently to build a reliable data set.</p>
      </div>
    );
  }

  const severityConfig: Record<string, { border: string; dot: string; tag: string; tagColor: string }> = {
    high:   { border: 'border-[rgba(248,113,113,0.2)]',  dot: 'bg-[#f87171]',  tag: 'HIGH',   tagColor: 'text-[#f87171] bg-[rgba(248,113,113,0.1)]' },
    medium: { border: 'border-[rgba(251,191,36,0.2)]',   dot: 'bg-amber-400',  tag: 'MEDIUM', tagColor: 'text-amber-400 bg-amber-400/10' },
    low:    { border: 'border-[rgba(255,255,255,0.07)]',  dot: 'bg-[rgba(255,255,255,0.2)]', tag: 'LOW', tagColor: 'text-[rgba(255,255,255,0.3)] bg-[rgba(255,255,255,0.06)]' },
  };

  return (
    <div className="space-y-3">
      {insights.map((insight, i) => {
        const cfg = severityConfig[insight.severity];
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={cn('rounded-xl border bg-[rgba(255,255,255,0.02)] px-5 py-4', cfg.border)}
          >
            <div className="flex items-start gap-4">
              <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', cfg.dot)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[13px] font-medium text-[rgba(255,255,255,0.85)] leading-snug">{insight.message}</p>
                  <span className={cn('text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full shrink-0 mt-0.5', cfg.tagColor)}>
                    {cfg.tag}
                  </span>
                </div>
                <p className="text-[11px] text-[rgba(255,255,255,0.3)] font-mono mt-1.5">{insight.stat}</p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Risk Indicator ───
function RiskIndicator({ trades }: { trades: Trade[] }) {
  const risk = getCurrentRiskStatus(trades);
  const config = {
    green:  { border: 'border-[rgba(16,185,129,0.2)]',  bg: 'bg-[rgba(16,185,129,0.04)]',  iconBg: 'bg-[rgba(16,185,129,0.1)]',  text: 'text-[#10b981]',  label: 'All Clear',   Icon: ShieldCheck },
    yellow: { border: 'border-[rgba(251,191,36,0.2)]',   bg: 'bg-[rgba(251,191,36,0.04)]',   iconBg: 'bg-amber-400/10',             text: 'text-amber-400',  label: 'Caution',     Icon: Warning },
    red:    { border: 'border-[rgba(248,113,113,0.2)]',  bg: 'bg-[rgba(248,113,113,0.04)]',  iconBg: 'bg-[rgba(248,113,113,0.1)]', text: 'text-[#f87171]',  label: 'Risk Alert',  Icon: TrendDown },
  }[risk.status];
  const { Icon } = config;

  return (
    <div className={cn('rounded-xl border px-6 py-5 flex items-center gap-5', config.border, config.bg)}>
      <div className={cn('p-3 rounded-xl shrink-0', config.iconBg)}>
        <Icon className={cn('h-5 w-5', config.text)} weight="regular" />
      </div>
      <div className="flex-1">
        <p className={cn('text-[13px] font-bold mb-0.5', config.text)}>{config.label}</p>
        <p className="text-[13px] text-[rgba(255,255,255,0.5)]">{risk.message}</p>
      </div>
      {risk.drawdownR > 0 && (
        <div className="text-right shrink-0">
          <p className="text-[10px] text-[rgba(255,255,255,0.3)] uppercase tracking-wider mb-0.5">Drawdown</p>
          <p className={cn('text-[18px] font-bold font-mono', config.text)}>{risk.drawdownR}R</p>
        </div>
      )}
    </div>
  );
}

// ─── Strategy Simulator ───
interface SimulatorPreFilter { field: string; value: string; }

function StrategySimulator({ trades, preFilter }: { trades: Trade[]; preFilter?: SimulatorPreFilter | null }) {
  const [instrument, setInstrument] = useState<string>('__any__');
  const [htfBias, setHtfBias] = useState<string>('__any__');
  const [minConfidence, setMinConfidence] = useState<string>('__any__');
  const [followedPlan, setFollowedPlan] = useState<boolean>(false);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [minEmotion, setMinEmotion] = useState<string>('__any__');
  const [result, setResult] = useState<SimulationResult | null>(null);

  const instruments = useMemo(() => Array.from(new Set(trades.map(t => t.instrument))).sort(), [trades]);

  useEffect(() => {
    if (!preFilter) return;
    if (preFilter.field === 'instrument') setInstrument(preFilter.value);
    else if (preFilter.field === 'session') setSelectedSessions([preFilter.value]);
    else if (preFilter.field === 'htfBias') setHtfBias(preFilter.value);
    setTimeout(() => runSimulationWithValues(preFilter), 100);
  }, [preFilter]);

  const runSimulationWithValues = (pf?: SimulatorPreFilter | null) => {
    const inst = pf?.field === 'instrument' ? pf.value : instrument;
    const sess = pf?.field === 'session' ? [pf.value] : selectedSessions;
    setResult(simulateFilter(trades, {
      instrument: inst !== '__any__' ? inst : undefined,
      htfBias: htfBias !== '__any__' ? htfBias : undefined,
      minConfidence: minConfidence !== '__any__' ? parseInt(minConfidence) : undefined,
      followedPlan: followedPlan ? true : undefined,
      sessions: sess.length > 0 ? sess : undefined,
      minEmotionalState: minEmotion !== '__any__' ? parseInt(minEmotion) : undefined,
    }));
  };

  const toggleSession = (s: string) =>
    setSelectedSessions(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const insightText = useMemo(() => {
    if (!result) return '';
    if (result.filteredPnl <= result.originalPnl && result.filteredPnl > 0 && result.originalPnl > 0)
      return `This setup accounts for ${((result.filteredPnl / result.originalPnl) * 100).toFixed(1)}% ($${result.filteredPnl.toFixed(0)}) of your total gains`;
    if (result.filteredPnl > result.originalPnl)
      return `Filtering improves P&L by ${result.improvementPct}% — removing excluded trades adds $${(result.filteredPnl - result.originalPnl).toFixed(0)}`;
    if (result.filteredPnl < 0)
      return `This filter isolates a losing subset — $${Math.abs(result.filteredPnl).toFixed(0)} in losses from ${result.filteredTrades} trades`;
    return `${result.improvementPct > 0 ? '+' : ''}${result.improvementPct}% P&L change with filter: ${result.label}`;
  }, [result]);

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
    <div className="rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.07)] overflow-hidden">
      <div className="px-6 py-5 border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-2 mb-1">
          <Lightning className="h-4 w-4 text-[rgba(255,255,255,0.4)]" weight="regular" />
          <p className="text-[13px] font-semibold text-white">Strategy Optimizer</p>
        </div>
        <p className="text-[12px] text-[rgba(255,255,255,0.35)]">
          Apply filters to see what your performance looks like if you only took certain setups.
          The <span className="text-white">solid green line</span> is your filtered portfolio — the <span className="text-[rgba(255,255,255,0.4)]">dashed line</span> is your full history.
          If the green line finishes higher, that filter improves your results — consider trading only those conditions.
        </p>
      </div>

      <div className="p-6 space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Instrument', value: instrument, onChange: setInstrument, options: [{ value: '__any__', label: 'Any instrument' }, ...instruments.map(i => ({ value: i, label: i }))] },
            { label: 'HTF Bias', value: htfBias, onChange: setHtfBias, options: [{ value: '__any__', label: 'Any bias' }, ...HTF_BIASES.map(b => ({ value: b, label: b }))] },
            { label: 'Min Confidence', value: minConfidence, onChange: setMinConfidence, options: [{ value: '__any__', label: 'Any' }, ...[3,4,5].map(n => ({ value: String(n), label: `${n}+ out of 5` }))] },
            { label: 'Min Emotion', value: minEmotion, onChange: setMinEmotion, options: [{ value: '__any__', label: 'Any' }, ...[3,4,5].map(n => ({ value: String(n), label: `${n}+ out of 5` }))] },
          ].map(({ label, value, onChange, options }) => (
            <div key={label}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[rgba(255,255,255,0.3)] mb-2">{label}</p>
              <Select value={value} onValueChange={onChange}>
                <SelectTrigger className="h-9 text-xs bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.1)]">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  {options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-5">
          <div className="flex items-center gap-2">
            <Checkbox id="plan" checked={followedPlan} onCheckedChange={v => setFollowedPlan(!!v)} />
            <Label htmlFor="plan" className="text-[13px] text-[rgba(255,255,255,0.5)] cursor-pointer">Plan followed trades only</Label>
          </div>
          <div className="flex flex-wrap gap-2">
            {SESSIONS.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => toggleSession(s)}
                className={cn(
                  'text-[11px] px-3 py-1.5 rounded-full border transition-all',
                  selectedSessions.includes(s)
                    ? 'bg-white text-black border-white font-semibold'
                    : 'bg-transparent border-[rgba(255,255,255,0.12)] text-[rgba(255,255,255,0.4)] hover:text-white hover:border-[rgba(255,255,255,0.25)]'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Button
            size="sm"
            onClick={() => runSimulationWithValues()}
            className="gap-2 bg-white text-black hover:bg-white/90 rounded-[24px] font-semibold px-5"
          >
            <Pulse className="h-3.5 w-3.5" weight="bold" /> Run Simulation
          </Button>
        </div>

        {result && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Trades',     orig: String(result.originalTrades),                filt: String(result.filteredTrades),                badge: false },
                { label: 'Win Rate',   orig: `${result.originalWinRate.toFixed(1)}%`,      filt: `${result.filteredWinRate.toFixed(1)}%`,      badge: false },
                { label: 'Expectancy', orig: result.originalExpectancy.toFixed(3),         filt: result.filteredExpectancy.toFixed(3),         badge: highExpectancy },
                { label: 'Net P&L',    orig: `$${result.originalPnl.toFixed(0)}`,          filt: `$${result.filteredPnl.toFixed(0)}`,          badge: false },
              ].map(m => (
                <div key={m.label} className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.07)] px-4 py-4">
                  <div className="flex items-center gap-1 mb-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[rgba(255,255,255,0.3)]">{m.label}</p>
                    {m.badge && <Lightning className="h-3 w-3 text-[#10b981]" />}
                  </div>
                  <p className="text-[11px] text-[rgba(255,255,255,0.2)] line-through font-mono mb-1">{m.orig}</p>
                  <p className="text-[20px] font-bold font-mono text-white leading-none">{m.filt}</p>
                </div>
              ))}
            </div>

            {drawdownReduced && (
              <div className="flex items-center gap-2 text-[12px] text-[#10b981] font-mono bg-[rgba(16,185,129,0.04)] rounded-xl px-4 py-3 border border-[rgba(16,185,129,0.12)]">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                Max drawdown reduced: ${result.originalMaxDrawdown.toFixed(0)} → ${result.filteredMaxDrawdown.toFixed(0)}
              </div>
            )}

            <div className={cn(
              'text-center py-3 rounded-xl text-[13px] font-medium',
              result.filteredPnl >= result.originalPnl
                ? 'bg-[rgba(16,185,129,0.05)] text-[#10b981] border border-[rgba(16,185,129,0.12)]'
                : 'bg-[rgba(255,255,255,0.02)] text-[rgba(255,255,255,0.4)] border border-[rgba(255,255,255,0.06)]'
            )}>
              {insightText}
            </div>

            {mergedCurveData.length > 0 && (
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mergedCurveData}>
                    <defs>
                      <linearGradient id="filteredGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#fff', fontSize: 11, padding: '8px 14px' }}
                    />
                    <Area type="monotone" dataKey="original" stroke="rgba(255,255,255,0.15)" strokeWidth={1} strokeDasharray="4 3" fill="none" name="All Trades" />
                    <Area type="monotone" dataKey="filtered" stroke="#10b981" strokeWidth={1.5} fill="url(#filteredGrad)" name="Filtered Strategy" connectNulls />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ───
const PerformanceAnalyst = () => {
  const { trades } = useSharedTrades();
  const { accounts } = useSharedAccounts();
  const [selectedAccountId, setSelectedAccountId] = useState<string>('__all__');
  const [preFilter, setPreFilter] = useState<SimulatorPreFilter | null>(null);
  const simulatorRef = useRef<HTMLDivElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    if (searchParams.get('tour') === '1') {
      const timer = setTimeout(() => setShowTour(true), 800);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const filteredTrades = useMemo(
    () => selectedAccountId === '__all__' ? trades : trades.filter(t => t.accountId === selectedAccountId),
    [trades, selectedAccountId]
  );

  const stats       = useMemo(() => calculateAnalytics(filteredTrades),                        [filteredTrades]);
  const byPair      = useMemo(() => getExpectancyByField(filteredTrades, 'instrument'),         [filteredTrades]);
  const bySession   = useMemo(() => getExpectancyByField(filteredTrades, 'session'),            [filteredTrades]);
  const byDirection = useMemo(() => getExpectancyByField(filteredTrades, 'direction'),          [filteredTrades]);
  const byEmotion   = useMemo(() => getExpectancyByField(filteredTrades, 'emotionalState'),     [filteredTrades]);
  const byConfidence= useMemo(() => getExpectancyByField(filteredTrades, 'confidenceLevel'),    [filteredTrades]);
  const byHTF       = useMemo(() => getExpectancyByField(filteredTrades, 'htfBias'),            [filteredTrades]);
  const byPlan      = useMemo(() => getExpectancyByPlanAdherence(filteredTrades),               [filteredTrades]);
  const behavioral  = useMemo(() => detectBehavioralPatterns(filteredTrades),                   [filteredTrades]);

  const handleSimulate = (key: string, field: string) => {
    setPreFilter({ field, value: key });
    setTimeout(() => simulatorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  if (trades.length === 0) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="p-4 rounded-2xl bg-[rgba(255,255,255,0.04)] mb-6 border border-[rgba(255,255,255,0.07)]">
            <ChartBar className="h-10 w-10 text-[rgba(255,255,255,0.3)]" weight="regular" />
          </div>
          <h1 className="text-[24px] font-bold text-white tracking-[-0.5px] mb-2">Performance Analytic</h1>
          <p className="text-[14px] text-[rgba(255,255,255,0.35)]">Log your first trade to unlock deep analytics.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[24px] font-bold text-white tracking-[-0.5px]">Performance Analytic</h1>
          <p className="text-[13px] text-[rgba(255,255,255,0.35)] mt-1">
            Identify leaks, find your edge, simulate improvements
          </p>
        </div>
        {accounts.length > 1 && (
          <div className="flex items-center gap-2">
            <Funnel className="h-3.5 w-3.5 text-[rgba(255,255,255,0.3)]" weight="regular" />
            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
              <SelectTrigger className="w-[160px] h-8 text-xs border-[rgba(255,255,255,0.1)] bg-transparent">
                <SelectValue placeholder="All Accounts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Accounts</SelectItem>
                {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* ── Risk Status ── */}
      <div className="mb-8">
        <RiskIndicator trades={filteredTrades} />
      </div>

      {/* ── Key Metrics ── */}
      <div className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[rgba(255,255,255,0.3)] mb-4">
          Key Metrics
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'R-Expectancy',
              value: stats.rExpectancy ? stats.rExpectancy.toFixed(3) : '—',
              sub: 'Expected R per trade',
              color: stats.rExpectancy > 0 ? 'text-[#10b981]' : stats.rExpectancy < 0 ? 'text-[#f87171]' : 'text-white',
              badge: stats.rExpectancy > 0.5,
            },
            {
              label: 'Avg Win',
              value: stats.avgRWin ? `+${stats.avgRWin}R` : '—',
              sub: 'Average winning trade',
              color: 'text-[#10b981]',
              badge: false,
            },
            {
              label: 'Avg Loss',
              value: stats.avgRLoss ? `−${stats.avgRLoss}R` : '—',
              sub: 'Average losing trade',
              color: 'text-[#f87171]',
              badge: false,
            },
            {
              label: 'Max Drawdown',
              value: `$${stats.maxDrawdown}`,
              sub: 'Peak to trough loss',
              color: stats.maxDrawdown > 0 ? 'text-[#f87171]' : 'text-white',
              badge: false,
            },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.07)] px-5 py-5"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[rgba(255,255,255,0.3)]">
                  {s.label}
                </p>
                {s.badge && <Lightning className="h-3.5 w-3.5 text-[#10b981]" weight="fill" />}
              </div>
              <p className={cn('text-[32px] font-bold font-mono tracking-[-0.03em] leading-none mb-2', s.color)}>
                {s.value}
              </p>
              <p className="text-[11px] text-[rgba(255,255,255,0.25)]">{s.sub}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Behavioral Patterns ── */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-4 w-4 text-[rgba(255,255,255,0.3)]" weight="regular" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[rgba(255,255,255,0.3)]">
            Behavioral Patterns
          </p>
          {behavioral.length > 0 && (
            <span className="text-[10px] font-mono text-[rgba(255,255,255,0.2)] ml-auto">
              {behavioral.length} signal{behavioral.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <BehavioralAlerts insights={behavioral} tradeCount={filteredTrades.length} />
      </div>

      {/* ── Expectancy Breakdown ── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[rgba(255,255,255,0.3)]">
            Expectancy Breakdown
          </p>
          <p className="text-[11px] text-[rgba(255,255,255,0.2)]">
            Click ⚡ on any row to see how your equity curve looks if you removed that setup from your trading
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ExpectancyTable title="By Instrument"       data={byPair}       field="instrument"      onSimulate={handleSimulate} />
          <ExpectancyTable title="By Session"          data={bySession}    field="session"         onSimulate={handleSimulate} />
          <ExpectancyTable title="By Direction"        data={byDirection}  field="direction"       onSimulate={handleSimulate} />
          <ExpectancyTable title="By HTF Bias"         data={byHTF}        field="htfBias"         onSimulate={handleSimulate} />
          <ExpectancyTable title="By Emotional State"  data={byEmotion}    field="emotionalState"  onSimulate={handleSimulate} />
          <ExpectancyTable title="By Confidence Level" data={byConfidence} field="confidenceLevel" onSimulate={handleSimulate} />
          {byPlan.length > 0 && (
            <ExpectancyTable title="By Plan Adherence" data={byPlan} field="followedPlan" onSimulate={handleSimulate} />
          )}
        </div>
      </div>

      {/* ── Strategy Optimizer ── */}
      <div ref={simulatorRef} data-tour="simulator">
        <StrategySimulator trades={filteredTrades} preFilter={preFilter} />
      </div>

      {showTour && (
        <OnboardingTour onComplete={() => { setShowTour(false); setSearchParams({}); }} />
      )}

    </AppLayout>
  );
};

export default PerformanceAnalyst;
