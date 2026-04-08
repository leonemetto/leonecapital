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
    { metric: 'Recovery', value: recovery },
    { metric: 'Profit Factor', value: profitFactor },
    { metric: 'Consistency', value: consistency },
    { metric: 'Adherence', value: planAdherence },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.1 }}
      className="glass-card p-5 h-full"
    >
      <h3 className="label-text mb-1">
        Performance Profile
      </h3>
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="60%" margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
            <PolarGrid stroke="hsl(220, 6%, 14%)" strokeWidth={0.5} />
            <PolarAngleAxis
              dataKey="metric"
              tick={{ fill: 'hsl(220, 5%, 45%)', fontSize: 10, fontWeight: 500 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: 'hsl(220, 6%, 25%)', fontSize: 8 }}
              axisLine={false}
            />
            <Radar
              name="Performance"
              dataKey="value"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.06}
              strokeWidth={1.5}
              dot={{ r: 2.5, fill: '#10b981', strokeWidth: 0 }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}