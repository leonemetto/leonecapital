import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';

interface WinLossPieProps {
  wins: number;
  losses: number;
  breakevens: number;
}

const COLORS = ['hsl(142, 70%, 45%)', 'hsl(0, 72%, 51%)', 'hsl(215, 15%, 50%)'];

export function WinLossPie({ wins, losses, breakevens }: WinLossPieProps) {
  const data = [
    { name: 'Wins', value: wins },
    { name: 'Losses', value: losses },
    { name: 'Breakeven', value: breakevens },
  ].filter(d => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">Win / Loss</h3>
        <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
          No trades yet
        </div>
      </div>
    );
  }

  const total = wins + losses + breakevens;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="glass-card p-6"
    >
      <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">Win / Loss</h3>
      <div className="h-[280px] flex items-center">
        <div className="w-1/2 h-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(222, 25%, 10%)',
                  border: '1px solid hsl(220, 18%, 14%)',
                  borderRadius: '8px',
                  color: 'hsl(210, 20%, 93%)',
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="w-1/2 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-profit" />
            <span className="text-sm text-muted-foreground">Wins</span>
            <span className="ml-auto font-mono text-sm font-semibold">{wins}</span>
            <span className="text-xs text-muted-foreground">({total > 0 ? ((wins / total) * 100).toFixed(0) : 0}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-loss" />
            <span className="text-sm text-muted-foreground">Losses</span>
            <span className="ml-auto font-mono text-sm font-semibold">{losses}</span>
            <span className="text-xs text-muted-foreground">({total > 0 ? ((losses / total) * 100).toFixed(0) : 0}%)</span>
          </div>
          {breakevens > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: COLORS[2] }} />
              <span className="text-sm text-muted-foreground">BE</span>
              <span className="ml-auto font-mono text-sm font-semibold">{breakevens}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
