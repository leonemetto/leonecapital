import { useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { EquityCurve } from '@/components/charts/EquityCurve';
import { WinLossPie } from '@/components/charts/WinLossPie';
import { StrategyChart } from '@/components/charts/StrategyChart';
import { PerformanceRadar } from '@/components/charts/PerformanceRadar';
import { TradingCalendar } from '@/components/calendar/TradingCalendar';
import { useTrades } from '@/hooks/useTrades';
import { calculateAnalytics, getEquityCurve, getStrategyPerformance } from '@/lib/analytics';
import {
  Target, DollarSign, BarChart3, TrendingUp, PlusCircle, ArrowUpDown,
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
      {/* Row 1: Quick Actions + KPI Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 mb-4">
        <QuickActions />
        <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatsCard title="Win Rate" value={`${stats.winRate.toFixed(1)}%`} icon={Target}
            trend={stats.winRate >= 50 ? 'up' : 'down'} delay={0} />
          <StatsCard title="Total P&L" value={`$${stats.netPnl.toFixed(2)}`} icon={DollarSign}
            trend={stats.netPnl >= 0 ? 'up' : 'down'} delay={1} />
          <StatsCard title="Returns" value={`${stats.totalTrades} trades`} icon={TrendingUp}
            delay={2} />
          <StatsCard title="Profit Factor" value={stats.profitFactor >= 999 ? '∞' : stats.profitFactor.toFixed(2)} icon={ArrowUpDown}
            trend={stats.profitFactor >= 1 ? 'up' : 'down'} delay={3} />
        </div>
      </div>

      {/* Row 2: Performance Radar + Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 mb-4">
        <PerformanceRadar stats={stats} />
        <div className="lg:col-span-3">
          <TradingCalendar trades={trades} />
        </div>
      </div>

      {/* Row 3: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <EquityCurve data={equityData} />
        <WinLossPie wins={stats.wins} losses={stats.losses} breakevens={stats.breakevens} />
        <StrategyChart data={strategyData} />
      </div>
    </AppLayout>
  );
};

export default Dashboard;
