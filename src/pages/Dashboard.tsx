import { useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { EquityCurve } from '@/components/charts/EquityCurve';
import { WinLossPie } from '@/components/charts/WinLossPie';
import { StrategyChart } from '@/components/charts/StrategyChart';
import { useTrades } from '@/hooks/useTrades';
import { calculateAnalytics, getEquityCurve, getStrategyPerformance } from '@/lib/analytics';
import {
  TrendingUp, TrendingDown, Target, DollarSign, BarChart3,
  Activity, Zap, ArrowDownRight, Flame, PlusCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Dashboard = () => {
  const { trades } = useTrades();
  const stats = useMemo(() => calculateAnalytics(trades), [trades]);
  const equityData = useMemo(() => getEquityCurve(trades), [trades]);
  const strategyData = useMemo(() => getStrategyPerformance(trades), [trades]);

  if (trades.length === 0) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="p-4 rounded-2xl bg-primary/10 mb-6">
            <TrendingUp className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Welcome to EdgeJournal</h1>
          <p className="text-muted-foreground mb-6 max-w-md">
            Start logging your trades to unlock powerful analytics, performance insights, and track your edge.
          </p>
          <Link to="/add-trade">
            <Button className="gap-2 px-6">
              <PlusCircle className="h-4 w-4" /> Log Your First Trade
            </Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">{stats.totalTrades} trades logged</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <StatsCard title="Win Rate" value={`${stats.winRate.toFixed(1)}%`} icon={Target}
          trend={stats.winRate >= 50 ? 'up' : 'down'} delay={0} />
        <StatsCard title="Net P&L" value={`$${stats.netPnl.toFixed(2)}`} icon={DollarSign}
          trend={stats.netPnl >= 0 ? 'up' : 'down'} delay={1} />
        <StatsCard title="Profit Factor" value={stats.profitFactor >= 999 ? '∞' : stats.profitFactor.toFixed(2)} icon={BarChart3}
          trend={stats.profitFactor >= 1 ? 'up' : 'down'} delay={2} />
        <StatsCard title="Avg Win" value={`$${stats.avgWin.toFixed(2)}`} icon={TrendingUp}
          trend="up" delay={3} />
        <StatsCard title="Avg Loss" value={`$${Math.abs(stats.avgLoss).toFixed(2)}`} icon={TrendingDown}
          trend="down" delay={4} />
        <StatsCard title="R:R Ratio" value={stats.rrRatio.toFixed(2)} icon={Activity} delay={5} />
        <StatsCard title="Expectancy" value={`$${stats.expectancy.toFixed(2)}`} icon={Zap}
          trend={stats.expectancy >= 0 ? 'up' : 'down'} delay={6} />
        <StatsCard title="Max Drawdown" value={`$${stats.maxDrawdown.toFixed(2)}`} icon={ArrowDownRight}
          trend="down" delay={7} />
        <StatsCard title="Total Trades" value={stats.totalTrades} icon={BarChart3} delay={8} />
        <StatsCard title="Streak" icon={Flame} delay={9}
          value={stats.currentStreak.count > 0 ? `${stats.currentStreak.count} ${stats.currentStreak.type}${stats.currentStreak.count > 1 ? 's' : ''}` : '—'}
          trend={stats.currentStreak.type === 'win' ? 'up' : stats.currentStreak.type === 'loss' ? 'down' : 'neutral'} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <EquityCurve data={equityData} />
        <WinLossPie wins={stats.wins} losses={stats.losses} breakevens={stats.breakevens} />
      </div>
      <StrategyChart data={strategyData} />
    </AppLayout>
  );
};

export default Dashboard;
