import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowUpRight, ArrowDownRight, ArrowsClockwise, CaretLeft, CaretRight, DownloadSimple, FilePdf, ImageSquare,
  MagnifyingGlass, NoteBlank, Plus, Rows, UploadSimple, X, BookmarkSimple,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { CountTabs, EmptyState, Surface } from '@/components/ef/primitives';
import { FilterChip, type FilterOption } from '@/components/ef/FilterChip';
import { TradeTape } from '@/components/ef/TradeTape';
import { useSharedTrades } from '@/contexts/TradesContext';
import { useView } from '@/contexts/ViewContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useProfile } from '@/hooks/useProfile';
import { useShell } from '@/components/shell/ShellContext';
import { calculateAnalytics, exportTradesCSV } from '@/lib/analytics';
import { groupTradesForDisplay, type DisplayRow } from '@/lib/mirroredTrades';
import { filterByRange, RANGE_OPTIONS, type RangeKey } from '@/lib/range';
import { cn, parseLocalDate } from '@/lib/utils';
import { fmtPct, fmtR, fmtSignedMoney, toneOf, TONE_CLASS } from '@/lib/format';
import type { Trade } from '@/types/trade';

type TabKey = 'all' | 'win' | 'loss' | 'offplan' | 'review';
type SortField = 'date' | 'instrument' | 'r' | 'pnl';
type Density = 'compact' | 'regular';

interface Filters {
  instrument: string[];
  session: string[];
  strategy: string[];
  direction: string[];
  range: RangeKey;
}

interface SavedView {
  name: string;
  tab: TabKey;
  filters: Filters;
}

const EMPTY: Filters = { instrument: [], session: [], strategy: [], direction: [], range: 'all' };
const PAGE_SIZE = 50;
const VIEWS_KEY = 'ef-trade-views';
const DENSITY_KEY = 'ef-trade-density';

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const head = (row: DisplayRow): Trade => (row.kind === 'group' ? row.legs[0] : row.trade);
const rowPnl = (row: DisplayRow) => (row.kind === 'group' ? row.legs.reduce((s, l) => s + l.pnl, 0) : row.trade.pnl);
const rowR = (row: DisplayRow) => {
  if (row.kind === 'single') return row.trade.rMultiple;
  const rs = row.legs.map(l => l.rMultiple).filter((r): r is number => r != null);
  return rs.length ? rs.reduce((s, r) => s + r, 0) / rs.length : undefined;
};

function optionsFor(trades: Trade[], pick: (t: Trade) => string): FilterOption[] {
  const counts = new Map<string, number>();
  for (const t of trades) {
    const v = pick(t);
    if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([value, count]) => ({ value, label: value, count }));
}

