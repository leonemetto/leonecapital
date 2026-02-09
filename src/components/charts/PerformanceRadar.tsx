import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';
import { Analytics } from '@/lib/analytics';

interface PerformanceRadarProps {
  stats: Analytics;
}

export function PerformanceRadar({ stats }: PerformanceRadarProps) {
  // Normalize metrics to 0-100 scale
  const winRate = Math.min(stats.winRate, 100);
  const profitFactor = Math.min((stats.profitFactor / 5) * 100, 100);
  const consistency = stats.totalTrades > 0
    ? Math.min((stats.currentStreak.count / Math.max(stats.totalTrades * 0.3, 1)) * 100, 100)
    : 0;
  const recovery = stats.maxDrawdown > 0
    ? Math.min((stats.netPnl / stats.maxDrawdown) * 50, 100)
    : stats.netPnl > 0 ? 80 : 0;
  // Plan adherence approximation based on breakeven ratio (lower = better discipline)
  const planAdherence = stats.totalTrades > 0
    ? Math.max(100 - (stats.breakevens / stats.totalTrades) * 200, 20)
    : 50;

  const data = [
    { metric: 'Win Rate', value: winRate },
    { metric: 'Recovery Factor', value: recovery },
    { metric: 'Profit Factor', value: profitFactor },
    { metric: 'Consistency\nScore', value: consistency },
    { metric: 'Plan\nAdherence', value: planAdherence },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.1 }}
      className="glass-card p-4 h-full"
    >
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        Performance Profile
      </h3>
      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid stroke="hsl(0, 0%, 18%)" />
            <PolarAngleAxis
              dataKey="metric"
              tick={{ fill: 'hsl(0, 0%, 45%)', fontSize: 10 }}
            />
            <Radar
              name="Performance"
              dataKey="value"
              stroke="hsl(142, 70%, 45%)"
              fill="hsl(142, 70%, 45%)"
              fillOpacity={0.15}
              strokeWidth={2}
              dot={{ r: 3, fill: 'hsl(142, 70%, 45%)' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
