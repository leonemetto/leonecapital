import { useMemo, useState } from 'react';
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
import { useProfile } from '@/hooks/useProfile';

import { calculateAnalytics, getEquityCurve, getStrategyPerformance } from '@/lib/analytics';
import {
  Target, DollarSign, BarChart3, TrendingUp, PlusCircle, ArrowUpDown, Wallet, Filter,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

const Dashboard = () => {
  const { trades } = useSharedTrades();
  const { accounts } = useSharedAccounts();
  const { profile } = useProfile();
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  // Auto-select first account when accounts load
  const effectiveAccountId = selectedAccountId || (accounts.length > 0 ? accounts[0].id : '');

  const filteredTrades = useMemo(
    () => effectiveAccountId ? trades.filter(t => t.accountId === effectiveAccountId) : trades,
    [trades, effectiveAccountId]
  );

  const stats = useMemo(() => calculateAnalytics(filteredTrades), [filteredTrades]);
  const equityData = useMemo(() => getEquityCurve(filteredTrades), [filteredTrades]);
  const strategyData = useMemo(() => getStrategyPerformance(filteredTrades), [filteredTrades]);

  if (trades.length === 0) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="p-3 rounded-xl bg-primary/10 mb-5">
            <BarChart3 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-1.5">{getGreeting()}, {profile?.nickname || 'Trader'}!</h1>
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
      {/* Greeting */}
      <h1 className="text-xl font-bold mb-4">{getGreeting()}, {profile?.nickname || 'Trader'} 👋</h1>

      {/* Account Filter */}
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        <Select value={effectiveAccountId} onValueChange={setSelectedAccountId}>
          <SelectTrigger className="w-[200px] h-8 text-xs">
            <SelectValue placeholder="Select Account" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map(a => (
              <SelectItem key={a.id} value={a.id}>{a.name} ({a.type})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Row 1: Quick Actions + KPI Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 mb-4">
        <QuickActions />
        <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatsCard title="Win Rate" value={`${stats.winRate.toFixed(1)}%`} icon={Target}
            trend={stats.winRate >= 50 ? 'up' : 'down'} delay={0} />
          <StatsCard title="Total P&L" value={`$${stats.netPnl.toFixed(2)}`} icon={DollarSign}
            trend={stats.netPnl >= 0 ? 'up' : 'down'} delay={1} />
          <StatsCard title="Returns" value={`${filteredTrades.length} trades`} icon={TrendingUp}
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
            const balance = account.currentBalance + accountPnl;
            const pctChange = account.startingBalance > 0 ? ((balance - account.startingBalance) / account.startingBalance) * 100 : 0;
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
          <TradingCalendar trades={filteredTrades} />
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
