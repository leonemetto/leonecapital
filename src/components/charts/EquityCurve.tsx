import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import { motion } from 'framer-motion';

interface EquityCurveProps {
  data: { date: string; balance: number; pnl: number }[];
}

export function EquityCurve({ data }: EquityCurveProps) {
  const lastBalance = data.length > 0 ? data[data.length - 1].balance : 0;
  const isPositive = lastBalance >= 0;

  if (data.length === 0) {
    return (
      <div className="glass-card p-5">
        <h3 className="text-xs font-semibold mb-4 text-muted-foreground uppercase tracking-wider">Equity Curve</h3>
        <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
          No trades yet
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="glass-card p-5"
    >
      <h3 className="text-xs font-semibold mb-4 text-muted-foreground uppercase tracking-wider">Equity Curve</h3>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isPositive ? 'hsl(142, 70%, 45%)' : 'hsl(0, 72%, 51%)'} stopOpacity={0.25} />
                <stop offset="95%" stopColor={isPositive ? 'hsl(142, 70%, 45%)' : 'hsl(0, 72%, 51%)'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 14%)" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="hsl(0, 0%, 20%)"
              tick={{ fill: 'hsl(0, 0%, 40%)', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(0, 0%, 20%)"
              tick={{ fill: 'hsl(0, 0%, 40%)', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(0, 0%, 8%)',
                border: '1px solid hsl(0, 0%, 14%)',
                borderRadius: '6px',
                color: 'hsl(0, 0%, 92%)',
                fontSize: 11,
              }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Balance']}
            />
            <Area
              type="monotone"
              dataKey="balance"
              stroke={isPositive ? 'hsl(142, 70%, 45%)' : 'hsl(0, 72%, 51%)'}
              strokeWidth={2}
              fill="url(#equityGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
