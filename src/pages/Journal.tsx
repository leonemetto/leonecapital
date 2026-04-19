import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { TradeTable } from '@/components/trade/TradeTable';
import { useSharedTrades } from '@/contexts/TradesContext';
import { useSharedAccounts } from '@/contexts/AccountsContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Funnel, DownloadSimple, UploadSimple, FilePdf } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { exportTradesCSV } from '@/lib/analytics';
import { exportTradePDF } from '@/lib/pdfExport';

const Journal = () => {
  const navigate = useNavigate();
  const { trades, updateTrade, deleteTrade } = useSharedTrades();
  const { accounts } = useSharedAccounts();
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');

  const filteredTrades = useMemo(
    () => selectedAccountId === 'all' ? trades : trades.filter(t => t.accountId === selectedAccountId),
    [trades, selectedAccountId]
  );

  const stats = useMemo(() => {
    if (filteredTrades.length === 0) return null;
    const wins = filteredTrades.filter(t => t.outcome === 'win').length;
    const netPnl = filteredTrades.reduce((s, t) => s + t.pnl, 0);
    const winRate = Math.round((wins / filteredTrades.length) * 100);
    const avgR = filteredTrades.filter(t => t.rMultiple != null).reduce((s, t) => s + (t.rMultiple ?? 0), 0) / (filteredTrades.filter(t => t.rMultiple != null).length || 1);
    return { total: filteredTrades.length, wins, netPnl, winRate, avgR };
  }, [filteredTrades]);

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-[24px] font-bold text-foreground tracking-[-0.5px]">Trades DB</h1>
          <p className="text-xs text-muted-foreground/60">Your complete trade history</p>
        </div>
        <div className="flex items-center gap-2">
          {accounts.length > 1 && (
            <>
              <Funnel className="h-3.5 w-3.5 text-muted-foreground/60" weight="regular" />
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger className="w-[180px] h-8 text-xs">
                  <SelectValue placeholder="All Accounts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  {accounts.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.name} ({a.type})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
          <button
            onClick={() => navigate('/import-trades')}
            className="flex items-center gap-1.5 h-8 px-3 text-xs rounded-[24px] border border-border text-muted-foreground hover:text-foreground hover:border-foreground/25 transition-colors"
          >
            <UploadSimple className="h-3.5 w-3.5" weight="regular" />
            Import
          </button>
          {filteredTrades.length > 0 && (
            <>
              <button
                onClick={() => exportTradesCSV(filteredTrades)}
                className="flex items-center gap-1.5 h-8 px-3 text-xs rounded-[24px] border border-border text-muted-foreground hover:text-foreground hover:border-foreground/25 transition-colors"
              >
                <DownloadSimple className="h-3.5 w-3.5" weight="regular" />
                CSV
              </button>
              <button
                onClick={() => exportTradePDF(filteredTrades)}
                className="flex items-center gap-1.5 h-8 px-3 text-xs rounded-[24px] border border-border text-muted-foreground hover:text-foreground hover:border-foreground/25 transition-colors"
              >
                <FilePdf className="h-3.5 w-3.5" weight="regular" />
                PDF
              </button>
            </>
          )}
        </div>
      </div>

      {/* Summary stats */}
      {stats && (
        <div className="flex items-stretch rounded-[10px] bg-card border border-border mb-4">
          {[
            { label: 'Total Trades', value: stats.total, color: 'text-foreground' },
            { label: 'Win Rate', value: `${stats.winRate}%`, color: stats.winRate >= 50 ? 'text-[#10b981]' : 'text-[#f87171]' },
            { label: 'Net P&L', value: `${stats.netPnl >= 0 ? '+' : ''}$${stats.netPnl.toFixed(0)}`, color: stats.netPnl >= 0 ? 'text-[#10b981]' : 'text-[#f87171]' },
            { label: 'Avg R', value: filteredTrades.some(t => t.rMultiple != null) ? `${stats.avgR >= 0 ? '+' : ''}${stats.avgR.toFixed(2)}R` : '—', color: stats.avgR >= 0 ? 'text-foreground' : 'text-[#f87171]' },
          ].map((s, i, arr) => (
            <div key={s.label} className="flex-1 flex items-center">
              <div className="flex-1 py-3 px-4 flex flex-col items-center">
                <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground/60">{s.label}</span>
                <span className={cn('text-[22px] leading-tight metric-number', s.color)}>{s.value}</span>
              </div>
              {i < arr.length - 1 && <div className="w-px h-10 bg-border" />}
            </div>
          ))}
        </div>
      )}

      <TradeTable trades={filteredTrades} onUpdate={updateTrade} onDelete={deleteTrade} />
    </AppLayout>
  );
};

export default Journal;
