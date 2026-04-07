import { useState, useMemo } from 'react';
import { Trade, TradeFormData } from '@/types/trade';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TradeForm } from './TradeForm';
import { exportTradesCSV } from '@/lib/analytics';
import { Search, Download, Trash2, Edit3, ChevronLeft, ChevronRight, ChevronDown, BookOpen, PlusCircle } from 'lucide-react';
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

    if (outcomeFilter !== 'all') {
      result = result.filter(t => t.outcome === outcomeFilter);
    }

    if (directionFilter !== 'all') {
      result = result.filter(t => t.direction === directionFilter);
    }

    if (dateRange !== 'all') {
      const now = new Date();
      const cutoff = dateRange === 'week' ? startOfWeek(now, { weekStartsOn: 1 }) : startOfMonth(now);
      result = result.filter(t => isAfter(new Date(t.date), cutoff));
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'date': cmp = new Date(a.date).getTime() - new Date(b.date).getTime(); break;
        case 'instrument': cmp = a.instrument.localeCompare(b.instrument); break;
        case 'pnl': cmp = a.pnl - b.pnl; break;
      }
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
        'flex items-center gap-1 text-[11px] uppercase tracking-[0.06em] font-medium hover:text-white transition-colors',
        sortField === field ? 'text-white' : ''
      )}
      style={sortField !== field ? { color: 'rgba(255,255,255,0.35)' } : {}}
    >
      {children}
      {sortField === field && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
    </button>
  );

  const handleEditSubmit = (data: TradeFormData) => {
    if (editTrade) {
      onUpdate(editTrade.id, data);
      setEditTrade(null);
    }
  };

  const confirmDelete = (id: string) => {
    onDelete(id);
    setDeletingId(null);
  };

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    // Don't expand when clicking action buttons
    if ((e.target as HTMLElement).closest('button')) return;
    setExpandedId(prev => prev === id ? null : id);
  };

  const outcomeOptions: { value: OutcomeFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'win', label: 'Wins' },
    { value: 'loss', label: 'Losses' },
    { value: 'breakeven', label: 'BE' },
  ];

  const directionOptions: { value: DirectionFilter; label: string }[] = [
    { value: 'all', label: 'All Dirs' },
    { value: 'long', label: 'Long' },
    { value: 'short', label: 'Short' },
  ];

  const dateOptions: { value: DateRange; label: string }[] = [
    { value: 'all', label: 'All time' },
    { value: 'week', label: 'This week' },
    { value: 'month', label: 'This month' },
  ];

  // Empty state
  if (trades.length === 0) {
    return (
      <div className="glass-card flex flex-col items-center justify-center py-20 text-center">
        <BookOpen className="h-8 w-8 mb-4" style={{ color: 'rgba(255,255,255,0.2)' }} />
        <p className="text-base font-semibold text-white mb-1">No trades logged yet</p>
        <p className="text-xs mb-6" style={{ color: 'rgba(255,255,255,0.35)' }}>Start building your edge by logging your first trade.</p>
        <Link to="/add-trade">
          <Button size="sm" className="gap-1.5 bg-white text-black hover:bg-white/90 rounded-[24px]">
            <PlusCircle className="h-3.5 w-3.5" /> Log your first trade →
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Toolbar row 1: search + date range + csv */}
      <div className="flex flex-col sm:flex-row gap-2 mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => { setSearch(e.target.value); resetPage(); }}
            placeholder="Search instrument, strategy, notes..."
            className="pl-8 bg-secondary border-border h-8 text-sm"
          />
        </div>
        <Select value={dateRange} onValueChange={(v: DateRange) => { setDateRange(v); resetPage(); }}>
          <SelectTrigger className="w-[130px] bg-secondary border-border h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {dateOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => exportTradesCSV(trades)} className="gap-1 h-8 text-xs">
          <Download className="h-3 w-3" /> CSV
        </Button>
      </div>

      {/* Toolbar row 2: filter pills */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        {outcomeOptions.map(o => (
          <button
            key={o.value}
            onClick={() => { setOutcomeFilter(o.value); resetPage(); }}
            className={cn(
              'px-3 py-1 rounded-full text-[11px] font-medium border transition-all',
              outcomeFilter === o.value
                ? 'bg-white text-black border-transparent'
                : 'bg-transparent border-[rgba(255,255,255,0.12)] hover:border-[rgba(255,255,255,0.25)]'
            )}
            style={outcomeFilter !== o.value ? { color: 'rgba(255,255,255,0.5)' } : {}}
          >
            {o.label}
          </button>
        ))}
        <span className="text-[rgba(255,255,255,0.15)] text-xs px-1">|</span>
        {directionOptions.map(o => (
          <button
            key={o.value}
            onClick={() => { setDirectionFilter(o.value); resetPage(); }}
            className={cn(
              'px-3 py-1 rounded-full text-[11px] font-medium border transition-all',
              directionFilter === o.value
                ? 'bg-white text-black border-transparent'
                : 'bg-transparent border-[rgba(255,255,255,0.12)] hover:border-[rgba(255,255,255,0.25)]'
            )}
            style={directionFilter !== o.value ? { color: 'rgba(255,255,255,0.5)' } : {}}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-2.5"><SortHeader field="date">Date</SortHeader></th>
                <th className="text-left p-2.5"><SortHeader field="instrument">Pair</SortHeader></th>
                <th className="text-left p-2.5 hidden md:table-cell">
                  <span className="text-[11px] uppercase tracking-[0.06em] font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>Dir</span>
                </th>
                <th className="text-left p-2.5 hidden lg:table-cell">
                  <span className="text-[11px] uppercase tracking-[0.06em] font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>Strategy</span>
                </th>
                <th className="text-left p-2.5 hidden lg:table-cell">
                  <span className="text-[11px] uppercase tracking-[0.06em] font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>Session</span>
                </th>
                <th className="text-right p-2.5"><SortHeader field="pnl">P&L</SortHeader></th>
                <th className="text-center p-2.5">
                  <span className="text-[11px] uppercase tracking-[0.06em] font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>Result</span>
                </th>
                {hasCriteria && (
                  <th className="text-center p-2.5 hidden md:table-cell">
                    <span className="text-[11px] uppercase tracking-[0.06em] font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>Checklist</span>
                  </th>
                )}
                <th className="text-right p-2.5 w-16">
                  <span className="text-[11px] uppercase tracking-[0.06em] font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>Act</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
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
                      className="border-b border-border/40 hover:bg-secondary/30 transition-colors cursor-pointer"
                    >
                      <td className="p-2.5 text-[13px] font-mono whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.8)' }}>
                        {new Date(trade.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="p-2.5 text-[13px] font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>{trade.instrument}</td>
                      <td className="p-2.5 hidden md:table-cell">
                        <span className={cn(
                          'text-[10px] font-bold px-1.5 py-0.5 rounded',
                          trade.direction === 'long' ? 'bg-profit/15 text-profit' : 'bg-loss/15 text-loss'
                        )}>
                          {trade.direction === 'long' ? 'L' : 'S'}
                        </span>
                      </td>
                      <td className="p-2.5 text-[13px] hidden lg:table-cell" style={{ color: 'rgba(255,255,255,0.8)' }}>{trade.strategy}</td>
                      <td className="p-2.5 text-[13px] hidden lg:table-cell" style={{ color: 'rgba(255,255,255,0.8)' }}>{trade.session}</td>
                      <td className={cn('p-2.5 text-right text-[13px] font-mono font-bold',
                        trade.pnl > 0 ? 'text-profit' : trade.pnl < 0 ? 'text-loss' : ''
                      )} style={trade.pnl === 0 ? { color: 'rgba(255,255,255,0.8)' } : {}}>
                        {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}
                      </td>
                      <td className="p-2.5 text-center">
                        <span className={cn(
                          'text-[9px] font-bold px-1.5 py-0.5 rounded uppercase',
                          trade.outcome === 'win' ? 'bg-profit/15 text-profit' :
                          trade.outcome === 'loss' ? 'bg-loss/15 text-loss' :
                          'bg-secondary text-muted-foreground'
                        )}>
                          {trade.outcome === 'breakeven' ? 'BE' : trade.outcome}
                        </span>
                      </td>
                      {hasCriteria && (
                        <td className="p-2.5 text-center hidden md:table-cell">
                          {!checklistChecked ? (
                            <span className="text-[11px] font-mono font-semibold text-loss">{0}/{total}</span>
                          ) : checked === total ? (
                            <span className="text-[11px] font-mono font-semibold text-profit">{checked}/{total}</span>
                          ) : (
                            <span className="text-[11px] font-mono font-semibold text-amber-400">{checked}/{total}</span>
                          )}
                        </td>
                      )}
                      <td className="p-2.5 text-right">
                        <div className="flex items-center gap-0.5 justify-end">
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditTrade(trade); }}
                            className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Edit3 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeletingId(trade.id); }}
                            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', isExpanded && 'rotate-180')} style={{ color: 'rgba(255,255,255,0.3)' }} />
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
                            <div className="rounded-lg p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4" style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.07)' }}>
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>R-Multiple</p>
                                <p className={cn('text-sm font-bold font-mono', (trade.rMultiple ?? 0) > 0 ? 'text-profit' : (trade.rMultiple ?? 0) < 0 ? 'text-loss' : '')} style={(trade.rMultiple ?? 0) === 0 ? { color: 'rgba(255,255,255,0.8)' } : {}}>
                                  {trade.rMultiple != null ? `${trade.rMultiple > 0 ? '+' : ''}${trade.rMultiple}R` : '—'}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>HTF Bias</p>
                                <p className="text-sm font-medium text-white">{trade.htfBias || '—'}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Emotional State</p>
                                <p className="text-sm font-medium text-white">{trade.emotionalState != null ? `${trade.emotionalState}/5` : '—'}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Confidence</p>
                                <p className="text-sm font-medium text-white">{trade.confidenceLevel != null ? `${trade.confidenceLevel}/5` : '—'}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Plan Followed</p>
                                <p className="text-sm font-medium text-white">{trade.followedPlan == null ? '—' : trade.followedPlan ? 'Yes' : 'No'}</p>
                              </div>
                              {trade.notes && (
                                <div className="col-span-2 sm:col-span-3 md:col-span-5">
                                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Notes</p>
                                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>{trade.notes}</p>
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
          <div className="flex items-center justify-between px-3 py-2 border-t border-border">
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {filtered.length} trades · Page {page + 1}/{totalPages}
            </span>
            <div className="flex gap-0.5">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="p-1 rounded hover:bg-secondary disabled:opacity-30 transition-colors">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="p-1 rounded hover:bg-secondary disabled:opacity-30 transition-colors">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editTrade} onOpenChange={() => setEditTrade(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle>Edit Trade</DialogTitle>
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
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle>Delete Trade</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This cannot be undone.</p>
          <div className="flex gap-2 justify-end mt-3">
            <Button variant="ghost" size="sm" onClick={() => setDeletingId(null)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={() => deletingId && confirmDelete(deletingId)}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
