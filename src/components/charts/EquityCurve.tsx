import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface EquityCurveProps {
  data: { date: string; balance: number; pnl: number }[];
}

export function EquityCurve({ data }: EquityCurveProps) {
  const lastBalance = data.length > 0 ? data[data.length - 1].balance : 0;
  const isPositive = lastBalance >= 0;

  if (data.length === 0) {
    return (
      <div className="glass-card p-5">
        <h3 className="label-text mb-4">Equity Curve</h3>
        <div className="h-[220px] flex items-center justify-center text-muted-foreground/40 text-sm">No trades yet</div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}
      className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="label-text">Equity Curve</h3>
        <span className={cn('text-xs font-mono font-bold', isPositive ? 'text-profit' : 'text-loss')}>
          ${lastBalance.toFixed(2)}
        </span>
      </div>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isPositive ? '#30D158' : '#EF4444'} stopOpacity={0.2} />
                <stop offset="95%" stopColor={isPositive ? '#30D158' : '#EF4444'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 6%, 10%)" vertical={false} />
            <XAxis dataKey="date" stroke="hsl(220, 6%, 16%)" tick={{ fill: 'hsl(220, 5%, 45%)', fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(220, 6%, 16%)" tick={{ fill: 'hsl(220, 5%, 45%)', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(220, 8%, 7%)', border: '1px solid hsl(220, 6%, 12%)', borderRadius: '10px', color: '#eee', fontSize: 11, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Balance']} />
            <Area type="monotone" dataKey="balance" stroke={isPositive ? '#30D158' : '#EF4444'} strokeWidth={1.5} fill="url(#equityGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
