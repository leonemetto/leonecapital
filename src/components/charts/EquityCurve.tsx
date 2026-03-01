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
      <div className="glass-card p-6 md:p-8">
        <h3 className="text-[12px] font-medium mb-5 text-muted-foreground uppercase tracking-[0.08em]">Equity Curve</h3>
        <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">No trades yet</div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
      className="glass-card p-6 md:p-8">
      <h3 className="text-[12px] font-medium mb-5 text-muted-foreground uppercase tracking-[0.08em]">Equity Curve</h3>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isPositive ? 'hsl(142, 50%, 45%)' : 'hsl(0, 55%, 55%)'} stopOpacity={0.15} />
                <stop offset="95%" stopColor={isPositive ? 'hsl(142, 50%, 45%)' : 'hsl(0, 55%, 55%)'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 100% / 0.04)" vertical={false} />
            <XAxis dataKey="date" stroke="transparent" tick={{ fill: 'hsl(0, 0%, 45%)', fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis stroke="transparent" tick={{ fill: 'hsl(0, 0%, 45%)', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(225, 12%, 10%)', border: '1px solid hsl(0 0% 100% / 0.08)', borderRadius: '12px', color: '#f5f5f5', fontSize: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Balance']} />
            <Area type="monotone" dataKey="balance" stroke={isPositive ? 'hsl(142, 50%, 45%)' : 'hsl(0, 55%, 55%)'} strokeWidth={1.5} fill="url(#equityGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