const Trades = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { updateTrade, updateTradeGroup, deleteTrade, deleteTradeGroup, isLoading } = useSharedTrades();
  const { accountTrades: trades, account } = useView();
  const { countBreakevenInWinRate } = useSettings();
  const { profile } = useProfile();
  const { openTrade, openLogTrade, tradeId } = useShell();

  const [tab, setTab] = useState<TabKey>(() => (params.get('tab') as TabKey) || 'all');
  const [filters, setFilters] = useState<Filters>(() => {
    const instrument = params.get('instrument');
    return instrument ? { ...EMPTY, instrument: [instrument] } : EMPTY;
  });
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<{ field: SortField; dir: 'asc' | 'desc' }>({ field: 'date', dir: 'desc' });
  const [page, setPage] = useState(0);
  const [density, setDensity] = useState<Density>(() => readJson<Density>(DENSITY_KEY, 'regular'));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [views, setViews] = useState<SavedView[]>(() => readJson<SavedView[]>(VIEWS_KEY, []));
  const [naming, setNaming] = useState<string | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  // Deep links (command palette, Today) set the filter through the URL.
  useEffect(() => {
    const instrument = params.get('instrument');
    const nextTab = params.get('tab') as TabKey | null;
    if (!instrument && !nextTab) return;
    if (instrument) setFilters({ ...EMPTY, instrument: [instrument] });
    if (nextTab) setTab(nextTab);
    setPage(0);
    setParams({}, { replace: true });
  }, [params, setParams]);

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(0);
  };

  // Everything except the tab, so each tab's count reflects the other filters.
  const scoped = useMemo(() => {
    let result = filterByRange(trades, filters.range);
    if (filters.instrument.length) result = result.filter(t => filters.instrument.includes(t.instrument));
    if (filters.session.length) result = result.filter(t => filters.session.includes(t.session));
    if (filters.strategy.length) result = result.filter(t => filters.strategy.includes(t.strategy));
    if (filters.direction.length) result = result.filter(t => filters.direction.includes(t.direction));
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(t =>
        t.instrument.toLowerCase().includes(q) ||
        t.strategy.toLowerCase().includes(q) ||
        t.session.toLowerCase().includes(q) ||
        t.notes.toLowerCase().includes(q),
      );
    }
    return result;
  }, [trades, filters, search]);

  const byTab = (list: Trade[], key: TabKey) => {
    if (key === 'win') return list.filter(t => t.outcome === 'win');
    if (key === 'loss') return list.filter(t => t.outcome === 'loss');
    if (key === 'offplan') return list.filter(t => t.followedPlan === false);
    if (key === 'review') return list.filter(t => t.followedPlan === undefined);
    return list;
  };

  const counts = useMemo(() => {
    const n = (key: TabKey) => groupTradesForDisplay(byTab(scoped, key)).length;
    return { all: n('all'), win: n('win'), loss: n('loss'), offplan: n('offplan'), review: n('review') };
  }, [scoped]);

  const filtered = useMemo(() => byTab(scoped, tab), [scoped, tab]);
  const stats = useMemo(() => calculateAnalytics(filtered, { countBreakevenInWinRate }), [filtered, countBreakevenInWinRate]);
  const hasR = filtered.some(t => t.rMultiple != null);

  const rows = useMemo(() => {
    const list = groupTradesForDisplay(filtered);
    const dir = sort.dir === 'desc' ? -1 : 1;
    return list.sort((a, b) => {
      const ta = head(a);
      const tb = head(b);
      let cmp = 0;
      if (sort.field === 'date') cmp = ta.date.localeCompare(tb.date) || ta.createdAt.localeCompare(tb.createdAt);
      else if (sort.field === 'instrument') cmp = ta.instrument.localeCompare(tb.instrument);
      else if (sort.field === 'r') cmp = (rowR(a) ?? -Infinity) - (rowR(b) ?? -Infinity);
      else cmp = rowPnl(a) - rowPnl(b);
      return cmp * dir;
    });
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const paged = rows.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
  const queue = useMemo(() => rows.map(r => head(r).id), [rows]);

  const instrumentOptions = useMemo(() => optionsFor(trades, t => t.instrument), [trades]);
  const sessionOptions = useMemo(() => optionsFor(trades, t => t.session), [trades]);
  const strategyOptions = useMemo(() => optionsFor(trades, t => t.strategy), [trades]);

  const activeFilterCount =
    filters.instrument.length + filters.session.length + filters.strategy.length + filters.direction.length +
    (filters.range !== 'all' ? 1 : 0) + (search ? 1 : 0);

  const clearFilters = () => {
    setFilters(EMPTY);
    setSearch('');
    setPage(0);
  };

  const toggleSort = (field: SortField) =>
    setSort(prev => (prev.field === field ? { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'desc' }));

  const changeDensity = () => {
    const next: Density = density === 'regular' ? 'compact' : 'regular';
    setDensity(next);
    try { localStorage.setItem(DENSITY_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  // ─── Saved views ───
  const persistViews = (next: SavedView[]) => {
    setViews(next);
    try { localStorage.setItem(VIEWS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };
  const saveView = () => {
    const name = naming?.trim();
    if (!name) return;
    persistViews([...views.filter(v => v.name !== name), { name, tab, filters }]);
    setNaming(null);
    toast.success(`Saved the view "${name}"`);
  };
  const applyView = (v: SavedView) => {
    setTab(v.tab);
    setFilters({ ...EMPTY, ...v.filters });
    setSearch('');
    setPage(0);
  };

  // ─── Selection and bulk actions ───
  const pageIds = paged.map(r => head(r).id);
  const allOnPage = pageIds.length > 0 && pageIds.every(id => selected.has(id));
  const toggleRow = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  const togglePage = () =>
    setSelected(prev => {
      const next = new Set(prev);
      if (allOnPage) pageIds.forEach(id => next.delete(id)); else pageIds.forEach(id => next.add(id));
      return next;
    });
  const selectedRows = rows.filter(r => selected.has(head(r).id));
  const clearSelection = () => {
    setSelected(new Set());
    setConfirmBulkDelete(false);
  };

  const bulkPlan = async (value: boolean) => {
    try {
      await Promise.all(selectedRows.map(r =>
        r.kind === 'group' ? updateTradeGroup(r.groupId, { followedPlan: value }) : updateTrade(r.trade.id, { followedPlan: value }),
      ));
      toast.success(`${selectedRows.length} ${selectedRows.length === 1 ? 'trade' : 'trades'} marked ${value ? 'on plan' : 'off plan'}`);
      clearSelection();
    } catch (e: any) {
      toast.error(e?.message || 'Could not update the trades');
    }
  };
  const bulkDelete = async () => {
    try {
      await Promise.all(selectedRows.map(r => (r.kind === 'group' ? deleteTradeGroup(r.groupId) : deleteTrade(r.trade.id))));
      toast.success(`${selectedRows.length} ${selectedRows.length === 1 ? 'trade' : 'trades'} deleted`);
      clearSelection();
    } catch (e: any) {
      toast.error(e?.message || 'Could not delete the trades');
    }
  };
  const bulkExport = () => exportTradesCSV(selectedRows.flatMap(r => (r.kind === 'group' ? r.legs : [r.trade])));

  const exportPdf = async () => {
    const { exportTradePDF } = await import('@/lib/pdfExport');
    await exportTradePDF(filtered, profile?.nickname || 'Trader', account?.name ?? 'All accounts', countBreakevenInWinRate);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div aria-busy="true" aria-label="Loading trades">
          <div className="h-7 w-32 animate-pulse rounded-chip bg-ef-sunken" />
          <div className="mt-6 h-9 animate-pulse rounded-control bg-ef-sunken" />
          <div className="mt-3 h-[420px] animate-pulse rounded-surface bg-ef-sunken" />
        </div>
      </AppLayout>
    );
  }

  const actions = (
    <>
      <button type="button" onClick={() => navigate('/import-trades')} className="ef-btn ef-btn-secondary">
        <UploadSimple className="h-3.5 w-3.5" /> Import
      </button>
      {filtered.length > 0 && (
        <>
          <button type="button" onClick={() => exportTradesCSV(filtered)} className="ef-btn ef-btn-secondary">
            <DownloadSimple className="h-3.5 w-3.5" /> CSV
          </button>
          <button type="button" onClick={exportPdf} className="ef-btn ef-btn-secondary">
            <FilePdf className="h-3.5 w-3.5" /> PDF
          </button>
        </>
      )}
    </>
  );

  if (trades.length === 0) {
    return (
      <AppLayout>
        <PageHeader title="Trades" />
        <Surface>
          <EmptyState
            art="/art/statement-flow.webp"
            title="No trades here yet"
            body={account
              ? `Nothing is logged on ${account.name}. Import a broker statement or log a trade and it shows up here.`
              : 'Import a broker statement to bring in your history at once, or log a trade by hand.'}
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

  const rowHeight = density === 'compact' ? 'h-9' : 'h-11';

  return (
    <AppLayout>
      <PageHeader
        title="Trades"
        subtitle={account ? `Every trade logged on ${account.name}` : 'Every trade across your accounts'}
        actions={actions}
        mb={16}
      />

      <CountTabs
        ariaLabel="Trade groups"
        value={tab}
        onChange={key => { setTab(key); setPage(0); }}
        tabs={[
          { key: 'all', label: 'All', count: counts.all },
          { key: 'win', label: 'Wins', count: counts.win },
          { key: 'loss', label: 'Losses', count: counts.loss },
          { key: 'offplan', label: 'Off-plan', count: counts.offplan },
          { key: 'review', label: 'To review', count: counts.review, tone: 'warn' },
        ]}
      />

      {/* Filters */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <label className="relative">
          <span className="sr-only">Search trades</span>
          <MagnifyingGlass className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ef-ink-4" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search notes, setups"
            className="h-7 w-[190px] rounded-[8px] border border-ef-line bg-transparent pl-8 pr-2 text-[12px] text-ef-ink outline-none transition-colors placeholder:text-ef-ink-4 hover:border-ef-line-strong focus:border-ef-ink-3"
          />
        </label>
        <FilterChip label="Instrument" options={instrumentOptions} selected={filters.instrument} onChange={v => setFilter('instrument', v)} />
        <FilterChip label="Session" options={sessionOptions} selected={filters.session} onChange={v => setFilter('session', v)} />
        <FilterChip label="Setup" options={strategyOptions} selected={filters.strategy} onChange={v => setFilter('strategy', v)} />
        <FilterChip
          label="Side"
          options={[{ value: 'long', label: 'Long' }, { value: 'short', label: 'Short' }]}
          selected={filters.direction}
          onChange={v => setFilter('direction', v)}
        />
        <FilterChip
          label="Date"
          single
          neutral="all"
          options={RANGE_OPTIONS.map(o => ({ value: o.key, label: o.label }))}
          selected={[filters.range]}
          onChange={v => setFilter('range', (v[0] as RangeKey) ?? 'all')}
        />
        {activeFilterCount > 0 && (
          <>
            <button type="button" onClick={clearFilters} className="ef-btn ef-btn-ghost ef-btn-sm">Clear</button>
            {naming === null ? (
              <button type="button" onClick={() => setNaming('')} className="ef-btn ef-btn-ghost ef-btn-sm">
                <BookmarkSimple className="h-3.5 w-3.5" /> Save view
              </button>
            ) : (
              <form onSubmit={e => { e.preventDefault(); saveView(); }} className="flex items-center gap-1">
                <label className="sr-only" htmlFor="view-name">View name</label>
                <input
                  id="view-name"
                  autoFocus
                  value={naming}
                  onChange={e => setNaming(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Escape') setNaming(null); }}
                  placeholder="Name this view"
                  className="h-7 w-[150px] rounded-[8px] border border-ef-ink-3 bg-transparent px-2 text-[12px] text-ef-ink outline-none placeholder:text-ef-ink-4"
                />
                <button type="submit" disabled={!naming.trim()} className="ef-btn ef-btn-primary ef-btn-sm">Save</button>
              </form>
            )}
          </>
        )}
        <button
          type="button"
          onClick={changeDensity}
          aria-label={`Row density: ${density}. Switch to ${density === 'regular' ? 'compact' : 'regular'}`}
          title={density === 'regular' ? 'Compact rows' : 'Regular rows'}
          className="ef-btn ef-btn-ghost ef-btn-sm ml-auto w-7 px-0"
        >
          <Rows className="h-3.5 w-3.5" weight={density === 'compact' ? 'fill' : 'regular'} />
        </button>
      </div>

      {views.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="ef-label mr-1">Views</span>
          {views.map(v => (
            <span key={v.name} className="inline-flex">
              <button type="button" onClick={() => applyView(v)} className="ef-chip rounded-r-none border-r-0 pr-2">{v.name}</button>
              <button
                type="button"
                onClick={() => persistViews(views.filter(x => x.name !== v.name))}
                aria-label={`Delete the view ${v.name}`}
                className="ef-chip rounded-l-none px-1.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Summary for the current filter */}
      <Surface className="mt-3">
        <div className="flex flex-col gap-4 border-b border-ef-line px-4 py-3.5 lg:flex-row lg:items-center lg:gap-8">
          <dl className="m-0 flex flex-wrap items-baseline gap-x-7 gap-y-2">
            <Summary label="Trades" value={String(stats.totalTrades)} />
            <Summary label="Win rate" value={stats.totalTrades ? fmtPct(stats.winRate) : '—'} />
            <Summary label="Net P&L" value={fmtSignedMoney(stats.netPnl)} tone={toneOf(stats.netPnl)} />
            <Summary label="Avg R" value={hasR ? fmtR(stats.rExpectancy, 2) : '—'} />
            <Summary label="Profit factor" value={stats.totalTrades ? (stats.profitFactor >= 999 ? '∞' : stats.profitFactor.toFixed(2)) : '—'} />
          </dl>
          <TradeTape trades={filtered} height={30} limit={80} onSelect={t => openTrade(t.id, queue)} className="min-w-0 lg:ml-auto lg:max-w-[420px] lg:flex-1" />
        </div>

        {rows.length === 0 ? (
          <EmptyState
            title="No trades match these filters"
            body="Loosen a filter or clear them all to see your trades again."
            className="py-12"
          >
            <button type="button" onClick={() => { clearFilters(); setTab('all'); }} className="ef-btn ef-btn-secondary">Clear filters</button>
          </EmptyState>
        ) : (
          <div className="overflow-x-auto lg:overflow-visible lg:[--ef-table-top:52px]">
            <table className="ef-table">
              <thead>
                <tr>
                  <th className="w-9 !pr-0">
                    <input
                      type="checkbox"
                      checked={allOnPage}
                      onChange={togglePage}
                      aria-label="Select every trade on this page"
                      className="ef-check"
                    />
                  </th>
                  <SortTh field="date" sort={sort} onSort={toggleSort}>Date</SortTh>
                  <SortTh field="instrument" sort={sort} onSort={toggleSort}>Instrument</SortTh>
                  <th>Side</th>
                  <th className="hidden lg:table-cell">Session</th>
                  <th className="hidden lg:table-cell">Setup</th>
                  <SortTh field="r" sort={sort} onSort={toggleSort} right className="hidden sm:table-cell">R</SortTh>
                  <SortTh field="pnl" sort={sort} onSort={toggleSort} right>P&amp;L</SortTh>
                  <th className="hidden md:table-cell">Plan</th>
                  <th className="hidden w-12 md:table-cell" aria-label="Attachments" />
                </tr>
              </thead>
              <tbody>
                {paged.map(row => {
                  const t = head(row);
                  const pnl = rowPnl(row);
                  const r = rowR(row);
                  const isSelected = selected.has(t.id);
                  return (
                    <tr
                      key={t.id}
                      data-clickable="true"
                      data-selected={tradeId === t.id || isSelected}
                      tabIndex={0}
                      onClick={() => openTrade(t.id, queue)}
                      onKeyDown={e => { if (e.key === 'Enter') openTrade(t.id, queue); }}
                      className={cn(rowHeight, 'outline-none focus-visible:[&>td]:bg-ef-hover')}
                    >
                      <td className="!pr-0" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(t.id)}
                          aria-label={`Select the ${t.instrument} trade on ${t.date.slice(0, 10)}`}
                          className="ef-check"
                        />
                      </td>
                      <td className="ef-num text-[12.5px] text-ef-ink-3">
                        {parseLocalDate(t.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                      </td>
                      <td>
                        <span className="flex items-center gap-2">
                          <span className="font-medium text-ef-ink">{t.instrument}</span>
                          {row.kind === 'group' && (
                            <span className="ef-num inline-flex items-center gap-1 rounded-chip bg-ef-sunken px-1.5 py-0.5 text-[10.5px] text-ef-ink-3">
                              <ArrowsClockwise className="h-2.5 w-2.5" weight="bold" /> {row.legs.length} accounts
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="text-ef-ink-2">
                        <span className="inline-flex items-center gap-1 text-[12.5px]">
                          {t.direction === 'long'
                            ? <ArrowUpRight className="h-3 w-3 text-ef-ink-3" weight="bold" />
                            : <ArrowDownRight className="h-3 w-3 text-ef-ink-3" weight="bold" />}
                          {t.direction === 'long' ? 'Long' : 'Short'}
                        </span>
                      </td>
                      <td className="hidden text-ef-ink-3 lg:table-cell">{t.session || '—'}</td>
                      <td className="hidden max-w-[200px] truncate text-ef-ink-3 lg:table-cell">{t.strategy || '—'}</td>
                      <td className={cn('num hidden sm:table-cell', r == null ? 'text-ef-ink-4' : 'text-ef-ink-2')}>{fmtR(r)}</td>
                      <td className={cn('num font-medium', TONE_CLASS[toneOf(pnl)])}>{fmtSignedMoney(pnl, 2)}</td>
                      <td className="hidden md:table-cell">
                        <PlanTag value={t.followedPlan} />
                      </td>
                      <td className="hidden text-ef-ink-4 md:table-cell">
                        <span className="flex items-center justify-end gap-1.5">
                          {t.notes && <NoteBlank className="h-3.5 w-3.5" aria-label="Has a note" />}
                          {t.screenshotUrl && <ImageSquare className="h-3.5 w-3.5" aria-label="Has a chart screenshot" />}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {rows.length > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t border-ef-line px-4 py-2">
            <span className="ef-num text-[11.5px] text-ef-ink-3">
              {safePage * PAGE_SIZE + 1}–{Math.min(rows.length, (safePage + 1) * PAGE_SIZE)} of {rows.length}
            </span>
            <div className="flex items-center gap-0.5">
              <button type="button" onClick={() => setPage(safePage - 1)} disabled={safePage === 0} aria-label="Previous page" className="ef-btn ef-btn-ghost ef-btn-sm w-7 px-0">
                <CaretLeft className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={() => setPage(safePage + 1)} disabled={safePage >= totalPages - 1} aria-label="Next page" className="ef-btn ef-btn-ghost ef-btn-sm w-7 px-0">
                <CaretRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </Surface>

      {/* Bulk actions */}
      {selectedRows.length > 0 && (
        <div
          role="region"
          aria-label="Selected trades"
          className="fixed inset-x-0 bottom-20 z-30 mx-auto flex w-[calc(100%-32px)] max-w-[620px] flex-wrap items-center gap-1.5 rounded-surface border border-ef-line-strong bg-ef-elev px-3 py-2 lg:bottom-6"
          style={{ boxShadow: 'var(--ef-shadow-pop)' }}
        >
          {confirmBulkDelete ? (
            <>
              <span className="mr-auto pl-1 text-[12.5px] text-ef-ink-2">
                Delete {selectedRows.length} {selectedRows.length === 1 ? 'trade' : 'trades'}? This cannot be undone.
              </span>
              <button type="button" onClick={() => setConfirmBulkDelete(false)} className="ef-btn ef-btn-ghost ef-btn-sm">Cancel</button>
              <button type="button" onClick={bulkDelete} className="ef-btn ef-btn-sm bg-ef-neg font-semibold text-white hover:opacity-90">Delete</button>
            </>
          ) : (
            <>
              <span className="ef-num mr-auto pl-1 text-[12.5px] text-ef-ink-2">{selectedRows.length} selected</span>
              <button type="button" onClick={() => bulkPlan(true)} className="ef-btn ef-btn-secondary ef-btn-sm">On plan</button>
              <button type="button" onClick={() => bulkPlan(false)} className="ef-btn ef-btn-secondary ef-btn-sm">Off plan</button>
              <button type="button" onClick={bulkExport} className="ef-btn ef-btn-secondary ef-btn-sm">Export</button>
              <button type="button" onClick={() => setConfirmBulkDelete(true)} className="ef-btn ef-btn-ghost ef-btn-sm hover:text-ef-neg">Delete</button>
              <button type="button" onClick={clearSelection} aria-label="Clear selection" className="ef-btn ef-btn-ghost ef-btn-sm w-7 px-0">
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      )}
    </AppLayout>
  );
};

function Summary({ label, value, tone }: { label: string; value: string; tone?: 'pos' | 'neg' | 'flat' }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="text-[12px] text-ef-ink-3">{label}</dt>
      <dd className={cn('ef-num m-0 text-[14px] font-medium', tone ? TONE_CLASS[tone] : 'text-ef-ink')}>{value}</dd>
    </div>
  );
}

function SortTh({
  field, sort, onSort, children, right, className,
}: {
  field: SortField;
  sort: { field: SortField; dir: 'asc' | 'desc' };
  onSort: (field: SortField) => void;
  children: React.ReactNode;
  right?: boolean;
  className?: string;
}) {
  const active = sort.field === field;
  return (
    <th className={className} aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'} style={right ? { textAlign: 'right' } : undefined}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className={cn('ef-focus -mx-1 inline-flex items-center gap-1 rounded-[4px] px-1 uppercase tracking-[0.12em] transition-colors', active ? 'text-ef-ink' : 'hover:text-ef-ink-2')}
      >
        {children}
        <span aria-hidden className={cn('text-[9px]', !active && 'opacity-0')}>{sort.dir === 'asc' ? '▲' : '▼'}</span>
      </button>
    </th>
  );
}

function PlanTag({ value }: { value: boolean | undefined }) {
  if (value === undefined) {
    return <span className="inline-flex h-5 items-center rounded-chip border border-dashed border-ef-warn px-1.5 text-[10.5px] font-medium text-ef-warn">Review</span>;
  }
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[12px]', value ? 'text-ef-ink-2' : 'text-ef-neg')}>
      <span aria-hidden className={cn('h-1.5 w-1.5 rounded-full', value ? 'bg-ef-ink-3' : 'bg-ef-neg')} />
      {value ? 'On plan' : 'Off plan'}
    </span>
  );
}

export default Trades;
