import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';

interface WinLossPieProps {
  wins: number;
  losses: number;
  breakevens: number;
}

const COLORS = ['hsl(142, 50%, 45%)', 'hsl(0, 55%, 55%)', 'hsl(0, 0%, 30%)'];

export function WinLossPie({ wins, losses, breakevens }: WinLossPieProps) {
  const data = [
    { name: 'Wins', value: wins },
    { name: 'Losses', value: losses },
    { name: 'Breakeven', value: breakevens },
  ].filter(d => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="glass-card p-6 md:p-8">
        <h3 className="text-[12px] font-medium mb-5 text-muted-foreground uppercase tracking-[0.08em]">Win / Loss</h3>
        <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">No trades yet</div>
      </div>
    );
  }

  const total = wins + losses + breakevens;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}
      className="glass-card p-6 md:p-8">
      <h3 className="text-[12px] font-medium mb-5 text-muted-foreground uppercase tracking-[0.08em]">Win / Loss</h3>
      <div className="h-[220px] flex items-center">
        <div className="w-1/2 h-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2} dataKey="value" strokeWidth={0}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={COLORS[entry.name === 'Wins' ? 0 : entry.name === 'Losses' ? 1 : 2]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: 'hsl(225, 12%, 10%)', border: '1px solid hsl(0 0% 100% / 0.08)', borderRadius: '12px', color: '#f5f5f5', fontSize: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="w-1/2 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-profit" />
            <span className="text-[13px] text-muted-foreground">Wins</span>
            <span className="ml-auto font-mono text-[13px] font-semibold">{wins}</span>
            <span className="text-[11px] text-muted-foreground">({total > 0 ? ((wins / total) * 100).toFixed(0) : 0}%)</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-loss" />
            <span className="text-[13px] text-muted-foreground">Losses</span>
            <span className="ml-auto font-mono text-[13px] font-semibold">{losses}</span>
            <span className="text-[11px] text-muted-foreground">({total > 0 ? ((losses / total) * 100).toFixed(0) : 0}%)</span>
          </div>
          {breakevens > 0 && (
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full" style={{ background: COLORS[2] }} />
              <span className="text-[13px] text-muted-foreground">BE</span>
              <span className="ml-auto font-mono text-[13px] font-semibold">{breakevens}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
