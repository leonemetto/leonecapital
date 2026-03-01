import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';

interface StrategyChartProps {
  data: { strategy: string; pnl: number; winRate: number; total: number }[];
}

export function StrategyChart({ data }: StrategyChartProps) {
  if (data.length === 0) {
    return (
      <div className="glass-card p-6 md:p-8">
        <h3 className="text-[12px] font-medium mb-5 text-muted-foreground uppercase tracking-[0.08em]">By Strategy</h3>
        <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">No trades yet</div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
      className="glass-card p-6 md:p-8">
      <h3 className="text-[12px] font-medium mb-5 text-muted-foreground uppercase tracking-[0.08em]">By Strategy</h3>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 100% / 0.04)" horizontal={false} />
            <XAxis type="number" stroke="transparent" tick={{ fill: 'hsl(0, 0%, 45%)', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
            <YAxis type="category" dataKey="strategy" stroke="transparent" tick={{ fill: 'hsl(0, 0%, 45%)', fontSize: 10 }} tickLine={false} axisLine={false} width={75} />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(225, 12%, 10%)', border: '1px solid hsl(0 0% 100% / 0.08)', borderRadius: '12px', color: '#f5f5f5', fontSize: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
              formatter={(value: number, _name: string, props: any) => [`$${value.toFixed(2)} | WR: ${props.payload.winRate}% | ${props.payload.total} trades`, 'P&L']} />
            <Bar dataKey="pnl" radius={[0, 4, 4, 0]} maxBarSize={18}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.pnl >= 0 ? 'hsl(142, 50%, 45%)' : 'hsl(0, 55%, 55%)'} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
