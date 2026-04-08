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
  getLeakDiagnostic, detectToxicCombinations,
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
  Activity, Warning, ChartBar, Brain, Funnel, ShieldCheck, TrendDown, Lightning,
} from '@phosphor-icons/react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const CARD = 'rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.07)]';
const SECTION_LABEL = 'text-[10px] font-semibold uppercase tracking-[0.1em] text-[rgba(255,255,255,0.25)]';

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
  const maxAbsR = Math.max(...data.map(r => Math.abs(r.avgR)), 0.001);
  const maxExp = Math.max(...data.map(r => r.expectancy));
  const minExp = Math.min(...data.map(r => r.expectancy));

  return (
    <div className={cn(CARD, 'p-5')}>
      <h3 className={cn(SECTION_LABEL, 'mb-4')}>{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.07)]">
              {['Segment', 'Trades', 'Win%', 'Avg R', 'Expect.', 'P&L', ''].map((h, i) => (
                <th
                  key={i}
                  className={cn(
                    'pb-2.5 text-[10px] font-medium uppercase tracking-[0.08em] text-[rgba(255,255,255,0.3)]',
                    i === 0 ? 'text-left' : 'text-right'
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map(row => {
              const isLeak = row.expectancy < 0;
              const isBest = data.length > 1 && row.expectancy === maxExp;
              const isWorst = data.length > 1 && row.expectancy === minExp && minExp < 0;
              const expectBarWidth = Math.min((Math.abs(row.expectancy) / maxAbsExpectancy) * 100, 100);
              const avgRBarWidth = Math.min((Math.abs(row.avgR) / maxAbsR) * 100, 100);

              return (
                <tr
                  key={row.key}
                  className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                  style={isBest ? { borderLeft: '2px solid rgba(16,185,129,0.5)' } : isWorst ? { borderLeft: '2px solid rgba(248,113,113,0.5)' } : {}}
                >
                  <td className="py-2.5 pr-2 font-medium text-[rgba(255,255,255,0.8)] text-[13px]">
                    <div className="flex items-center gap-1.5">
                      {row.key}
                      {isLeak && (
                        <span className="inline-flex items-center gap-0.5 text-[8px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-full" data-tour="leak-badge">
                          <Warning className="h-2.5 w-2.5" />
                          LEAK
                        </span>
                      )}
                    </div>
                    {isLeak && field && (
                      <p className="text-[9px] text-[rgba(255,255,255,0.3)] mt-0.5 leading-tight">
                        {getLeakDiagnostic(field, row.key, row.expectancy, row.winRate)}
                      </p>
                    )}
                  </td>
                  <td className="py-2.5 text-right font-mono text-[rgba(255,255,255,0.35)]">{row.trades}</td>
                  <td className={cn('py-2.5 text-right font-mono', row.winRate >= 50 ? 'text-[#10b981]' : 'text-[#f87171]')}>
                    {row.winRate}%
                  </td>
                  <td className="py-2.5 text-right font-mono">
                    <div className="relative inline-flex items-center justify-end w-full">
                      <div
                        className={cn('absolute inset-y-0 right-0 rounded-sm transition-all opacity-15', row.avgR >= 0 ? 'bg-[#10b981]' : 'bg-[#f87171]')}
                        style={{ width: `${avgRBarWidth}%` }}
                      />
                      <span className="relative z-10 text-[rgba(255,255,255,0.7)]">{row.avgR || '—'}</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-right font-mono font-semibold">
                    <div className="relative inline-flex items-center justify-end w-full">
                      <div
                        className={cn('absolute inset-y-0 right-0 rounded-sm transition-all opacity-15', row.expectancy > 0 ? 'bg-[#10b981]' : row.expectancy < 0 ? 'bg-[#f87171]' : '')}
                        style={{ width: `${expectBarWidth}%` }}
                      />
                      <span className={cn('relative z-10', row.expectancy > 0 ? 'text-[#10b981]' : row.expectancy < 0 ? 'text-[#f87171]' : 'text-[rgba(255,255,255,0.7)]')}>
                        {row.expectancy}
                      </span>
                    </div>
                  </td>
                  <td className={cn('py-2.5 text-right font-mono', row.pnl >= 0 ? 'text-[#10b981]' : 'text-[#f87171]')}>
                    ${row.pnl}
                  </td>
                  <td className="py-2.5 text-right">
                    {onSimulate && field && (
                      <button
                        onClick={() => onSimulate(row.key, field)}
                        data-tour="simulate-btn"
                        className={cn(
                          'p-1 rounded transition-colors',
                          isLeak
                            ? 'text-amber-400 hover:bg-amber-400/10'
                            : 'text-[rgba(255,255,255,0.3)] hover:text-white hover:bg-[rgba(255,255,255,0.06)]'
                        )}
                        title={`Simulate ${row.key}`}
                      >
                        <Lightning className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Behavioral Alerts ───
function BehavioralAlerts({ insights, tradeCount }: { insights: BehavioralInsight[]; tradeCount: number }) {
  const THRESHOLD = 20;

  if (tradeCount < THRESHOLD) return (
    <div className={cn(CARD, 'p-5')}>
      <h3 className={cn(SECTION_LABEL, 'mb-4 flex items-center gap-1.5')}>
        <Brain className="h-3.5 w-3.5" /> Behavioral Patterns
      </h3>
      <p className="text-sm font-semibold text-white mb-1">Log at least 20 trades to detect patterns</p>
      <p className="text-xs text-[rgba(255,255,255,0.4)] mb-4">EdgeFlow needs enough data to surface meaningful behavioral signals.</p>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full transition-all" style={{ width: `${Math.min((tradeCount / THRESHOLD) * 100, 100)}%` }} />
        </div>
        <span className="text-[11px] font-mono text-[rgba(255,255,255,0.35)] shrink-0">{tradeCount}/{THRESHOLD}</span>
      </div>
    </div>
  );

  if (insights.length === 0) return (
    <div className={cn(CARD, 'p-5')}>
      <h3 className={cn(SECTION_LABEL, 'mb-3 flex items-center gap-1.5')}>
        <Brain className="h-3.5 w-3.5" /> Behavioral Patterns
      </h3>
      <p className="text-xs text-[rgba(255,255,255,0.4)]">No significant behavioral patterns detected. Keep logging consistently.</p>
    </div>
  );

  const severityBorder: Record<string, string> = {
    high: 'border-[rgba(248,113,113,0.35)]',
    medium: 'border-[rgba(251,191,36,0.35)]',
    low: 'border-[rgba(255,255,255,0.07)]',
  };
  const severityDot: Record<string, string> = {
    high: 'bg-[#f87171]',
    medium: 'bg-amber-400',
    low: 'bg-[rgba(255,255,255,0.3)]',
  };

  return (
    <div className={cn(CARD, 'p-5')}>
      <h3 className={cn(SECTION_LABEL, 'mb-4 flex items-center gap-1.5')}>
        <Brain className="h-3.5 w-3.5" /> Behavioral Patterns
      </h3>
      <div className="space-y-2">
        {insights.map((insight, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={cn('p-3 rounded-lg border bg-[rgba(255,255,255,0.02)]', severityBorder[insight.severity])}
          >
            <div className="flex items-start gap-2.5">
              <div className={cn('w-1.5 h-1.5 rounded-full mt-1.5 shrink-0', severityDot[insight.severity])} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[rgba(255,255,255,0.85)]">{insight.message}</p>
                <p className="text-[10px] text-[rgba(255,255,255,0.35)] mt-0.5 font-mono">{insight.stat}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Risk Indicator ───
function RiskIndicator({ trades }: { trades: Trade[] }) {
  const risk = getCurrentRiskStatus(trades);
  const borderColor = { green: 'border-[rgba(16,185,129,0.3)]', yellow: 'border-[rgba(251,191,36,0.3)]', red: 'border-[rgba(248,113,113,0.3)]' };
  const textColor = { green: 'text-[#10b981]', yellow: 'text-amber-400', red: 'text-[#f87171]' };
  const icons = { green: ShieldCheck, yellow: Warning, red: TrendDown };
  const Icon = icons[risk.status];

  return (
    <div className={cn(CARD, 'p-5 border', borderColor[risk.status])}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn('h-4 w-4', textColor[risk.status])} />
        <h3 className={cn('text-xs font-bold uppercase tracking-wider', textColor[risk.status])}>
          {risk.status.toUpperCase()}
        </h3>
      </div>
      <p className="text-xs text-[rgba(255,255,255,0.6)]">{risk.message}</p>
      {risk.drawdownR > 0 && (
        <p className="text-[10px] font-mono mt-1 text-[rgba(255,255,255,0.35)]">
          Drawdown: {risk.drawdownR}R
        </p>
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

  const toggleSession = (s: string) => {
    setSelectedSessions(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const insightText = useMemo(() => {
    if (!result) return '';
    if (result.filteredPnl <= result.originalPnl && result.filteredPnl > 0 && result.originalPnl > 0) {
      return `This setup accounts for ${((result.filteredPnl / result.originalPnl) * 100).toFixed(1)}% ($${result.filteredPnl.toFixed(0)}) of your total gains`;
    }
    if (result.filteredPnl > result.originalPnl) {
      return `Filtering improves P&L by ${result.improvementPct}% — removing excluded trades adds $${(result.filteredPnl - result.originalPnl).toFixed(0)}`;
    }
    if (result.filteredPnl < 0) {
      return `This filter isolates a losing subset — $${Math.abs(result.filteredPnl).toFixed(0)} in losses from ${result.filteredTrades} trades`;
    }
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
    <div className={cn(CARD, 'p-5')}>
      <h3 className={cn(SECTION_LABEL, 'mb-5 flex items-center gap-1.5')}>
        <Lightning className="h-3.5 w-3.5" /> Strategy Optimizer — What If?
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Instrument', value: instrument, onChange: setInstrument, options: [{ value: '__any__', label: 'Any' }, ...instruments.map(i => ({ value: i, label: i }))] },
          { label: 'HTF Bias', value: htfBias, onChange: setHtfBias, options: [{ value: '__any__', label: 'Any' }, ...HTF_BIASES.map(b => ({ value: b, label: b }))] },
          { label: 'Min Confidence', value: minConfidence, onChange: setMinConfidence, options: [{ value: '__any__', label: 'Any' }, ...[3,4,5].map(n => ({ value: String(n), label: `≥${n}` }))] },
          { label: 'Min Emotion', value: minEmotion, onChange: setMinEmotion, options: [{ value: '__any__', label: 'Any' }, ...[3,4,5].map(n => ({ value: String(n), label: `≥${n}` }))] },
        ].map(({ label, value, onChange, options }) => (
          <div key={label}>
            <p className="text-[10px] uppercase tracking-[0.08em] text-[rgba(255,255,255,0.3)] mb-1.5">{label}</p>
            <Select value={value} onValueChange={onChange}>
              <SelectTrigger className="h-8 text-xs bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.1)]">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                {options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <Checkbox id="plan" checked={followedPlan} onCheckedChange={v => setFollowedPlan(!!v)} />
          <Label htmlFor="plan" className="text-xs text-[rgba(255,255,255,0.6)] cursor-pointer">Plan followed only</Label>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SESSIONS.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => toggleSession(s)}
              className={cn(
                'text-[10px] px-2.5 py-1 rounded-full border transition-all',
                selectedSessions.includes(s)
                  ? 'bg-white text-black border-white font-semibold'
                  : 'bg-transparent border-[rgba(255,255,255,0.15)] text-[rgba(255,255,255,0.4)] hover:text-white hover:border-[rgba(255,255,255,0.3)]'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <Button
        size="sm"
        onClick={() => runSimulationWithValues()}
        className="gap-1.5 text-xs bg-white text-black hover:bg-white/90 rounded-[24px] font-semibold"
      >
        <Activity className="h-3 w-3" /> Run Simulation
      </Button>

      {result && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Trades', orig: result.originalTrades, filt: result.filteredTrades, badge: false },
              { label: 'Win Rate', orig: `${result.originalWinRate.toFixed(1)}%`, filt: `${result.filteredWinRate.toFixed(1)}%`, badge: false },
              { label: 'Expectancy', orig: result.originalExpectancy.toFixed(3), filt: result.filteredExpectancy.toFixed(3), badge: highExpectancy },
              { label: 'P&L', orig: `$${result.originalPnl.toFixed(0)}`, filt: `$${result.filteredPnl.toFixed(0)}`, badge: false },
            ].map(m => (
              <div key={m.label} className="rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] p-3">
                <div className="flex items-center gap-1 mb-1">
                  <p className="text-[9px] uppercase tracking-[0.08em] text-[rgba(255,255,255,0.3)]">{m.label}</p>
                  {m.badge && <Lightning className="h-3 w-3 text-[#10b981]" />}
                </div>
                <p className="text-[10px] text-[rgba(255,255,255,0.25)] line-through font-mono">{m.orig}</p>
                <p className="text-sm font-bold font-mono text-white">{m.filt}</p>
              </div>
            ))}
          </div>

          {drawdownReduced && (
            <div className="flex items-center gap-1.5 text-[10px] text-[#10b981] font-mono bg-[rgba(16,185,129,0.05)] rounded-lg px-3 py-2 border border-[rgba(16,185,129,0.15)]">
              <ShieldCheck className="h-3 w-3" />
              Drawdown reduced: ${result.originalMaxDrawdown.toFixed(0)} → ${result.filteredMaxDrawdown.toFixed(0)}
            </div>
          )}

          <div className={cn(
            'text-center py-2.5 rounded-lg text-xs font-medium',
            result.filteredPnl >= result.originalPnl
              ? 'bg-[rgba(16,185,129,0.06)] text-[#10b981] border border-[rgba(16,185,129,0.15)]'
              : 'bg-[rgba(255,255,255,0.03)] text-[rgba(255,255,255,0.4)] border border-[rgba(255,255,255,0.07)]'
          )}>
            {insightText}
          </div>

          {mergedCurveData.length > 0 && (
            <div className="h-[180px] mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mergedCurveData}>
                  <defs>
                    <linearGradient id="filteredGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0a0a0a',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: 10,
                      padding: '6px 12px',
                    }}
                  />
                  <Area type="monotone" dataKey="original" stroke="rgba(255,255,255,0.2)" strokeWidth={1} strokeDasharray="4 3" fill="none" name="Total Portfolio" />
                  <Area type="monotone" dataKey="filtered" stroke="#10b981" strokeWidth={1.5} fill="url(#filteredGrad)" name="Filtered Strategy" connectNulls />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>
      )}
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

  const stats = useMemo(() => calculateAnalytics(filteredTrades), [filteredTrades]);
  const byPair = useMemo(() => getExpectancyByField(filteredTrades, 'instrument'), [filteredTrades]);
  const bySession = useMemo(() => getExpectancyByField(filteredTrades, 'session'), [filteredTrades]);
  const byDirection = useMemo(() => getExpectancyByField(filteredTrades, 'direction'), [filteredTrades]);
  const byEmotion = useMemo(() => getExpectancyByField(filteredTrades, 'emotionalState'), [filteredTrades]);
  const byConfidence = useMemo(() => getExpectancyByField(filteredTrades, 'confidenceLevel'), [filteredTrades]);
  const byHTF = useMemo(() => getExpectancyByField(filteredTrades, 'htfBias'), [filteredTrades]);
  const byPlan = useMemo(() => getExpectancyByPlanAdherence(filteredTrades), [filteredTrades]);
  const behavioral = useMemo(() => detectBehavioralPatterns(filteredTrades), [filteredTrades]);

  const handleSimulate = (key: string, field: string) => {
    setPreFilter({ field, value: key });
    setTimeout(() => simulatorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  if (trades.length === 0) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="p-3 rounded-xl bg-[rgba(255,255,255,0.06)] mb-5">
            <ChartBar className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-[24px] font-bold text-white tracking-[-0.5px] mb-1.5">Performance Analyst</h1>
          <p className="text-sm text-[rgba(255,255,255,0.4)]">Log trades to unlock deep analytics.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-[24px] font-bold text-white tracking-[-0.5px]">Performance Analyst</h1>
        {accounts.length > 0 && (
          <div className="flex items-center gap-2">
            <Funnel className="h-3.5 w-3.5 text-[rgba(255,255,255,0.3)]" />
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

      {/* Risk banner */}
      <div className="mb-3">
        <RiskIndicator trades={filteredTrades} />
      </div>

      {/* Core Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'R-Expectancy', value: stats.rExpectancy ? stats.rExpectancy.toFixed(3) : '—', color: stats.rExpectancy > 0 ? 'text-[#10b981]' : 'text-[#f87171]', badge: stats.rExpectancy > 0.5 },
          { label: 'Avg R Win',    value: stats.avgRWin ? `+${stats.avgRWin}R` : '—',            color: 'text-[#10b981]', badge: false },
          { label: 'Avg R Loss',   value: stats.avgRLoss ? `−${stats.avgRLoss}R` : '—',          color: 'text-[#f87171]', badge: false },
          { label: 'Max Drawdown', value: `$${stats.maxDrawdown}`,                                color: stats.maxDrawdown > 0 ? 'text-[#f87171]' : 'text-white', badge: false },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={cn(CARD, 'p-5')}>
            <div className="flex items-center gap-1.5 mb-3">
              <p className={SECTION_LABEL}>{s.label}</p>
              {s.badge && <Lightning className="h-3 w-3 text-[#10b981]" weight="fill" />}
            </div>
            <p className={cn('text-[28px] font-bold font-mono tracking-[-0.03em] leading-none', s.color)}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Behavioral Patterns */}
      <div className="mb-4">
        <BehavioralAlerts insights={behavioral} tradeCount={filteredTrades.length} />
      </div>

      {/* Expectancy Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
        <ExpectancyTable title="By Instrument" data={byPair} field="instrument" onSimulate={handleSimulate} />
        <ExpectancyTable title="By Session" data={bySession} field="session" onSimulate={handleSimulate} />
        <ExpectancyTable title="By Direction" data={byDirection} field="direction" onSimulate={handleSimulate} />
        <ExpectancyTable title="By HTF Bias" data={byHTF} field="htfBias" onSimulate={handleSimulate} />
        <ExpectancyTable title="By Emotional State" data={byEmotion} field="emotionalState" onSimulate={handleSimulate} />
        <ExpectancyTable title="By Confidence Level" data={byConfidence} field="confidenceLevel" onSimulate={handleSimulate} />
        {byPlan.length > 0 && <ExpectancyTable title="By Plan Adherence" data={byPlan} field="followedPlan" onSimulate={handleSimulate} />}
      </div>

      {/* Strategy Simulator */}
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
