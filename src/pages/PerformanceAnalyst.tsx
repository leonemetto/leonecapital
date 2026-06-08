import { useMemo, useState, useRef, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
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

const ANALYTIC_PANEL_STYLE: CSSProperties = {
  borderRadius: 18,
  border: '1px solid color-mix(in oklab, var(--ef-line) 88%, white 4%)',
  background: `
    radial-gradient(circle at 88% 0%, color-mix(in oklab, var(--ef-pos-wash) 16%, transparent) 0, transparent 38%),
    linear-gradient(180deg, color-mix(in oklab, var(--ef-bg-elev) 94%, white 2%) 0%, var(--ef-bg-elev) 100%)
  `,
  boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 22px 60px rgba(0,0,0,0.18)',
};

function MetricTile({
  label,
  value,
  sub,
  tone = 'neutral',
  badge,
  delay = 0,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: 'positive' | 'negative' | 'warning' | 'neutral';
  badge?: boolean;
  delay?: number;
}) {
  const toneColor = tone === 'positive'
    ? 'var(--ef-pos)'
    : tone === 'negative'
      ? 'var(--ef-neg)'
      : tone === 'warning'
        ? 'var(--ef-warn)'
        : 'var(--ef-ink)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="relative overflow-hidden px-5 py-5"
      style={{
        ...ANALYTIC_PANEL_STYLE,
        background: `
          radial-gradient(circle at 92% 10%, color-mix(in oklab, ${toneColor} 18%, transparent) 0, transparent 36%),
          linear-gradient(180deg, color-mix(in oklab, var(--ef-bg-elev) 94%, ${toneColor} 4%) 0%, var(--ef-bg-elev) 100%)
        `,
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <p className="label-text">{label}</p>
        {badge && <Lightning className="h-3.5 w-3.5" style={{ color: toneColor }} weight="fill" />}
      </div>
      <p className="text-[32px] leading-none mb-2 metric-number tracking-[-0.04em]" style={{ color: toneColor }}>
        {value}
      </p>
      <p className="text-[11px] text-muted-foreground/55">{sub}</p>
    </motion.div>
  );
}

// ─── Expectancy Table ───
function ExpectancyTable({
  title, data, field, onSimulate,
}: {
  title: string;
  data: ExpectancyBreakdown[];
  field?: string;
  onSimulate?: (key: string, field: string) => void;
}) {
  const cleanData = data.filter(r =>
    r.key !== 'Unknown' &&
    r.key !== '' &&
    r.key !== 'undefined' &&
    r.trades >= 2
  );
  if (cleanData.length === 0) return null;

  const maxAbsExpectancy = Math.max(...cleanData.map(r => Math.abs(r.expectancy)), 0.001);
  const maxAbsPnl = Math.max(...cleanData.map(r => Math.abs(r.pnl)), 1);
  const maxExp = Math.max(...cleanData.map(r => r.expectancy));
  const minExp = Math.min(...cleanData.map(r => r.expectancy));

  return (
    <div className="overflow-hidden" style={ANALYTIC_PANEL_STYLE}>
      <div className="px-6 py-4 border-b border-[color:var(--ef-line)]/70">
        <p className="label-text">{title}</p>
      </div>

      <div className="divide-y divide-border/40">
        {/* Column labels */}
        <div className="grid grid-cols-[1fr_60px_60px_70px_70px_60px_32px] gap-2 px-6 py-2.5 bg-black/10">
          {['Segment','Trades','Win%','Avg R','Expect.','P&L',''].map((h, i) => (
            <span key={i} className={cn(
              'text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/40',
              i === 0 ? '' : 'text-right'
            )}>{h}</span>
          ))}
        </div>

        {/* Rows */}
        {cleanData.map(row => {
          const isLeak = row.expectancy < 0;
          const isBest = cleanData.length > 1 && row.expectancy === maxExp && maxExp > 0;
          const isWorst = cleanData.length > 1 && row.expectancy === minExp && minExp < 0;
          const barWidth = Math.min((Math.abs(row.expectancy) / maxAbsExpectancy) * 100, 100);
          const pnlIntensity = Math.min(Math.abs(row.pnl) / maxAbsPnl, 1);

          return (
            <div
              key={row.key}
              className={cn(
                'grid grid-cols-[1fr_60px_60px_70px_70px_60px_32px] gap-2 px-6 py-4 items-center transition-colors',
                isBest ? 'hover:bg-[var(--ef-pos-wash)]/20' : isWorst ? 'hover:bg-[var(--ef-neg-wash)]/20' : 'hover:bg-white/[0.025]'
              )}
            >
              {/* Segment name */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={cn(
                  'w-0.5 h-7 rounded-full shrink-0',
                  isBest ? 'bg-[var(--ef-pos)]' : isWorst ? 'bg-[var(--ef-neg)]' : 'bg-border'
                )} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-foreground truncate">{row.key}</span>
                    {isLeak && (
                      <span className="inline-flex items-center gap-0.5 text-[8px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full shrink-0">
                        <Warning className="h-2.5 w-2.5" weight="fill" /> LEAK
                      </span>
                    )}
                  </div>
                  {isLeak && field && (
                    <p className="text-[10px] text-muted-foreground/50 mt-0.5 leading-tight">
                      {getLeakDiagnostic(field, row.key, row.expectancy, row.winRate)}
                    </p>
                  )}
                </div>
              </div>

              <span className="text-right text-[12px] font-mono text-muted-foreground/50">{row.trades}</span>

              <span className={cn('text-right text-[12px] metric-number', row.winRate >= 50 ? 'text-[var(--ef-pos)]' : 'text-[var(--ef-neg)]')}>
                {row.winRate}%
              </span>

              <span className={cn('text-right text-[12px] metric-number', (row.avgR ?? 0) >= 0 ? 'text-muted-foreground' : 'text-[var(--ef-neg)]')}>
                {row.avgR || '—'}
              </span>

              {/* Expectancy with bar */}
              <div className="relative flex items-center justify-end">
                <div
                  className={cn('absolute inset-y-0 right-0 rounded-full opacity-[0.16]', row.expectancy > 0 ? 'bg-[var(--ef-pos)]' : row.expectancy < 0 ? 'bg-[var(--ef-neg)]' : '')}
                  style={{ width: `${barWidth}%` }}
                />
                <span className={cn('relative z-10 text-[12px] metric-number', row.expectancy > 0 ? 'text-[var(--ef-pos)]' : row.expectancy < 0 ? 'text-[var(--ef-neg)]' : 'text-muted-foreground/60')}>
                  {row.expectancy}
                </span>
              </div>

              <div className="relative flex items-center justify-end">
                <div
                  className="absolute inset-0 rounded-sm"
                  style={{
                    background: row.pnl > 0
                      ? `rgba(16,185,129,${(pnlIntensity * 0.18).toFixed(2)})`
                      : row.pnl < 0
                      ? `rgba(248,113,113,${(pnlIntensity * 0.18).toFixed(2)})`
                      : 'transparent',
                  }}
                />
                <span className={cn('relative z-10 text-right text-[12px] pr-1 metric-number', row.pnl >= 0 ? 'text-[var(--ef-pos)]' : 'text-[var(--ef-neg)]')}>
                  ${row.pnl}
                </span>
              </div>

              <div className="flex justify-end">
                {onSimulate && field && (
                  <button
                    onClick={() => onSimulate(row.key, field)}
                    className={cn(
                      'p-1.5 rounded-lg transition-colors',
                      isLeak ? 'text-amber-500 hover:bg-amber-500/10' : 'text-muted-foreground/40 hover:text-foreground hover:bg-muted'
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
function BehavioralAlerts({ insights, tradeCount, onSimulate }: { insights: BehavioralInsight[]; tradeCount: number; onSimulate?: (key: string, field: string) => void }) {
  const THRESHOLD = 20;

  if (tradeCount < THRESHOLD) {
    return (
      <div className="p-8 text-center" style={ANALYTIC_PANEL_STYLE}>
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-white/[0.035] border border-white/10">
          <Brain className="h-7 w-7 text-muted-foreground/35" weight="regular" />
        </div>
        <p className="text-[15px] font-semibold text-foreground mb-2">
          {THRESHOLD - tradeCount} more trades to unlock pattern detection
        </p>
        <p className="text-sm text-muted-foreground/60 mb-6 max-w-sm mx-auto">
          EdgeFlow needs at least {THRESHOLD} trades to surface meaningful behavioral signals and psychological patterns.
        </p>
        <div className="flex items-center gap-3 max-w-xs mx-auto">
          <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden border border-white/10">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min((tradeCount / THRESHOLD) * 100, 100)}%`,
                background: 'linear-gradient(90deg, var(--ef-ink), var(--ef-pos))',
              }}
            />
          </div>
          <span className="text-[12px] font-mono text-muted-foreground/50 shrink-0">{tradeCount} / {THRESHOLD}</span>
        </div>
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="p-8 text-center" style={ANALYTIC_PANEL_STYLE}>
        <ShieldCheck className="h-8 w-8 text-[#10b981] mx-auto mb-3" weight="regular" />
        <p className="text-[15px] font-semibold text-foreground mb-1">No significant patterns detected</p>
        <p className="text-sm text-muted-foreground/60">Keep logging consistently to build a reliable data set.</p>
      </div>
    );
  }

  const severityConfig: Record<string, { border: string; dot: string; tag: string; tagColor: string }> = {
    high:   { border: 'border-[rgba(248,113,113,0.25)]',  dot: 'bg-[#f87171]',  tag: 'HIGH',   tagColor: 'text-[#f87171] bg-[rgba(248,113,113,0.1)]' },
    medium: { border: 'border-[rgba(251,191,36,0.25)]',   dot: 'bg-amber-500',  tag: 'MEDIUM', tagColor: 'text-amber-500 bg-amber-500/10' },
    low:    { border: 'border-border',                     dot: 'bg-muted-foreground/30', tag: 'LOW', tagColor: 'text-muted-foreground/50 bg-muted' },
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
            className={cn('px-5 py-4', cfg.border)}
            style={ANALYTIC_PANEL_STYLE}
          >
            <div className="flex items-start gap-4">
              <div className={cn('w-0.5 h-full min-h-[2.5rem] rounded-full shrink-0 self-stretch', cfg.dot)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[13px] font-medium text-foreground leading-snug">{insight.message}</p>
                  <span className={cn('text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full shrink-0 mt-0.5', cfg.tagColor)}>
                    {cfg.tag}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground/50 font-mono mt-1.5">{insight.stat}</p>
                {insight.severity === 'high' && onSimulate && (
                  <button
                    onClick={() => {
                      if (insight.type === 'plan-deviation') onSimulate('No', 'followedPlan');
                      else if (insight.type === 'emotional') onSimulate('1', 'emotionalState');
                    }}
                    className="mt-2.5 flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground hover:text-foreground border border-border hover:border-foreground/25 rounded-full px-3 py-1 transition-all"
                  >
                    <Lightning className="h-2.5 w-2.5" weight="bold" />
                    Simulate removing this from your trading
                  </button>
                )}
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
    green:  { border: 'border-[rgba(16,185,129,0.25)]',  bg: 'bg-[rgba(16,185,129,0.05)]',  iconBg: 'bg-[rgba(16,185,129,0.1)]',  text: 'text-[#10b981]',  label: 'All Clear',   Icon: ShieldCheck },
    yellow: { border: 'border-[rgba(251,191,36,0.25)]',   bg: 'bg-amber-500/5',               iconBg: 'bg-amber-500/10',             text: 'text-amber-500',  label: 'Caution',     Icon: Warning },
    red:    { border: 'border-[rgba(248,113,113,0.25)]',  bg: 'bg-[rgba(248,113,113,0.05)]',  iconBg: 'bg-[rgba(248,113,113,0.1)]', text: 'text-[#f87171]',  label: 'Risk Alert',  Icon: TrendDown },
  }[risk.status];
  const { Icon } = config;

  return (
    <div
      className={cn('relative overflow-hidden px-6 py-5 flex items-center gap-5', config.border, config.bg)}
      style={{
        ...ANALYTIC_PANEL_STYLE,
        background: `
          radial-gradient(circle at 96% 10%, ${risk.status === 'green' ? 'color-mix(in oklab, var(--ef-pos) 18%, transparent)' : risk.status === 'yellow' ? 'color-mix(in oklab, var(--ef-warn) 20%, transparent)' : 'color-mix(in oklab, var(--ef-neg) 18%, transparent)'} 0, transparent 38%),
          linear-gradient(135deg, var(--ef-bg-elev), color-mix(in oklab, var(--ef-bg-elev) 88%, ${risk.status === 'green' ? 'var(--ef-pos-wash)' : risk.status === 'yellow' ? 'var(--ef-warn-wash)' : 'var(--ef-neg-wash)'}) 100%)
        `,
      }}
    >
      <div className={cn('p-3 rounded-xl shrink-0 border border-white/10', config.iconBg)}>
        <Icon className={cn('h-5 w-5', config.text)} weight="regular" />
      </div>
      <div className="flex-1">
        <p className={cn('text-[13px] font-bold mb-0.5', config.text)}>Risk state · {config.label}</p>
        <p className="text-[13px] text-muted-foreground/60">{risk.message}</p>
      </div>
      {risk.drawdownR > 0 && (
        <div className="text-right shrink-0">
          <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider mb-0.5">Drawdown</p>
          <p className={cn('text-[18px] font-bold font-mono', config.text)}>{risk.drawdownR}R</p>
        </div>
      )}
    </div>
  );
}


// ─── Main Page ───
const PerformanceAnalyst = () => {
  const { trades } = useSharedTrades();
  const { accounts } = useSharedAccounts();
  const [selectedAccountId, setSelectedAccountId] = useState<string>('__all__');
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

  const navigate = useNavigate();

  const handleSimulate = (key: string, field: string) => {
    navigate(`/what-if?field=${encodeURIComponent(field)}&key=${encodeURIComponent(key)}`);
  };

  if (trades.length === 0) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="p-4 rounded-2xl bg-muted mb-6 border border-border">
            <ChartBar className="h-10 w-10 text-muted-foreground/40" weight="regular" />
          </div>
          <h1 className="text-[24px] font-bold text-foreground tracking-[-0.5px] mb-2">Performance Analytics</h1>
          <p className="text-[14px] text-muted-foreground/60">Log your first trade to unlock deep analytics.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>

      <PageHeader
        title="Performance Analytics"
        subtitle="Identify leaks, find your edge, simulate improvements"
        mb={28}
        actions={accounts.length > 1 ? (
          <div className="flex items-center gap-2">
            <Funnel className="h-3.5 w-3.5 text-muted-foreground/50" weight="regular" />
            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue placeholder="All Accounts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Accounts</SelectItem>
                {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        ) : undefined}
      />

      {/* ── Risk Status ── */}
      <div className="mb-8">
        <RiskIndicator trades={filteredTrades} />
      </div>

      {/* ── Key Metrics ── */}
      <div className="mb-8">
        <p className="label-text mb-4">Key metrics</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'R-Expectancy',
              value: stats.rExpectancy ? stats.rExpectancy.toFixed(3) : '—',
              sub: 'Expected R per trade',
              tone: stats.rExpectancy > 0 ? 'positive' : stats.rExpectancy < 0 ? 'negative' : 'neutral',
              badge: stats.rExpectancy > 0.5,
            },
            {
              label: 'Avg Win',
              value: stats.avgRWin ? `+${stats.avgRWin}R` : '—',
              sub: 'Average winning trade',
              tone: 'positive',
              badge: false,
            },
            {
              label: 'Avg Loss',
              value: stats.avgRLoss ? `−${stats.avgRLoss}R` : '—',
              sub: 'Average losing trade',
              tone: 'negative',
              badge: false,
            },
            {
              label: 'Max Drawdown',
              value: `$${stats.maxDrawdown}`,
              sub: 'Peak to trough loss',
              tone: stats.maxDrawdown > 0 ? 'warning' : 'neutral',
              badge: false,
            },
          ].map((s, i) => (
            <MetricTile
              key={s.label}
              label={s.label}
              value={s.value}
              sub={s.sub}
              tone={s.tone as 'positive' | 'negative' | 'warning' | 'neutral'}
              badge={s.badge}
              delay={i * 0.06}
            />
          ))}
        </div>
      </div>

      {/* ── Behavioral Patterns ── */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-4 w-4 text-muted-foreground/50" weight="regular" />
          <p className="label-text">Behavioral patterns</p>
          {behavioral.length > 0 && (
            <span className="text-[10px] font-mono text-muted-foreground/40 ml-auto">
              {behavioral.length} signal{behavioral.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <BehavioralAlerts insights={behavioral} tradeCount={filteredTrades.length} onSimulate={handleSimulate} />
      </div>

      {/* ── Expectancy Breakdown ── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <p className="label-text">Expectancy breakdown</p>
          <p className="text-[11px] text-muted-foreground/40">
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

      {/* ── Strategy Optimizer link ── */}
      <div className="px-6 py-5 flex items-center justify-between gap-4" style={ANALYTIC_PANEL_STYLE}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Lightning className="h-4 w-4 text-muted-foreground/50" weight="regular" />
            <p className="text-[13px] font-semibold text-foreground">Strategy optimizer</p>
          </div>
          <p className="text-[12px] text-muted-foreground/60">
            Click the <Lightning className="h-3 w-3 inline" weight="bold" /> icon on any row above to simulate removing that segment — or open the full optimizer to build custom filters.
          </p>
        </div>
        <Link
          to="/what-if"
          className="shrink-0 flex items-center gap-1.5 text-[13px] font-semibold rounded-[24px] px-5 py-2 transition-colors"
          style={{ background: 'var(--ef-ink)', color: 'var(--ef-bg)', whiteSpace: 'nowrap' }}
        >
          Open Optimizer →
        </Link>
      </div>

      {showTour && (
        <OnboardingTour onComplete={() => { setShowTour(false); setSearchParams({}); }} />
      )}

    </AppLayout>
  );
};

export default PerformanceAnalyst;
