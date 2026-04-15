import { useMemo, useState, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatBar } from '@/components/dashboard/StatBar';
import { PremiumEquityCurve } from '@/components/dashboard/PremiumEquityCurve';
import { HeatMapCalendar } from '@/components/dashboard/HeatMapCalendar';
import { SessionPerformance } from '@/components/dashboard/SessionPerformance';
import { RecentTrades } from '@/components/dashboard/RecentTrades';
import { useSharedTrades } from '@/contexts/TradesContext';
import { useSharedAccounts } from '@/contexts/AccountsContext';
import { useProfile } from '@/hooks/useProfile';
import { useCriteria } from '@/hooks/useCriteria';
import { toast } from 'sonner';
import { calculateAnalytics } from '@/lib/analytics';
import { Wallet, ChartBar, Plus, NotePencil, Funnel, ClipboardText, CheckFat, Gear } from '@phosphor-icons/react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const Dashboard = () => {
  const { trades, addTrade } = useSharedTrades();
  const { accounts } = useSharedAccounts();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [selectedAccountId, setSelectedAccountId] = useState<string>(() => {
    return localStorage.getItem('dashboard_account_filter') ?? '__all__';
  });
  const [loadingDemo, setLoadingDemo] = useState(false);
  const { activeCriteria, isLoading: criteriaLoading } = useCriteria();

  const filteredTrades = useMemo(
    () => selectedAccountId === '__all__' ? trades : trades.filter(t => t.accountId === selectedAccountId),
    [trades, selectedAccountId]
  );

  const stats = useMemo(() => calculateAnalytics(filteredTrades), [filteredTrades]);

  const startingBalance = useMemo(() => {
    if (selectedAccountId === '__all__') {
      return accounts.reduce((sum, a) => sum + (a.startingBalance ?? 0), 0);
    }
    return accounts.find(a => a.id === selectedAccountId)?.startingBalance ?? 0;
  }, [accounts, selectedAccountId]);

  const handleDailyReview = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayTrades = trades.filter(t => t.date === today);
    if (todayTrades.length === 0) {
      navigate('/ai', { state: { prompt: "I haven't logged any trades today yet. What should I focus on based on my overall performance?" } });
      return;
    }
    const wins = todayTrades.filter(t => t.outcome === 'win').length;
    const losses = todayTrades.filter(t => t.outcome === 'loss').length;
    const be = todayTrades.filter(t => t.outcome === 'breakeven').length;
    const totalPnl = todayTrades.reduce((sum, t) => sum + t.pnl, 0);
    const summary = [
      `TODAY'S TRADES (${today}):`,
      `Total: ${todayTrades.length} | Wins: ${wins} | Losses: ${losses} | BE: ${be}`,
      `P&L: $${totalPnl.toFixed(2)}`,
      ...todayTrades.map(t => `  ${t.instrument} ${t.direction} — ${t.outcome.toUpperCase()} — $${t.pnl.toFixed(2)}`)
    ].join('\n');
    navigate('/ai', { state: { prompt: "Give me a daily review of my trading today.", extraContext: summary } });
  };

  const loadDemoData = useCallback(async () => {
    const accountId = accounts[0]?.id;
    if (!accountId) return;
    setLoadingDemo(true);
    try {
      const today = new Date();
      const demoTrades = [
        { date: new Date(today.getTime() - 6 * 86400000).toISOString().slice(0, 10), instrument: 'XAUUSD', direction: 'long' as const, strategy: 'CISD', session: 'London', outcome: 'win' as const, pnl: 320, rMultiple: 2.5, riskPercent: 1, htfBias: 'Bullish', emotionalState: 4, confidenceLevel: 5, followedPlan: true, notes: 'Clean CISD setup on gold.', accountId, timeInTrade: 45 },
        { date: new Date(today.getTime() - 5 * 86400000).toISOString().slice(0, 10), instrument: 'NAS100', direction: 'short' as const, strategy: 'IFVG', session: 'New York', outcome: 'loss' as const, pnl: -150, rMultiple: -1, riskPercent: 1, htfBias: 'Bearish', emotionalState: 2, confidenceLevel: 3, followedPlan: false, notes: 'Entered too early.', accountId, timeInTrade: 20 },
        { date: new Date(today.getTime() - 4 * 86400000).toISOString().slice(0, 10), instrument: 'EUR/USD', direction: 'long' as const, strategy: 'Both', session: 'London/NY Overlap', outcome: 'win' as const, pnl: 210, rMultiple: 1.8, riskPercent: 1.5, htfBias: 'Bullish', emotionalState: 4, confidenceLevel: 4, followedPlan: true, notes: 'Solid overlap session.', accountId, timeInTrade: 60 },
        { date: new Date(today.getTime() - 3 * 86400000).toISOString().slice(0, 10), instrument: 'GBP/USD', direction: 'short' as const, strategy: 'CISD', session: 'London', outcome: 'breakeven' as const, pnl: 0, rMultiple: 0, riskPercent: 1, htfBias: 'Neutral', emotionalState: 3, confidenceLevel: 3, followedPlan: true, notes: 'BE stop.', accountId, timeInTrade: 35 },
        { date: new Date(today.getTime() - 2 * 86400000).toISOString().slice(0, 10), instrument: 'XAUUSD', direction: 'long' as const, strategy: 'IFVG', session: 'New York', outcome: 'win' as const, pnl: 480, rMultiple: 3.2, riskPercent: 1, htfBias: 'Bullish', emotionalState: 5, confidenceLevel: 5, followedPlan: true, notes: 'Perfect IFVG entry.', accountId, timeInTrade: 90 },
        { date: new Date(today.getTime() - 1 * 86400000).toISOString().slice(0, 10), instrument: 'US30', direction: 'short' as const, strategy: 'CISD', session: 'New York', outcome: 'loss' as const, pnl: -130, rMultiple: -0.9, riskPercent: 1, htfBias: 'Bearish', emotionalState: 2, confidenceLevel: 2, followedPlan: false, notes: 'Revenge trade.', accountId, timeInTrade: 15 },
        { date: today.toISOString().slice(0, 10), instrument: 'BTC/USD', direction: 'long' as const, strategy: 'Both', session: 'Asian', outcome: 'win' as const, pnl: 275, rMultiple: 2.0, riskPercent: 1.5, htfBias: 'Bullish', emotionalState: 4, confidenceLevel: 4, followedPlan: true, notes: 'Asian session breakout.', accountId, timeInTrade: 55 },
      ];
      for (const t of demoTrades) await addTrade(t);
      toast.success('Demo data loaded — 7 sample trades added!');
    } catch (e: any) {
      toast.error(e.message || 'Failed to load demo data');
    } finally {
      setLoadingDemo(false);
    }
  }, [accounts, addTrade]);

  // No accounts state
  if (accounts.length === 0) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Wallet className="h-8 w-8 text-gray-400 mb-4" weight="regular" />
          <h1 className="text-xl font-semibold text-gray-900 mb-1">{getGreeting()}, {profile?.nickname || 'Trader'}</h1>
          <p className="text-xs text-gray-500 mb-5">Add a trading account to get started.</p>
          <Link to="/accounts">
            <Button size="sm" className="gap-1.5"><Wallet className="h-3.5 w-3.5" weight="regular" /> Add Account</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  // No trades state
  if (trades.length === 0) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <ChartBar className="h-8 w-8 text-gray-400 mb-4" weight="regular" />
          <h1 className="text-xl font-semibold text-gray-900 mb-1">{getGreeting()}, {profile?.nickname || 'Trader'}</h1>
          <p className="text-xs text-gray-500 mb-5">Log your first trade to unlock analytics.</p>
          <div className="flex gap-3">
            <Link to="/add-trade">
              <Button size="sm" className="gap-1.5 bg-gray-900 text-white hover:bg-gray-800 rounded-[24px]">
                <Plus className="h-3.5 w-3.5" weight="bold" /> Log First Trade
              </Button>
            </Link>
            <Button size="sm" variant="outline" className="gap-1.5 rounded-full" onClick={loadDemoData} disabled={loadingDemo}>
              <ChartBar className="h-3.5 w-3.5" weight="regular" /> {loadingDemo ? 'Loading...' : 'Load Demo Data'}
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-[24px] font-bold text-gray-900 tracking-[-0.5px]">{getGreeting()}, {profile?.nickname || 'Trader'}</h1>
          <p className="text-xs text-gray-500">Here's your trading overview</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Account filter — only show when multiple accounts */}
          {accounts.length > 1 && (
            <>
              <Funnel className="h-3.5 w-3.5 text-gray-400" weight="regular" />
              <Select value={selectedAccountId} onValueChange={(v) => { setSelectedAccountId(v); localStorage.setItem('dashboard_account_filter', v); }}>
                <SelectTrigger className="w-[160px] h-8 text-xs border-gray-200 bg-white">
                  <SelectValue placeholder="All Accounts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Accounts</SelectItem>
                  {accounts.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}

          {/* Entry Checklist */}
          <Sheet>
            <SheetTrigger asChild>
              <button className="h-8 px-3.5 flex items-center gap-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-[24px] hover:text-gray-900 hover:border-gray-300 transition-colors outline-none">
                <ClipboardText className="h-3.5 w-3.5" weight="regular" />
                Checklist
                {!criteriaLoading && activeCriteria.length > 0 && (
                  <span className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full font-mono">{activeCriteria.length}</span>
                )}
              </button>
            </SheetTrigger>
            <SheetContent className="w-80 sm:w-96">
              <SheetHeader className="mb-5">
                <SheetTitle className="flex items-center gap-2 text-sm">
                  <CheckFat className="h-4 w-4 text-profit" weight="fill" /> Entry Checklist
                </SheetTitle>
              </SheetHeader>
              {criteriaLoading ? (
                <p className="text-xs text-muted-foreground">Loading...</p>
              ) : activeCriteria.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                  <ClipboardText className="h-6 w-6 text-gray-400" weight="regular" />
                  <p className="text-sm font-medium">No checklist yet</p>
                  <Link to="/trading-plan">
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs mt-1">
                      <Gear className="h-3.5 w-3.5" weight="regular" /> Set Up Checklist
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {(() => {
                    const grouped: Record<string, typeof activeCriteria> = {};
                    for (const c of activeCriteria) {
                      const cat = c.category || 'General';
                      if (!grouped[cat]) grouped[cat] = [];
                      grouped[cat].push(c);
                    }
                    return Object.entries(grouped).map(([category, items]) => (
                      <div key={category}>
                        <p className="text-[9px] text-gray-400 uppercase tracking-widest mb-2">{category}</p>
                        <div className="space-y-2">
                          {items.map(c => (
                            <div key={c.id} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                              <CheckFat className="h-3.5 w-3.5 text-profit shrink-0" weight="fill" />
                              <span className="text-xs">{c.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                  <div className="pt-2 border-t border-gray-100">
                    <Link to="/trading-plan">
                      <Button variant="ghost" size="sm" className="w-full gap-1.5 text-xs justify-start">
                        <Gear className="h-3.5 w-3.5" weight="regular" /> Customize Checklist
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </SheetContent>
          </Sheet>

          {/* Daily Review */}
          <button
            onClick={handleDailyReview}
            className="h-8 px-3.5 flex items-center gap-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-[24px] hover:text-gray-900 hover:border-gray-300 transition-colors outline-none"
          >
            <NotePencil className="h-3.5 w-3.5" weight="regular" />
            Daily Review
          </button>
          <Link
            to="/add-trade"
            className="h-8 px-4 text-xs font-semibold text-white bg-gray-900 hover:bg-gray-800 rounded-[24px] flex items-center gap-1.5 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" weight="bold" />
            Log Trade
          </Link>
        </div>
      </div>

      {/* Stat Bar */}
      <div className="mb-4">
        <StatBar stats={stats} trades={filteredTrades} />
      </div>

      {/* Equity Curve */}
      <div className="mb-4">
        <PremiumEquityCurve trades={filteredTrades} startingBalance={startingBalance} />
      </div>

      {/* Heat Map Calendar */}
      <div className="mb-4">
        <HeatMapCalendar trades={filteredTrades} />
      </div>

      {/* Two Column Bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <SessionPerformance trades={filteredTrades} />
        <RecentTrades trades={filteredTrades} />
      </div>

    </AppLayout>
  );
};

export default Dashboard;
