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
        'flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold hover:text-foreground transition-colors',
        sortField === field ? 'text-primary' : 'text-muted-foreground'
      )}
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search..."
            className="pl-8 bg-secondary border-border h-8 text-sm"
          />
        </div>
        <Select value={outcomeFilter} onValueChange={v => { setOutcomeFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[120px] bg-secondary border-border h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="win">Wins</SelectItem>
            <SelectItem value="loss">Losses</SelectItem>
            <SelectItem value="breakeven">BE</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => exportTradesCSV(trades)} className="gap-1 h-8 text-xs">
          <Download className="h-3 w-3" /> CSV
        </Button>
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
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Dir</span>
                </th>
                <th className="text-left p-2.5 hidden lg:table-cell">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Strategy</span>
                </th>
                <th className="text-left p-2.5 hidden lg:table-cell">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Session</span>
                </th>
                <th className="text-right p-2.5"><SortHeader field="pnl">P&L</SortHeader></th>
                <th className="text-center p-2.5">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Result</span>
                </th>
                {hasCriteria && (
                  <th className="text-center p-2.5 hidden md:table-cell">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Checklist</span>
                  </th>
                )}
                <th className="text-right p-2.5 w-16">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Act</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-muted-foreground text-sm">
                    {trades.length === 0 ? 'No trades logged yet' : 'No matches'}
                  </td>
                </tr>
              ) : paged.map(trade => (
                <tr key={trade.id} className="border-b border-border/40 hover:bg-secondary/30 transition-colors">
                  <td className="p-2.5 text-xs font-mono text-muted-foreground whitespace-nowrap">
                    {new Date(trade.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </td>
                  <td className="p-2.5 text-xs font-semibold">{trade.instrument}</td>
                  <td className="p-2.5 hidden md:table-cell">
                    <span className={cn(
                      'text-[10px] font-bold px-1.5 py-0.5 rounded',
                      trade.direction === 'long' ? 'bg-profit/15 text-profit' : 'bg-loss/15 text-loss'
                    )}>
                      {trade.direction === 'long' ? 'L' : 'S'}
                    </span>
                  </td>
                  <td className="p-2.5 text-xs hidden lg:table-cell text-muted-foreground">{trade.strategy}</td>
                  <td className="p-2.5 text-xs hidden lg:table-cell text-muted-foreground">{trade.session}</td>
                  <td className={cn('p-2.5 text-right text-xs font-mono font-semibold',
                    trade.pnl > 0 ? 'text-profit' : trade.pnl < 0 ? 'text-loss' : 'text-muted-foreground'
                  )}>
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
                  {hasCriteria && (() => {
                    const checks = verificationsMap[trade.id] ?? {};
                    const total = activeCriteria.length;
                    const checked = activeCriteria.filter(c => checks[c.id]).length;
                    const allDone = checked === total;
                    const none = checked === 0 && !verificationsMap[trade.id];
                    return (
                      <td className="p-2.5 text-center hidden md:table-cell">
                        {none ? (
                          <span className="text-[10px] text-muted-foreground/40">—</span>
                        ) : allDone ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-profit">
                            <CheckSquare className="h-3 w-3" />{checked}/{total}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-loss">
                            <XSquare className="h-3 w-3" />{checked}/{total}
                          </span>
                        )}
                      </td>
                    );
                  })()}
                  <td className="p-2.5 text-right">
                    <div className="flex items-center gap-0.5 justify-end">
                      <button
                        onClick={() => setEditTrade(trade)}
                        className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Edit3 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => setDeletingId(trade.id)}
                        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-3 py-2 border-t border-border">
            <span className="text-[10px] text-muted-foreground">
              {filtered.length} trades • Page {page + 1}/{totalPages}
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
