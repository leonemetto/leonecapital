import { useMemo } from 'react';
import { Area, AreaChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Trade } from '@/types/trade';
import { parseLocalDate } from '@/lib/utils';
import { fmtMoney, fmtSignedMoney } from '@/lib/format';

interface Point {
  date: string;
  balance: number;
  pnl: number;
}

/** Daily closing balance, starting from the balance before the first trade shown. */
export function buildEquitySeries(trades: Trade[], openingBalance: number): Point[] {
  const byDay = new Map<string, number>();
  for (const t of trades) {
    const day = t.date.slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + t.pnl);
  }
  let balance = openingBalance;
  return Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, pnl]) => {
      balance += pnl;
      return { date, pnl, balance: Number(balance.toFixed(2)) };
    });
}

const shortDate = (d: string) => parseLocalDate(d).toLocaleDateString('en', { month: 'short', day: 'numeric' });

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: Point }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-control border border-ef-line bg-ef-elev px-3 py-2" style={{ boxShadow: 'var(--ef-shadow-pop)' }}>
      <p className="ef-label m-0">{shortDate(p.date)}</p>
      <p className="ef-num m-0 mt-1 text-[13px] font-medium text-ef-ink">{fmtMoney(p.balance)}</p>
      <p className={`ef-num m-0 text-[11.5px] ${p.pnl > 0 ? 'text-ef-pos' : p.pnl < 0 ? 'text-ef-neg' : 'text-ef-ink-3'}`}>
        {fmtSignedMoney(p.pnl)} on the day
      </p>
    </div>
  );
}

/**
 * Account balance over the selected range. One ink line with a faint area;
 * the dashed rule marks where the range started.
 */
export function EquityChart({ trades, openingBalance, height = 220 }: { trades: Trade[]; openingBalance: number; height?: number }) {
  const data = useMemo(() => buildEquitySeries(trades, openingBalance), [trades, openingBalance]);

  const domain = useMemo<[number, number] | ['auto', 'auto']>(() => {
    if (data.length === 0) return ['auto', 'auto'];
    const values = [...data.map(d => d.balance), openingBalance];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = (max - min) * 0.16 || 100;
    return [Math.floor(min - pad), Math.ceil(max + pad)];
  }, [data, openingBalance]);

  if (data.length < 2) {
    return (
      <div className="grid place-items-center rounded-control border border-dashed border-ef-line-strong text-center" style={{ height }}>
        <p className="m-0 max-w-[30ch] px-4 text-[12.5px] leading-relaxed text-ef-ink-3">
          The curve appears once there are trades on two or more days in this range.
        </p>
      </div>
    );
  }

  const last = data[data.length - 1];
  return (
    <div
      role="img"
      aria-label={`Balance from ${shortDate(data[0].date)} to ${shortDate(last.date)}, ending at ${fmtMoney(last.balance)}.`}
      style={{ height }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
          <defs>
            <linearGradient id="ef-equity-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--ef-ink)" stopOpacity={0.14} />
              <stop offset="100%" stopColor="var(--ef-ink)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tickFormatter={shortDate}
            tick={{ fontSize: 10, fill: 'var(--ef-ink-4)', fontFamily: 'var(--ff-mono)' }}
            tickLine={false}
            axisLine={false}
            minTickGap={56}
            tickMargin={8}
          />
          <YAxis hide domain={domain} />
          <ReferenceLine y={openingBalance} stroke="var(--ef-line-strong)" strokeDasharray="3 4" />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--ef-line-strong)', strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="balance"
            stroke="var(--ef-ink)"
            strokeWidth={1.5}
            fill="url(#ef-equity-fill)"
            dot={false}
            activeDot={{ r: 3.5, fill: 'var(--ef-ink)', stroke: 'var(--ef-bg-elev)', strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
