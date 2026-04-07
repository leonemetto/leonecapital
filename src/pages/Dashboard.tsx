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
import { Wallet, BarChart3, PlusCircle, FileText, Filter, ClipboardList, CheckSquare, Settings2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

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
  const navigate = useNavigate();
  const [selectedAccountId, setSelectedAccountId] = useState<string>('__all__');
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
          <Wallet className="h-8 w-8 text-[rgba(255,255,255,0.3)] mb-4" />
          <h1 className="text-xl font-semibold mb-1">{getGreeting()}, {profile?.nickname || 'Trader'}</h1>
          <p className="text-xs text-[rgba(255,255,255,0.35)] mb-5">Add a trading account to get started.</p>
          <Link to="/accounts">
            <Button size="sm" className="gap-1.5"><Wallet className="h-3.5 w-3.5" /> Add Account</Button>
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
          <BarChart3 className="h-8 w-8 text-[rgba(255,255,255,0.3)] mb-4" />
          <h1 className="text-xl font-semibold mb-1">{getGreeting()}, {profile?.nickname || 'Trader'}</h1>
          <p className="text-xs text-[rgba(255,255,255,0.35)] mb-5">Log your first trade to unlock analytics.</p>
          <div className="flex gap-3">
            <Link to="/add-trade">
              <Button size="sm" className="gap-1.5 bg-white text-black hover:bg-white/90 rounded-[24px]">
                <PlusCircle className="h-3.5 w-3.5" /> Log First Trade
              </Button>
            </Link>
            <Button size="sm" variant="outline" className="gap-1.5 rounded-full" onClick={loadDemoData} disabled={loadingDemo}>
              <BarChart3 className="h-3.5 w-3.5" /> {loadingDemo ? 'Loading...' : 'Load Demo Data'}
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
          <h1 className="text-[24px] font-bold text-white tracking-[-0.5px]">{getGreeting()}, {profile?.nickname || 'Trader'}</h1>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Here's your trading overview</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Account filter — only show when multiple accounts */}
          {accounts.length > 1 && (
            <>
              <Filter className="h-3.5 w-3.5 text-[rgba(255,255,255,0.3)]" />
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger className="w-[160px] h-8 text-xs border-[rgba(255,255,255,0.1)] bg-transparent">
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
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs border-[rgba(255,255,255,0.15)] bg-transparent rounded-full">
                <ClipboardList className="h-3.5 w-3.5" />
                Checklist
                {!criteriaLoading && activeCriteria.length > 0 && (
                  <span className="text-[9px] bg-[rgba(255,255,255,0.1)] px-1.5 py-0.5 rounded-full font-mono">{activeCriteria.length}</span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-80 sm:w-96">
              <SheetHeader className="mb-5">
                <SheetTitle className="flex items-center gap-2 text-sm">
                  <CheckSquare className="h-4 w-4 text-profit" /> Entry Checklist
                </SheetTitle>
              </SheetHeader>
              {criteriaLoading ? (
                <p className="text-xs text-muted-foreground">Loading...</p>
              ) : activeCriteria.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                  <ClipboardList className="h-6 w-6 text-[rgba(255,255,255,0.3)]" />
                  <p className="text-sm font-medium">No checklist yet</p>
                  <Link to="/trading-plan">
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs mt-1">
                      <Settings2 className="h-3.5 w-3.5" /> Set Up Checklist
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
                        <p className="text-[9px] text-[rgba(255,255,255,0.35)] uppercase tracking-widest mb-2">{category}</p>
                        <div className="space-y-2">
                          {items.map(c => (
                            <div key={c.id} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.07)]">
                              <CheckSquare className="h-3.5 w-3.5 text-profit shrink-0" />
                              <span className="text-xs">{c.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                  <div className="pt-2 border-t border-[rgba(255,255,255,0.05)]">
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

          {/* Quick Actions */}
          <button
            onClick={handleDailyReview}
            className="h-8 px-4 text-xs font-semibold text-[rgba(255,255,255,0.6)] border border-[rgba(255,255,255,0.15)] rounded-full hover:border-[rgba(255,255,255,0.3)] transition-colors"
          >
            <FileText className="h-3.5 w-3.5 inline mr-1.5" />
            Daily Review
          </button>
          <Link
            to="/add-trade"
            className="h-8 px-4 text-xs font-semibold text-black bg-white hover:bg-white/90 rounded-[24px] flex items-center gap-1.5 transition-colors"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Trade Entry
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SessionPerformance trades={filteredTrades} />
        <RecentTrades trades={filteredTrades} />
      </div>
    </AppLayout>
  );
};

export default Dashboard;
