import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';

interface WinLossPieProps {
  wins: number;
  losses: number;
  breakevens: number;
}

const COLORS = ['#10b981', '#EF4444', 'hsl(220, 6%, 30%)'];

export function WinLossPie({ wins, losses, breakevens }: WinLossPieProps) {
  const data = [
    { name: 'Wins', value: wins },
    { name: 'Losses', value: losses },
    { name: 'Breakeven', value: breakevens },
  ].filter(d => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="glass-card p-5">
        <h3 className="label-text mb-4">Win / Loss</h3>
        <div className="h-[220px] flex items-center justify-center text-muted-foreground/40 text-sm">No trades yet</div>
      </div>
    );
  }

  const total = wins + losses + breakevens;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}
      className="glass-card p-5">
      <h3 className="label-text mb-4">Win / Loss</h3>
      <div className="h-[220px] flex items-center">
        <div className="w-1/2 h-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value" strokeWidth={0}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={COLORS[entry.name === 'Wins' ? 0 : entry.name === 'Losses' ? 1 : 2]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: 'hsl(220, 8%, 7%)', border: '1px solid hsl(220, 6%, 12%)', borderRadius: '10px', color: '#eee', fontSize: 11, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="w-1/2 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-profit" />
            <span className="text-xs text-muted-foreground">Wins</span>
            <span className="ml-auto font-mono text-xs font-semibold">{wins}</span>
            <span className="text-[10px] text-muted-foreground/60">({total > 0 ? ((wins / total) * 100).toFixed(0) : 0}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-loss" />
            <span className="text-xs text-muted-foreground">Losses</span>
            <span className="ml-auto font-mono text-xs font-semibold">{losses}</span>
            <span className="text-[10px] text-muted-foreground/60">({total > 0 ? ((losses / total) * 100).toFixed(0) : 0}%)</span>
          </div>
          {breakevens > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: COLORS[2] }} />
              <span className="text-xs text-muted-foreground">BE</span>
              <span className="ml-auto font-mono text-xs font-semibold">{breakevens}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}