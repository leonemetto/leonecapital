import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';

interface StrategyChartProps {
  data: { strategy: string; pnl: number; winRate: number; total: number }[];
}

export function StrategyChart({ data }: StrategyChartProps) {
  if (data.length === 0) {
    return (
      <div className="glass-card p-5">
        <h3 className="label-text mb-4">By Strategy</h3>
        <div className="h-[220px] flex items-center justify-center text-muted-foreground/40 text-sm">No trades yet</div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}
      className="glass-card p-5">
      <h3 className="label-text mb-4">By Strategy</h3>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 6%, 10%)" horizontal={false} />
            <XAxis type="number" stroke="hsl(220, 6%, 16%)" tick={{ fill: 'hsl(220, 5%, 45%)', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
            <YAxis type="category" dataKey="strategy" stroke="hsl(220, 6%, 16%)" tick={{ fill: 'hsl(220, 5%, 45%)', fontSize: 10 }} tickLine={false} axisLine={false} width={75} />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(220, 8%, 7%)', border: '1px solid hsl(220, 6%, 12%)', borderRadius: '10px', color: '#eee', fontSize: 11, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
              formatter={(value: number, _name: string, props: any) => [`$${value.toFixed(2)} | WR: ${props.payload.winRate}% | ${props.payload.total} trades`, 'P&L']} />
            <Bar dataKey="pnl" radius={[0, 4, 4, 0]} maxBarSize={20}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.pnl >= 0 ? '#30D158' : '#EF4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}