import { useState, useMemo } from 'react';
import { Trade, TradeFormData } from '@/types/trade';
import { cn, parseLocalDate } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TradeForm } from './TradeForm';
import { exportTradesCSV } from '@/lib/analytics';
import { groupTradesForDisplay } from '@/lib/mirroredTrades';
import { useSharedAccounts } from '@/contexts/AccountsContext';
import { MagnifyingGlass, DownloadSimple, Trash, PencilSimple, CaretLeft, CaretRight, CaretDown, BookOpen, Plus, ArrowsClockwise } from '@phosphor-icons/react';
import { useSignedUrl } from '@/hooks/useSignedUrl';
import { motion, AnimatePresence } from 'framer-motion';
import { useTradeVerifications } from '@/hooks/useTradeVerifications';
import { useCriteria } from '@/hooks/useCriteria';
import { Link } from 'react-router-dom';
import { startOfWeek, startOfMonth, isAfter } from 'date-fns';

interface TradeTableProps {
  trades: Trade[];
  onUpdate: (id: string, data: Partial<TradeFormData>) => void;
  onDelete: (id: string) => void;
  onUpdateGroup?: (groupId: string, data: Partial<TradeFormData>) => void;
  onDeleteGroup?: (groupId: string) => void;
}

type SortField = 'date' | 'instrument' | 'pnl';
type SortDir = 'asc' | 'desc';
type OutcomeFilter = 'all' | 'win' | 'loss' | 'breakeven';
type DirectionFilter = 'all' | 'long' | 'short';
type DateRange = 'all' | 'week' | 'month';

const PAGE_SIZE = 50;
const CARD = 'rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--ef-bg-elev)_96%,white_2%),var(--ef-bg-elev))] shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_22px_60px_rgba(0,0,0,0.18)]';

function TradeScreenshot({ path }: { path: string }) {
  const [open, setOpen] = useState(false);
  const { data: url } = useSignedUrl(path);
  if (!url) return null;
  return (
    <>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-1 text-muted-foreground/60">Chart</p>
        <button onClick={() => setOpen(true)} className="outline-none">
          <img src={url} alt="chart" className="h-16 w-auto rounded-md border border-border object-cover hover:border-foreground/30 transition-colors" />
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="relative max-w-5xl max-h-[90vh] w-full mx-4" onClick={e => e.stopPropagation()}>
            <button onClick={() => setOpen(false)} className="absolute -top-8 right-0 text-[rgba(255,255,255,0.5)] hover:text-white text-xs outline-none">✕ Close</button>
            <img src={url} alt="chart" className="w-full h-auto max-h-[85vh] object-contain rounded-xl border border-[rgba(255,255,255,0.1)]" />
          </div>
        </div>
      )}
    </>
  );
}

