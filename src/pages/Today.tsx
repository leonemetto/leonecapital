import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowRight, Check, Compass, NotePencil, Plus, UploadSimple, Wallet } from '@phosphor-icons/react';
import { AppLayout } from '@/components/layout/AppLayout';
import { EmptyState, Meter, Segmented, Stat, Surface } from '@/components/ef/primitives';
import { TradeTape } from '@/components/ef/TradeTape';
import { EquityChart } from '@/components/today/EquityChart';
import { PnlCalendar } from '@/components/today/PnlCalendar';
import { ActiveChallenges } from '@/components/dashboard/ChallengeCard';
import { UpgradeModal } from '@/components/billing/UpgradeModal';
import { useSharedTrades } from '@/contexts/TradesContext';
import { useSharedAccounts } from '@/contexts/AccountsContext';
import { useSharedSubscription } from '@/contexts/SubscriptionContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useView } from '@/contexts/ViewContext';
import { useLeaks } from '@/contexts/LeaksContext';
import { useProfile } from '@/hooks/useProfile';
import { useGoals } from '@/hooks/useGoals';
import { useDailyJournals, hasJournalContent } from '@/hooks/useDailyJournal';
import { useInvalidateSubscription } from '@/hooks/useSubscription';
import { useShell } from '@/components/shell/ShellContext';
import { useSessionStatus } from '@/components/shell/SessionStrip';
import { calculateAnalytics, getCurrentRiskStatus, getExpectancyByField } from '@/lib/analytics';
import { filterByWindow, previousWindow, rangeLabel, rangeStart, RANGE_OPTIONS, type RangeKey } from '@/lib/range';
import { setPendingImportFile } from '@/lib/pendingImport';
import { cn, parseLocalDate, todayLocal } from '@/lib/utils';
import { fmtMoney, fmtPct, fmtR, fmtSignedMoney, toneOf, TONE_CLASS } from '@/lib/format';
import type { Trade } from '@/types/trade';

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const dayName = (date: string) =>
  parseLocalDate(date).toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'short' });

/* ─── Trial strip ─── */
function TrialStrip({ onUpgrade }: { onUpgrade: () => void }) {
  const { hasProAccess, isTrialing, isTrialExpired, trialEndsAt } = useSharedSubscription();
  if (hasProAccess && !isTrialing) return null;
  if (!isTrialing && !isTrialExpired) return null;

  const daysLeft = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / 86_400_000)) : 0;
  const urgent = isTrialExpired || daysLeft <= 3;

  return (
    <div
      className={cn(
        'mb-4 flex flex-col gap-2 rounded-control border px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between',
        urgent ? 'border-transparent bg-ef-warn-wash' : 'border-ef-line bg-ef-elev',
      )}
    >
      <p className="m-0 text-[13px] text-ef-ink-2">
        <span className={cn('ef-num', urgent ? 'text-ef-warn' : 'text-ef-ink')}>
          {isTrialExpired ? 'Trial ended' : `Trial: ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left`}
        </span>{' '}
        · Upgrade when EdgeFlow earns its place.
      </p>
      <button type="button" onClick={onUpgrade} className="ef-btn ef-btn-primary ef-btn-sm self-start sm:self-auto">
        Upgrade to Pro
      </button>
    </div>
  );
}

/* ─── Needs attention ─── */
interface AttentionItem {
  id: string;
  tone: 'neg' | 'warn' | 'flat';
  text: React.ReactNode;
  action: string;
  onAction: () => void;
}

