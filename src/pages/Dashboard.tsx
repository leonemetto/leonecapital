import { useMemo, useState, useCallback } from 'react';
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
import { useCriteria } from '@/hooks/useCriteria';
import { insertDemoTrades } from '@/lib/demoData';
import { toast } from 'sonner';

import { calculateAnalytics, getEquityCurve, getStrategyPerformance } from '@/lib/analytics';
import {
  Target, DollarSign, BarChart3, TrendingUp, PlusCircle, ArrowUpDown, Wallet, Filter, ClipboardList, CheckSquare, Settings2, Database,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
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
  const { activeCriteria, isLoading: criteriaLoading } = useCriteria();
  const [loadingDemo, setLoadingDemo] = useState(false);

  const handleAddDemo = useCallback(async () => {
    if (accounts.length === 0) return;
    setLoadingDemo(true);
    try {
      const count = await insertDemoTrades(accounts[0].id);
      toast.success(`${count} demo trades added`);
      window.location.reload();
    } catch (e: any) {
      toast.error(e.message || 'Failed to add demo data');
    } finally {
      setLoadingDemo(false);
    }
  }, [accounts]);

  // Auto-select first account when accounts load
  const effectiveAccountId = selectedAccountId || (accounts.length > 0 ? accounts[0].id : '');

  const filteredTrades = useMemo(
    () => effectiveAccountId ? trades.filter(t => t.accountId === effectiveAccountId) : trades,
    [trades, effectiveAccountId]
  );

  const stats = useMemo(() => calculateAnalytics(filteredTrades), [filteredTrades]);
  const equityData = useMemo(() => getEquityCurve(filteredTrades), [filteredTrades]);
  const strategyData = useMemo(() => getStrategyPerformance(filteredTrades), [filteredTrades]);

  if (accounts.length === 0) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="p-3 rounded-xl bg-primary/10 mb-5">
            <Wallet className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-1.5">{getGreeting()}, {profile?.nickname || 'Trader'}!</h1>
          <p className="text-sm text-muted-foreground mb-5 max-w-sm">
            First, add a trading account to get started.
          </p>
          <Link to="/accounts">
            <Button size="sm" className="gap-1.5">
              <Wallet className="h-3.5 w-3.5" /> Add Account
            </Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  if (trades.length === 0) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="p-3 rounded-xl bg-primary/10 mb-5">
            <BarChart3 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-1.5">{getGreeting()}, {profile?.nickname || 'Trader'}!</h1>
          <p className="text-sm text-muted-foreground mb-5 max-w-sm">
            Great, you have an account! Now log your first trade to unlock analytics.
          </p>
          <div className="flex gap-2">
            <Link to="/add-trade">
              <Button size="sm" className="gap-1.5">
                <PlusCircle className="h-3.5 w-3.5" /> Log First Trade
              </Button>
            </Link>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={handleAddDemo} disabled={loadingDemo}>
              <Database className="h-3.5 w-3.5" /> {loadingDemo ? 'Adding...' : 'Add Demo Data'}
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Greeting */}
      <h1 className="text-xl font-bold mb-4">{getGreeting()}, {profile?.nickname || 'Trader'} 👋</h1>

      {/* Account Filter + Checklist Button */}
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

        {/* Entry Checklist Sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
              <ClipboardList className="h-3.5 w-3.5" />
              Entry Checklist
              {!criteriaLoading && activeCriteria.length > 0 && (
                <span className="ml-0.5 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-mono">
                  {activeCriteria.length}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-80 sm:w-96">
            <SheetHeader className="mb-5">
              <SheetTitle className="flex items-center gap-2 text-sm">
                <CheckSquare className="h-4 w-4 text-primary" />
                Entry Checklist
              </SheetTitle>
            </SheetHeader>

            {criteriaLoading ? (
              <p className="text-xs text-muted-foreground">Loading...</p>
            ) : activeCriteria.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                <div className="p-3 rounded-xl bg-primary/10">
                  <ClipboardList className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-medium">No checklist yet</p>
                <p className="text-xs text-muted-foreground max-w-[200px]">
                  Go to Trading Plan to create your entry criteria checklist.
                </p>
                <Link to="/trading-plan">
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs mt-1">
                    <Settings2 className="h-3.5 w-3.5" /> Set Up Checklist
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Group by category */}
                {(() => {
                  const grouped: Record<string, typeof activeCriteria> = {};
                  for (const c of activeCriteria) {
                    const cat = c.category || 'General';
                    if (!grouped[cat]) grouped[cat] = [];
                    grouped[cat].push(c);
                  }
                  return Object.entries(grouped).map(([category, items]) => (
                    <div key={category}>
                      <p className="text-[9px] text-muted-foreground/60 uppercase tracking-widest mb-2">{category}</p>
                      <div className="space-y-2">
                        {items.map(c => (
                          <div key={c.id} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-secondary/40 border border-border/50">
                            <CheckSquare className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="text-xs">{c.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ));
                })()}

                <div className="pt-2 border-t border-border">
                  <Link to="/trading-plan">
                    <Button variant="ghost" size="sm" className="w-full gap-1.5 text-xs justify-start">
                      <Settings2 className="h-3.5 w-3.5" /> Customize Checklist
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
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
          <StatsCard
            title="Profit Factor"
            value={stats.profitFactor >= 999 ? (
              <div className="flex flex-col">
                <span className="text-foreground">∞</span>
                <span className="text-[10px] text-muted-foreground font-normal tracking-normal lowercase">Infinite</span>
              </div>
            ) : stats.profitFactor.toFixed(2)}
            icon={ArrowUpDown}
            trend={stats.profitFactor >= 999 ? undefined : stats.profitFactor >= 1 ? 'up' : 'down'}
            delay={3}
          />
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
