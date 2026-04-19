import { useMemo, useState, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCards } from '@/components/dashboard/StatCards';
import { PremiumEquityCurve } from '@/components/dashboard/PremiumEquityCurve';
import { HeatMapCalendar } from '@/components/dashboard/HeatMapCalendar';
import { PropFirmCard } from '@/components/dashboard/PropFirmCard';
import { DashboardRail } from '@/components/dashboard/DashboardRail';
import { useSharedTrades } from '@/contexts/TradesContext';
import { useSharedAccounts } from '@/contexts/AccountsContext';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { calculateAnalytics, getExpectancyByField } from '@/lib/analytics';
import { Wallet, ChartBar, Plus, NotePencil, Funnel, Warning } from '@phosphor-icons/react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

function LeakTeaser({ trades }: { trades: { instrument: string; pnl: number; outcome: string; session?: string }[] }) {
  const summary = useMemo(() => {
    if (trades.length < 3) return null;
    const byInstrument = getExpectancyByField(trades as any, 'instrument');
    const bySession = getExpectancyByField(trades as any, 'session');
    const combined = [...byInstrument, ...bySession]
      .filter(s => s.expectancy < 0 && s.total >= 3 && s.pnl < 0)
      .sort((a, b) => a.pnl - b.pnl)
      .slice(0, 5);
    if (combined.length === 0) return null;
    const impact = combined.reduce((s, l) => s + l.pnl, 0);
    const criticalCount = combined.filter(l => l.expectancy < -80).length;
    return { count: combined.length, impact, criticalCount };
  }, [trades]);

  if (!summary) return null;

  return (
    <Link
      to="/analyst"
      className="flex items-center gap-3 rounded-[10px] border transition-colors hover:border-[color-mix(in_oklab,var(--ef-neg)_35%,transparent)]"
      style={{
        padding: '10px 16px',
        background: 'var(--ef-neg-wash)',
        border: '1px solid color-mix(in oklab, var(--ef-neg) 20%, transparent)',
        textDecoration: 'none',
      }}
    >
      <Warning size={14} weight="fill" style={{ color: 'var(--ef-neg)', flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: 'var(--ef-ink-2)', flex: 1 }}>
        <span style={{ fontWeight: 600, color: 'var(--ef-neg)' }}>{summary.count} active leak{summary.count !== 1 ? 's' : ''}</span>
        {summary.criticalCount > 0 && (
          <span className="font-mono" style={{ fontSize: 11, marginLeft: 6, color: 'var(--ef-neg)', background: 'var(--ef-neg-wash)', padding: '1px 6px', borderRadius: 4, border: '1px solid color-mix(in oklab, var(--ef-neg) 25%, transparent)' }}>
            {summary.criticalCount} critical
          </span>
        )}
        <span className="font-mono" style={{ marginLeft: 8, color: 'var(--ef-ink-3)', fontSize: 12 }}>
          −${Math.abs(summary.impact).toLocaleString(undefined, { maximumFractionDigits: 0 })} impact detected
        </span>
      </span>
      <span className="font-mono" style={{ fontSize: 11.5, color: 'var(--ef-ink-3)', flexShrink: 0 }}>
        View analysis →
      </span>
    </Link>
  );
}

