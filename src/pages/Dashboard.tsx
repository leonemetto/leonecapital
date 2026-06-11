import { useMemo, useState, useCallback, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { HeatMapCalendar } from '@/components/dashboard/HeatMapCalendar';
import { useSharedTrades } from '@/contexts/TradesContext';
import { useSharedAccounts } from '@/contexts/AccountsContext';
import { useSharedSubscription } from '@/contexts/SubscriptionContext';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { calculateAnalytics, getExpectancyByField, getSessionPerformance, type Analytics } from '@/lib/analytics';
import { useInvalidateSubscription } from '@/hooks/useSubscription';
import { UpgradeModal } from '@/components/billing/UpgradeModal';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Calendar,
  ChartBar,
  Funnel,
  Hash,
  NotePencil,
  Plus,
  ShieldCheck,
  Wallet,
  Warning,
} from '@phosphor-icons/react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Trade } from '@/types/trade';
import type { TradingAccount } from '@/types/account';
import { getAccountTargetProgress } from '@/lib/accountProgress';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const getLocationFromTimezone = () => {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const city = tz.split('/').pop()?.replace(/_/g, ' ') ?? tz;
  return city;
};

const formatTime = () =>
  new Date().toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit', hour12: true });

const fmtMoney = (value: number, maximumFractionDigits = 0) => {
  const sign = value < 0 ? '-' : '';
  return `${sign}$${Math.abs(value).toLocaleString(undefined, { maximumFractionDigits })}`;
};

const fmtSignedMoney = (value: number, maximumFractionDigits = 0) =>
  `${value >= 0 ? '+' : '-'}$${Math.abs(value).toLocaleString(undefined, { maximumFractionDigits })}`;

function buildEquityData(trades: Trade[], startingBalance: number, balanceAdjustment: number) {
  const sorted = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const dayMap = new Map<string, number>();
  for (const t of sorted) {
    const day = t.date.split('T')[0];
    dayMap.set(day, (dayMap.get(day) ?? 0) + t.pnl);
  }

  let balance = startingBalance + balanceAdjustment;
  return Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, pnl]) => {
      balance += pnl;
      return { date, pnl, balance: Number(balance.toFixed(2)) };
    });
}

function Panel({
  children,
  className,
  style,
  quiet = false,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  quiet?: boolean;
}) {
  return (
    <section
      className={className}
      style={{
        background:
          quiet
            ? 'linear-gradient(180deg, color-mix(in oklab, var(--ef-bg-elev) 88%, transparent), color-mix(in oklab, var(--ef-bg) 72%, var(--ef-bg-elev) 28%))'
            : 'linear-gradient(180deg, color-mix(in oklab, var(--ef-bg-elev) 94%, white 3%), var(--ef-bg-elev))',
        border: quiet ? '1px solid color-mix(in oklab, var(--ef-line) 48%, transparent)' : '1px solid color-mix(in oklab, var(--ef-line) 82%, white 8%)',
        borderRadius: 18,
        boxShadow: quiet ? 'none' : 'inset 0 1px 0 rgba(255,255,255,0.035)',
        ...style,
      }}
    >
      {children}
    </section>
  );
}

function MetricPlate({
  label,
  value,
  caption,
  tone = 'neutral',
  compact = false,
}: {
  label: string;
  value: string;
  caption?: string;
  tone?: 'positive' | 'negative' | 'neutral' | 'warning';
  compact?: boolean;
}) {
  const color =
    tone === 'positive' ? 'var(--ef-pos)' :
    tone === 'negative' ? 'var(--ef-neg)' :
    tone === 'warning' ? 'var(--ef-warn)' :
    'var(--ef-ink)';

  return (
    <div
      style={{
        minHeight: compact ? 64 : 94,
        padding: compact ? '11px 12px' : '16px 16px 14px',
        borderRadius: compact ? 12 : 14,
        background: compact
          ? 'linear-gradient(180deg, color-mix(in oklab, var(--ef-bg-sunken) 72%, transparent), color-mix(in oklab, var(--ef-bg) 82%, transparent))'
          : 'color-mix(in oklab, var(--ef-bg-sunken) 78%, transparent)',
        border: compact ? '1px solid color-mix(in oklab, var(--ef-line) 45%, transparent)' : '1px solid color-mix(in oklab, var(--ef-line) 72%, transparent)',
      }}
    >
      <p className="font-mono uppercase" style={{ margin: 0, fontSize: compact ? 9 : 10, letterSpacing: '0.12em', color: 'var(--ef-ink-4)' }}>
        {label}
      </p>
      <p className="font-mono" style={{ margin: compact ? '7px 0 0' : '10px 0 0', fontSize: compact ? 19 : 26, lineHeight: 1, letterSpacing: '-0.035em', color }}>
        {value}
      </p>
      {caption && (
        <p className="font-mono truncate" style={{ margin: compact ? '6px 0 0' : '9px 0 0', fontSize: compact ? 10 : 11, color: 'var(--ef-ink-4)' }}>
          {caption}
        </p>
      )}
    </div>
  );
}

function getRiskSignal(stats: Analytics, todayPnl: number) {
  const lossStreak = stats.currentStreak.type === 'loss' ? stats.currentStreak.count : 0;
  if (lossStreak >= 2) {
    return {
      label: 'Reduce size',
      caption: `${lossStreak}-loss streak detected · Use 50% risk today`,
      tone: 'negative' as const,
    };
  }
  if (todayPnl < 0) {
    return {
      label: 'Reduce size',
      caption: 'Today is red · protect execution quality',
      tone: 'negative' as const,
    };
  }
  return {
    label: 'Clear to execute',
    caption: 'No active warning · stay on plan',
    tone: 'positive' as const,
  };
}

