import { useState, useMemo } from 'react';
import { Trade, TradeFormData } from '@/types/trade';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TradeForm } from './TradeForm';
import { exportTradesCSV } from '@/lib/analytics';
import { Search, Download, Trash2, Edit3, ChevronLeft, ChevronRight, CheckSquare, XSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTradeVerifications } from '@/hooks/useTradeVerifications';
import { useCriteria } from '@/hooks/useCriteria';

interface TradeTableProps {
  trades: Trade[];
  onUpdate: (id: string, data: Partial<TradeFormData>) => void;
  onDelete: (id: string) => void;
}

type SortField = 'date' | 'instrument' | 'pnl';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 10;

export function TradeTable({ trades, onUpdate, onDelete }: TradeTableProps) {
  const [search, setSearch] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(0);
  const [editTrade, setEditTrade] = useState<Trade | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
  }, [trades, search, outcomeFilter, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => toggleSort(field)}
      className={cn(
        'flex items-center gap-1 text-[11px] uppercase tracking-[0.06em] font-medium hover:text-foreground transition-colors duration-200',
        sortField === field ? 'text-foreground' : 'text-muted-foreground'
      )}
    >
      {children}
      {sortField === field && <span className="opacity-50">{sortDir === 'asc' ? '↑' : '↓'}</span>}
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground opacity-50" />
          <Input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search trades..."
            className="pl-9 bg-secondary/50 border-border h-9 text-[13px]"
          />
        </div>
        <Select value={outcomeFilter} onValueChange={v => { setOutcomeFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[120px] bg-secondary/50 border-border h-9 text-[13px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="win">Wins</SelectItem>
            <SelectItem value="loss">Losses</SelectItem>
            <SelectItem value="breakeven">BE</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => exportTradesCSV(trades)} className="gap-1.5 h-9 text-[13px]">
          <Download className="h-3.5 w-3.5 opacity-50" /> Export
        </Button>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3"><SortHeader field="date">Date</SortHeader></th>
                <th className="text-left px-4 py-3"><SortHeader field="instrument">Pair</SortHeader></th>
                <th className="text-left px-4 py-3 hidden md:table-cell">
                  <span className="text-[11px] uppercase tracking-[0.06em] font-medium text-muted-foreground">Dir</span>
                </th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">
                  <span className="text-[11px] uppercase tracking-[0.06em] font-medium text-muted-foreground">Strategy</span>
                </th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">
                  <span className="text-[11px] uppercase tracking-[0.06em] font-medium text-muted-foreground">Session</span>
                </th>
                <th className="text-right px-4 py-3"><SortHeader field="pnl">P&L</SortHeader></th>
                <th className="text-center px-4 py-3">
                  <span className="text-[11px] uppercase tracking-[0.06em] font-medium text-muted-foreground">Result</span>
                </th>
                {hasCriteria && (
                  <th className="text-center px-4 py-3 hidden md:table-cell">
                    <span className="text-[11px] uppercase tracking-[0.06em] font-medium text-muted-foreground">Checklist</span>
                  </th>
                )}
                <th className="text-right px-4 py-3 w-20">
                  <span className="text-[11px] uppercase tracking-[0.06em] font-medium text-muted-foreground">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted-foreground text-sm">
                    {trades.length === 0 ? 'No trades logged yet' : 'No matches'}
                  </td>
                </tr>
              ) : paged.map(trade => (
                <tr key={trade.id} className="border-b border-border/30 hover:bg-secondary/20 transition-colors duration-200">
                  <td className="px-4 py-3.5 text-[13px] font-mono text-muted-foreground whitespace-nowrap">
                    {new Date(trade.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-4 py-3.5 text-[13px] font-medium">{trade.instrument}</td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <span className={cn(
                      'text-[11px] font-medium px-2 py-0.5 rounded-md',
                      trade.direction === 'long' ? 'bg-profit/8 text-profit' : 'bg-loss/8 text-loss'
                    )}>
                      {trade.direction === 'long' ? 'Long' : 'Short'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-[13px] hidden lg:table-cell text-muted-foreground">{trade.strategy}</td>
                  <td className="px-4 py-3.5 text-[13px] hidden lg:table-cell text-muted-foreground">{trade.session}</td>
                  <td className={cn('px-4 py-3.5 text-right text-[14px] font-mono font-medium',
                    trade.pnl > 0 ? 'text-profit' : trade.pnl < 0 ? 'text-loss' : 'text-muted-foreground'
                  )}>
                    {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={cn(
                      'text-[10px] font-medium px-2 py-1 rounded-md uppercase tracking-wide',
                      trade.outcome === 'win' ? 'bg-profit/8 text-profit' :
                      trade.outcome === 'loss' ? 'bg-loss/8 text-loss' :
                      'bg-secondary text-muted-foreground'
                    )}>
                      {trade.outcome === 'breakeven' ? 'BE' : trade.outcome}
                    </span>
                  </td>
                  {hasCriteria && (() => {
                    const checks = verificationsMap[trade.id] ?? {};
                    const total = activeCriteria.length;
                    const checked = activeCriteria.filter(c => checks[c.id]).length;
                    const allDone = checked === total;
                    const none = checked === 0 && !verificationsMap[trade.id];
                    return (
                      <td className="px-4 py-3.5 text-center hidden md:table-cell">
                        {none ? (
                          <span className="text-[11px] text-muted-foreground/30">—</span>
                        ) : allDone ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-profit">
                            <CheckSquare className="h-3 w-3" />{checked}/{total}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-loss">
                            <XSquare className="h-3 w-3" />{checked}/{total}
                          </span>
                        )}
                      </td>
                    );
                  })()}
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => setEditTrade(trade)}
                        className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors duration-200"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingId(trade.id)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors duration-200"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/30">
            <span className="text-[12px] text-muted-foreground">
              {filtered.length} trades · Page {page + 1} of {totalPages}
            </span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="p-1.5 rounded-lg hover:bg-secondary disabled:opacity-20 transition-colors duration-200">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="p-1.5 rounded-lg hover:bg-secondary disabled:opacity-20 transition-colors duration-200">
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
