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
  Activity, AlertTriangle, BarChart3, Brain, Filter, Shield, TrendingDown, TrendingUp, Zap,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

// ─── Expectancy Table with Heat-Bars & Leak Detection ───
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

  return (
    <div className="glass-card p-4">
      <h3 className="text-[10px] font-semibold mb-3 text-muted-foreground uppercase tracking-widest">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-2 text-[10px] text-muted-foreground uppercase">Segment</th>
              <th className="text-right p-2 text-[10px] text-muted-foreground uppercase">Trades</th>
              <th className="text-right p-2 text-[10px] text-muted-foreground uppercase">Win%</th>
              <th className="text-right p-2 text-[10px] text-muted-foreground uppercase">Avg R</th>
              <th className="text-right p-2 text-[10px] text-muted-foreground uppercase">Expect.</th>
              <th className="text-right p-2 text-[10px] text-muted-foreground uppercase">P&L</th>
              {onSimulate && <th className="text-right p-2 text-[10px] text-muted-foreground uppercase w-8"></th>}
            </tr>
          </thead>
          <tbody>
            {data.map(row => {
              const isLeak = row.expectancy < 0;
              const expectBarWidth = Math.min((Math.abs(row.expectancy) / maxAbsExpectancy) * 100, 100);
              const avgRBarWidth = Math.min((Math.abs(row.avgR) / maxAbsR) * 100, 100);

              return (
                <tr
                  key={row.key}
                  className={cn(
                    'border-b border-border/30 hover:bg-secondary/30 transition-colors duration-200',
                    isLeak && 'bg-loss/5'
                  )}
                >
                  <td className="p-2 font-medium">
                    <div className="flex items-center gap-1.5">
                      {row.key}
                      {row.sampleWarning && (
                        <span className="text-[9px] text-amber-500" title="Low sample size">⚠</span>
                      )}
                      {isLeak && (
                        <span className="inline-flex items-center gap-0.5 text-[8px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full">
                          <AlertTriangle className="h-2.5 w-2.5" />
                          LEAK
                        </span>
                      )}
                    </div>
                    {isLeak && field && (
                      <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight opacity-70">
                        {getLeakDiagnostic(field, row.key, row.expectancy, row.winRate)}
                      </p>
                    )}
                  </td>
                  <td className="p-2 text-right font-mono text-muted-foreground">{row.trades}</td>
                  <td className={cn('p-2 text-right font-mono', row.winRate >= 50 ? 'text-profit' : 'text-loss')}>
                    {row.winRate}%
                  </td>
                  {/* Avg R with heat-bar */}
                  <td className="p-2 text-right font-mono">
                    <div className="relative inline-flex items-center justify-end w-full">
                      <div
                        className={cn(
                          'absolute inset-y-0 right-0 rounded-sm transition-all duration-200 opacity-20',
                          row.avgR >= 0 ? 'bg-profit' : 'bg-loss'
                        )}
                        style={{ width: `${avgRBarWidth}%` }}
                      />
                      <span className="relative z-10">{row.avgR || '—'}</span>
                    </div>
                  </td>
                  {/* Expectancy with heat-bar */}
                  <td className="p-2 text-right font-mono font-semibold">
                    <div className="relative inline-flex items-center justify-end w-full">
                      <div
                        className={cn(
                          'absolute inset-y-0 right-0 rounded-sm transition-all duration-200 opacity-20',
                          row.expectancy > 0 ? 'bg-profit' : row.expectancy < 0 ? 'bg-loss' : ''
                        )}
                        style={{ width: `${expectBarWidth}%` }}
                      />
                      <span className={cn('relative z-10', row.expectancy > 0 ? 'text-profit' : row.expectancy < 0 ? 'text-loss' : '')}>
                        {row.expectancy}
                      </span>
                    </div>
                  </td>
                  <td className={cn('p-2 text-right font-mono', row.pnl >= 0 ? 'text-profit' : 'text-loss')}>
                    ${row.pnl}
                  </td>
                  {onSimulate && field && (
                    <td className="p-2 text-right">
                      <button
                        onClick={() => onSimulate(row.key, field)}
                        className={cn(
                          'p-1 rounded transition-all duration-200 hover:scale-110',
                          isLeak
                            ? 'text-amber-500 hover:bg-amber-500/10'
                            : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                        )}
                        title={`Simulate ${row.key}`}
                      >
                        <Zap className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Behavioral Alert Card ───
function BehavioralAlerts({ insights }: { insights: BehavioralInsight[] }) {
  if (insights.length === 0) return (
    <div className="glass-card p-4">
      <h3 className="text-[10px] font-semibold mb-3 text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
        <Brain className="h-3.5 w-3.5" /> Behavioral Patterns
      </h3>
      <p className="text-xs text-muted-foreground">Not enough data to detect patterns. Keep logging.</p>
    </div>
  );

  const severityColor = { high: 'border-loss/50 bg-loss/5', medium: 'border-amber-500/50 bg-amber-500/5', low: 'border-border' };
  const severityIcon = { high: '🔴', medium: '🟡', low: '🟢' };

  return (
    <div className="glass-card p-4">
      <h3 className="text-[10px] font-semibold mb-3 text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
        <Brain className="h-3.5 w-3.5" /> Behavioral Patterns
      </h3>
      <div className="space-y-2">
        {insights.map((insight, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={cn('p-3 rounded-lg border', severityColor[insight.severity])}
          >
            <div className="flex items-start gap-2">
              <span className="text-sm mt-0.5">{severityIcon[insight.severity]}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">{insight.message}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">{insight.stat}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Risk Status Indicator ───
function RiskIndicator({ trades }: { trades: Trade[] }) {
  const risk = getCurrentRiskStatus(trades);
  const colors = {
    green: 'bg-profit/15 border-profit/30 text-profit',
    yellow: 'bg-amber-500/15 border-amber-500/30 text-amber-500',
    red: 'bg-loss/15 border-loss/30 text-loss',
  };
  const icons = { green: Shield, yellow: AlertTriangle, red: TrendingDown };
  const Icon = icons[risk.status];

  return (
    <div className={cn('glass-card p-4 border', colors[risk.status])}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4" />
        <h3 className="text-xs font-bold uppercase tracking-wider">
          Risk Status: {risk.status.toUpperCase()}
        </h3>
      </div>
      <p className="text-xs">{risk.message}</p>
      {risk.drawdownR > 0 && (
        <p className="text-[10px] font-mono mt-1 opacity-70">
          Current drawdown: {risk.drawdownR}R
        </p>
      )}
    </div>
  );
}

// ─── Strategy Simulator ───
interface SimulatorPreFilter {
  field: string;
  value: string;
}

function StrategySimulator({ trades, preFilter }: { trades: Trade[]; preFilter?: SimulatorPreFilter | null }) {
  const [instrument, setInstrument] = useState<string>('__any__');
  const [htfBias, setHtfBias] = useState<string>('__any__');
  const [minConfidence, setMinConfidence] = useState<string>('__any__');
  const [followedPlan, setFollowedPlan] = useState<boolean>(false);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [minEmotion, setMinEmotion] = useState<string>('__any__');
  const [result, setResult] = useState<SimulationResult | null>(null);

  // Unique instruments from trades
  const instruments = useMemo(() => {
    const set = new Set(trades.map(t => t.instrument));
    return Array.from(set).sort();
  }, [trades]);

  // Apply pre-filter from table row click
  useEffect(() => {
    if (!preFilter) return;
    if (preFilter.field === 'instrument') {
      setInstrument(preFilter.value);
    } else if (preFilter.field === 'session') {
      setSelectedSessions([preFilter.value]);
    } else if (preFilter.field === 'htfBias') {
      setHtfBias(preFilter.value);
    } else if (preFilter.field === 'direction') {
      // Can't filter by direction directly, ignore
    }
    // Auto-run after applying pre-filter
    setTimeout(() => runSimulationWithValues(preFilter), 100);
  }, [preFilter]);

  const runSimulationWithValues = (pf?: SimulatorPreFilter | null) => {
    const inst = pf?.field === 'instrument' ? pf.value : instrument;
    const sess = pf?.field === 'session' ? [pf.value] : selectedSessions;

    const sim = simulateFilter(trades, {
      instrument: inst !== '__any__' ? inst : undefined,
      htfBias: htfBias !== '__any__' ? htfBias : undefined,
      minConfidence: minConfidence !== '__any__' ? parseInt(minConfidence) : undefined,
      followedPlan: followedPlan ? true : undefined,
      sessions: sess.length > 0 ? sess : undefined,
      minEmotionalState: minEmotion !== '__any__' ? parseInt(minEmotion) : undefined,
    });
    setResult(sim);
  };

  const runSimulation = () => runSimulationWithValues();

  const toggleSession = (s: string) => {
    setSelectedSessions(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  // Dynamic insight header
  const insightText = useMemo(() => {
    if (!result) return '';
    if (result.filteredPnl <= result.originalPnl && result.filteredPnl > 0 && result.originalPnl > 0) {
      const pct = ((result.filteredPnl / result.originalPnl) * 100).toFixed(1);
      return `This setup accounts for ${pct}% ($${result.filteredPnl.toFixed(0)}) of your total gains`;
    }
    if (result.filteredPnl > result.originalPnl) {
      const diff = result.filteredPnl - result.originalPnl;
      return `Filtering improves P&L by ${result.improvementPct}% — removing excluded trades adds $${diff.toFixed(0)}`;
    }
    if (result.filteredPnl < 0) {
      return `This filter isolates a losing subset — $${Math.abs(result.filteredPnl).toFixed(0)} in losses from ${result.filteredTrades} trades`;
    }
    return `${result.improvementPct > 0 ? '+' : ''}${result.improvementPct}% P&L change with filter: ${result.label}`;
  }, [result]);

  const drawdownReduced = result ? result.filteredMaxDrawdown < result.originalMaxDrawdown : false;
  const highExpectancy = result ? result.filteredExpectancy > 0.5 : false;

  // Merge equity curves for ghost overlay
  const mergedCurveData = useMemo(() => {
    if (!result || result.originalEquityCurve.length === 0) return [];
    const map = new Map<string, { date: string; original: number; filtered?: number }>();
    for (const pt of result.originalEquityCurve) {
      map.set(pt.date, { date: pt.date, original: pt.balance });
    }
    for (const pt of result.equityCurve) {
      const existing = map.get(pt.date);
      if (existing) {
        existing.filtered = pt.balance;
      } else {
        map.set(pt.date, { date: pt.date, original: 0, filtered: pt.balance });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [result]);

  return (
    <div className="glass-card p-4">
      <h3 className="text-[10px] font-semibold mb-3 text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
        <Zap className="h-3.5 w-3.5" /> Strategy Optimizer — "What If?"
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
        <div>
          <Label className="text-[10px] text-muted-foreground uppercase">Instrument</Label>
          <Select value={instrument} onValueChange={setInstrument}>
            <SelectTrigger className="mt-1 h-8 text-xs bg-secondary"><SelectValue placeholder="Any" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__any__">Any</SelectItem>
              {instruments.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground uppercase">HTF Bias</Label>
          <Select value={htfBias} onValueChange={setHtfBias}>
            <SelectTrigger className="mt-1 h-8 text-xs bg-secondary"><SelectValue placeholder="Any" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__any__">Any</SelectItem>
              {HTF_BIASES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground uppercase">Min Confidence</Label>
          <Select value={minConfidence} onValueChange={setMinConfidence}>
            <SelectTrigger className="mt-1 h-8 text-xs bg-secondary"><SelectValue placeholder="Any" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__any__">Any</SelectItem>
              {[3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>≥{n}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground uppercase">Min Emotion</Label>
          <Select value={minEmotion} onValueChange={setMinEmotion}>
            <SelectTrigger className="mt-1 h-8 text-xs bg-secondary"><SelectValue placeholder="Any" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__any__">Any</SelectItem>
              {[3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>≥{n}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-3">
        <div className="flex items-center gap-1.5">
          <Checkbox id="plan" checked={followedPlan} onCheckedChange={v => setFollowedPlan(!!v)} />
          <Label htmlFor="plan" className="text-xs cursor-pointer">Plan followed only</Label>
        </div>
        <div className="flex flex-wrap gap-1">
          {SESSIONS.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => toggleSession(s)}
              className={cn(
                'text-[10px] px-2 py-1 rounded-full border transition-all duration-200',
                selectedSessions.includes(s)
                  ? 'bg-primary/15 text-primary border-primary/30'
                  : 'bg-secondary border-border text-muted-foreground'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <Button size="sm" onClick={runSimulation} className="gap-1.5 text-xs">
        <Activity className="h-3 w-3" /> Run Simulation
      </Button>

      {result && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Trades', orig: result.originalTrades, filt: result.filteredTrades, badge: null },
              { label: 'Win Rate', orig: `${result.originalWinRate.toFixed(1)}%`, filt: `${result.filteredWinRate.toFixed(1)}%`, badge: null },
              { label: 'Expectancy', orig: result.originalExpectancy.toFixed(3), filt: result.filteredExpectancy.toFixed(3), badge: highExpectancy ? 'lightning' : null },
              { label: 'P&L', orig: `$${result.originalPnl.toFixed(0)}`, filt: `$${result.filteredPnl.toFixed(0)}`, badge: null },
            ].map(m => (
              <div key={m.label} className="bg-secondary/50 rounded-lg p-2.5">
                <div className="flex items-center gap-1">
                  <p className="text-[9px] text-muted-foreground uppercase">{m.label}</p>
                  {m.badge === 'lightning' && <Zap className="h-3 w-3 text-profit" />}
                </div>
                <p className="text-xs text-muted-foreground line-through">{m.orig}</p>
                <p className="text-sm font-bold font-mono">{m.filt}</p>
              </div>
            ))}
          </div>

          {/* Drawdown comparison with shield badge */}
          {drawdownReduced && (
            <div className="flex items-center gap-1.5 text-[10px] text-profit font-mono bg-profit/5 rounded-lg px-3 py-1.5 border border-profit/20">
              <Shield className="h-3 w-3" />
              Drawdown reduced: ${result.originalMaxDrawdown.toFixed(0)} → ${result.filteredMaxDrawdown.toFixed(0)}
            </div>
          )}

          {/* Dynamic insight header */}
          <div className={cn(
            'text-center py-2.5 rounded-lg text-xs font-medium transition-all duration-200',
            result.filteredPnl >= result.originalPnl ? 'bg-profit/10 text-profit border border-profit/20' : 'bg-secondary/50 text-muted-foreground border border-border'
          )}>
            {insightText}
          </div>

          {/* Ghost Curve + Filtered Curve */}
          {mergedCurveData.length > 0 && (
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mergedCurveData}>
                  <defs>
                    <linearGradient id="filteredGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#30D158" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#30D158" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,11%)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(0,0%,40%)', fontSize: 9 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: 'hsl(0,0%,40%)', fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#000',
                      border: '1px solid hsl(0,0%,15%)',
                      borderRadius: '8px',
                      color: '#eee',
                      fontSize: 10,
                    }}
                  />
                  {/* Ghost curve — original portfolio */}
                  <Area
                    type="monotone"
                    dataKey="original"
                    stroke="hsl(0,0%,35%)"
                    strokeWidth={1}
                    strokeDasharray="4 3"
                    fill="none"
                    name="Total Portfolio"
                  />
                  {/* Filtered curve — bold neon green with glow */}
                  <Area
                    type="monotone"
                    dataKey="filtered"
                    stroke="#30D158"
                    strokeWidth={2}
                    fill="url(#filteredGrad)"
                    name="Filtered Strategy"
                    style={{ filter: 'drop-shadow(0 0 4px rgba(48, 209, 88, 0.4))' }}
                    connectNulls
                  />
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
    setTimeout(() => {
      simulatorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  if (trades.length === 0) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="p-3 rounded-xl bg-primary/10 mb-5">
            <BarChart3 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-xl font-bold mb-1.5">Performance Analyst</h1>
          <p className="text-sm text-muted-foreground">Log trades to unlock intelligence.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Performance Analyst</h1>
        {accounts.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <SelectValue placeholder="Account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Accounts</SelectItem>
                {accounts.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Risk Status + Core Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 mb-4">
        <RiskIndicator trades={filteredTrades} />
        <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'R-Expectancy', value: stats.rExpectancy ? stats.rExpectancy.toFixed(3) : '—', positive: stats.rExpectancy > 0, badge: stats.rExpectancy > 0.5 ? 'lightning' : null },
            { label: 'Avg R Win', value: stats.avgRWin ? `+${stats.avgRWin}R` : '—', positive: true, badge: null },
            { label: 'Avg R Loss', value: stats.avgRLoss ? `-${stats.avgRLoss}R` : '—', positive: false, badge: null },
            { label: 'Max Drawdown', value: `$${stats.maxDrawdown}`, positive: false, badge: null },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-3"
            >
              <div className="flex items-center gap-1">
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest">{s.label}</p>
                {s.badge === 'lightning' && <Zap className="h-3 w-3 text-profit" />}
              </div>
              <p className={cn('text-lg font-bold font-mono mt-1', s.positive ? 'text-profit' : 'text-loss')}>
                {s.value}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Behavioral Patterns */}
      <div className="mb-4">
        <BehavioralAlerts insights={behavioral} />
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
      <div ref={simulatorRef}>
        <StrategySimulator trades={filteredTrades} preFilter={preFilter} />
      </div>
    </AppLayout>
  );
};

export default PerformanceAnalyst;
