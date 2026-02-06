import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import { motion } from 'framer-motion';

interface EquityCurveProps {
  data: { date: string; balance: number; pnl: number }[];
}

export function EquityCurve({ data }: EquityCurveProps) {
  if (data.length === 0) {
    return (
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">Equity Curve</h3>
        <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
          No trades yet
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="glass-card p-6"
    >
      <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">Equity Curve</h3>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 18%, 14%)" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="hsl(215, 15%, 35%)"
              tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(215, 15%, 35%)"
              tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(222, 25%, 10%)',
                border: '1px solid hsl(220, 18%, 14%)',
                borderRadius: '8px',
                color: 'hsl(210, 20%, 93%)',
                fontSize: 12,
              }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Balance']}
            />
            <Area
              type="monotone"
              dataKey="balance"
              stroke="hsl(199, 89%, 48%)"
              strokeWidth={2}
              fill="url(#equityGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