function InstrumentPerformance({ trades }: { trades: { instrument: string; pnl: number; outcome: string }[] }) {
  const pairs = useMemo(() => {
    if (trades.length === 0) return [];
    return getExpectancyByField(trades as any, 'instrument')
      .filter(p => p.total >= 2)
      .slice(0, 6);
  }, [trades]);

  if (pairs.length === 0) return null;

  const maxAbs = Math.max(...pairs.map(p => Math.abs(p.expectancy)), 1);

  return (
    <div className="rounded-[14px] border border-border bg-card" style={{ padding: '20px' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.01em', color: 'var(--ef-ink)' }}>
            Instrument performance
          </div>
          <div className="font-mono" style={{ fontSize: 12, color: 'var(--ef-ink-3)', marginTop: 2 }}>
            expectancy per trade
          </div>
        </div>
        <Link to="/analyst" className="font-mono hover:text-[var(--ef-ink)] transition-colors" style={{ fontSize: 11, color: 'var(--ef-ink-3)' }}>
          all →
        </Link>
      </div>

      <div className="flex flex-col">
        {pairs.map(pair => {
          const barPct = Math.abs(pair.expectancy) / maxAbs * 46;
          const pos = pair.pnl >= 0;
          return (
            <div key={pair.key} className="flex items-center gap-2" style={{ padding: '8px 0', fontSize: 12.5 }}>
              <div className="font-mono shrink-0" style={{ width: 64, color: 'var(--ef-ink-2)', fontWeight: 500 }}>
                {pair.key}
              </div>
              <div
                className="flex-1 relative"
                style={{ height: 6, borderRadius: 3, background: 'var(--ef-bg-sunken)', overflow: 'visible' }}
              >
                {/* Center tick */}
                <div style={{
                  position: 'absolute', left: '50%', top: -1,
                  width: 1, height: 8, background: 'var(--ef-ink-3)',
                }} />
                <div
                  style={{
                    position: 'absolute', top: 0, bottom: 0,
                    borderRadius: 3,
                    [pos ? 'left' : 'right']: '50%',
                    width: barPct + '%',
                    background: pos ? 'var(--ef-pos)' : 'var(--ef-neg)',
                  }}
                />
              </div>
              <div
                className="font-mono shrink-0 text-right"
                style={{
                  width: 56,
                  fontSize: 11.5,
                  color: pos ? 'var(--ef-pos)' : 'var(--ef-neg)',
                }}
              >
                {pos ? '+' : ''}${pair.pnl.toFixed(0)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

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

  const today = new Date();
  const monthLabel = today.toLocaleDateString('en', { month: 'long', year: 'numeric' });

  return (
    <AppLayout rail={rail}>
      {/* Topbar */}
      <div
        className="flex items-center gap-4 border-b border-border"
        style={{ paddingBottom: 12, marginBottom: 20 }}
      >
        <div className="flex-1 min-w-0">
          <h1
            style={{
              margin: 0, fontSize: 22, fontWeight: 500,
              letterSpacing: '-0.02em', color: 'var(--ef-ink)',
            }}
          >
            Dashboard
          </h1>
          <div
            className="font-mono"
            style={{ fontSize: 12.5, color: 'var(--ef-ink-3)', marginTop: 2 }}
          >
            {monthLabel} · {filteredTrades.length} trades logged
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Account filter */}
          {accounts.length > 1 && (
            <Select value={selectedAccountId} onValueChange={(v) => { setSelectedAccountId(v); localStorage.setItem('dashboard_account_filter', v); }}>
              <SelectTrigger
                className="h-[34px] text-xs font-mono border-border rounded-[10px]"
                style={{ width: 140, background: 'var(--ef-bg-elev)', fontSize: 12 }}
              >
                <Funnel className="h-3 w-3 mr-1 text-muted-foreground/50" weight="regular" />
                <SelectValue placeholder="All Accounts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Accounts</SelectItem>
                {accounts.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <button
            onClick={handleDailyReview}
            className="flex items-center gap-1.5 outline-none transition-colors"
            style={{
              height: 34, padding: '0 14px', borderRadius: 10,
              background: 'var(--ef-bg-elev)', border: '1px solid var(--ef-line)',
              fontSize: 13, fontWeight: 500, color: 'var(--ef-ink-2)',
            }}
          >
            <NotePencil className="h-3.5 w-3.5" weight="regular" />
            Daily Review
          </button>

          <Link
            to="/add-trade"
            className="flex items-center gap-1.5 outline-none transition-colors"
            style={{
              height: 34, padding: '0 14px', borderRadius: 10,
              background: 'var(--ef-ink)', color: 'var(--ef-bg)',
              fontSize: 13, fontWeight: 500,
              border: '1px solid var(--ef-ink)',
            }}
          >
            <Plus className="h-3.5 w-3.5" weight="bold" />
            Log trade
          </Link>
        </div>
      </div>

      {/* Prop Firm Challenge Card */}
      {selectedPropAccount && (
        <div style={{ marginBottom: 14 }}>
          <PropFirmCard account={selectedPropAccount} trades={filteredTrades} />
        </div>
      )}

      {/* Stat Cards */}
      <div style={{ marginBottom: 14 }}>
        <StatCards stats={stats} trades={filteredTrades} startingBalance={startingBalance} />
      </div>

      {/* Equity Curve — full width */}
      <div style={{ marginBottom: 8 }}>
        <PremiumEquityCurve trades={filteredTrades} startingBalance={startingBalance} />
      </div>

      {/* Leak teaser banner */}
      <div style={{ marginBottom: 14 }}>
        <LeakTeaser trades={filteredTrades} />
      </div>

      {/* Heat Map Calendar + Instrument Performance */}
      <div
        className="grid"
        style={{ gridTemplateColumns: '1.55fr 1fr', gap: 14, marginBottom: 14 }}
      >
        <HeatMapCalendar trades={filteredTrades} />
        <InstrumentPerformance trades={filteredTrades} />
      </div>
    </AppLayout>
  );
};

export default Dashboard;
