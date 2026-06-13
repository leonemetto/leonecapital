import { useState, useMemo } from 'react';
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine, CartesianGrid,
} from 'recharts';
import { cn, parseLocalDate } from '@/lib/utils';
import { Trade } from '@/types/trade';
import { Link } from 'react-router-dom';
import { format, startOfWeek, startOfMonth } from 'date-fns';

type Period = 'daily' | 'weekly' | 'monthly';

interface Props {
  trades: Trade[];
  startingBalance?: number;
  balanceAdjustment?: number;
  projectedGain?: number;
}

export function PremiumEquityCurve({ trades, startingBalance = 0, balanceAdjustment = 0, projectedGain = 0 }: Props) {
  const [period, setPeriod] = useState<Period>('daily');

  const data = useMemo(() => {
    const sorted = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (sorted.length === 0) return [];

    if (period === 'daily') {
      let bal = startingBalance + balanceAdjustment;
      const dayMap = new Map<string, number>();
      for (const t of sorted) {
        const d = t.date.split('T')[0];
        dayMap.set(d, (dayMap.get(d) || 0) + t.pnl);
      }
      return Array.from(dayMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, pnl]) => {
          bal += pnl;
          return { date, balance: Number(bal.toFixed(2)), pnl };
        });
    }

    const groupFn = period === 'weekly'
      ? (d: string) => format(startOfWeek(new Date(d), { weekStartsOn: 1 }), 'yyyy-MM-dd')
      : (d: string) => format(startOfMonth(new Date(d)), 'yyyy-MM');

    const groups = new Map<string, number>();
    for (const t of sorted) {
      const key = groupFn(t.date);
      groups.set(key, (groups.get(key) || 0) + t.pnl);
    }

    let bal = startingBalance + balanceAdjustment;
    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, pnl]) => {
        bal += pnl;
        return { date, balance: Number(bal.toFixed(2)), pnl };
      });
  }, [trades, period, startingBalance, balanceAdjustment]);

  const baselineBalance = startingBalance + balanceAdjustment;
  const lastBal = data.length > 0 ? data[data.length - 1].balance : baselineBalance;
  const netPnl = lastBal - startingBalance;
  const netPct = startingBalance > 0 ? (netPnl / startingBalance) * 100 : 0;
  const isPositive = netPnl >= 0;
  const lineColor = isPositive ? 'var(--ef-pos)' : 'var(--ef-neg)';
  const lineHex = isPositive ? 'oklch(0.55 0.17 155)' : 'oklch(0.52 0.18 25)';

  // Projected data — linearly distribute the gain over time
  const projectedData = useMemo(() => {
    if (projectedGain <= 0 || data.length === 0) return null;
    return data.map((pt, i) => ({
      ...pt,
      projected: pt.balance + (projectedGain * (i / (data.length - 1))),
    }));
  }, [data, projectedGain]);
  const isEmpty = data.length === 0;

  const yDomain = useMemo(() => {
    if (data.length === 0) return ['auto', 'auto'] as ['auto', 'auto'];
    const vals = data.map(d => d.balance);
    const projMax = projectedGain > 0 ? (lastBal + projectedGain) : 0;
    const min = Math.min(...vals, baselineBalance);
    const max = Math.max(...vals, baselineBalance, projMax);
    const pad = (max - min) * 0.15 || 50;
    return [Math.floor(min - pad), Math.ceil(max + pad)] as [number, number];
  }, [data, baselineBalance, projectedGain, lastBal]);

  const periods: { key: Period; label: string }[] = [
    { key: 'daily', label: '30D' },
    { key: 'weekly', label: '90D' },
    { key: 'monthly', label: 'All' },
  ];

  return (
    <div className="rounded-[14px] border border-border bg-card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Card header */}
      <div
        className="flex items-center justify-between"
        style={{ padding: '20px 20px 0 20px' }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.01em', color: 'var(--ef-ink)' }}>
            Equity curve
          </div>
          <div
            className="font-mono"
            style={{ fontSize: 12, color: 'var(--ef-ink-3)', marginTop: 2 }}
          >
            {period} · ${baselineBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })} start
          </div>
        </div>

        {/* Segmented control */}
        <div
          className="flex"
          style={{ background: 'var(--ef-bg-sunken)', borderRadius: 8, padding: 3, gap: 2 }}
        >
          {periods.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className="transition-all outline-none"
              style={{
                padding: '5px 11px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: period === p.key ? 500 : 400,
                color: period === p.key ? 'var(--ef-ink)' : 'var(--ef-ink-3)',
                background: period === p.key ? 'var(--ef-bg-elev)' : 'transparent',
                boxShadow: period === p.key ? '0 1px 0 rgba(14,14,12,0.04)' : 'none',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Equity meta */}
      {!isEmpty && (
        <div
          className="flex items-baseline gap-4"
          style={{ padding: '12px 20px 4px' }}
        >
          <div
            className="font-mono"
            style={{ fontSize: 32, fontWeight: 500, letterSpacing: '-0.03em', color: 'var(--ef-ink)', lineHeight: 1 }}
          >
            ${lastBal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div
            className="font-mono"
            style={{
              fontSize: 12,
              color: isPositive ? 'var(--ef-pos)' : 'var(--ef-neg)',
            }}
          >
            {netPnl >= 0 ? '+' : '−'}${Math.abs(netPnl).toLocaleString(undefined, { maximumFractionDigits: 0 })} ({netPct >= 0 ? '+' : ''}{netPct.toFixed(1)}%)
          </div>
          {projectedGain > 0 && (
            <span style={{
              marginLeft: 'auto',
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '3px 8px', borderRadius: 999,
              background: 'var(--ef-pos-wash)',
              color: 'var(--ef-pos)',
              fontSize: 11, fontFamily: 'var(--ff-mono)',
            }}>
              projected +${projectedGain.toLocaleString(undefined, { maximumFractionDigits: 0 })} w/o leaks
            </span>
          )}
        </div>
      )}

      {/* Chart */}
      <div style={{ height: 200, padding: '0 4px 0 0' }}>
        {isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center gap-3">
            <svg width="100%" height="60" className="opacity-20">
              <line x1="0" y1="30" x2="100%" y2="30" stroke="currentColor" strokeDasharray="6 4" strokeWidth="1" />
            </svg>
            <span style={{ fontSize: 13, color: 'var(--ef-ink-4)' }}>Your equity curve will appear here</span>
            <Link to="/add-trade" className="text-xs font-semibold px-4 py-2 rounded-full transition-colors"
              style={{ background: 'var(--ef-pos)', color: 'white' }}>
              Log Trade →
            </Link>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={projectedData ?? data} margin={{ left: 0, right: 8, top: 8, bottom: 4 }}>
              <defs>
                <linearGradient id="eqPos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={lineHex} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={lineHex} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="eqNeg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={lineHex} stopOpacity={0} />
                  <stop offset="100%" stopColor={lineHex} stopOpacity={0.14} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="2 4"
                stroke="var(--ef-line)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fill: 'var(--ef-ink-4)', fontSize: 10, fontFamily: 'var(--ff-mono)' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={v => {
                  try { return parseLocalDate(v).toLocaleDateString('en', { month: 'short', day: 'numeric' }); }
                  catch { return v; }
                }}
                interval="preserveStartEnd"
              />
              <YAxis
                orientation="left"
                domain={yDomain}
                tick={{ fill: 'var(--ef-ink-4)', fontSize: 10, fontFamily: 'var(--ff-mono)' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
                width={40}
              />
              <ReferenceLine
                y={baselineBalance}
                stroke="var(--ef-ink-3)"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                opacity={0.7}
                label={{
                  value: `start · $${baselineBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                  position: 'insideTopRight',
                  style: {
                    fill: 'var(--ef-ink-4)',
                    fontSize: 9.5,
                    fontFamily: 'var(--ff-mono)',
                  },
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--ef-ink)',
                  border: 'none',
                  borderRadius: 8,
                  color: 'var(--ef-bg)',
                  fontSize: 11,
                  fontFamily: 'var(--ff-mono)',
                  padding: '8px 12px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
                }}
                labelStyle={{ opacity: 0.6, fontSize: 10, marginBottom: 2 }}
                formatter={(value: number) => [`$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, 'Balance']}
              />
              {projectedData && (
                <Area
                  type="monotone"
                  dataKey="projected"
                  stroke="oklch(0.55 0.17 155)"
                  strokeWidth={1.6}
                  strokeDasharray="4 3"
                  fill="url(#eqPos)"
                  fillOpacity={0.5}
                  dot={false}
                  activeDot={false}
                  baseValue={startingBalance}
                />
              )}
              <Area
                type="monotone"
                dataKey="balance"
                stroke={projectedData ? 'var(--ef-ink-4)' : lineHex}
                strokeWidth={projectedData ? 1.2 : 1.6}
                fill={projectedData ? 'none' : (isPositive ? 'url(#eqPos)' : 'url(#eqNeg)')}
                dot={false}
                activeDot={{ r: 4, fill: 'var(--ef-bg-elev)', stroke: lineHex, strokeWidth: 2 }}
                baseValue={startingBalance}
                opacity={projectedData ? 0.45 : 1}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
