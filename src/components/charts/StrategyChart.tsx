import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';

interface StrategyChartProps {
  data: { strategy: string; pnl: number; winRate: number; total: number }[];
}

export function StrategyChart({ data }: StrategyChartProps) {
  if (data.length === 0) {
    return (
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">Performance by Strategy</h3>
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
      transition={{ duration: 0.4, delay: 0.2 }}
      className="glass-card p-6"
    >
      <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">Performance by Strategy</h3>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 18%, 14%)" horizontal={false} />
            <XAxis
              type="number"
              stroke="hsl(215, 15%, 35%)"
              tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${v}`}
            />
            <YAxis
              type="category"
              dataKey="strategy"
              stroke="hsl(215, 15%, 35%)"
              tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={80}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(222, 25%, 10%)',
                border: '1px solid hsl(220, 18%, 14%)',
                borderRadius: '8px',
                color: 'hsl(210, 20%, 93%)',
                fontSize: 12,
              }}
              formatter={(value: number, _name: string, props: any) => [
                `$${value.toFixed(2)} | WR: ${props.payload.winRate}% | ${props.payload.total} trades`,
                'P&L'
              ]}
            />
            <Bar dataKey="pnl" radius={[0, 4, 4, 0]} maxBarSize={24}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.pnl >= 0 ? 'hsl(142, 70%, 45%)' : 'hsl(0, 72%, 51%)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
