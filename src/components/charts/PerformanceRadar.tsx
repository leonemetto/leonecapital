import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';
import { Analytics } from '@/lib/analytics';

interface PerformanceRadarProps {
  stats: Analytics;
}

export function PerformanceRadar({ stats }: PerformanceRadarProps) {
  const winRate = Math.min(stats.winRate, 100);
  const profitFactor = Math.min((stats.profitFactor / 5) * 100, 100);
  const consistency = stats.totalTrades > 0
    ? Math.min((stats.currentStreak.count / Math.max(stats.totalTrades * 0.3, 1)) * 100, 100)
    : 0;
  const recovery = stats.maxDrawdown > 0
    ? Math.min((stats.netPnl / stats.maxDrawdown) * 50, 100)
    : stats.netPnl > 0 ? 80 : 0;
  const planAdherence = stats.totalTrades > 0
    ? Math.max(100 - (stats.breakevens / stats.totalTrades) * 200, 20)
    : 50;

  const data = [
    { metric: 'Win Rate', value: winRate },
    { metric: 'Recovery Factor', value: recovery },
    { metric: 'Profit Factor', value: profitFactor },
    { metric: 'Consistency Score', value: consistency },
    { metric: 'Plan Adherence', value: planAdherence },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.1 }}
      className="glass-card p-5 h-full"
    >
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest opacity-50 mb-1">
        Performance Profile
      </h3>
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="65%">
            <PolarGrid stroke="hsl(0, 0%, 16%)" strokeWidth={0.5} />
            <PolarAngleAxis
              dataKey="metric"
              tick={{ fill: 'hsl(0, 0%, 56%)', fontSize: 10, fontWeight: 500 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: 'hsl(0, 0%, 30%)', fontSize: 8 }}
              axisLine={false}
            />
            <Radar
              name="Performance"
              dataKey="value"
              stroke="#30D158"
              fill="#30D158"
              fillOpacity={0.08}
              strokeWidth={1}
              dot={{ r: 2, fill: '#30D158', strokeWidth: 0 }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
