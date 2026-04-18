import { useMemo, useState, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { HeroBalance } from '@/components/dashboard/HeroBalance';
import { StatCards } from '@/components/dashboard/StatCards';
import { PremiumEquityCurve } from '@/components/dashboard/PremiumEquityCurve';
import { HeatMapCalendar } from '@/components/dashboard/HeatMapCalendar';
import { RecentTrades } from '@/components/dashboard/RecentTrades';
import { PropFirmCard } from '@/components/dashboard/PropFirmCard';
import { DashboardRail } from '@/components/dashboard/DashboardRail';
import { useSharedTrades } from '@/contexts/TradesContext';
import { useSharedAccounts } from '@/contexts/AccountsContext';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { calculateAnalytics } from '@/lib/analytics';
import { Wallet, ChartBar, Plus, NotePencil, Funnel } from '@phosphor-icons/react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

  const selectedPropAccount = useMemo(() => {
    if (selectedAccountId === '__all__') return null;
    const acct = accounts.find(a => a.id === selectedAccountId);
    return acct?.type === 'prop' ? acct : null;
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
          <Wallet className="h-8 w-8 text-muted-foreground/30 mb-4" weight="regular" />
          <h1 className="text-xl font-semibold mb-1">{getGreeting()}, {profile?.nickname || 'Trader'}</h1>
          <p className="text-xs text-muted-foreground mb-5">Add a trading account to get started.</p>
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
          <ChartBar className="h-8 w-8 text-muted-foreground/30 mb-4" weight="regular" />
          <h1 className="text-xl font-semibold mb-1">{getGreeting()}, {profile?.nickname || 'Trader'}</h1>
          <p className="text-xs text-muted-foreground mb-5">Log your first trade to unlock analytics.</p>
          <div className="flex gap-3">
            <Link to="/add-trade">
              <Button size="sm" className="gap-1.5 rounded-[24px]">
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

  const rail = (
    <DashboardRail
      trades={filteredTrades}
      stats={stats}
      accounts={accounts}
      selectedAccountId={selectedAccountId}
      selectedPropAccount={selectedPropAccount}
    />
  );

  return (
    <AppLayout rail={rail}>
      {/* Hero Balance */}
      <HeroBalance
        nickname={profile?.nickname || 'Trader'}
        stats={stats}
        trades={filteredTrades}
        accounts={accounts}
        selectedAccountId={selectedAccountId}
      />

      {/* Action row */}
      <div className="flex items-center gap-2 mb-4">
        {accounts.length > 1 && (
          <>
            <Funnel className="h-3.5 w-3.5 text-muted-foreground/40" weight="regular" />
            <Select value={selectedAccountId} onValueChange={(v) => { setSelectedAccountId(v); localStorage.setItem('dashboard_account_filter', v); }}>
              <SelectTrigger className="w-[160px] h-7 text-xs">
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
        <div className="flex-1" />
        <button
          onClick={handleDailyReview}
          className="h-7 px-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground border border-border rounded-[24px] hover:text-foreground hover:border-foreground/25 transition-colors outline-none"
        >
          <NotePencil className="h-3.5 w-3.5" weight="regular" />
          Daily Review
        </button>
        <Link
          to="/add-trade"
          className="h-7 px-3.5 text-xs font-semibold text-background bg-foreground hover:opacity-80 rounded-[24px] flex items-center gap-1.5 transition-opacity"
        >
          <Plus className="h-3.5 w-3.5" weight="bold" />
          Log Trade
        </Link>
      </div>

      {/* Prop Firm Challenge Card */}
      {selectedPropAccount && (
        <div className="mb-4">
          <PropFirmCard account={selectedPropAccount} trades={filteredTrades} />
        </div>
      )}

      {/* Stat Cards */}
      <div className="mb-4">
        <StatCards stats={stats} trades={filteredTrades} />
      </div>

      {/* Equity Curve */}
      <div className="mb-4">
        <PremiumEquityCurve trades={filteredTrades} startingBalance={startingBalance} />
      </div>

      {/* Heat Map Calendar */}
      <div className="mb-4">
        <HeatMapCalendar trades={filteredTrades} />
      </div>

      {/* Recent Trades */}
      <div className="mb-4">
        <RecentTrades trades={filteredTrades} />
      </div>
    </AppLayout>
  );
};

export default Dashboard;
