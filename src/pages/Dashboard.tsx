import { useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { EquityCurve } from '@/components/charts/EquityCurve';
import { WinLossPie } from '@/components/charts/WinLossPie';
import { StrategyChart } from '@/components/charts/StrategyChart';
import { PerformanceRadar } from '@/components/charts/PerformanceRadar';
import { TradingCalendar } from '@/components/calendar/TradingCalendar';
import { useSharedTrades } from '@/contexts/TradesContext';
import { useSharedAccounts } from '@/contexts/AccountsContext';
import { generateDemoTrades } from '@/lib/seedTrades';
import { calculateAnalytics, getEquityCurve, getStrategyPerformance } from '@/lib/analytics';
import {
  Target, DollarSign, BarChart3, TrendingUp, PlusCircle, ArrowUpDown, Wallet,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const Dashboard = () => {
  const { trades, seedTrades } = useSharedTrades();
  const { accounts } = useSharedAccounts();
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
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => seedTrades(generateDemoTrades())}>
            Load Demo Data
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Row 1: Quick Actions + KPI Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 mb-4">
        <QuickActions onLoadDemo={() => seedTrades(generateDemoTrades())} />
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

      {/* Account Balances */}
      {accounts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          {accounts.map(account => {
            const accountPnl = trades.filter(t => t.accountId === account.id).reduce((s, t) => s + t.pnl, 0);
            const balance = account.startingBalance + accountPnl;
            const pctChange = account.startingBalance > 0 ? (accountPnl / account.startingBalance) * 100 : 0;
            return (
              <div key={account.id} className="glass-card p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Wallet className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{account.name} ({account.type})</p>
                  <p className="text-lg font-bold font-mono">${balance.toFixed(2)}</p>
                </div>
                <span className={cn('text-xs font-mono font-semibold', accountPnl >= 0 ? 'text-profit' : 'text-loss')}>
                  {accountPnl >= 0 ? '+' : ''}{pctChange.toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      )}

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
