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
  const { trades, updateTrade, deleteTrade, isLoading: tradesLoading } = useSharedTrades();
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

  if (tradesLoading) {
    return (
      <AppLayout>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ height: 28, width: 160, borderRadius: 8, background: 'var(--ef-bg-elev)', border: '1px solid var(--ef-line)' }} />
          <div style={{ height: 80, borderRadius: 14, background: 'var(--ef-bg-elev)', border: '1px solid var(--ef-line)' }} />
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ height: 52, borderRadius: 10, background: 'var(--ef-bg-elev)', border: '1px solid var(--ef-line)' }} />
          ))}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-between border-b border-border" style={{ paddingBottom: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--ef-ink)' }}>Trades DB</h1>
          <div className="font-mono" style={{ fontSize: 12.5, color: 'var(--ef-ink-3)', marginTop: 2 }}>Your complete trade history</div>
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
          {[
            { label: 'Import', icon: UploadSimple, onClick: () => navigate('/import-trades') },
            ...(filteredTrades.length > 0 ? [
              { label: 'CSV', icon: DownloadSimple, onClick: () => exportTradesCSV(filteredTrades) },
              { label: 'PDF', icon: FilePdf, onClick: () => exportTradePDF(filteredTrades) },
            ] : []),
          ].map(({ label, icon: Icon, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              className="flex items-center gap-1.5 transition-colors"
              style={{
                height: 34, padding: '0 12px', borderRadius: 10,
                background: 'var(--ef-bg-elev)', border: '1px solid var(--ef-line)',
                fontSize: 12, fontWeight: 500, color: 'var(--ef-ink-2)',
              }}
            >
              <Icon className="h-3.5 w-3.5" weight="regular" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: '1px solid var(--ef-line)', borderRadius: 14, overflow: 'hidden', marginBottom: 14 }}>
          {[
            { label: 'Total Trades', value: stats.total, mono: String(stats.total), color: 'var(--ef-ink)' },
            { label: 'Win Rate', value: `${stats.winRate}%`, mono: `${stats.winRate}%`, color: stats.winRate >= 50 ? 'var(--ef-pos)' : 'var(--ef-neg)' },
            { label: 'Net P&L', value: `${stats.netPnl >= 0 ? '+' : ''}$${stats.netPnl.toFixed(0)}`, mono: `${stats.netPnl >= 0 ? '+' : ''}$${stats.netPnl.toFixed(0)}`, color: stats.netPnl >= 0 ? 'var(--ef-pos)' : 'var(--ef-neg)' },
            { label: 'Avg R', value: filteredTrades.some(t => t.rMultiple != null) ? `${stats.avgR >= 0 ? '+' : ''}${stats.avgR.toFixed(2)}R` : '—', mono: filteredTrades.some(t => t.rMultiple != null) ? `${stats.avgR >= 0 ? '+' : ''}${stats.avgR.toFixed(2)}R` : '—', color: stats.avgR >= 0 ? 'var(--ef-ink)' : 'var(--ef-neg)' },
          ].map((s, i, arr) => (
            <div key={s.label} style={{
              padding: '16px 20px',
              background: 'var(--ef-bg-elev)',
              borderRight: i < arr.length - 1 ? '1px solid var(--ef-line)' : 'none',
            }}>
              <div className="font-mono" style={{ fontSize: 10, color: 'var(--ef-ink-4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{s.label}</div>
              <div className="font-mono" style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', color: s.color, lineHeight: 1 }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      <TradeTable trades={filteredTrades} onUpdate={updateTrade} onDelete={deleteTrade} />
    </AppLayout>
  );
};

export default Journal;