function DashboardKpiStrip({
  trades,
  stats,
}: {
  trades: Trade[];
  stats: Analytics;
}) {
  const expectancy = trades.length > 0 ? stats.netPnl / trades.length : 0;
  const planTrades = trades.filter(t => t.followedPlan !== undefined);
  const planRate = planTrades.length > 0
    ? (planTrades.filter(t => t.followedPlan).length / planTrades.length) * 100
    : null;

  const items = [
    { label: 'Win rate', value: `${stats.winRate.toFixed(1)}%`, caption: `${stats.wins}W · ${stats.losses}L`, tone: stats.winRate >= 50 ? 'positive' : 'negative' },
    { label: 'Profit factor', value: stats.profitFactor >= 999 ? '∞' : stats.profitFactor.toFixed(2), caption: stats.profitFactor >= 1.5 ? 'strong edge' : 'needs work', tone: stats.profitFactor >= 1 ? 'positive' : 'negative' },
    { label: 'Expectancy', value: fmtSignedMoney(expectancy, 2), caption: `avg R ${stats.rExpectancy >= 0 ? '+' : ''}${stats.rExpectancy.toFixed(2)}`, tone: expectancy >= 0 ? 'positive' : 'negative' },
    { label: 'Max drawdown', value: fmtMoney(stats.maxDrawdown), caption: 'largest pullback', tone: stats.maxDrawdown > 0 ? 'warning' : 'neutral' },
    { label: 'Trades logged', value: trades.length.toLocaleString(), caption: `${stats.wins}W · ${stats.losses}L · ${stats.breakevens}BE`, tone: 'neutral' },
    { label: 'Plan followed', value: planRate === null ? '—' : `${planRate.toFixed(0)}%`, caption: planRate === null ? 'not tracked yet' : `${planTrades.length} tracked`, tone: planRate === null ? 'neutral' : planRate >= 70 ? 'positive' : 'warning' },
  ] as const;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-6 gap-2">
      {items.map(item => (
        <MetricPlate
          key={item.label}
          label={item.label}
          value={item.value}
          caption={item.caption}
          tone={item.tone}
          compact
        />
      ))}
    </div>
  );
}

function UpgradePromptStrip({ onUpgrade }: { onUpgrade: () => void }) {
  const { hasProAccess, isTrialing, isTrialExpired, trialEndsAt } = useSharedSubscription();
  if (hasProAccess && !isTrialing) return null;
  if (!isTrialing && !isTrialExpired) return null;

  const daysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / 86_400_000))
    : 0;
  const urgent = isTrialExpired || daysLeft <= 3;

  return (
    <Panel
      quiet={!urgent}
      style={{
        padding: '10px 12px',
        marginBottom: 12,
        borderColor: urgent ? 'var(--ef-warn)' : 'var(--ef-line)',
        background: urgent ? 'var(--ef-warn-wash)' : undefined,
      }}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.35, color: 'var(--ef-ink-2)' }}>
          <span className="font-mono" style={{ color: urgent ? 'var(--ef-warn-high)' : 'var(--ef-ink)' }}>
            {isTrialExpired ? 'Trial ended' : `Trial: ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left`}
          </span>
          {' '}· Upgrade when EdgeFlow earns its place.
        </p>
        <button
          onClick={onUpgrade}
          className="shrink-0 rounded-[24px] px-3.5 py-1.5 text-sm font-semibold transition-colors"
          style={{ background: 'var(--ef-ink)', color: 'var(--ef-bg)' }}
        >
          Upgrade to Pro
        </button>
      </div>
    </Panel>
  );
}

