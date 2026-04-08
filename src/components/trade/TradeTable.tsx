import { useState, useMemo } from 'react';
import { Trade, TradeFormData } from '@/types/trade';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TradeForm } from './TradeForm';
import { exportTradesCSV } from '@/lib/analytics';
import { MagnifyingGlass, DownloadSimple, Trash, PencilSimple, CaretLeft, CaretRight, CaretDown, BookOpen, Plus } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTradeVerifications } from '@/hooks/useTradeVerifications';
import { useCriteria } from '@/hooks/useCriteria';
import { Link } from 'react-router-dom';
import { startOfWeek, startOfMonth, isAfter } from 'date-fns';

interface TradeTableProps {
  trades: Trade[];
  onUpdate: (id: string, data: Partial<TradeFormData>) => void;
  onDelete: (id: string) => void;
}

type SortField = 'date' | 'instrument' | 'pnl';
type SortDir = 'asc' | 'desc';
type OutcomeFilter = 'all' | 'win' | 'loss' | 'breakeven';
type DirectionFilter = 'all' | 'long' | 'short';
type DateRange = 'all' | 'week' | 'month';

const PAGE_SIZE = 10;
const CARD = 'rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.07)]';

export function TradeTable({ trades, onUpdate, onDelete }: TradeTableProps) {
  const [search, setSearch] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState<OutcomeFilter>('all');
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>('all');
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(0);
  const [editTrade, setEditTrade] = useState<Trade | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { activeCriteria } = useCriteria();
  const tradeIds = useMemo(() => trades.map(t => t.id), [trades]);
  const { data: verificationsMap = {} } = useTradeVerifications(tradeIds);
  const hasCriteria = activeCriteria.length > 0;

  const filtered = useMemo(() => {
    let result = [...trades];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(t =>
        t.instrument.toLowerCase().includes(q) ||
        t.strategy.toLowerCase().includes(q) ||
        t.notes.toLowerCase().includes(q) ||
        t.session.toLowerCase().includes(q)
      );
    }
    if (outcomeFilter !== 'all') result = result.filter(t => t.outcome === outcomeFilter);
    if (directionFilter !== 'all') result = result.filter(t => t.direction === directionFilter);
    if (dateRange !== 'all') {
      const now = new Date();
      const cutoff = dateRange === 'week' ? startOfWeek(now, { weekStartsOn: 1 }) : startOfMonth(now);
      result = result.filter(t => isAfter(new Date(t.date), cutoff));
    }
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
      else if (sortField === 'instrument') cmp = a.instrument.localeCompare(b.instrument);
      else if (sortField === 'pnl') cmp = a.pnl - b.pnl;
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return result;
  }, [trades, search, outcomeFilter, directionFilter, dateRange, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const resetPage = () => setPage(0);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => toggleSort(field)}
      className={cn(
        'flex items-center gap-1 text-[10px] uppercase tracking-[0.08em] font-semibold transition-colors',
        sortField === field ? 'text-white' : 'text-[rgba(255,255,255,0.3)] hover:text-white'
      )}
    >
      {children}
      {sortField === field && <span className="opacity-60">{sortDir === 'asc' ? '↑' : '↓'}</span>}
    </button>
  );

  const handleEditSubmit = (data: TradeFormData) => {
    if (editTrade) { onUpdate(editTrade.id, data); setEditTrade(null); }
  };

  const confirmDelete = (id: string) => { onDelete(id); setDeletingId(null); };

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setExpandedId(prev => prev === id ? null : id);
  };

  const filterPill = (active: boolean) =>
    cn(
      'px-3 py-1 rounded-full text-[11px] font-medium border transition-all',
      active
        ? 'bg-white text-black border-transparent'
        : 'bg-transparent border-[rgba(255,255,255,0.12)] text-[rgba(255,255,255,0.45)] hover:border-[rgba(255,255,255,0.25)] hover:text-[rgba(255,255,255,0.7)]'
    );

  // Empty state
  if (trades.length === 0) {
    return (
      <div className={cn(CARD, 'flex flex-col items-center justify-center py-20 text-center')}>
        <BookOpen className="h-8 w-8 mb-4 text-[rgba(255,255,255,0.2)]" weight="regular" />
        <p className="text-base font-semibold text-white mb-1">No trades logged yet</p>
        <p className="text-xs text-[rgba(255,255,255,0.35)] mb-6">Start building your edge by logging your first trade.</p>
        <Link to="/add-trade">
          <Button size="sm" className="gap-1.5 bg-white text-black hover:bg-white/90 rounded-[24px]">
            <Plus className="h-3.5 w-3.5" weight="bold" /> Log your first trade →
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2 mb-2">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[rgba(255,255,255,0.3)]" weight="regular" />
          <Input
            value={search}
            onChange={e => { setSearch(e.target.value); resetPage(); }}
            placeholder="Search instrument, strategy, notes..."
            className="pl-8 bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.1)] h-8 text-sm placeholder:text-[rgba(255,255,255,0.25)]"
          />
        </div>
        <Select value={dateRange} onValueChange={(v: DateRange) => { setDateRange(v); resetPage(); }}>
          <SelectTrigger className="w-[130px] bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.1)] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[
              { value: 'all', label: 'All time' },
              { value: 'week', label: 'This week' },
              { value: 'month', label: 'This month' },
            ].map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportTradesCSV(trades)}
          className="gap-1 h-8 text-xs border-[rgba(255,255,255,0.15)] bg-transparent hover:bg-[rgba(255,255,255,0.06)] rounded-full"
        >
          <DownloadSimple className="h-3 w-3" weight="regular" /> CSV
        </Button>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        {(['all', 'win', 'loss', 'breakeven'] as OutcomeFilter[]).map(v => (
          <button key={v} onClick={() => { setOutcomeFilter(v); resetPage(); }} className={filterPill(outcomeFilter === v)}>
            {v === 'all' ? 'All' : v === 'breakeven' ? 'BE' : v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
        <span className="text-[rgba(255,255,255,0.12)] text-xs px-1">|</span>
        {(['all', 'long', 'short'] as DirectionFilter[]).map(v => (
          <button key={v} onClick={() => { setDirectionFilter(v); resetPage(); }} className={filterPill(directionFilter === v)}>
            {v === 'all' ? 'All Dirs' : v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className={cn(CARD, 'overflow-hidden')}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.07)]">
                <th className="text-left p-3"><SortHeader field="date">Date</SortHeader></th>
                <th className="text-left p-3"><SortHeader field="instrument">Pair</SortHeader></th>
                <th className="text-left p-3 hidden md:table-cell">
                  <span className="text-[10px] uppercase tracking-[0.08em] font-semibold text-[rgba(255,255,255,0.3)]">Dir</span>
                </th>
                <th className="text-left p-3 hidden lg:table-cell">
                  <span className="text-[10px] uppercase tracking-[0.08em] font-semibold text-[rgba(255,255,255,0.3)]">Strategy</span>
                </th>
                <th className="text-left p-3 hidden lg:table-cell">
                  <span className="text-[10px] uppercase tracking-[0.08em] font-semibold text-[rgba(255,255,255,0.3)]">Session</span>
                </th>
                <th className="text-right p-3"><SortHeader field="pnl">P&amp;L</SortHeader></th>
                <th className="text-center p-3">
                  <span className="text-[10px] uppercase tracking-[0.08em] font-semibold text-[rgba(255,255,255,0.3)]">Result</span>
                </th>
                {hasCriteria && (
                  <th className="text-center p-3 hidden md:table-cell">
                    <span className="text-[10px] uppercase tracking-[0.08em] font-semibold text-[rgba(255,255,255,0.3)]">Checklist</span>
                  </th>
                )}
                <th className="text-right p-3 w-16" />
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-sm text-[rgba(255,255,255,0.35)]">
                    No matches for current filters
                  </td>
                </tr>
              ) : paged.map(trade => {
                const isExpanded = expandedId === trade.id;
                const checks = verificationsMap[trade.id] ?? {};
                const total = activeCriteria.length;
                const checked = activeCriteria.filter(c => checks[c.id]).length;
                const checklistChecked = hasCriteria && verificationsMap[trade.id] !== undefined;

                return (
                  <>
                    <tr
                      key={trade.id}
                      onClick={(e) => toggleExpand(trade.id, e)}
                      className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)] transition-colors cursor-pointer"
                    >
                      <td className="p-3 text-[13px] font-mono whitespace-nowrap text-[rgba(255,255,255,0.7)]">
                        {new Date(trade.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="p-3 text-[13px] font-semibold text-white">{trade.instrument}</td>
                      <td className="p-3 hidden md:table-cell">
                        <span className={cn(
                          'text-[10px] font-bold px-1.5 py-0.5 rounded',
                          trade.direction === 'long'
                            ? 'bg-[rgba(255,255,255,0.1)] text-white'
                            : 'bg-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.5)]'
                        )}>
                          {trade.direction === 'long' ? 'L' : 'S'}
                        </span>
                      </td>
                      <td className="p-3 text-[13px] hidden lg:table-cell text-[rgba(255,255,255,0.7)]">{trade.strategy}</td>
                      <td className="p-3 text-[13px] hidden lg:table-cell text-[rgba(255,255,255,0.7)]">{trade.session}</td>
                      <td className={cn(
                        'p-3 text-right text-[13px] font-mono font-bold',
                        trade.pnl > 0 ? 'text-[#00c896]' : trade.pnl < 0 ? 'text-[#f87171]' : 'text-[rgba(255,255,255,0.7)]'
                      )}>
                        {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}
                      </td>
                      <td className="p-3 text-center">
                        <span className={cn(
                          'text-[9px] font-bold px-1.5 py-0.5 rounded uppercase',
                          trade.outcome === 'win'
                            ? 'bg-[rgba(0,200,150,0.12)] text-[#00c896]'
                            : trade.outcome === 'loss'
                            ? 'bg-[rgba(248,113,113,0.12)] text-[#f87171]'
                            : 'bg-[rgba(255,255,255,0.07)] text-[rgba(255,255,255,0.5)]'
                        )}>
                          {trade.outcome === 'breakeven' ? 'BE' : trade.outcome}
                        </span>
                      </td>
                      {hasCriteria && (
                        <td className="p-3 text-center hidden md:table-cell">
                          {!checklistChecked ? (
                            <span className="text-[11px] font-mono font-semibold text-[#f87171]">{0}/{total}</span>
                          ) : checked === total ? (
                            <span className="text-[11px] font-mono font-semibold text-[#00c896]">{checked}/{total}</span>
                          ) : (
                            <span className="text-[11px] font-mono font-semibold text-amber-400">{checked}/{total}</span>
                          )}
                        </td>
                      )}
                      <td className="p-3 text-right">
                        <div className="flex items-center gap-0.5 justify-end">
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditTrade(trade); }}
                            className="p-1 rounded text-[rgba(255,255,255,0.3)] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-colors"
                          >
                            <PencilSimple className="h-3 w-3" weight="regular" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeletingId(trade.id); }}
                            className="p-1 rounded text-[rgba(255,255,255,0.3)] hover:text-[#f87171] hover:bg-[rgba(248,113,113,0.08)] transition-colors"
                          >
                            <Trash className="h-3 w-3" weight="regular" />
                          </button>
                          <CaretDown className={cn('h-3.5 w-3.5 text-[rgba(255,255,255,0.25)] transition-transform', isExpanded && 'rotate-180')} weight="regular" />
                        </div>
                      </td>
                    </tr>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.tr
                          key={`${trade.id}-expanded`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          <td colSpan={9} className="px-4 pb-4 pt-0">
                            <div className="rounded-lg p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)]">
                              {[
                                {
                                  label: 'R-Multiple',
                                  value: trade.rMultiple != null
                                    ? `${trade.rMultiple > 0 ? '+' : ''}${trade.rMultiple}R`
                                    : '—',
                                  color: (trade.rMultiple ?? 0) > 0
                                    ? 'text-[#00c896]'
                                    : (trade.rMultiple ?? 0) < 0
                                    ? 'text-[#f87171]'
                                    : 'text-white',
                                },
                                { label: 'HTF Bias', value: trade.htfBias || '—', color: 'text-white' },
                                { label: 'Emotional State', value: trade.emotionalState != null ? `${trade.emotionalState}/5` : '—', color: 'text-white' },
                                { label: 'Confidence', value: trade.confidenceLevel != null ? `${trade.confidenceLevel}/5` : '—', color: 'text-white' },
                                { label: 'Plan Followed', value: trade.followedPlan == null ? '—' : trade.followedPlan ? 'Yes' : 'No', color: 'text-white' },
                              ].map(({ label, value, color }) => (
                                <div key={label}>
                                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-1 text-[rgba(255,255,255,0.3)]">{label}</p>
                                  <p className={cn('text-sm font-bold font-mono', color)}>{value}</p>
                                </div>
                              ))}
                              {trade.notes && (
                                <div className="col-span-2 sm:col-span-3 md:col-span-5">
                                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-1 text-[rgba(255,255,255,0.3)]">Notes</p>
                                  <p className="text-sm leading-relaxed text-[rgba(255,255,255,0.65)]">{trade.notes}</p>
                                </div>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-3 py-2.5 border-t border-[rgba(255,255,255,0.07)]">
            <span className="text-[10px] text-[rgba(255,255,255,0.35)]">
              {filtered.length} trades · Page {page + 1}/{totalPages}
            </span>
            <div className="flex gap-0.5">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1 rounded text-[rgba(255,255,255,0.4)] hover:text-white hover:bg-[rgba(255,255,255,0.06)] disabled:opacity-25 transition-colors"
              >
                <CaretLeft className="h-3.5 w-3.5" weight="regular" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-1 rounded text-[rgba(255,255,255,0.4)] hover:text-white hover:bg-[rgba(255,255,255,0.06)] disabled:opacity-25 transition-colors"
              >
                <CaretRight className="h-3.5 w-3.5" weight="regular" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editTrade} onOpenChange={() => setEditTrade(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0e0e0e] border-[rgba(255,255,255,0.1)]">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Trade</DialogTitle>
          </DialogHeader>
          {editTrade && (
            <TradeForm
              initialData={editTrade}
              onSubmit={handleEditSubmit}
              submitLabel="Update"
              onCancel={() => setEditTrade(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <DialogContent className="max-w-sm bg-[#0e0e0e] border-[rgba(255,255,255,0.1)]">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Trade</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[rgba(255,255,255,0.45)]">This cannot be undone.</p>
          <div className="flex gap-2 justify-end mt-3">
            <Button variant="ghost" size="sm" onClick={() => setDeletingId(null)} className="text-[rgba(255,255,255,0.5)] hover:text-white">Cancel</Button>
            <Button size="sm" onClick={() => deletingId && confirmDelete(deletingId)} className="bg-[#f87171] hover:bg-[#f87171]/90 text-black font-semibold rounded-[24px]">Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
