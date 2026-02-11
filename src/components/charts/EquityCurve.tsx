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
        <h3 className="text-xs font-semibold mb-4 text-muted-foreground uppercase tracking-widest opacity-50">Equity Curve</h3>
        <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">No trades yet</div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}
      className="glass-card p-5">
      <h3 className="text-xs font-semibold mb-4 text-muted-foreground uppercase tracking-widest opacity-50">Equity Curve</h3>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isPositive ? '#30D158' : '#EF4444'} stopOpacity={0.25} />
                <stop offset="95%" stopColor={isPositive ? '#30D158' : '#EF4444'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 11%)" vertical={false} />
            <XAxis dataKey="date" stroke="hsl(0, 0%, 20%)" tick={{ fill: 'hsl(0, 0%, 56%)', fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(0, 0%, 20%)" tick={{ fill: 'hsl(0, 0%, 56%)', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
            <Tooltip contentStyle={{ backgroundColor: '#161618', border: '1px solid #1C1C1E', borderRadius: '8px', color: '#eee', fontSize: 11 }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Balance']} />
            <Area type="monotone" dataKey="balance" stroke={isPositive ? '#30D158' : '#EF4444'} strokeWidth={2} fill="url(#equityGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