function AttentionList({ items }: { items: AttentionItem[] }) {
  return (
    <Surface className="flex flex-col">
      <div className="flex items-center justify-between px-5 pb-2 pt-4">
        <p className="ef-label m-0">Needs attention</p>
        {items.length > 0 && <span className="ef-num text-[11.5px] text-ef-ink-3">{items.length}</span>}
      </div>
      {items.length === 0 ? (
        <div className="flex flex-1 items-center gap-3 px-5 pb-5 pt-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ef-sunken text-ef-ink-2">
            <Check className="h-3.5 w-3.5" weight="bold" />
          </span>
          <div>
            <p className="m-0 text-[13.5px] font-medium text-ef-ink">You're caught up</p>
            <p className="m-0 mt-0.5 text-[12.5px] text-ef-ink-3">Every trade is reviewed and nothing has crossed a limit.</p>
          </div>
        </div>
      ) : (
        <ul className="m-0 list-none px-5 pb-2">
          {items.map(item => (
            <li key={item.id} className="flex items-center gap-3 border-t border-ef-line py-3 first:border-t-0">
              <span
                aria-hidden
                className={cn(
                  'h-1.5 w-1.5 shrink-0 rounded-full',
                  item.tone === 'neg' ? 'bg-ef-neg' : item.tone === 'warn' ? 'bg-ef-warn' : 'bg-ef-ink-4',
                )}
              />
              <p className="m-0 min-w-0 flex-1 text-[13px] leading-snug text-ef-ink-2">{item.text}</p>
              <button type="button" onClick={item.onAction} className="ef-btn ef-btn-secondary ef-btn-sm shrink-0">
                {item.action}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Surface>
  );
}

/* ─── What moved the result ─── */
function Movers({ trades }: { trades: Trade[] }) {
  const rows = useMemo(() => {
    const seg = (field: 'instrument' | 'session', kind: string) =>
      getExpectancyByField(trades, field)
        .filter(r => r.key && r.key !== 'Unknown' && r.trades >= 2)
        .map(r => ({ key: `${kind}:${r.key}`, name: r.key, kind, pnl: r.pnl, trades: r.trades, winRate: r.winRate }));
    const all = [...seg('instrument', 'Instrument'), ...seg('session', 'Session')].sort((a, b) => b.pnl - a.pnl);
    if (all.length <= 6) return all;
    return [...all.slice(0, 3), ...all.slice(-3)];
  }, [trades]);

  if (rows.length === 0) return null;
  const maxAbs = Math.max(...rows.map(r => Math.abs(r.pnl)), 1);

  return (
    <Surface>
      <div className="flex items-center justify-between gap-3 px-5 pb-2 pt-4">
        <p className="ef-label m-0 truncate">What moved the result</p>
        <Link to="/insights" className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[12px] text-ef-ink-3 underline-offset-2 hover:text-ef-ink hover:underline">
          Full breakdown <ArrowRight className="h-3 w-3" weight="bold" />
        </Link>
      </div>
      <ul className="m-0 list-none px-5 pb-4">
        {rows.map(r => {
          const pos = r.pnl >= 0;
          const width = Math.max(2, (Math.abs(r.pnl) / maxAbs) * 50);
          return (
            <li key={r.key} className="grid grid-cols-[minmax(0,116px)_minmax(0,1fr)_auto] items-center gap-3 border-t border-ef-line py-2.5 first:border-t-0">
              <div className="min-w-0">
                <p className="m-0 truncate text-[13px] font-medium text-ef-ink">{r.name}</p>
                <p className="ef-num m-0 text-[10.5px] text-ef-ink-4">{r.kind} · {r.trades} trades</p>
              </div>
              <div className="relative h-2" aria-hidden>
                <span className="absolute inset-y-[-3px] left-1/2 w-px bg-ef-line-strong" />
                <span
                  className="absolute inset-y-0 rounded-[1px]"
                  style={{ [pos ? 'left' : 'right']: '50%', width: `${width}%`, background: pos ? 'var(--ef-pos)' : 'var(--ef-neg)' }}
                />
              </div>
              <span className={cn('ef-num w-[72px] text-right text-[13px]', TONE_CLASS[toneOf(r.pnl)])}>{fmtSignedMoney(r.pnl)}</span>
            </li>
          );
        })}
      </ul>
    </Surface>
  );
}

/* ─── Latest trades ─── */
function RecentTrades({ trades, onOpen }: { trades: Trade[]; onOpen: (id: string, queue: string[]) => void }) {
  const latest = useMemo(
    () => [...trades].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)).slice(0, 6),
    [trades],
  );
  if (latest.length === 0) return null;
  const queue = latest.map(t => t.id);

  return (
    <Surface>
      <div className="flex items-center justify-between px-5 pb-1 pt-4">
        <p className="ef-label m-0">Latest trades</p>
        <Link to="/journal" className="inline-flex items-center gap-1 text-[12px] text-ef-ink-3 underline-offset-2 hover:text-ef-ink hover:underline">
          All trades <ArrowRight className="h-3 w-3" weight="bold" />
        </Link>
      </div>
      <ul className="m-0 list-none px-3 pb-2">
        {latest.map(t => (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => onOpen(t.id, queue)}
              className="ef-focus flex h-10 w-full items-center gap-3 rounded-[8px] px-2 text-left transition-colors hover:bg-ef-hover"
            >
              <span className="ef-num w-11 shrink-0 text-[11.5px] text-ef-ink-4">
                {parseLocalDate(t.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
              </span>
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ef-ink">
                {t.instrument}
                <span className="ml-2 font-normal text-ef-ink-4">{t.direction === 'long' ? 'Long' : 'Short'}</span>
              </span>
              {t.followedPlan === undefined && <span aria-label="Needs review" title="Needs review" className="h-1.5 w-1.5 shrink-0 rounded-full bg-ef-warn" />}
              <span className={cn('ef-num w-[76px] shrink-0 text-right text-[13px]', TONE_CLASS[toneOf(t.pnl)])}>{fmtSignedMoney(t.pnl)}</span>
            </button>
          </li>
        ))}
      </ul>
    </Surface>
  );
}

/* ─── Page ─── */
const Today = () => {
  const { trades: allTrades, addTrade, isLoading } = useSharedTrades();
  const { accounts } = useSharedAccounts();
  const { countBreakevenInWinRate } = useSettings();
  const { range, setRange, account, accountTrades, scaledTrades, rangeTrades, baseBalance } = useView();
  const { leaks, newLeakCount } = useLeaks();
  const { profile } = useProfile();
  const { goals } = useGoals();
  const { journals } = useDailyJournals();
  const session = useSessionStatus();
  const { openLogTrade, openDayReview, openAtlas, openTrade } = useShell();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const invalidateSubscription = useInvalidateSubscription();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Lemon Squeezy returns to /dashboard?payment=success after checkout.
  useEffect(() => {
    if (searchParams.get('payment') === 'success') {
      invalidateSubscription();
      toast.success('Payment received. Your plan is upgraded.');
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => calculateAnalytics(rangeTrades, { countBreakevenInWinRate }), [rangeTrades, countBreakevenInWinRate]);
  const hasR = rangeTrades.some(t => t.rMultiple != null);

  const previous = useMemo(() => {
    const win = previousWindow(range);
    if (!win) return null;
    const prior = filterByWindow(scaledTrades, win.start, win.end);
    return prior.length ? prior.reduce((s, t) => s + t.pnl, 0) : null;
  }, [scaledTrades, range]);

  // Balance at the start of the range = base balance plus every earlier trade.
  const openingBalance = useMemo(() => {
    const start = rangeStart(range);
    if (!start) return baseBalance;
    return baseBalance + scaledTrades.filter(t => t.date.slice(0, 10) < start).reduce((s, t) => s + t.pnl, 0);
  }, [scaledTrades, baseBalance, range]);
  const balance = baseBalance + scaledTrades.reduce((s, t) => s + t.pnl, 0);

  const attention = useMemo<AttentionItem[]>(() => {
    const items: AttentionItem[] = [];

    if (session.limit && session.limitState === 'breached') {
      items.push({
        id: 'limit',
        tone: 'neg',
        text: <>Daily loss limit reached: <b className="ef-num font-medium text-ef-neg">{fmtMoney(session.lossUsed)}</b> of {fmtMoney(session.limit)}. Stop for today.</>,
        action: 'Review today',
        onAction: () => openDayReview(session.today),
      });
    } else if (session.limit && session.limitState === 'near') {
      items.push({
        id: 'limit',
        tone: 'warn',
        text: <>{Math.round(session.limitPct)}% of your daily loss limit is used. <span className="ef-num">{fmtMoney(session.limit - session.lossUsed)}</span> of room left.</>,
        action: 'Review today',
        onAction: () => openDayReview(session.today),
      });
    }

    const untagged = accountTrades.filter(t => t.followedPlan === undefined);
    if (untagged.length > 0) {
      items.push({
        id: 'review',
        tone: 'warn',
        text: <><b className="font-medium text-ef-ink">{untagged.length} {untagged.length === 1 ? 'trade is' : 'trades are'}</b> waiting for a plan tag.</>,
        action: 'Review',
        onAction: () => navigate('/journal?tab=review'),
      });
    }

    if (newLeakCount > 0 && leaks[0]) {
      const top = leaks[0];
      items.push({
        id: 'leak',
        tone: 'neg',
        text: <>New leak: <b className="font-medium text-ef-ink">{top.title}</b>, <span className="ef-num text-ef-neg">{fmtSignedMoney(top.pnl)}</span> over {top.trades} trades.</>,
        action: 'Open',
        onAction: () => navigate('/insights/leaks'),
      });
    }

    const lastDay = accountTrades.reduce<string | null>((latest, t) => {
      const d = t.date.slice(0, 10);
      return !latest || d > latest ? d : latest;
    }, null);
    if (lastDay && !hasJournalContent(journals[lastDay])) {
      items.push({
        id: 'note',
        tone: 'flat',
        text: <>No session note for {lastDay === todayLocal() ? 'today' : dayName(lastDay)}.</>,
        action: 'Write',
        onAction: () => openDayReview(lastDay),
      });
    }

    const risk = getCurrentRiskStatus(scaledTrades);
    if (risk.status !== 'green') {
      items.push({
        id: 'risk',
        tone: risk.status === 'red' ? 'neg' : 'warn',
        text: risk.message,
        action: 'Ask Atlas',
        onAction: () => openAtlas({ prompt: 'I am in a drawdown. What is driving it and what should I change this week?' }),
      });
    }
    return items;
  }, [session, accountTrades, newLeakCount, leaks, journals, scaledTrades, navigate, openDayReview, openAtlas]);

  const loadDemoData = useCallback(async () => {
    const accountId = accounts[0]?.id;
    if (!accountId) return;
    setLoadingDemo(true);
    try {
      const now = Date.now();
      const day = (back: number) => new Date(now - back * 86_400_000).toISOString().slice(0, 10);
      const demoTrades = [
        { date: day(6), instrument: 'XAUUSD', direction: 'long' as const, strategy: 'Trend Continuation', session: 'London', outcome: 'win' as const, pnl: 320, rMultiple: 2.5, riskPercent: 1, htfBias: 'Bullish', emotionalState: 4, confidenceLevel: 5, followedPlan: true, notes: 'Clean continuation setup on gold.', accountId, timeInTrade: 45 },
        { date: day(5), instrument: 'NAS100', direction: 'short' as const, strategy: 'Reversal', session: 'New York', outcome: 'loss' as const, pnl: -150, rMultiple: -1, riskPercent: 1, htfBias: 'Bearish', emotionalState: 2, confidenceLevel: 3, followedPlan: false, notes: 'Entered too early.', accountId, timeInTrade: 20 },
        { date: day(4), instrument: 'EUR/USD', direction: 'long' as const, strategy: 'Breakout', session: 'London/NY Overlap', outcome: 'win' as const, pnl: 210, rMultiple: 1.8, riskPercent: 1.5, htfBias: 'Bullish', emotionalState: 4, confidenceLevel: 4, followedPlan: true, notes: 'Solid overlap session.', accountId, timeInTrade: 60 },
        { date: day(3), instrument: 'GBP/USD', direction: 'short' as const, strategy: 'Trend Continuation', session: 'London', outcome: 'breakeven' as const, pnl: 0, rMultiple: 0, riskPercent: 1, htfBias: 'Neutral', emotionalState: 3, confidenceLevel: 3, followedPlan: true, notes: 'Stopped at breakeven.', accountId, timeInTrade: 35 },
        { date: day(2), instrument: 'XAUUSD', direction: 'long' as const, strategy: 'Reversal', session: 'New York', outcome: 'win' as const, pnl: 480, rMultiple: 3.2, riskPercent: 1, htfBias: 'Bullish', emotionalState: 5, confidenceLevel: 5, followedPlan: true, notes: 'Patient entry, held to target.', accountId, timeInTrade: 90 },
        { date: day(1), instrument: 'US30', direction: 'short' as const, strategy: 'Trend Continuation', session: 'New York', outcome: 'loss' as const, pnl: -130, rMultiple: -0.9, riskPercent: 1, htfBias: 'Bearish', emotionalState: 2, confidenceLevel: 2, followedPlan: false, notes: 'Revenge trade.', accountId, timeInTrade: 15 },
        { date: day(0), instrument: 'BTC/USD', direction: 'long' as const, strategy: 'Breakout', session: 'Asian', outcome: 'win' as const, pnl: 275, rMultiple: 2.0, riskPercent: 1.5, htfBias: 'Bullish', emotionalState: 4, confidenceLevel: 4, followedPlan: true, notes: 'Asian session breakout.', accountId, timeInTrade: 55 },
      ];
      for (const t of demoTrades) await addTrade(t);
      toast.success('Seven sample trades added');
    } catch (e: any) {
      toast.error(e.message || 'Could not load the sample trades');
    } finally {
      setLoadingDemo(false);
    }
  }, [accounts, addTrade]);

  const handleDrop = (file: File | undefined) => {
    setDragOver(false);
    if (!file) return;
    setPendingImportFile(file);
    navigate('/import-trades');
  };

  const header = (
    <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="m-0 text-[22px] font-medium leading-tight tracking-[-0.02em] text-ef-ink">
          {greeting()}, {profile?.nickname || 'trader'}
        </h1>
        <p className="m-0 mt-1 text-[13px] text-ef-ink-3">
          {dayName(todayLocal())}
          <span className="mx-1.5 text-ef-ink-4">·</span>
          {account ? account.name : accounts.length > 1 ? 'All accounts' : accounts[0]?.name ?? 'No account yet'}
        </p>
      </div>
    </header>
  );

  if (isLoading) {
    return (
      <AppLayout>
        <div aria-busy="true" aria-label="Loading today">
          <div className="h-7 w-56 animate-pulse rounded-chip bg-ef-sunken" />
          <div className="mt-6 h-[300px] animate-pulse rounded-surface bg-ef-sunken" />
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <div className="h-44 animate-pulse rounded-surface bg-ef-sunken" />
            <div className="h-44 animate-pulse rounded-surface bg-ef-sunken" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (accounts.length === 0) {
    return (
      <AppLayout>
        <TrialStrip onUpgrade={() => setUpgradeOpen(true)} />
        {header}
        <Surface>
          <EmptyState title="Add a trading account to begin" body="Trades, balances and limits are tracked per account. One takes a few seconds to set up.">
            <Link to="/accounts" className="ef-btn ef-btn-primary">
              <Wallet className="h-3.5 w-3.5" /> Add an account
            </Link>
          </EmptyState>
        </Surface>
        <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
      </AppLayout>
    );
  }

  // First run: lead with the fastest path to a result, a statement import.
  if (allTrades.length === 0) {
    return (
      <AppLayout>
        <TrialStrip onUpgrade={() => setUpgradeOpen(true)} />
        {header}
        <Surface className="overflow-hidden">
          <div className="grid items-center gap-6 p-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] md:p-8">
            <div className="min-w-0">
              <p className="ef-label m-0">Start here</p>
              <h2 className="m-0 mt-2 max-w-[18ch] text-[26px] font-medium leading-[1.12] tracking-[-0.03em] text-ef-ink" style={{ textWrap: 'balance' }}>
                Drop in a broker statement and see where the money goes
              </h2>
              <p className="m-0 mt-3 max-w-[46ch] text-[13.5px] leading-relaxed text-ef-ink-3">
                EdgeFlow reads an MT4, MT5 or CSV export and finds the instruments, sessions and habits that cost you the most. No manual entry needed first.
              </p>
              <label
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); handleDrop(e.dataTransfer.files?.[0]); }}
                className={cn(
                  'mt-6 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-surface border border-dashed px-4 py-7 text-center transition-colors focus-within:border-ef-ink-3',
                  dragOver ? 'border-ef-ink-3 bg-ef-hover' : 'border-ef-line-strong bg-ef-bg hover:border-ef-ink-3',
                )}
              >
                <UploadSimple className="h-5 w-5 text-ef-ink-3" />
                <span className="text-[13.5px] font-medium text-ef-ink">Drop a .csv statement here</span>
                <span className="text-[12px] text-ef-ink-3">or click to choose a file</span>
                <input type="file" accept=".csv" className="sr-only" onChange={e => handleDrop(e.target.files?.[0])} />
              </label>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button type="button" onClick={openLogTrade} className="ef-btn ef-btn-secondary">
                  <Plus className="h-3.5 w-3.5" weight="bold" /> Log a trade by hand
                </button>
                <button type="button" onClick={loadDemoData} disabled={loadingDemo} className="ef-btn ef-btn-ghost">
                  {loadingDemo ? 'Adding sample trades…' : 'Try it with sample trades'}
                </button>
              </div>
            </div>
            <img src="/art/statement-flow.webp" alt="" className="ef-art hidden w-full md:block" />
          </div>
        </Surface>
        <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
      </AppLayout>
    );
  }

  const delta = previous != null ? stats.netPnl - previous : null;

  return (
    <AppLayout>
      <TrialStrip onUpgrade={() => setUpgradeOpen(true)} />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="m-0 text-[22px] font-medium leading-tight tracking-[-0.02em] text-ef-ink">
            {greeting()}, {profile?.nickname || 'trader'}
          </h1>
          <p className="m-0 mt-1 text-[13px] text-ef-ink-3">
            {dayName(todayLocal())}
            <span className="mx-1.5 text-ef-ink-4">·</span>
            {account ? account.name : accounts.length > 1 ? 'All accounts' : accounts[0].name}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented<RangeKey>
            ariaLabel="Date range"
            value={range}
            onChange={setRange}
            options={RANGE_OPTIONS.map(o => ({ value: o.key, label: o.short }))}
          />
          <button type="button" onClick={() => openDayReview(todayLocal())} className="ef-btn ef-btn-secondary">
            <NotePencil className="h-3.5 w-3.5" /> Review today
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {/* Band 1: the number, then how it was made */}
        <Surface>
          <div className="grid lg:grid-cols-[minmax(300px,0.82fr)_minmax(0,1.3fr)]">
            <div className="flex min-w-0 flex-col p-5 lg:p-6">
              <p className="ef-label m-0">Net P&amp;L · {rangeLabel(range)}</p>
              <p className={cn('ef-num m-0 mt-3 text-[clamp(38px,4.6vw,56px)] font-medium leading-[0.95] tracking-[-0.05em]', TONE_CLASS[toneOf(stats.netPnl)])}>
                {fmtSignedMoney(stats.netPnl)}
              </p>
              <p className="ef-num m-0 mt-3 min-h-[18px] text-[12px] text-ef-ink-3">
                {delta != null ? (
                  <>
                    <span className={TONE_CLASS[toneOf(delta)]}>{fmtSignedMoney(delta)}</span> against the previous period
                  </>
                ) : rangeTrades.length === 0 ? 'No trades in this range yet' : `${rangeTrades.length} trades in this range`}
              </p>
              <dl className="m-0 mt-6 grid gap-x-4 gap-y-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(96px, 1fr))' }}>
                <Stat label="Trades" value={String(stats.totalTrades)} />
                <Stat label="Win rate" value={stats.totalTrades ? fmtPct(stats.winRate) : '—'} />
                <Stat label="Avg R" value={hasR ? fmtR(stats.rExpectancy, 2) : '—'} />
                <Stat label="Drawdown" value={stats.maxDrawdown > 0 ? fmtMoney(stats.maxDrawdown) : '—'} />
              </dl>
              {rangeTrades.length > 0 && (
                <div className="mt-auto pt-6">
                  <p className="ef-label m-0 mb-2">Trade tape</p>
                  <TradeTape trades={rangeTrades} onSelect={t => openTrade(t.id)} />
                </div>
              )}
            </div>
            <div className="flex min-w-0 flex-col border-t border-ef-line p-5 lg:border-l lg:border-t-0 lg:p-6">
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <p className="ef-label m-0">Balance</p>
                <p className="ef-num m-0 text-[15px] font-medium text-ef-ink">{fmtMoney(balance)}</p>
              </div>
              <EquityChart trades={rangeTrades} openingBalance={openingBalance} height={236} />
              <button
                type="button"
                onClick={() => openAtlas({ prompt: `Explain my results for ${rangeLabel(range).toLowerCase()}. What drove the P&L?` })}
                className="ef-btn ef-btn-ghost ef-btn-sm mt-3 self-start"
              >
                <Compass className="h-3.5 w-3.5" /> Explain this period
              </button>
            </div>
          </div>
        </Surface>

        {/* Band 2: what to do now */}
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.82fr)]">
          <AttentionList items={attention} />

          <Surface className="p-5">
            <div className="flex items-center justify-between">
              <p className="ef-label m-0">Session</p>
              <button type="button" onClick={() => openDayReview(session.today)} className="text-[12px] text-ef-ink-3 underline-offset-2 hover:text-ef-ink hover:underline">
                Review
              </button>
            </div>
            <div className="mt-3 flex items-baseline gap-3">
              <span className={cn('ef-num text-[26px] font-medium leading-none tracking-[-0.04em]', session.count ? TONE_CLASS[toneOf(session.pnl)] : 'text-ef-ink-4')}>
                {session.count ? fmtSignedMoney(session.pnl) : '—'}
              </span>
              <span className="text-[12.5px] text-ef-ink-3">
                {session.count === 0 ? 'No trades today' : `${session.count} ${session.count === 1 ? 'trade' : 'trades'} today`}
                {session.tagged > 0 && ` · ${session.onPlan} of ${session.tagged} on plan`}
              </span>
            </div>
            <div className="mt-5 flex flex-col gap-4">
              {session.limit ? (
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-[12px]">
                    <span className="text-ef-ink-3">Daily loss limit</span>
                    <span className="ef-num text-ef-ink-2">{fmtMoney(session.lossUsed)} of {fmtMoney(session.limit)}</span>
                  </div>
                  <Meter value={session.lossUsed} max={session.limit} label="Daily loss limit used" />
                </div>
              ) : (
                <p className="m-0 text-[12.5px] leading-relaxed text-ef-ink-3">
                  No daily loss limit set.{' '}
                  <Link to="/trading-plan" className="text-ef-ink underline underline-offset-2">Add one in Plan</Link> and it is tracked here.
                </p>
              )}
              {goals?.dailyTarget ? (
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-[12px]">
                    <span className="text-ef-ink-3">Daily target</span>
                    <span className="ef-num text-ef-ink-2">{fmtMoney(Math.max(0, session.pnl))} of {fmtMoney(goals.dailyTarget)}</span>
                  </div>
                  <Meter value={Math.max(0, session.pnl)} max={goals.dailyTarget} tone={session.pnl >= goals.dailyTarget ? 'pos' : 'ink'} label="Progress toward the daily target" />
                </div>
              ) : null}
            </div>
          </Surface>
        </div>

        {/* Band 3: the long view */}
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.82fr)]">
          <Surface>
            <PnlCalendar trades={scaledTrades} journals={journals} onSelectDay={openDayReview} />
          </Surface>
          <div className="flex min-w-0 flex-col gap-3">
            <Movers trades={rangeTrades} />
            <RecentTrades trades={accountTrades} onOpen={openTrade} />
          </div>
        </div>

        <ActiveChallenges accounts={account ? [account] : accounts} trades={allTrades} />
      </div>

      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </AppLayout>
  );
};

export default Today;
