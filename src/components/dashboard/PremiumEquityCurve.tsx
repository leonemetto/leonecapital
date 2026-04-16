import { useState, useMemo } from 'react';
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine, CartesianGrid,
} from 'recharts';
import { cn } from '@/lib/utils';
import { Trade } from '@/types/trade';
import { Link } from 'react-router-dom';
import { format, startOfWeek, startOfMonth } from 'date-fns';

type Period = 'daily' | 'weekly' | 'monthly';

interface Props {
  trades: Trade[];
  startingBalance?: number;
}

export function PremiumEquityCurve({ trades, startingBalance = 0 }: Props) {
  const [period, setPeriod] = useState<Period>('daily');

  const data = useMemo(() => {
    const sorted = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (sorted.length === 0) return [];

    if (period === 'daily') {
      let bal = startingBalance;
      const dayMap = new Map<string, number>();
      for (const t of sorted) {
        const d = t.date.split('T')[0];
        dayMap.set(d, (dayMap.get(d) || 0) + t.pnl);
      }
      return Array.from(dayMap.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, pnl]) => {
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

    let bal = startingBalance;
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, pnl]) => {
      bal += pnl;
      return { date, balance: Number(bal.toFixed(2)), pnl };
    });
  }, [trades, period, startingBalance]);

  const lastBal = data.length > 0 ? data[data.length - 1].balance : startingBalance;
  const isPositive = lastBal >= startingBalance;
  const lineColor = isPositive ? '#10b981' : '#f87171';
  const isEmpty = data.length === 0;

  const yDomain = useMemo(() => {
    if (data.length === 0) return ['auto', 'auto'] as ['auto', 'auto'];
    const vals = data.map(d => d.balance);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const pad = (max - min) * 0.15 || 50;
    return [Math.floor(min - pad), Math.ceil(max + pad)] as [number, number];
  }, [data]);

  const pills: { key: Period; label: string }[] = [
    { key: 'daily', label: 'Daily' },
    { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly' },
  ];

  return (
    <div className="relative rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.07)] p-4 px-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-[rgba(255,255,255,0.4)]">Equity Curve</span>
        <div className="flex gap-0.5 bg-[rgba(255,255,255,0.05)] rounded-lg p-0.5">
          {pills.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={cn(
                'px-3 py-1 text-xs rounded-md transition-all',
                period === p.key
                  ? 'bg-white text-black font-semibold'
                  : 'text-[rgba(255,255,255,0.3)] hover:text-[rgba(255,255,255,0.5)]'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Annotated balance overlay */}
      {!isEmpty && (
        <div className="absolute top-4 right-5 text-right pointer-events-none">
          <p className="text-[9px] uppercase tracking-[0.1em] text-[rgba(255,255,255,0.25)]">Equity</p>
          <p className="text-[17px] leading-tight metric-number text-white">${lastBal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
      )}

      <div className="h-[200px]">
        {isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center gap-3">
            <svg width="100%" height="60" className="opacity-20">
              <line x1="0" y1="30" x2="100%" y2="30" stroke="white" strokeDasharray="6 4" strokeWidth="1" />
            </svg>
            <span className="text-sm text-[rgba(255,255,255,0.25)]">Your equity curve will appear here</span>
            <Link to="/add-trade" className="text-xs font-semibold text-background bg-profit hover:bg-profit/90 px-4 py-2 rounded-full transition-colors">
              Log Trade →
            </Link>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={lineColor} stopOpacity={0.14} />
                  <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="1 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 11 }}
                tickLine={false} axisLine={false}
              />
              <YAxis
                orientation="right"
                domain={yDomain}
                tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 11 }}
                tickLine={false} axisLine={false}
                tickFormatter={v => `$${v}`}
              />
              <ReferenceLine y={startingBalance} stroke="rgba(255,255,255,0.06)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(0,0%,6%)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: 11,
                  padding: '6px 14px',
                }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Balance']}
              />
              <Area
                type="monotone"
                dataKey="balance"
                stroke={lineColor}
                strokeWidth={2}
                fill="url(#eqGrad)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
