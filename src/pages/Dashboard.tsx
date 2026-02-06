import { useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { EquityCurve } from '@/components/charts/EquityCurve';
import { WinLossPie } from '@/components/charts/WinLossPie';
import { StrategyChart } from '@/components/charts/StrategyChart';
import { TradingCalendar } from '@/components/calendar/TradingCalendar';
import { useTrades } from '@/hooks/useTrades';
import { calculateAnalytics, getEquityCurve, getStrategyPerformance } from '@/lib/analytics';
import {
  Target, DollarSign, BarChart3, TrendingUp, TrendingDown,
  Zap, ArrowDownRight, Flame, PlusCircle,
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
          <div className="p-3 rounded-xl bg-primary/10 mb-5">
            <BarChart3 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-1.5">Welcome to EdgeJournal</h1>
          <p className="text-sm text-muted-foreground mb-5 max-w-sm">
            Start logging trades to unlock your analytics dashboard.
          </p>
          <Link to="/add-trade">
            <Button size="sm" className="gap-1.5">
              <PlusCircle className="h-3.5 w-3.5" /> Log First Trade
            </Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 mb-4">
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
        <StatsCard title="Expectancy" value={`$${stats.expectancy.toFixed(2)}`} icon={Zap}
          trend={stats.expectancy >= 0 ? 'up' : 'down'} delay={5} />
        <StatsCard title="Max DD" value={`$${stats.maxDrawdown.toFixed(2)}`} icon={ArrowDownRight}
          trend="down" delay={6} />
        <StatsCard title="Trades" value={stats.totalTrades} icon={BarChart3} delay={7} />
        <StatsCard title="Streak" icon={Flame} delay={8}
          value={stats.currentStreak.count > 0 ? `${stats.currentStreak.count} ${stats.currentStreak.type}` : '—'}
          trend={stats.currentStreak.type === 'win' ? 'up' : stats.currentStreak.type === 'loss' ? 'down' : 'neutral'} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
        <EquityCurve data={equityData} />
        <WinLossPie wins={stats.wins} losses={stats.losses} breakevens={stats.breakevens} />
      </div>

      {/* Strategy + Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <StrategyChart data={strategyData} />
        <TradingCalendar trades={trades} />
      </div>
    </AppLayout>
  );
};

export default Dashboard;
