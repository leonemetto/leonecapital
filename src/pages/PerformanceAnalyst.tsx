import { useMemo, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useSharedTrades } from '@/contexts/TradesContext';
import { useSharedAccounts } from '@/contexts/AccountsContext';
import {
  calculateAnalytics, getExpectancyByField, getExpectancyByPlanAdherence,
  detectBehavioralPatterns, simulateFilter, getCurrentRiskStatus,
  getEquityCurve, ExpectancyBreakdown, BehavioralInsight, SimulationResult,
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

// ─── Expectancy Table ───
function ExpectancyTable({ title, data }: { title: string; data: ExpectancyBreakdown[] }) {
  if (data.length === 0) return null;
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
            </tr>
          </thead>
          <tbody>
            {data.map(row => (
              <tr key={row.key} className="border-b border-border/30 hover:bg-secondary/30">
                <td className="p-2 font-medium">
                  {row.key}
                  {row.sampleWarning && (
                    <span className="ml-1.5 text-[9px] text-amber-500" title="Low sample size">⚠</span>
                  )}
                </td>
                <td className="p-2 text-right font-mono text-muted-foreground">{row.trades}</td>
                <td className={cn('p-2 text-right font-mono', row.winRate >= 50 ? 'text-profit' : 'text-loss')}>
                  {row.winRate}%
                </td>
                <td className="p-2 text-right font-mono">{row.avgR || '—'}</td>
                <td className={cn('p-2 text-right font-mono font-semibold', row.expectancy > 0 ? 'text-profit' : row.expectancy < 0 ? 'text-loss' : '')}>
                  {row.expectancy}
                </td>
                <td className={cn('p-2 text-right font-mono', row.pnl >= 0 ? 'text-profit' : 'text-loss')}>
                  ${row.pnl}
                </td>
              </tr>
            ))}
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
function StrategySimulator({ trades }: { trades: Trade[] }) {
  const [htfBias, setHtfBias] = useState<string>('__any__');
  const [minConfidence, setMinConfidence] = useState<string>('__any__');
  const [followedPlan, setFollowedPlan] = useState<boolean>(false);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [minEmotion, setMinEmotion] = useState<string>('__any__');
  const [result, setResult] = useState<SimulationResult | null>(null);

  const runSimulation = () => {
    const sim = simulateFilter(trades, {
      htfBias: htfBias !== '__any__' ? htfBias : undefined,
      minConfidence: minConfidence !== '__any__' ? parseInt(minConfidence) : undefined,
      followedPlan: followedPlan ? true : undefined,
      sessions: selectedSessions.length > 0 ? selectedSessions : undefined,
      minEmotionalState: minEmotion !== '__any__' ? parseInt(minEmotion) : undefined,
    });
    setResult(sim);
  };

  const toggleSession = (s: string) => {
    setSelectedSessions(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  return (
    <div className="glass-card p-4">
      <h3 className="text-[10px] font-semibold mb-3 text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
        <Zap className="h-3.5 w-3.5" /> Strategy Optimizer — "What If?"
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
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
                'text-[10px] px-2 py-1 rounded-full border transition-all',
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
              { label: 'Trades', orig: result.originalTrades, filt: result.filteredTrades },
              { label: 'Win Rate', orig: `${result.originalWinRate.toFixed(1)}%`, filt: `${result.filteredWinRate.toFixed(1)}%` },
              { label: 'Expectancy', orig: result.originalExpectancy.toFixed(3), filt: result.filteredExpectancy.toFixed(3) },
              { label: 'P&L', orig: `$${result.originalPnl.toFixed(0)}`, filt: `$${result.filteredPnl.toFixed(0)}` },
            ].map(m => (
              <div key={m.label} className="bg-secondary/50 rounded-lg p-2.5">
                <p className="text-[9px] text-muted-foreground uppercase">{m.label}</p>
                <p className="text-xs text-muted-foreground line-through">{m.orig}</p>
                <p className="text-sm font-bold font-mono">{m.filt}</p>
              </div>
            ))}
          </div>

          <div className={cn(
            'text-center py-2 rounded-lg text-xs font-semibold',
            result.improvementPct > 0 ? 'bg-profit/10 text-profit' : 'bg-loss/10 text-loss'
          )}>
            {result.improvementPct > 0 ? '+' : ''}{result.improvementPct}% P&L improvement with filter: {result.label}
          </div>

          {result.equityCurve.length > 0 && (
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={result.equityCurve}>
                  <defs>
                    <linearGradient id="simGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#30D158" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#30D158" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,11%)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(0,0%,56%)', fontSize: 9 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: 'hsl(0,0%,56%)', fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip contentStyle={{ backgroundColor: '#161618', border: '1px solid #1C1C1E', borderRadius: '8px', color: '#eee', fontSize: 10 }} />
                  <Area type="monotone" dataKey="balance" stroke="#30D158" strokeWidth={1.5} fill="url(#simGrad)" />
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
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  const effectiveAccountId = selectedAccountId || (accounts.length > 0 ? accounts[0].id : '');
  const filteredTrades = useMemo(
    () => effectiveAccountId ? trades.filter(t => t.accountId === effectiveAccountId) : trades,
    [trades, effectiveAccountId]
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
        {accounts.length > 1 && (
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <Select value={effectiveAccountId} onValueChange={setSelectedAccountId}>
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <SelectValue placeholder="Account" />
              </SelectTrigger>
              <SelectContent>
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
            { label: 'R-Expectancy', value: stats.rExpectancy ? stats.rExpectancy.toFixed(3) : '—', positive: stats.rExpectancy > 0 },
            { label: 'Avg R Win', value: stats.avgRWin ? `+${stats.avgRWin}R` : '—', positive: true },
            { label: 'Avg R Loss', value: stats.avgRLoss ? `-${stats.avgRLoss}R` : '—', positive: false },
            { label: 'Max Drawdown', value: `$${stats.maxDrawdown}`, positive: false },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-3"
            >
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest">{s.label}</p>
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
        <ExpectancyTable title="By Instrument" data={byPair} />
        <ExpectancyTable title="By Session" data={bySession} />
        <ExpectancyTable title="By Direction" data={byDirection} />
        <ExpectancyTable title="By HTF Bias" data={byHTF} />
        <ExpectancyTable title="By Emotional State" data={byEmotion} />
        <ExpectancyTable title="By Confidence Level" data={byConfidence} />
        {byPlan.length > 0 && <ExpectancyTable title="By Plan Adherence" data={byPlan} />}
      </div>

      {/* Strategy Simulator */}
      <StrategySimulator trades={filteredTrades} />
    </AppLayout>
  );
};

export default PerformanceAnalyst;
