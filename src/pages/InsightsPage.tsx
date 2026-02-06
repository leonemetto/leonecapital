import { useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useTrades } from '@/hooks/useTrades';
import { generateInsights, getStrategyPerformance, getPairDistribution, calculateAnalytics } from '@/lib/analytics';
import { Brain, Lightbulb, TrendingUp, TrendingDown, Target, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const InsightsPage = () => {
  const { trades } = useTrades();
  const insights = useMemo(() => generateInsights(trades), [trades]);
  const strategies = useMemo(() => getStrategyPerformance(trades), [trades]);
  const pairs = useMemo(() => getPairDistribution(trades), [trades]);
  const stats = useMemo(() => calculateAnalytics(trades), [trades]);

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Performance Insights</h1>
        <p className="text-sm text-muted-foreground">AI-powered analysis of your trading patterns</p>
      </div>

      {/* Insights */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 mb-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Smart Insights</h3>
        </div>
        <div className="space-y-3">
          {insights.map((insight, i) => (
            <div key={i} className="flex gap-3 items-start p-3 rounded-lg bg-secondary/50">
              <Lightbulb className="h-4 w-4 text-chart-4 mt-0.5 shrink-0" />
              <p className="text-sm">{insight}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Strategy Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-accent" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Strategy Breakdown</h3>
          </div>
          {strategies.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet</p>
          ) : (
            <div className="space-y-3">
              {strategies.sort((a, b) => b.pnl - a.pnl).map(s => (
                <div key={s.strategy} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <div>
                    <span className="text-sm font-medium">{s.strategy}</span>
                    <div className="flex gap-3 mt-1">
                      <span className="text-[11px] text-muted-foreground">{s.total} trades</span>
                      <span className="text-[11px] text-muted-foreground">WR: {s.winRate}%</span>
                    </div>
                  </div>
                  <span className={cn('font-mono text-sm font-semibold', s.pnl >= 0 ? 'text-profit' : 'text-loss')}>
                    {s.pnl >= 0 ? '+' : ''}${s.pnl.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Instrument Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-chart-3" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">By Instrument</h3>
          </div>
          {pairs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet</p>
          ) : (
            <div className="space-y-3">
              {pairs.sort((a, b) => b.pnl - a.pnl).map(p => (
                <div key={p.instrument} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <div>
                    <span className="text-sm font-medium">{p.instrument}</span>
                    <span className="text-[11px] text-muted-foreground ml-2">{p.count} trades</span>
                  </div>
                  <span className={cn('font-mono text-sm font-semibold', p.pnl >= 0 ? 'text-profit' : 'text-loss')}>
                    {p.pnl >= 0 ? '+' : ''}${p.pnl.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default InsightsPage;
