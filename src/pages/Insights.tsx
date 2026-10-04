import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Plus, UploadSimple } from '@phosphor-icons/react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { CountTabs, EmptyState, Segmented, Surface } from '@/components/ef/primitives';
import { BreakdownTab } from '@/components/insights/BreakdownTab';
import { LeaksTab } from '@/components/insights/LeaksTab';
import { WhatIfTab } from '@/components/insights/WhatIfTab';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';
import { useView } from '@/contexts/ViewContext';
import { useShell } from '@/components/shell/ShellContext';
import { computeLeaks, LEAK_MIN_TRADES } from '@/lib/leaks';
import { filterByRange, RANGE_OPTIONS, type RangeKey } from '@/lib/range';

type Tab = 'breakdown' | 'leaks' | 'what-if';
const TABS: Tab[] = ['breakdown', 'leaks', 'what-if'];

/**
 * Where the money is made and lost, and what to change. One page in three
 * steps: break results down, see the leaks, test a change.
 */
const Insights = () => {
  const { tab: tabParam } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { accountTrades, account } = useView();
  const { openLogTrade } = useShell();
  // Analysis defaults to everything logged: more trades, steadier conclusions.
  const [range, setRange] = useState<RangeKey>('all');
  const [showTour, setShowTour] = useState(false);

  const tab: Tab = TABS.includes(tabParam as Tab) ? (tabParam as Tab) : 'breakdown';
  const trades = useMemo(() => filterByRange(accountTrades, range), [accountTrades, range]);
  const leakCount = useMemo(() => (accountTrades.length >= LEAK_MIN_TRADES ? computeLeaks(trades).length : undefined), [trades, accountTrades.length]);

  // The guide links here with ?tour=1.
  useEffect(() => {
    if (searchParams.get('tour') !== '1') return;
    const timer = setTimeout(() => setShowTour(true), 600);
    return () => clearTimeout(timer);
  }, [searchParams]);

  const setTab = (next: Tab) => navigate(next === 'breakdown' ? '/insights' : `/insights/${next}`);

  if (accountTrades.length === 0) {
    return (
      <AppLayout>
        <PageHeader title="Insights" />
        <Surface>
          <EmptyState
            art="/art/leak-lines.webp"
            title="Insights start with your first trades"
            body="Import a statement or log a trade. Breakdowns appear at once; leak detection and what-if open at 15 trades."
          >
            <button type="button" onClick={() => navigate('/import-trades')} className="ef-btn ef-btn-primary">
              <UploadSimple className="h-3.5 w-3.5" /> Import a statement
            </button>
            <button type="button" onClick={openLogTrade} className="ef-btn ef-btn-secondary">
              <Plus className="h-3.5 w-3.5" weight="bold" /> Log a trade
            </button>
          </EmptyState>
        </Surface>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title="Insights"
        subtitle={`${trades.length} ${trades.length === 1 ? 'trade' : 'trades'} analysed${account ? ` on ${account.name}` : ''}`}
        mb={16}
        actions={
          <Segmented<RangeKey>
            ariaLabel="Date range"
            value={range}
            onChange={setRange}
            options={RANGE_OPTIONS.map(o => ({ value: o.key, label: o.short }))}
          />
        }
      />

      <CountTabs<Tab>
        ariaLabel="Insights sections"
        value={tab}
        onChange={setTab}
        className="mb-4"
        tabs={[
          { key: 'breakdown', label: 'Breakdown' },
          { key: 'leaks', label: 'Leaks', count: leakCount, tone: 'warn' },
          { key: 'what-if', label: 'What-if', tour: 'simulator' },
        ]}
      />

      {tab === 'breakdown' && <BreakdownTab trades={trades} />}
      {tab === 'leaks' && <LeaksTab trades={trades} totalTrades={accountTrades.length} />}
      {tab === 'what-if' && <WhatIfTab trades={trades} totalTrades={accountTrades.length} />}

      {showTour && (
        <OnboardingTour
          onComplete={() => {
            setShowTour(false);
            setSearchParams({}, { replace: true });
          }}
        />
      )}
    </AppLayout>
  );
};

export default Insights;
