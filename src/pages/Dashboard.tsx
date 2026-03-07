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

import { toast } from 'sonner';

import { calculateAnalytics, getEquityCurve, getStrategyPerformance } from '@/lib/analytics';
import {
  Target, DollarSign, BarChart3, TrendingUp, PlusCircle, ArrowUpDown, Wallet, Filter, ClipboardList, CheckSquare, Settings2,
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
  const { trades, addTrade } = useSharedTrades();
  const { accounts } = useSharedAccounts();
  const { profile } = useProfile();
  const [selectedAccountId, setSelectedAccountId] = useState<string>('__all__');
  const [loadingDemo, setLoadingDemo] = useState(false);
  const { activeCriteria, isLoading: criteriaLoading } = useCriteria();

  const filteredTrades = useMemo(
    () => selectedAccountId === '__all__' ? trades : trades.filter(t => t.accountId === selectedAccountId),
    [trades, selectedAccountId]
  );

  const stats = useMemo(() => calculateAnalytics(filteredTrades), [filteredTrades]);
  const prevStats = useMemo(() => {
    if (filteredTrades.length < 2) return null;
    const sorted = [...filteredTrades].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return calculateAnalytics(sorted.slice(1));
  }, [filteredTrades]);
  const pnlDelta: 'up' | 'down' | 'neutral' | undefined = prevStats ? (stats.netPnl > prevStats.netPnl ? 'up' : stats.netPnl < prevStats.netPnl ? 'down' : 'neutral') : undefined;
  const pfDelta: 'up' | 'down' | 'neutral' | undefined = prevStats ? (stats.profitFactor > prevStats.profitFactor ? 'up' : stats.profitFactor < prevStats.profitFactor ? 'down' : 'neutral') : undefined;
  const equityData = useMemo(() => getEquityCurve(filteredTrades), [filteredTrades]);
  const strategyData = useMemo(() => getStrategyPerformance(filteredTrades), [filteredTrades]);

  const loadDemoData = useCallback(async () => {
    const accountId = accounts[0]?.id;
    if (!accountId) return;
    setLoadingDemo(true);
    try {
      const today = new Date();
      const demoTrades: Array<Parameters<typeof addTrade>[0]> = [
        { date: new Date(today.getTime() - 6 * 86400000).toISOString().slice(0, 10), instrument: 'XAUUSD', direction: 'long' as const, strategy: 'CISD', session: 'London', outcome: 'win' as const, pnl: 320, rMultiple: 2.5, riskPercent: 1, htfBias: 'Bullish', emotionalState: 4, confidenceLevel: 5, followedPlan: true, notes: 'Clean CISD setup on gold, held to TP.', accountId, timeInTrade: 45 },
        { date: new Date(today.getTime() - 5 * 86400000).toISOString().slice(0, 10), instrument: 'NAS100', direction: 'short' as const, strategy: 'IFVG', session: 'New York', outcome: 'loss' as const, pnl: -150, rMultiple: -1, riskPercent: 1, htfBias: 'Bearish', emotionalState: 2, confidenceLevel: 3, followedPlan: false, notes: 'Entered too early, didn\'t wait for confirmation.', accountId, timeInTrade: 20 },
        { date: new Date(today.getTime() - 4 * 86400000).toISOString().slice(0, 10), instrument: 'EUR/USD', direction: 'long' as const, strategy: 'Both', session: 'London/NY Overlap', outcome: 'win' as const, pnl: 210, rMultiple: 1.8, riskPercent: 1.5, htfBias: 'Bullish', emotionalState: 4, confidenceLevel: 4, followedPlan: true, notes: 'Solid overlap session trade.', accountId, timeInTrade: 60 },
        { date: new Date(today.getTime() - 3 * 86400000).toISOString().slice(0, 10), instrument: 'GBP/USD', direction: 'short' as const, strategy: 'CISD', session: 'London', outcome: 'breakeven' as const, pnl: 0, rMultiple: 0, riskPercent: 1, htfBias: 'Neutral', emotionalState: 3, confidenceLevel: 3, followedPlan: true, notes: 'Moved SL to BE, got stopped out.', accountId, timeInTrade: 35 },
        { date: new Date(today.getTime() - 2 * 86400000).toISOString().slice(0, 10), instrument: 'XAUUSD', direction: 'long' as const, strategy: 'IFVG', session: 'New York', outcome: 'win' as const, pnl: 480, rMultiple: 3.2, riskPercent: 1, htfBias: 'Bullish', emotionalState: 5, confidenceLevel: 5, followedPlan: true, notes: 'Perfect IFVG entry, let it run.', accountId, timeInTrade: 90 },
        { date: new Date(today.getTime() - 1 * 86400000).toISOString().slice(0, 10), instrument: 'US30', direction: 'short' as const, strategy: 'CISD', session: 'New York', outcome: 'loss' as const, pnl: -130, rMultiple: -0.9, riskPercent: 1, htfBias: 'Bearish', emotionalState: 2, confidenceLevel: 2, followedPlan: false, notes: 'Revenge trade after missing earlier setup.', accountId, timeInTrade: 15 },
        { date: today.toISOString().slice(0, 10), instrument: 'BTC/USD', direction: 'long' as const, strategy: 'Both', session: 'Asian', outcome: 'win' as const, pnl: 275, rMultiple: 2.0, riskPercent: 1.5, htfBias: 'Bullish', emotionalState: 4, confidenceLevel: 4, followedPlan: true, notes: 'Asian session breakout on BTC.', accountId, timeInTrade: 55 },
      ];
      for (const t of demoTrades) {
        await addTrade(t);
      }
      toast.success('Demo data loaded — 7 sample trades added!');
    } catch (e: any) {
      toast.error(e.message || 'Failed to load demo data');
    } finally {
      setLoadingDemo(false);
    }
  }, [accounts, addTrade]);

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
          <div className="flex gap-3">
            <Link to="/add-trade">
              <Button size="sm" className="gap-1.5">
                <PlusCircle className="h-3.5 w-3.5" /> Log First Trade
              </Button>
            </Link>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={loadDemoData} disabled={loadingDemo}>
              <BarChart3 className="h-3.5 w-3.5" /> {loadingDemo ? 'Loading...' : 'Load Demo Data'}
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Greeting */}
      <h1 className="text-2xl font-bold mb-1">{getGreeting()}, {profile?.nickname || 'Trader'} 👋</h1>
      <p className="text-xs text-muted-foreground/50 mb-5">Here's your trading overview</p>

      {/* Account Filter + Checklist Button */}
      <div className="flex items-center gap-2 mb-5">
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
          <SelectTrigger className="w-[200px] h-8 text-xs">
            <SelectValue placeholder="Select Account" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Accounts</SelectItem>
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
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-5">
        <QuickActions />
        <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard title="Win Rate" value={`${stats.winRate.toFixed(1)}%`} icon={Target}
            trend={stats.winRate >= 50 ? 'up' : 'down'} delay={0} />
          <StatsCard title="Total P&L" value={`$${stats.netPnl.toFixed(2)}`} icon={DollarSign}
            trend={stats.netPnl >= 0 ? 'up' : 'down'} delta={pnlDelta} delay={1} />
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
            delta={stats.profitFactor >= 999 ? undefined : pfDelta}
            delay={3}
          />
        </div>
      </div>

      {/* Account Balances */}
      {accounts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
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
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-5">
        <PerformanceRadar stats={stats} />
        <div className="lg:col-span-3">
          <TradingCalendar trades={filteredTrades} />
        </div>
      </div>

      {/* Row 3: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <EquityCurve data={equityData} />
        <WinLossPie wins={stats.wins} losses={stats.losses} breakevens={stats.breakevens} />
        <StrategyChart data={strategyData} />
      </div>
    </AppLayout>
  );
};

export default Dashboard;