export function TradeTable({ trades, onUpdate, onDelete, onUpdateGroup, onDeleteGroup }: TradeTableProps) {
  const { accounts } = useSharedAccounts();
  const accountName = (id?: string) => id ? (accounts.find(a => a.id === id)?.name ?? '—') : '—';

  const [search, setSearch] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState<OutcomeFilter>('all');
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>('all');
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(0);
  // editTrade: when set with `groupEdit = true`, applies updates to the whole group.
  const [editTrade, setEditTrade] = useState<Trade | null>(null);
  const [editIsGroup, setEditIsGroup] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  const [deletingGroupSize, setDeletingGroupSize] = useState(0);
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

  // Collapse mirrored trade groups for display. A group appears once with chip stack;
  // expand reveals per-account legs.
  const displayRows = useMemo(() => groupTradesForDisplay(filtered), [filtered]);

  const totalPages = Math.ceil(displayRows.length / PAGE_SIZE);
  const paged = displayRows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
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
        sortField === field ? 'text-foreground' : 'text-muted-foreground/60 hover:text-foreground'
      )}
    >
      {children}
      {sortField === field && <span className="opacity-60">{sortDir === 'asc' ? '↑' : '↓'}</span>}
    </button>
  );

  const handleEditSubmit = (data: TradeFormData) => {
    if (!editTrade) return;
    if (editIsGroup && editTrade.tradeGroupId && onUpdateGroup) {
      // Strip leg-specific fields — the hook also belts-and-braces this.
      const { accountId: _a, pnl: _p, ...shared } = data;
      onUpdateGroup(editTrade.tradeGroupId, shared);
    } else {
      onUpdate(editTrade.id, data);
    }
    setEditTrade(null);
    setEditIsGroup(false);
  };

  const confirmDelete = (id: string) => { onDelete(id); setDeletingId(null); };
  const confirmDeleteGroup = (groupId: string) => {
    if (onDeleteGroup) onDeleteGroup(groupId);
    setDeletingGroupId(null);
    setDeletingGroupSize(0);
  };

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setExpandedId(prev => prev === id ? null : id);
  };

  const filterPill = (active: boolean) =>
    cn(
      'px-3 py-1 rounded-full text-[11px] font-medium border transition-all',
      active
        ? 'bg-foreground text-background border-transparent'
        : 'bg-white/[0.025] border-white/10 text-muted-foreground hover:border-foreground/25 hover:text-foreground hover:bg-white/[0.05]'
    );

  // Empty state
  if (trades.length === 0) {
    return (
      <div className={cn(CARD, 'flex flex-col items-center justify-center py-20 text-center')}>
        <BookOpen className="h-8 w-8 mb-4 text-muted-foreground/30" weight="regular" />
        <p className="text-base font-semibold text-foreground mb-1">No trades logged yet</p>
        <p className="text-xs text-muted-foreground/60 mb-6">Start building your edge by logging your first trade.</p>
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
      <div className="flex flex-col sm:flex-row gap-2 mb-3 rounded-[18px] border border-white/10 bg-white/[0.025] p-2">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" weight="regular" />
          <Input
            value={search}
            onChange={e => { setSearch(e.target.value); resetPage(); }}
            placeholder="Search instrument, strategy, notes..."
            className="pl-8 h-9 text-sm rounded-full bg-black/20 border-white/10"
          />
        </div>
        <Select value={dateRange} onValueChange={(v: DateRange) => { setDateRange(v); resetPage(); }}>
          <SelectTrigger className="w-[130px] h-9 text-xs rounded-full bg-black/20 border-white/10">
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
          className="gap-1 h-9 text-xs rounded-full border-white/10 bg-black/20"
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
        <span className="text-border text-xs px-1">|</span>
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
              <tr className="border-b border-white/10 bg-white/[0.025]">
                <th className="text-left p-3"><SortHeader field="date">Date</SortHeader></th>
                <th className="text-left p-3"><SortHeader field="instrument">Pair</SortHeader></th>
                <th className="text-left p-3 hidden md:table-cell">
                  <span className="text-[10px] uppercase tracking-[0.08em] font-semibold text-muted-foreground/60">Dir</span>
                </th>
                <th className="text-left p-3 hidden lg:table-cell">
                  <span className="text-[10px] uppercase tracking-[0.08em] font-semibold text-muted-foreground/60">Strategy</span>
                </th>
                <th className="text-left p-3 hidden lg:table-cell">
                  <span className="text-[10px] uppercase tracking-[0.08em] font-semibold text-muted-foreground/60">Session</span>
                </th>
                <th className="text-right p-3"><SortHeader field="pnl">P&amp;L</SortHeader></th>
                <th className="text-center p-3">
                  <span className="text-[10px] uppercase tracking-[0.08em] font-semibold text-muted-foreground/60">Result</span>
                </th>
                {hasCriteria && (
                  <th className="text-center p-3 hidden md:table-cell">
                    <span className="text-[10px] uppercase tracking-[0.08em] font-semibold text-muted-foreground/60">Checklist</span>
                  </th>
                )}
                <th className="text-right p-3 w-16" />
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-sm text-muted-foreground/60">
                    No matches for current filters
                  </td>
                </tr>
              ) : paged.map(row => {
                if (row.kind === 'group') {
                  return (
                    <GroupRow
                      key={row.groupId}
                      groupId={row.groupId}
                      legs={row.legs}
                      isExpanded={expandedId === row.groupId}
                      onToggle={() => setExpandedId(prev => prev === row.groupId ? null : row.groupId)}
                      hasCriteria={hasCriteria}
                      accountName={accountName}
                      onEditGroup={() => { setEditTrade(row.legs[0]); setEditIsGroup(true); }}
                      onEditLeg={(leg) => { setEditTrade(leg); setEditIsGroup(false); }}
                      onDeleteGroup={() => { setDeletingGroupId(row.groupId); setDeletingGroupSize(row.legs.length); }}
                      onDeleteLeg={(legId) => setDeletingId(legId)}
                    />
                  );
                }

                const trade = row.trade;
                const isExpanded = expandedId === trade.id;
                const checks = verificationsMap[trade.id] ?? {};
                const checklistChecked = hasCriteria && verificationsMap[trade.id] !== undefined;

                return (
                  <>
                    <tr
                      key={trade.id}
                      onClick={(e) => toggleExpand(trade.id, e)}
                      className="border-b border-white/10 hover:bg-white/[0.025] transition-colors cursor-pointer"
                    >
                      <td className="p-3 text-[13px] font-mono whitespace-nowrap text-muted-foreground">
                        {parseLocalDate(trade.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="p-3 text-[13px] font-semibold text-foreground">{trade.instrument}</td>
                      <td className="p-3 hidden md:table-cell">
                        <span className={cn(
                            'text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-white/10',
                          trade.direction === 'long'
                            ? 'bg-white/[0.055] text-foreground'
                            : 'bg-black/25 text-muted-foreground'
                        )}>
                          {trade.direction === 'long' ? 'L' : 'S'}
                        </span>
                      </td>
                      <td className="p-3 text-[13px] hidden lg:table-cell text-muted-foreground">{trade.strategy}</td>
                      <td className="p-3 text-[13px] hidden lg:table-cell text-muted-foreground">{trade.session}</td>
                      <td className={cn(
                        'p-3 text-right text-[13px] font-mono font-bold',
                        trade.pnl > 0 ? 'text-[#10b981]' : trade.pnl < 0 ? 'text-[#f87171]' : 'text-muted-foreground'
                      )}>
                        {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className={cn(
                            'w-1.5 h-1.5 rounded-full shrink-0',
                            trade.outcome === 'win' ? 'bg-[#10b981]' : trade.outcome === 'loss' ? 'bg-[#f87171]' : 'bg-muted-foreground/30'
                          )} />
                          <span className={cn(
                            'text-[11px] font-medium uppercase',
                            trade.outcome === 'win' ? 'text-[#10b981]' : trade.outcome === 'loss' ? 'text-[#f87171]' : 'text-muted-foreground'
                          )}>
                            {trade.outcome === 'breakeven' ? 'BE' : trade.outcome}
                          </span>
                        </div>
                      </td>
                      {hasCriteria && (
                        <td className="p-3 hidden md:table-cell">
                          <div className="flex items-center justify-center gap-[3px]">
                            {activeCriteria.map((c, idx) => {
                              const filled = checklistChecked && checks[c.id];
                              return (
                                <span key={idx} className={cn(
                                  'w-1.5 h-1.5 rounded-full transition-colors',
                                  filled ? 'bg-[#10b981]' : checklistChecked ? 'bg-muted-foreground/20' : 'bg-[rgba(248,113,113,0.3)]'
                                )} />
                              );
                            })}
                          </div>
                        </td>
                      )}
                      <td className="p-3 text-right">
                        <div className="flex items-center gap-0.5 justify-end">
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditTrade(trade); setEditIsGroup(false); }}
                            className="p-1 rounded text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors"
                          >
                            <PencilSimple className="h-3 w-3" weight="regular" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeletingId(trade.id); }}
                            className="p-1 rounded text-muted-foreground/60 hover:text-[#f87171] hover:bg-[rgba(248,113,113,0.08)] transition-colors"
                          >
                            <Trash className="h-3 w-3" weight="regular" />
                          </button>
                          <CaretDown className={cn('h-3.5 w-3.5 text-muted-foreground/50 transition-transform', isExpanded && 'rotate-180')} weight="regular" />
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
                            <div className="rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 bg-black/25 border border-white/10">
                              {[
                                {
                                  label: 'R-Multiple',
                                  value: trade.rMultiple != null
                                    ? `${trade.rMultiple > 0 ? '+' : ''}${trade.rMultiple}R`
                                    : '—',
                                  color: (trade.rMultiple ?? 0) > 0
                                    ? 'text-[#10b981]'
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
                                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-1 text-muted-foreground/60">{label}</p>
                                  <p className={cn('text-sm font-bold font-mono', color)}>{value}</p>
                                </div>
                              ))}
                              {trade.notes && (
                                <div className="col-span-2 sm:col-span-3 md:col-span-5">
                                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-1 text-muted-foreground/60">Notes</p>
                                  <p className="text-sm leading-relaxed text-foreground/80">{trade.notes}</p>
                                </div>
                              )}
                              {trade.screenshotUrl && (
                                <div className="col-span-2 sm:col-span-3 md:col-span-5">
                                  <TradeScreenshot path={trade.screenshotUrl} />
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
          <div className="flex items-center justify-between px-3 py-2.5 border-t border-border">
            <span className="text-[10px] text-muted-foreground/60">
              {displayRows.length} entries · Page {page + 1}/{totalPages}
            </span>
            <div className="flex gap-0.5">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-25 transition-colors"
              >
                <CaretLeft className="h-3.5 w-3.5" weight="regular" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-25 transition-colors"
              >
                <CaretRight className="h-3.5 w-3.5" weight="regular" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editTrade} onOpenChange={() => { setEditTrade(null); setEditIsGroup(false); }}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          onPointerDownOutside={(e) => e.preventDefault()}
          onFocusOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-white">
              {editIsGroup ? 'Edit Mirrored Trade (all legs)' : 'Edit Trade'}
            </DialogTitle>
            {editIsGroup && (
              <p className="text-[11px] text-muted-foreground/70 pt-1">
                Changes apply to every account leg in this group. Per-account P&L and account assignment are unchanged.
              </p>
            )}
          </DialogHeader>
          {editTrade && (
            <TradeForm
              initialData={editTrade}
              onSubmit={handleEditSubmit}
              submitLabel="Update"
              onCancel={() => { setEditTrade(null); setEditIsGroup(false); }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete single trade */}
      <Dialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Trade</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This cannot be undone.</p>
          <div className="flex gap-2 justify-end mt-3">
            <Button variant="ghost" size="sm" onClick={() => setDeletingId(null)}>Cancel</Button>
            <Button size="sm" onClick={() => deletingId && confirmDelete(deletingId)} className="bg-[#f87171] hover:bg-[#f87171]/90 text-black font-semibold rounded-[24px]">Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete mirrored group */}
      <Dialog open={!!deletingGroupId} onOpenChange={() => { setDeletingGroupId(null); setDeletingGroupSize(0); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">Delete all {deletingGroupSize} mirrored trades?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Every account leg in this mirrored trade will be deleted. This cannot be undone.
          </p>
          <div className="flex gap-2 justify-end mt-3">
            <Button variant="ghost" size="sm" onClick={() => { setDeletingGroupId(null); setDeletingGroupSize(0); }}>Cancel</Button>
            <Button size="sm" onClick={() => deletingGroupId && confirmDeleteGroup(deletingGroupId)} className="bg-[#f87171] hover:bg-[#f87171]/90 text-black font-semibold rounded-[24px]">Delete All</Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// ─── Group row ───
interface GroupRowProps {
  groupId: string;
  legs: Trade[];
  isExpanded: boolean;
  onToggle: () => void;
  hasCriteria: boolean;
  accountName: (id?: string) => string;
  onEditGroup: () => void;
  onEditLeg: (leg: Trade) => void;
  onDeleteGroup: () => void;
  onDeleteLeg: (legId: string) => void;
}

function GroupRow({ groupId, legs, isExpanded, onToggle, hasCriteria, accountName, onEditGroup, onEditLeg, onDeleteGroup, onDeleteLeg }: GroupRowProps) {
  const head = legs[0];
  const totalPnl = legs.reduce((s, t) => s + t.pnl, 0);
  const wins = legs.filter(l => l.outcome === 'win').length;
  const losses = legs.filter(l => l.outcome === 'loss').length;
  // Header outcome rolls up to the dominant: win if any wins and no losses,
  // mixed if both, loss/breakeven otherwise.
  const headerOutcome: 'win' | 'loss' | 'breakeven' | 'mixed' =
    wins > 0 && losses > 0 ? 'mixed'
    : wins > 0 ? 'win'
    : losses > 0 ? 'loss'
    : 'breakeven';

  return (
    <>
      <tr
        onClick={(e) => { if (!(e.target as HTMLElement).closest('button')) onToggle(); }}
        className="border-b border-white/10 hover:bg-white/[0.025] transition-colors cursor-pointer bg-[rgba(16,185,129,0.045)]"
      >
        <td className="p-3 text-[13px] font-mono whitespace-nowrap text-muted-foreground">
          {parseLocalDate(head.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </td>
        <td className="p-3 text-[13px] font-semibold text-foreground">
          <div className="flex items-center gap-1.5">
            <ArrowsClockwise className="h-3 w-3 text-muted-foreground/60" weight="bold" />
            {head.instrument}
            <span className="text-[10px] font-medium uppercase tracking-[0.1em] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              {legs.length} accts
            </span>
          </div>
        </td>
        <td className="p-3 hidden md:table-cell">
          <span className={cn(
            'text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-white/10',
            head.direction === 'long' ? 'bg-white/[0.055] text-foreground' : 'bg-black/25 text-muted-foreground'
          )}>
            {head.direction === 'long' ? 'L' : 'S'}
          </span>
        </td>
        <td className="p-3 text-[13px] hidden lg:table-cell text-muted-foreground">{head.strategy}</td>
        <td className="p-3 text-[13px] hidden lg:table-cell text-muted-foreground">{head.session}</td>
        <td className={cn(
          'p-3 text-right text-[13px] font-mono font-bold',
          totalPnl > 0 ? 'text-[#10b981]' : totalPnl < 0 ? 'text-[#f87171]' : 'text-muted-foreground'
        )}>
          {totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(2)}
        </td>
        <td className="p-3 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <span className={cn(
              'w-1.5 h-1.5 rounded-full shrink-0',
              headerOutcome === 'win' ? 'bg-[#10b981]'
              : headerOutcome === 'loss' ? 'bg-[#f87171]'
              : headerOutcome === 'mixed' ? 'bg-[#f59e0b]'
              : 'bg-muted-foreground/30'
            )} />
            <span className={cn(
              'text-[11px] font-medium uppercase',
              headerOutcome === 'win' ? 'text-[#10b981]'
              : headerOutcome === 'loss' ? 'text-[#f87171]'
              : headerOutcome === 'mixed' ? 'text-[#f59e0b]'
              : 'text-muted-foreground'
            )}>
              {headerOutcome === 'mixed' ? `${wins}W/${losses}L` : headerOutcome === 'breakeven' ? 'BE' : headerOutcome}
            </span>
          </div>
        </td>
        {hasCriteria && <td className="p-3 hidden md:table-cell" />}
        <td className="p-3 text-right">
          <div className="flex items-center gap-0.5 justify-end">
            <button
              onClick={(e) => { e.stopPropagation(); onEditGroup(); }}
              title="Edit all legs"
              className="p-1 rounded text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors"
            >
              <PencilSimple className="h-3 w-3" weight="regular" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDeleteGroup(); }}
              title="Delete all legs"
              className="p-1 rounded text-muted-foreground/60 hover:text-[#f87171] hover:bg-[rgba(248,113,113,0.08)] transition-colors"
            >
              <Trash className="h-3 w-3" weight="regular" />
            </button>
            <CaretDown className={cn('h-3.5 w-3.5 text-muted-foreground/50 transition-transform', isExpanded && 'rotate-180')} weight="regular" />
          </div>
        </td>
      </tr>
      <AnimatePresence>
        {isExpanded && (
          <motion.tr
            key={`${groupId}-expanded`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <td colSpan={9} className="px-4 pb-4 pt-0">
              <div className="rounded-2xl p-4 bg-black/25 border border-white/10 space-y-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 mb-2">Per-account legs</p>
                  <div className="space-y-1.5">
                    {legs.map(leg => (
                      <div key={leg.id} className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-xl border border-white/10 bg-white/[0.025]">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-[12px] font-medium text-foreground truncate">{accountName(leg.accountId)}</span>
                          <span className={cn(
                            'text-[9px] font-bold px-1 py-0.5 rounded uppercase',
                            leg.outcome === 'win' ? 'bg-[rgba(16,185,129,0.15)] text-[#10b981]'
                            : leg.outcome === 'loss' ? 'bg-[rgba(248,113,113,0.15)] text-[#f87171]'
                            : 'bg-muted text-muted-foreground'
                          )}>
                            {leg.outcome === 'breakeven' ? 'BE' : leg.outcome}
                          </span>
                        </div>
                        <span className={cn(
                          'text-[12px] font-mono font-bold',
                          leg.pnl > 0 ? 'text-[#10b981]' : leg.pnl < 0 ? 'text-[#f87171]' : 'text-muted-foreground'
                        )}>
                          {leg.pnl >= 0 ? '+' : ''}{leg.pnl.toFixed(2)}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); onEditLeg(leg); }}
                          title="Edit just this leg"
                          className="p-1 rounded text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors"
                        >
                          <PencilSimple className="h-3 w-3" weight="regular" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDeleteLeg(leg.id); }}
                          title="Delete just this leg"
                          className="p-1 rounded text-muted-foreground/60 hover:text-[#f87171] hover:bg-[rgba(248,113,113,0.08)] transition-colors"
                        >
                          <Trash className="h-3 w-3" weight="regular" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-border/60">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-1 text-muted-foreground/60">R-Multiple (avg)</p>
                    <p className="text-sm font-bold font-mono text-white">
                      {(() => {
                        const rs = legs.map(l => l.rMultiple).filter((r): r is number => r != null);
                        return rs.length ? `${(rs.reduce((s, r) => s + r, 0) / rs.length).toFixed(2)}R` : '—';
                      })()}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-1 text-muted-foreground/60">HTF Bias</p>
                    <p className="text-sm font-bold font-mono text-white">{head.htfBias || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-1 text-muted-foreground/60">Emotional</p>
                    <p className="text-sm font-bold font-mono text-white">{head.emotionalState != null ? `${head.emotionalState}/5` : '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-1 text-muted-foreground/60">Plan Followed</p>
                    <p className="text-sm font-bold font-mono text-white">{head.followedPlan == null ? '—' : head.followedPlan ? 'Yes' : 'No'}</p>
                  </div>
                </div>
                {head.notes && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-1 text-muted-foreground/60">Notes (shared)</p>
                    <p className="text-sm leading-relaxed text-foreground/80">{head.notes}</p>
                  </div>
                )}
                {head.screenshotUrl && <TradeScreenshot path={head.screenshotUrl} />}
              </div>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
}
