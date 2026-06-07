import { useMemo, useState, useCallback, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { HeatMapCalendar } from '@/components/dashboard/HeatMapCalendar';
import { PropFirmCard } from '@/components/dashboard/PropFirmCard';
import { useSharedTrades } from '@/contexts/TradesContext';
import { useSharedAccounts } from '@/contexts/AccountsContext';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { calculateAnalytics, getExpectancyByField, getSessionPerformance, type Analytics } from '@/lib/analytics';
import { useInvalidateSubscription } from '@/hooks/useSubscription';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  ChartBar,
  Clock,
  Funnel,
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
import { cn } from '@/lib/utils';
import type { Trade } from '@/types/trade';

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
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <section
      className={className}
      style={{
        background:
          'linear-gradient(180deg, color-mix(in oklab, var(--ef-bg-elev) 94%, white 3%), var(--ef-bg-elev))',
        border: '1px solid color-mix(in oklab, var(--ef-line) 82%, white 8%)',
        borderRadius: 18,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.035)',
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
}: {
  label: string;
  value: string;
  caption?: string;
  tone?: 'positive' | 'negative' | 'neutral' | 'warning';
}) {
  const color =
    tone === 'positive' ? 'var(--ef-pos)' :
    tone === 'negative' ? 'var(--ef-neg)' :
    tone === 'warning' ? 'var(--ef-warn)' :
    'var(--ef-ink)';

  return (
    <div
      style={{
        minHeight: 94,
        padding: '16px 16px 14px',
        borderRadius: 14,
        background: 'color-mix(in oklab, var(--ef-bg-sunken) 78%, transparent)',
        border: '1px solid color-mix(in oklab, var(--ef-line) 72%, transparent)',
      }}
    >
      <p className="font-mono uppercase" style={{ margin: 0, fontSize: 10, letterSpacing: '0.12em', color: 'var(--ef-ink-4)' }}>
        {label}
      </p>
      <p className="font-mono" style={{ margin: '10px 0 0', fontSize: 26, lineHeight: 1, letterSpacing: '-0.035em', color }}>
        {value}
      </p>
      {caption && (
        <p className="font-mono" style={{ margin: '9px 0 0', fontSize: 11, color: 'var(--ef-ink-4)' }}>
          {caption}
        </p>
      )}
    </div>
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
  const expectancyPerTrade = trades.length > 0 ? stats.netPnl / trades.length : 0;
  const isPositive = netPnl >= 0;
  const lineColor = isPositive ? 'var(--ef-pos)' : 'var(--ef-neg)';

  const yDomain = useMemo(() => {
    if (data.length === 0) return ['auto', 'auto'] as ['auto', 'auto'];
    const values = data.map(d => d.balance);
    const min = Math.min(...values, baselineBalance);
    const max = Math.max(...values, baselineBalance);
    const pad = (max - min) * 0.18 || 100;
    return [Math.floor(min - pad), Math.ceil(max + pad)] as [number, number];
  }, [data, baselineBalance]);

  return (
    <Panel className="overflow-hidden" style={{ minHeight: 520 }}>
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] min-h-[520px]">
        <div style={{ padding: '28px 30px 26px', borderRight: '1px solid var(--ef-line)' }}>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
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
                  fontSize: 'clamp(42px, 5vw, 72px)',
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

          <div style={{ height: 285, marginTop: 24 }}>
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

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-2">
            <MetricPlate
              label="Win rate"
              value={`${stats.winRate.toFixed(1)}%`}
              caption={`${stats.wins} wins · ${stats.losses} losses`}
              tone={stats.winRate >= 50 ? 'positive' : 'negative'}
            />
            <MetricPlate
              label="Profit factor"
              value={stats.profitFactor >= 999 ? '∞' : stats.profitFactor.toFixed(2)}
              caption={stats.profitFactor >= 1.5 ? 'strong edge' : stats.profitFactor >= 1 ? 'marginal edge' : 'below break-even'}
              tone={stats.profitFactor >= 1 ? 'positive' : 'negative'}
            />
            <MetricPlate
              label="Expectancy"
              value={fmtSignedMoney(expectancyPerTrade, 2)}
              caption={`avg R ${stats.rExpectancy >= 0 ? '+' : ''}${stats.rExpectancy.toFixed(2)}`}
              tone={expectancyPerTrade >= 0 ? 'positive' : 'negative'}
            />
            <MetricPlate
              label="Max drawdown"
              value={fmtMoney(stats.maxDrawdown)}
              caption="largest equity pullback"
              tone={stats.maxDrawdown > 0 ? 'warning' : 'neutral'}
            />
          </div>
        </div>

        <RiskCommandPanel trades={trades} stats={stats} />
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
  const lossStreak = stats.currentStreak.type === 'loss' ? stats.currentStreak.count : 0;
  const riskTone = lossStreak >= 2 || todayPnl < 0 ? 'negative' : 'positive';

  return (
    <aside style={{ padding: '26px 22px' }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono uppercase" style={{ margin: 0, fontSize: 10, letterSpacing: '0.14em', color: 'var(--ef-ink-4)' }}>
            Risk state
          </p>
          <h3 style={{ margin: '8px 0 0', fontSize: 24, fontWeight: 600, letterSpacing: '-0.04em', color: 'var(--ef-ink)' }}>
            {riskTone === 'positive' ? 'Clear to execute' : 'Trade smaller'}
          </h3>
        </div>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 14,
            display: 'grid',
            placeItems: 'center',
            background: riskTone === 'positive' ? 'var(--ef-pos-wash)' : 'var(--ef-neg-wash)',
            color: riskTone === 'positive' ? 'var(--ef-pos)' : 'var(--ef-neg)',
          }}
        >
          {riskTone === 'positive' ? <ShieldCheck size={21} weight="fill" /> : <Warning size={21} weight="fill" />}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-6">
        <MetricPlate
          label="Today"
          value={fmtSignedMoney(todayPnl)}
          caption={`${todayTrades.length} trades`}
          tone={todayPnl >= 0 ? 'positive' : 'negative'}
        />
        <MetricPlate
          label="Plan"
          value={planRate === null ? '—' : `${planRate.toFixed(0)}%`}
          caption="followed"
          tone={planRate === null ? 'neutral' : planRate >= 70 ? 'positive' : 'warning'}
        />
      </div>

      <div style={{ marginTop: 22 }}>
        <div className="flex items-center justify-between">
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--ef-ink)' }}>
            Last 5 decisions
          </p>
          <Link to="/journal" className="font-mono" style={{ fontSize: 11, color: 'var(--ef-ink-4)' }}>
            trades →
          </Link>
        </div>
        <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
          {lastFive.map(t => (
            <div
              key={t.id}
              className="grid items-center"
              style={{
                gridTemplateColumns: '28px 1fr auto',
                gap: 10,
                padding: '10px 0',
                borderBottom: '1px dashed var(--ef-line)',
              }}
            >
              <span
                className="font-mono"
                style={{
                  width: 28,
                  height: 28,
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
                <p className="font-mono truncate" style={{ margin: 0, fontSize: 12, color: 'var(--ef-ink)' }}>
                  {t.instrument} · {t.direction === 'long' ? 'Long' : 'Short'}
                </p>
                <p className="truncate" style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--ef-ink-4)' }}>
                  {t.session || t.strategy || t.date}
                </p>
              </div>
              <span
                className="font-mono"
                style={{ fontSize: 12, color: t.pnl >= 0 ? 'var(--ef-pos)' : 'var(--ef-neg)' }}
              >
                {fmtSignedMoney(t.pnl)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </aside>
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
    <Panel style={{ padding: '22px 24px', minHeight: 300 }}>
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
    () => getSessionPerformance(trades).filter(s => s.total > 0).sort((a, b) => Math.abs((b.pnl ?? 0)) - Math.abs((a.pnl ?? 0))).slice(0, 5),
    [trades]
  );
  if (sessions.length === 0) return null;

  const maxAbs = Math.max(...sessions.map(s => Math.abs(s.pnl ?? 0)), 1);

  return (
    <Panel style={{ padding: '22px 24px', minHeight: 300 }}>
      <div className="flex items-start justify-between gap-4" style={{ marginBottom: 18 }}>
        <div>
          <p className="font-mono uppercase" style={{ margin: 0, fontSize: 10, letterSpacing: '0.14em', color: 'var(--ef-ink-4)' }}>
            Timing
          </p>
          <h3 style={{ margin: '7px 0 0', fontSize: 18, fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--ef-ink)' }}>
            Session readout
          </h3>
        </div>
        <Clock size={20} color="var(--ef-ink-4)" weight="regular" />
      </div>

      <div style={{ display: 'grid', gap: 11 }}>
        {sessions.map(s => {
          const pnl = s.pnl ?? 0;
          const pos = pnl >= 0;
          const width = Math.max(6, Math.abs(pnl) / maxAbs * 100);
          return (
            <div key={s.session}>
              <div className="flex items-center justify-between gap-3">
                <span style={{ fontSize: 13, color: 'var(--ef-ink-2)', fontWeight: 500 }}>
                  {s.session}
                </span>
                <span className="font-mono" style={{ fontSize: 12, color: pos ? 'var(--ef-pos)' : 'var(--ef-neg)' }}>
                  {s.winRate.toFixed(0)}% · {fmtSignedMoney(pnl)}
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
                    opacity: 0.9,
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
    <Panel style={{ padding: 0, overflow: 'hidden' }}>
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

  const selectedPropAccount = useMemo(() => {
    if (selectedAccountId === '__all__') return null;
    const acct = accounts.find(a => a.id === selectedAccountId);
    return acct?.type === 'prop' ? acct : null;
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
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Wallet className="h-8 w-8 text-muted-foreground/30 mb-4" weight="regular" />
          <h1 className="text-xl font-semibold mb-1">{getGreeting()}, {profile?.nickname || 'Trader'}</h1>
          <p className="text-xs text-muted-foreground mb-5">Add a trading account to get started.</p>
          <Link to="/accounts">
            <Button size="sm" className="gap-1.5"><Wallet className="h-3.5 w-3.5" weight="regular" /> Add Account</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  // No trades state
  if (trades.length === 0) {
    return (
      <AppLayout>
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
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Topbar */}
      <div
        className="flex flex-col lg:flex-row lg:items-center gap-5"
        style={{ paddingBottom: 18, marginBottom: 18, borderBottom: '1px solid var(--ef-line)' }}
      >
        <div className="flex-1 min-w-0">
          <p className="font-mono uppercase" style={{ margin: 0, fontSize: 10, letterSpacing: '0.16em', color: 'var(--ef-ink-4)' }}>
            EdgeFlow command center
          </p>
          <h1 style={{ margin: '8px 0 0', fontSize: 30, lineHeight: 1.05, fontWeight: 600, letterSpacing: '-0.045em', color: 'var(--ef-ink)' }}>
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

      {/* Prop Firm Challenge Card */}
      {selectedPropAccount && (
        <div style={{ marginBottom: 16 }}>
          <PropFirmCard account={selectedPropAccount} trades={scaledTrades} />
        </div>
      )}

      <div style={{ display: 'grid', gap: 16 }}>
        <EquityCommandPanel
          trades={scaledTrades}
          stats={stats}
          startingBalance={startingBalance}
          balanceAdjustment={balanceAdjustment}
        />

        <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr] gap-4">
          <SessionPerformancePanel trades={scaledTrades} />
          <InstrumentPerformance trades={scaledTrades} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-4">
          <div className="min-w-0">
            <HeatMapCalendar trades={scaledTrades} />
          </div>
          <ExecutionTape trades={scaledTrades} />
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