function EquityCommandPanel({
  trades,
  stats,
  startingBalance,
  balanceAdjustment,
}: {
  trades: Trade[];
  stats: Analytics;
  startingBalance: number;
  balanceAdjustment: number;
}) {
  const data = useMemo(
    () => buildEquityData(trades, startingBalance, balanceAdjustment),
    [trades, startingBalance, balanceAdjustment]
  );

  const baselineBalance = startingBalance + balanceAdjustment;
  const currentBalance = data.at(-1)?.balance ?? baselineBalance;
  const netPnl = currentBalance - startingBalance;
  const netPct = startingBalance > 0 ? (netPnl / startingBalance) * 100 : 0;
  const isPositive = netPnl >= 0;
  const lineColor = isPositive ? 'var(--ef-pos)' : 'var(--ef-neg)';
  const avgTrade = trades.length > 0 ? stats.netPnl / trades.length : 0;
  const avgWin = stats.wins > 0 ? trades.filter(t => t.outcome === 'win').reduce((sum, t) => sum + t.pnl, 0) / stats.wins : 0;
  const avgLoss = stats.losses > 0 ? Math.abs(trades.filter(t => t.outcome === 'loss').reduce((sum, t) => sum + t.pnl, 0) / stats.losses) : 0;

  const yDomain = useMemo(() => {
    if (data.length === 0) return ['auto', 'auto'] as ['auto', 'auto'];
    const values = data.map(d => d.balance);
    const min = Math.min(...values, baselineBalance);
    const max = Math.max(...values, baselineBalance);
    const pad = (max - min) * 0.18 || 100;
    return [Math.floor(min - pad), Math.ceil(max + pad)] as [number, number];
  }, [data, baselineBalance]);

  return (
    <Panel className="overflow-hidden h-full" style={{ minHeight: 385 }}>
      <div style={{ padding: '20px 24px 18px' }}>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    background: isPositive ? 'var(--ef-pos)' : 'var(--ef-neg)',
                    boxShadow: `0 0 0 4px ${isPositive ? 'var(--ef-pos-wash)' : 'var(--ef-neg-wash)'}`,
                  }}
                />
                <p className="font-mono uppercase" style={{ margin: 0, fontSize: 10, letterSpacing: '0.16em', color: 'var(--ef-ink-4)' }}>
                  Equity command
                </p>
              </div>
              <h2
                className="font-mono"
                style={{
                  margin: '14px 0 0',
                  fontSize: 'clamp(34px, 3.5vw, 50px)',
                  lineHeight: 0.92,
                  fontWeight: 500,
                  letterSpacing: '-0.065em',
                  color: 'var(--ef-ink)',
                }}
              >
                {fmtMoney(currentBalance)}
              </h2>
              <div className="flex flex-wrap items-center gap-3 mt-4">
                <span
                  className="font-mono inline-flex items-center gap-1.5"
                  style={{ color: isPositive ? 'var(--ef-pos)' : 'var(--ef-neg)', fontSize: 13 }}
                >
                  {isPositive ? <ArrowUp size={13} weight="bold" /> : <ArrowDown size={13} weight="bold" />}
                  {fmtSignedMoney(netPnl)} · {netPct >= 0 ? '+' : ''}{netPct.toFixed(1)}%
                </span>
                <span className="font-mono" style={{ fontSize: 12, color: 'var(--ef-ink-4)' }}>
                  {trades.length} trades · {stats.wins}W/{stats.losses}L
                </span>
              </div>
            </div>

            <Link
              to="/analyst"
              className="inline-flex items-center justify-center gap-2 transition-colors"
              style={{
                height: 38,
                padding: '0 14px',
                borderRadius: 12,
                background: 'var(--ef-ink)',
                color: 'var(--ef-bg)',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Open analytics
              <ArrowUpRight size={14} weight="bold" />
            </Link>
          </div>

          <div style={{ height: 210, marginTop: 14 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 14, right: 8, bottom: 6, left: 0 }}>
                <defs>
                  <linearGradient id="edgeflowEquityFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={lineColor} stopOpacity={0.24} />
                    <stop offset="62%" stopColor={lineColor} stopOpacity={0.06} />
                    <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--ef-line)" strokeDasharray="2 7" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'var(--ef-ink-4)', fontSize: 10, fontFamily: 'var(--ff-mono)' }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  tickFormatter={v => {
                    try { return new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' }); }
                    catch { return v; }
                  }}
                />
                <YAxis
                  domain={yDomain}
                  tick={{ fill: 'var(--ef-ink-4)', fontSize: 10, fontFamily: 'var(--ff-mono)' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => `$${(Number(v) / 1000).toFixed(0)}k`}
                  width={42}
                />
                <ReferenceLine y={baselineBalance} stroke="var(--ef-ink-4)" strokeDasharray="4 5" opacity={0.62} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--ef-ink)',
                    border: 'none',
                    borderRadius: 10,
                    color: 'var(--ef-bg)',
                    fontSize: 11,
                    fontFamily: 'var(--ff-mono)',
                    padding: '9px 12px',
                  }}
                  labelStyle={{ color: 'color-mix(in oklab, var(--ef-bg) 64%, transparent)', marginBottom: 4 }}
                  formatter={(value: number) => [fmtMoney(value), 'Balance']}
                />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke={lineColor}
                  strokeWidth={2}
                  fill="url(#edgeflowEquityFill)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: lineColor, fill: 'var(--ef-bg-elev)' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div
            className="grid grid-cols-2 md:grid-cols-4"
            style={{
              marginTop: 10,
              borderTop: '1px solid color-mix(in oklab, var(--ef-line) 58%, transparent)',
              paddingTop: 12,
              gap: 16,
            }}
          >
            {[
              { label: 'Avg trade', value: fmtSignedMoney(avgTrade, 2), tone: avgTrade >= 0 ? 'var(--ef-pos)' : 'var(--ef-neg)' },
              { label: 'Avg winner', value: fmtMoney(avgWin, 2), tone: 'var(--ef-pos)' },
              { label: 'Avg loser', value: fmtMoney(avgLoss, 2), tone: 'var(--ef-neg)' },
              { label: 'Streak', value: `${stats.currentStreak.count} ${stats.currentStreak.type}`, tone: stats.currentStreak.type === 'win' ? 'var(--ef-pos)' : stats.currentStreak.type === 'loss' ? 'var(--ef-neg)' : 'var(--ef-ink-3)' },
            ].map(item => (
              <div key={item.label}>
                <p className="font-mono uppercase" style={{ margin: 0, fontSize: 9, letterSpacing: '0.14em', color: 'var(--ef-ink-4)' }}>
                  {item.label}
                </p>
                <p className="font-mono" style={{ margin: '6px 0 0', fontSize: 15, lineHeight: 1, color: item.tone }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
      </div>
    </Panel>
  );
}

function RiskCommandPanel({ trades, stats }: { trades: Trade[]; stats: Analytics }) {
  const today = new Date().toISOString().slice(0, 10);
  const todayTrades = useMemo(() => trades.filter(t => t.date === today), [trades, today]);
  const todayPnl = todayTrades.reduce((sum, t) => sum + t.pnl, 0);
  const planTrades = trades.filter(t => t.followedPlan !== undefined);
  const planRate = planTrades.length > 0
    ? (planTrades.filter(t => t.followedPlan).length / planTrades.length) * 100
    : null;
  const lastFive = [...trades].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  const risk = getRiskSignal(stats, todayPnl);
  const riskTone = risk.tone;

  return (
    <Panel quiet style={{ padding: '20px 22px 18px', minHeight: 385 }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono uppercase" style={{ margin: 0, fontSize: 10, letterSpacing: '0.14em', color: 'var(--ef-ink-4)' }}>
            Risk state
          </p>
          <h3 style={{ margin: '7px 0 0', fontSize: 22, fontWeight: 560, letterSpacing: '-0.04em', color: 'var(--ef-ink)' }}>
            {risk.label}
          </h3>
          <p style={{ margin: '7px 0 0', maxWidth: 270, fontSize: 12.5, lineHeight: 1.45, color: 'var(--ef-ink-3)' }}>
            {risk.caption}
          </p>
        </div>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            display: 'grid',
            placeItems: 'center',
            background: riskTone === 'positive' ? 'var(--ef-pos-wash)' : 'var(--ef-neg-wash)',
            color: riskTone === 'positive' ? 'var(--ef-pos)' : 'var(--ef-neg)',
          }}
        >
          {riskTone === 'positive' ? <ShieldCheck size={21} weight="fill" /> : <Warning size={21} weight="fill" />}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-5">
        <MetricPlate
          label="Today"
          value={fmtSignedMoney(todayPnl)}
          caption={`${todayTrades.length} trades`}
          tone={todayPnl >= 0 ? 'positive' : 'negative'}
          compact
        />
        <MetricPlate
          label="Plan"
          value={planRate === null ? '—' : `${planRate.toFixed(0)}%`}
          caption="followed"
          tone={planRate === null ? 'neutral' : planRate >= 70 ? 'positive' : 'warning'}
          compact
        />
      </div>

      <div style={{ marginTop: 18 }}>
        <div className="flex items-center justify-between">
          <p style={{ margin: 0, fontSize: 15, fontWeight: 560, letterSpacing: '-0.02em', color: 'var(--ef-ink)' }}>
            Recent trades
          </p>
          <Link to="/journal" className="font-mono" style={{ fontSize: 11, color: 'var(--ef-ink-4)' }}>
            trades →
          </Link>
        </div>
        <div style={{ display: 'grid', gap: 0, marginTop: 9 }}>
          {lastFive.slice(0, 4).map(t => (
            <div
              key={t.id}
              className="grid items-center"
              style={{
                gridTemplateColumns: '34px minmax(0,1fr) auto',
                gap: 12,
                padding: '9px 0',
                borderTop: '1px solid color-mix(in oklab, var(--ef-line) 50%, transparent)',
              }}
            >
              <span
                className="font-mono"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  background: t.outcome === 'win' ? 'var(--ef-pos-wash)' : t.outcome === 'loss' ? 'var(--ef-neg-wash)' : 'var(--ef-bg-sunken)',
                  color: t.outcome === 'win' ? 'var(--ef-pos)' : t.outcome === 'loss' ? 'var(--ef-neg)' : 'var(--ef-ink-4)',
                }}
              >
                {t.outcome === 'win' ? 'W' : t.outcome === 'loss' ? 'L' : 'BE'}
              </span>
              <div className="min-w-0">
                <p className="font-mono truncate" style={{ margin: 0, fontSize: 13, color: 'var(--ef-ink)' }}>
                  {t.instrument} · {t.direction === 'long' ? 'Long' : 'Short'}
                </p>
                <p className="truncate" style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--ef-ink-4)' }}>
                  {t.session || t.strategy || t.date}
                </p>
              </div>
              <span
                className="font-mono"
                style={{ fontSize: 13, color: t.pnl >= 0 ? 'var(--ef-pos)' : 'var(--ef-neg)' }}
              >
                {fmtSignedMoney(t.pnl)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function ChallengeCard({ account, trades }: { account: TradingAccount; trades: Trade[] }) {
  const challengeSize = account.challengeSize && account.challengeSize > 0
    ? account.challengeSize
    : account.startingBalance;
  const startDate = account.challengeStartDate ?? account.createdAt?.slice(0, 10);
  const progressStats = useMemo(
    () => getAccountTargetProgress(account, trades),
    [account, trades]
  );
  const challengeTrades = progressStats.trades;
  const netPnl = challengeTrades.reduce((sum, trade) => sum + trade.pnl, 0);
  const wins = challengeTrades.filter(trade => trade.outcome === 'win').length;
  const winRate = challengeTrades.length > 0 ? (wins / challengeTrades.length) * 100 : 0;
  const target = progressStats.target;
  const progress = progressStats.progress;
  const start = startDate ? new Date(startDate) : new Date();
  const end = new Date(start);
  end.setDate(end.getDate() + 30);
  const elapsedDays = Math.max(0, Math.ceil((Date.now() - start.getTime()) / 86_400_000));
  const daysLeft = Math.max(0, 30 - elapsedDays);
  const funded = progress >= 100 || netPnl >= target;
  const positive = netPnl >= 0;
  const accent = funded ? 'var(--ef-pos)' : positive ? 'var(--ef-warn)' : 'var(--ef-neg)';
  const wash = funded ? 'var(--ef-pos-wash)' : positive ? 'var(--ef-warn-wash)' : 'var(--ef-neg-wash)';

  return (
    <article
      style={{
        minHeight: 146,
        padding: '18px 20px 16px',
        borderRadius: 18,
        position: 'relative',
        overflow: 'hidden',
        background: `linear-gradient(132deg, color-mix(in oklab, var(--ef-bg-elev) 92%, ${wash} 18%), color-mix(in oklab, var(--ef-bg-elev) 94%, black 4%))`,
        border: '1px solid color-mix(in oklab, var(--ef-line) 80%, white 8%)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 86% 18%, ${wash}, transparent 44%)`,
          opacity: 0.55,
          pointerEvents: 'none',
        }}
      />
      <div style={{ position: 'relative' }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3
                className="font-mono"
                style={{ margin: 0, fontSize: 30, lineHeight: 1, letterSpacing: '-0.06em', color: 'var(--ef-ink)', fontWeight: 500 }}
              >
                {fmtMoney(challengeSize)}
              </h3>
              {account.quantity > 1 && (
                <span className="font-mono" style={{ fontSize: 11, color: 'var(--ef-ink-4)' }}>
                  x{account.quantity}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-3" style={{ color: 'var(--ef-ink-4)', fontSize: 11 }}>
              <Calendar size={13} weight="regular" />
              <span>
                {start.toLocaleDateString('en', { month: 'short', day: 'numeric' })} → {end.toLocaleDateString('en', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="font-mono inline-flex items-center gap-1"
              style={{
                height: 30,
                padding: '0 10px',
                borderRadius: 999,
                background: 'color-mix(in oklab, var(--ef-bg-sunken) 72%, transparent)',
                color: 'var(--ef-ink-3)',
                fontSize: 10,
                border: '1px solid var(--ef-line)',
              }}
            >
              <Hash size={10} weight="bold" />
              {account.id.slice(0, 6)}
            </span>
            <span
              className="font-mono"
              style={{
                height: 30,
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0 11px',
                borderRadius: 999,
                background: wash,
                color: accent,
                fontSize: 10,
                fontWeight: 800,
              }}
            >
              {funded ? 'Funded' : 'Phase 1'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4" style={{ marginTop: 15 }}>
          {[
            { label: 'Profit/Loss', value: fmtSignedMoney(netPnl, 2), color: positive ? 'var(--ef-pos)' : 'var(--ef-neg)' },
            { label: 'Win Rate', value: `${winRate.toFixed(0)}%`, color: 'var(--ef-ink)' },
            { label: 'Days Left', value: String(daysLeft), color: 'var(--ef-ink)' },
          ].map(item => (
            <div key={item.label}>
              <p style={{ margin: 0, color: 'var(--ef-ink-4)', fontSize: 11 }}>{item.label}</p>
              <p className="font-mono" style={{ margin: '6px 0 0', fontSize: 17, lineHeight: 1, color: item.color, letterSpacing: '-0.03em' }}>
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 15 }}>
          <div className="flex items-center justify-between">
            <span style={{ color: 'var(--ef-ink-4)', fontSize: 12 }}>Target achievement</span>
            <span className="font-mono" style={{ color: accent, fontSize: 12, fontWeight: 800 }}>
              {progress.toFixed(1)}%
            </span>
          </div>
          <div
            style={{
              height: 12,
              marginTop: 7,
              borderRadius: 999,
              background: 'repeating-linear-gradient(90deg, color-mix(in oklab, var(--ef-bg-sunken) 78%, transparent) 0 4px, transparent 4px 8px)',
              border: '1px solid color-mix(in oklab, var(--ef-line) 70%, transparent)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                background: `repeating-linear-gradient(90deg, ${accent} 0 4px, transparent 4px 8px)`,
              }}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

function ActiveChallenges({ accounts, trades }: { accounts: TradingAccount[]; trades: Trade[] }) {
  const propAccounts = accounts.filter(account => account.type === 'prop').slice(0, 2);
  if (propAccounts.length === 0) return null;

  return (
    <Panel quiet style={{ padding: '14px 16px 16px', marginBottom: 14 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--ef-ink-2)' }}>
          Active challenges
        </h2>
        <Link to="/accounts" className="font-mono inline-flex items-center gap-1" style={{ fontSize: 11, color: 'var(--ef-ink-3)' }}>
          View all
          <ArrowUpRight size={12} weight="bold" />
        </Link>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        {propAccounts.map(account => (
          <ChallengeCard key={account.id} account={account} trades={trades} />
        ))}
      </div>
    </Panel>
  );
}

function InstrumentPerformance({ trades }: { trades: { instrument: string; pnl: number; outcome: string }[] }) {
  const pairs = useMemo(() => {
    if (trades.length === 0) return [];
    return getExpectancyByField(trades as any, 'instrument')
      .filter(p => p.trades >= 2)
      .slice(0, 6);
  }, [trades]);

  if (pairs.length === 0) return null;

  const maxAbs = Math.max(...pairs.map(p => Math.abs(p.expectancy)), 1);

  return (
    <Panel quiet style={{ padding: '22px 24px', minHeight: 300 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <p className="font-mono uppercase" style={{ margin: 0, fontSize: 10, letterSpacing: '0.14em', color: 'var(--ef-ink-4)' }}>
            Market selection
          </p>
          <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--ef-ink)', marginTop: 7 }}>
            Instrument edge
          </div>
          <div className="font-mono" style={{ fontSize: 12, color: 'var(--ef-ink-4)', marginTop: 2 }}>
            expectancy per trade
          </div>
        </div>
        <Link
          to="/analyst"
          className="font-mono hover:text-[var(--ef-ink)] transition-colors"
          style={{ fontSize: 11, color: 'var(--ef-ink-3)' }}
        >
          all →
        </Link>
      </div>

      <div className="flex flex-col">
        {pairs.map(pair => {
          const barPct = Math.abs(pair.expectancy) / maxAbs * 48;
          const pos = pair.pnl >= 0;
          return (
            <div key={pair.key} className="flex items-center gap-3" style={{ padding: '10px 0', fontSize: 12.5, borderTop: '1px solid var(--ef-line)' }}>
              <div className="font-mono shrink-0" style={{ width: 72, color: 'var(--ef-ink-2)', fontWeight: 600 }}>
                {pair.key}
              </div>
              <div
                className="flex-1 relative"
                style={{ height: 8, borderRadius: 99, background: 'var(--ef-bg-sunken)', overflow: 'visible' }}
              >
                <div style={{
                  position: 'absolute', left: '50%', top: -2,
                  width: 1, height: 12, background: 'var(--ef-line)',
                }} />
                <div style={{
                  position: 'absolute', top: 0, bottom: 0,
                  borderRadius: 99,
                  [pos ? 'left' : 'right']: '50%',
                  width: barPct + '%',
                  background: pos ? 'var(--ef-pos)' : 'var(--ef-neg)',
                }} />
              </div>
              <div
                className="font-mono shrink-0 text-right"
                style={{
                  width: 56, fontSize: 11.5,
                  color: pos ? 'var(--ef-pos)' : 'var(--ef-neg)',
                }}
              >
                {pos ? '+' : ''}${pair.pnl.toFixed(0)}
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function SessionPerformancePanel({ trades }: { trades: Trade[] }) {
  const sessions = useMemo(
    () => getSessionPerformance(trades)
      .filter(s => s.total > 0)
      .sort((a, b) => Math.abs((b.pnl ?? 0)) - Math.abs((a.pnl ?? 0)))
      .slice(0, 5),
    [trades]
  );
  if (sessions.length === 0) return null;

  const maxAbs = Math.max(...sessions.map(s => Math.abs(s.pnl ?? 0)), 1);

  return (
    <Panel quiet style={{ padding: '20px 24px', minHeight: 270 }}>
      <div className="flex items-start justify-between gap-4" style={{ marginBottom: 16 }}>
        <div>
          <p className="font-mono uppercase" style={{ margin: 0, fontSize: 10, letterSpacing: '0.14em', color: 'var(--ef-ink-4)' }}>
            Timing
          </p>
          <h3 style={{ margin: '7px 0 0', fontSize: 18, fontWeight: 560, letterSpacing: '-0.03em', color: 'var(--ef-ink)' }}>
            Session performance
          </h3>
        </div>
        <Link to="/analyst" className="font-mono" style={{ fontSize: 11, color: 'var(--ef-ink-4)' }}>
          all →
        </Link>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {sessions.map(session => {
          const pnl = session.pnl ?? 0;
          const pos = pnl >= 0;
          const width = Math.max(7, Math.abs(pnl) / maxAbs * 100);
          return (
            <div key={session.session}>
              <div className="flex items-center justify-between gap-3">
                <span className="truncate" style={{ fontSize: 13, color: 'var(--ef-ink-2)' }}>
                  {session.session}
                </span>
                <span className="font-mono" style={{ fontSize: 12, color: pos ? 'var(--ef-pos)' : 'var(--ef-neg)' }}>
                  {session.winRate.toFixed(0)}% · {fmtSignedMoney(pnl)}
                </span>
              </div>
              <div style={{ height: 8, borderRadius: 99, background: 'var(--ef-bg-sunken)', marginTop: 8, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${width}%`,
                    marginLeft: pos ? 0 : `${100 - width}%`,
                    borderRadius: 99,
                    background: pos ? 'var(--ef-pos)' : 'var(--ef-neg)',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function ExecutionTape({ trades }: { trades: Trade[] }) {
  const recent = useMemo(
    () => [...trades].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 9),
    [trades]
  );

  return (
    <Panel quiet style={{ padding: 0, overflow: 'hidden' }}>
      <div className="flex items-center justify-between" style={{ padding: '20px 24px 14px', borderBottom: '1px solid var(--ef-line)' }}>
        <div>
          <p className="font-mono uppercase" style={{ margin: 0, fontSize: 10, letterSpacing: '0.14em', color: 'var(--ef-ink-4)' }}>
            Execution tape
          </p>
          <h3 style={{ margin: '7px 0 0', fontSize: 18, fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--ef-ink)' }}>
            Recent trades
          </h3>
        </div>
        <Link to="/journal" className="font-mono" style={{ color: 'var(--ef-ink-4)', fontSize: 11 }}>
          open journal →
        </Link>
      </div>

      <div>
        {recent.map((trade, index) => (
          <div
            key={trade.id}
            className="grid items-center"
            style={{
              gridTemplateColumns: '42px minmax(110px,1.1fr) minmax(90px,0.8fr) 72px 72px',
              gap: 14,
              minHeight: 58,
              padding: '0 24px',
              borderTop: index === 0 ? 'none' : '1px solid var(--ef-line)',
            }}
          >
            <span
              className="font-mono"
              style={{
                width: 30,
                height: 30,
                borderRadius: 9,
                display: 'grid',
                placeItems: 'center',
                fontWeight: 800,
                fontSize: 11,
                background: trade.outcome === 'win' ? 'var(--ef-pos-wash)' : trade.outcome === 'loss' ? 'var(--ef-neg-wash)' : 'var(--ef-bg-sunken)',
                color: trade.outcome === 'win' ? 'var(--ef-pos)' : trade.outcome === 'loss' ? 'var(--ef-neg)' : 'var(--ef-ink-4)',
              }}
            >
              {trade.outcome === 'win' ? 'W' : trade.outcome === 'loss' ? 'L' : 'BE'}
            </span>
            <div className="min-w-0">
              <p className="font-mono truncate" style={{ margin: 0, color: 'var(--ef-ink)', fontSize: 13, fontWeight: 650 }}>
                {trade.instrument}
              </p>
              <p className="truncate" style={{ margin: '4px 0 0', color: 'var(--ef-ink-4)', fontSize: 11 }}>
                {trade.strategy || 'No strategy'}
              </p>
            </div>
            <span style={{ color: 'var(--ef-ink-3)', fontSize: 12 }} className="truncate">
              {trade.session || trade.date}
            </span>
            <span className="font-mono" style={{ color: trade.direction === 'long' ? 'var(--ef-pos)' : 'var(--ef-neg)', fontSize: 12 }}>
              {trade.direction === 'long' ? 'Long' : 'Short'}
            </span>
            <span className="font-mono text-right" style={{ color: trade.pnl >= 0 ? 'var(--ef-pos)' : 'var(--ef-neg)', fontSize: 12, fontWeight: 650 }}>
              {fmtSignedMoney(trade.pnl)}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

const Dashboard = () => {
  const { trades, addTrade, isLoading: tradesLoading } = useSharedTrades();
  const { accounts } = useSharedAccounts();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const invalidateSubscription = useInvalidateSubscription();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  // Invalidate subscription cache when returning from payment — Lemon Squeezy
  // redirects to /dashboard?payment=success after checkout completes
  useEffect(() => {
    if (searchParams.get('payment') === 'success') {
      invalidateSubscription();
      toast.success('Payment successful! Your plan has been upgraded.');
      setSearchParams({}, { replace: true });
    }
  }, []);

  const [selectedAccountId, setSelectedAccountId] = useState<string>(() =>
    localStorage.getItem('dashboard_account_filter') ?? '__all__'
  );

  // Reset stale filter — if the saved account ID no longer exists in the user's
  // accounts (e.g. account was deleted, or they signed into a fresh account),
  // the filter would silently hide every trade. Fall back to "All Accounts".
  useEffect(() => {
    if (selectedAccountId === '__all__') return;
    if (accounts.length === 0) return; // still loading
    if (!accounts.some(a => a.id === selectedAccountId)) {
      setSelectedAccountId('__all__');
      localStorage.setItem('dashboard_account_filter', '__all__');
    }
  }, [accounts, selectedAccountId]);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [currentTime, setCurrentTime] = useState(formatTime);

  useEffect(() => {
    const id = setInterval(() => setCurrentTime(formatTime()), 60_000);
    return () => clearInterval(id);
  }, []);

  const filteredTrades = useMemo(
    () => selectedAccountId === '__all__' ? trades : trades.filter(t => t.accountId === selectedAccountId),
    [trades, selectedAccountId]
  );

  // Mirror quantity per account. A trader running N identical funded accounts
  // sets one account row to quantity = N instead of creating N separate rows.
  const mirrorQty = (a?: { quantity?: number }) => (a && a.quantity && a.quantity > 0 ? a.quantity : 1);
  const accountQuantity = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of accounts) m.set(a.id, mirrorQty(a));
    return m;
  }, [accounts]);

  // Scale every dollar figure on the dashboard to the combined total across
  // mirrored accounts: a trade logged on a quantity = 3 account contributes 3×
  // its P&L. We only touch the pnl field — counts, win rate, R-multiple and all
  // ratios stay single-account because we never duplicate rows or scale rMultiple.
  const scaledTrades = useMemo(() => {
    const hasMirror = accounts.some(a => mirrorQty(a) > 1);
    if (!hasMirror) return filteredTrades;
    return filteredTrades.map(t => {
      const q = t.accountId ? (accountQuantity.get(t.accountId) ?? 1) : 1;
      return q === 1 ? t : { ...t, pnl: t.pnl * q };
    });
  }, [filteredTrades, accountQuantity, accounts]);

  const stats = useMemo(() => calculateAnalytics(scaledTrades), [scaledTrades]);

  const startingBalance = useMemo(() => {
    const base = (a: typeof accounts[number]) => (a.currentBalance ?? 0) * mirrorQty(a);
    if (selectedAccountId === '__all__') return accounts.reduce((sum, a) => sum + base(a), 0);
    const a = accounts.find(x => x.id === selectedAccountId);
    return a ? base(a) : 0;
  }, [accounts, selectedAccountId]);

  const balanceAdjustment = useMemo(() => {
    const adj = (a: typeof accounts[number]) => (a.balanceAdjustment ?? 0) * mirrorQty(a);
    if (selectedAccountId === '__all__') return accounts.reduce((sum, a) => sum + adj(a), 0);
    const a = accounts.find(x => x.id === selectedAccountId);
    return a ? adj(a) : 0;
  }, [accounts, selectedAccountId]);

  const handleDailyReview = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayTrades = trades.filter(t => t.date === today);
    if (todayTrades.length === 0) {
      navigate('/ai', { state: { prompt: "I haven't logged any trades today yet. What should I focus on based on my overall performance?" } });
      return;
    }
    const wins = todayTrades.filter(t => t.outcome === 'win').length;
    const losses = todayTrades.filter(t => t.outcome === 'loss').length;
    const be = todayTrades.filter(t => t.outcome === 'breakeven').length;
    const totalPnl = todayTrades.reduce((sum, t) => sum + t.pnl, 0);
    const summary = [
      `TODAY'S TRADES (${today}):`,
      `Total: ${todayTrades.length} | Wins: ${wins} | Losses: ${losses} | BE: ${be}`,
      `P&L: $${totalPnl.toFixed(2)}`,
      ...todayTrades.map(t => `  ${t.instrument} ${t.direction} — ${t.outcome.toUpperCase()} — $${t.pnl.toFixed(2)}`)
    ].join('\n');
    navigate('/ai', { state: { prompt: "Give me a daily review of my trading today.", extraContext: summary } });
  };

  const loadDemoData = useCallback(async () => {
    const accountId = accounts[0]?.id;
    if (!accountId) return;
    setLoadingDemo(true);
    try {
      const today = new Date();
      const demoTrades = [
        { date: new Date(today.getTime() - 6 * 86400000).toISOString().slice(0, 10), instrument: 'XAUUSD', direction: 'long' as const, strategy: 'CISD', session: 'London', outcome: 'win' as const, pnl: 320, rMultiple: 2.5, riskPercent: 1, htfBias: 'Bullish', emotionalState: 4, confidenceLevel: 5, followedPlan: true, notes: 'Clean CISD setup on gold.', accountId, timeInTrade: 45 },
        { date: new Date(today.getTime() - 5 * 86400000).toISOString().slice(0, 10), instrument: 'NAS100', direction: 'short' as const, strategy: 'IFVG', session: 'New York', outcome: 'loss' as const, pnl: -150, rMultiple: -1, riskPercent: 1, htfBias: 'Bearish', emotionalState: 2, confidenceLevel: 3, followedPlan: false, notes: 'Entered too early.', accountId, timeInTrade: 20 },
        { date: new Date(today.getTime() - 4 * 86400000).toISOString().slice(0, 10), instrument: 'EUR/USD', direction: 'long' as const, strategy: 'Both', session: 'London/NY Overlap', outcome: 'win' as const, pnl: 210, rMultiple: 1.8, riskPercent: 1.5, htfBias: 'Bullish', emotionalState: 4, confidenceLevel: 4, followedPlan: true, notes: 'Solid overlap session.', accountId, timeInTrade: 60 },
        { date: new Date(today.getTime() - 3 * 86400000).toISOString().slice(0, 10), instrument: 'GBP/USD', direction: 'short' as const, strategy: 'CISD', session: 'London', outcome: 'breakeven' as const, pnl: 0, rMultiple: 0, riskPercent: 1, htfBias: 'Neutral', emotionalState: 3, confidenceLevel: 3, followedPlan: true, notes: 'BE stop.', accountId, timeInTrade: 35 },
        { date: new Date(today.getTime() - 2 * 86400000).toISOString().slice(0, 10), instrument: 'XAUUSD', direction: 'long' as const, strategy: 'IFVG', session: 'New York', outcome: 'win' as const, pnl: 480, rMultiple: 3.2, riskPercent: 1, htfBias: 'Bullish', emotionalState: 5, confidenceLevel: 5, followedPlan: true, notes: 'Perfect IFVG entry.', accountId, timeInTrade: 90 },
        { date: new Date(today.getTime() - 1 * 86400000).toISOString().slice(0, 10), instrument: 'US30', direction: 'short' as const, strategy: 'CISD', session: 'New York', outcome: 'loss' as const, pnl: -130, rMultiple: -0.9, riskPercent: 1, htfBias: 'Bearish', emotionalState: 2, confidenceLevel: 2, followedPlan: false, notes: 'Revenge trade.', accountId, timeInTrade: 15 },
        { date: today.toISOString().slice(0, 10), instrument: 'BTC/USD', direction: 'long' as const, strategy: 'Both', session: 'Asian', outcome: 'win' as const, pnl: 275, rMultiple: 2.0, riskPercent: 1.5, htfBias: 'Bullish', emotionalState: 4, confidenceLevel: 4, followedPlan: true, notes: 'Asian session breakout.', accountId, timeInTrade: 55 },
      ];
      for (const t of demoTrades) await addTrade(t);
      toast.success('Demo data loaded — 7 sample trades added!');
    } catch (e: any) {
      toast.error(e.message || 'Failed to load demo data');
    } finally {
      setLoadingDemo(false);
    }
  }, [accounts, addTrade]);

  // Loading skeleton
  if (tradesLoading) {
    return (
      <AppLayout>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Header skeleton */}
          <div style={{ height: 28, width: 200, borderRadius: 8, background: 'var(--ef-bg-elev)', border: '1px solid var(--ef-line)' }} />
          {/* Stat bar skeleton */}
          <div className="grid grid-cols-3 md:grid-cols-5 gap-[10px]">
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ height: 72, borderRadius: 12, background: 'var(--ef-bg-elev)', border: '1px solid var(--ef-line)' }} />
            ))}
          </div>
          {/* Chart skeleton */}
          <div style={{ height: 220, borderRadius: 14, background: 'var(--ef-bg-elev)', border: '1px solid var(--ef-line)' }} />
        </div>
      </AppLayout>
    );
  }

  // No accounts state
  if (accounts.length === 0) {
    return (
      <AppLayout>
        <UpgradePromptStrip onUpgrade={() => setUpgradeOpen(true)} />
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Wallet className="h-8 w-8 text-muted-foreground/30 mb-4" weight="regular" />
          <h1 className="text-xl font-semibold mb-1">{getGreeting()}, {profile?.nickname || 'Trader'}</h1>
          <p className="text-xs text-muted-foreground mb-5">Add a trading account to get started.</p>
          <Link to="/accounts">
            <Button size="sm" className="gap-1.5"><Wallet className="h-3.5 w-3.5" weight="regular" /> Add Account</Button>
          </Link>
        </div>
        <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
      </AppLayout>
    );
  }

  // No trades state
  if (trades.length === 0) {
    return (
      <AppLayout>
        <UpgradePromptStrip onUpgrade={() => setUpgradeOpen(true)} />
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <ChartBar className="h-8 w-8 text-muted-foreground/30 mb-4" weight="regular" />
          <h1 className="text-xl font-semibold mb-1">{getGreeting()}, {profile?.nickname || 'Trader'}</h1>
          <p className="text-xs text-muted-foreground mb-5">Log your first trade to unlock analytics.</p>
          <div className="flex gap-3">
            <Link to="/add-trade">
              <Button size="sm" className="gap-1.5 rounded-[24px]">
                <Plus className="h-3.5 w-3.5" weight="bold" /> Log First Trade
              </Button>
            </Link>
            <Button size="sm" variant="outline" className="gap-1.5 rounded-full" onClick={loadDemoData} disabled={loadingDemo}>
              <ChartBar className="h-3.5 w-3.5" weight="regular" /> {loadingDemo ? 'Loading...' : 'Load Demo Data'}
            </Button>
          </div>
        </div>
        <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Topbar */}
      <div
        className="flex flex-col lg:flex-row lg:items-center gap-4"
        style={{ paddingBottom: 14, marginBottom: 12, borderBottom: '1px solid var(--ef-line)' }}
      >
        <div className="flex-1 min-w-0">
          <p className="font-mono uppercase" style={{ margin: 0, fontSize: 10, letterSpacing: '0.16em', color: 'var(--ef-ink-4)' }}>
            EdgeFlow command center
          </p>
          <h1 style={{ margin: '7px 0 0', fontSize: 28, lineHeight: 1.05, fontWeight: 600, letterSpacing: '-0.045em', color: 'var(--ef-ink)' }}>
            {getGreeting()}, {profile?.nickname || 'Trader'}.
          </h1>
          <div className="font-mono" style={{ fontSize: 12.5, color: 'var(--ef-ink-3)', marginTop: 2 }}>
            {getLocationFromTimezone()} · {currentTime} · {filteredTrades.length} trades logged
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {accounts.length > 1 && (
            <Select
              value={selectedAccountId}
              onValueChange={(v) => { setSelectedAccountId(v); localStorage.setItem('dashboard_account_filter', v); }}
            >
              <SelectTrigger
                className="h-[38px] text-xs font-mono border-border rounded-[12px]"
                style={{ width: 150, background: 'var(--ef-bg-elev)', fontSize: 12 }}
              >
                <Funnel className="h-3 w-3 mr-1 text-muted-foreground/50" weight="regular" />
                <SelectValue placeholder="All Accounts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Accounts</SelectItem>
                {accounts.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <button
            onClick={handleDailyReview}
            className="flex items-center gap-1.5 outline-none transition-colors"
            style={{
              height: 38, padding: '0 13px', borderRadius: 12,
              background: 'var(--ef-bg-elev)', border: '1px solid var(--ef-line)',
              fontSize: 13, fontWeight: 500, color: 'var(--ef-ink-2)',
            }}
          >
            <NotePencil className="h-3.5 w-3.5" weight="regular" />
            <span className="hidden sm:inline">Daily Review</span>
          </button>

          <Link
            to="/add-trade"
            className="flex items-center gap-1.5 outline-none transition-colors"
            style={{
              height: 38, padding: '0 14px', borderRadius: 12,
              background: 'var(--ef-ink)', color: 'var(--ef-bg)',
              fontSize: 13, fontWeight: 650,
              border: '1px solid var(--ef-ink)',
            }}
          >
            <Plus className="h-3.5 w-3.5" weight="bold" />
            <span className="hidden sm:inline">Log trade</span>
          </Link>
        </div>
      </div>

      <UpgradePromptStrip onUpgrade={() => setUpgradeOpen(true)} />

      <DashboardKpiStrip
        trades={scaledTrades}
        stats={stats}
      />

      <div style={{ display: 'grid', gap: 14, marginTop: 12 }}>
        <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_390px] gap-4 items-stretch">
          <EquityCommandPanel
            trades={scaledTrades}
            stats={stats}
            startingBalance={startingBalance}
            balanceAdjustment={balanceAdjustment}
          />
          <RiskCommandPanel trades={scaledTrades} stats={stats} />
        </div>

        <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,0.9fr)_minmax(300px,0.72fr)_minmax(360px,0.9fr)] gap-4">
          <div className="min-w-0">
            <HeatMapCalendar trades={scaledTrades} />
          </div>
          <SessionPerformancePanel trades={scaledTrades} />
          <InstrumentPerformance trades={scaledTrades} />
        </div>

        <ActiveChallenges accounts={accounts} trades={trades} />
      </div>
      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </AppLayout>
  );
};

export default Dashboard;
