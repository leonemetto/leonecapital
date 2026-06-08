import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader, PageBody } from '@/components/layout/PageHeader';
import { TradeTable } from '@/components/trade/TradeTable';
import { useSharedTrades } from '@/contexts/TradesContext';
import { useSharedAccounts } from '@/contexts/AccountsContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Funnel, DownloadSimple, UploadSimple, FilePdf } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { exportTradesCSV } from '@/lib/analytics';
import { motion } from 'framer-motion';

const JOURNAL_PANEL_STYLE: CSSProperties = {
  borderRadius: 18,
  border: '1px solid color-mix(in oklab, var(--ef-line) 88%, white 4%)',
  background: `
    radial-gradient(circle at 88% 0%, color-mix(in oklab, var(--ef-pos-wash) 16%, transparent) 0, transparent 38%),
    linear-gradient(180deg, color-mix(in oklab, var(--ef-bg-elev) 94%, white 2%) 0%, var(--ef-bg-elev) 100%)
  `,
  boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 22px 60px rgba(0,0,0,0.18)',
};

const Journal = () => {
  const navigate = useNavigate();
  const { trades, updateTrade, updateTradeGroup, deleteTrade, deleteTradeGroup, isLoading: tradesLoading } = useSharedTrades();
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

  const headerActions = (
    <>
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
          { label: 'PDF', icon: FilePdf, onClick: async () => {
            const { exportTradePDF } = await import('@/lib/pdfExport');
            await exportTradePDF(filteredTrades);
          } },
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
    </>
  );

  return (
    <AppLayout>
      <PageHeader title="Trades DB" subtitle="Your complete trade history" actions={headerActions} />

      <PageBody>
        {/* Summary stats */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ ...JOURNAL_PANEL_STYLE, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', overflow: 'hidden', marginBottom: 16 }}
          >
            {[
              { label: 'Total Trades', color: 'var(--ef-ink)', value: String(stats.total) },
              { label: 'Win Rate', color: stats.winRate >= 50 ? 'var(--ef-pos)' : 'var(--ef-neg)', value: `${stats.winRate}%` },
              { label: 'Net P&L', color: stats.netPnl >= 0 ? 'var(--ef-pos)' : 'var(--ef-neg)', value: `${stats.netPnl >= 0 ? '+' : ''}$${stats.netPnl.toFixed(0)}` },
              { label: 'Avg R', color: stats.avgR >= 0 ? 'var(--ef-ink)' : 'var(--ef-neg)', value: filteredTrades.some(t => t.rMultiple != null) ? `${stats.avgR >= 0 ? '+' : ''}${stats.avgR.toFixed(2)}R` : '—' },
            ].map((s, i, arr) => (
              <div key={s.label} style={{
                padding: '16px 20px',
                background: i === 0 ? 'color-mix(in oklab, var(--ef-bg-elev) 92%, var(--ef-pos-wash))' : 'transparent',
                borderRight: i < arr.length - 1 ? '1px solid color-mix(in oklab, var(--ef-line) 78%, transparent)' : 'none',
              }}>
                <div className="font-mono" style={{ fontSize: 10, color: 'var(--ef-ink-4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{s.label}</div>
                <div className="font-mono" style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', color: s.color, lineHeight: 1 }}>{s.value}</div>
              </div>
            ))}
          </motion.div>
        )}

        <TradeTable
          trades={filteredTrades}
          onUpdate={updateTrade}
          onDelete={deleteTrade}
          onUpdateGroup={updateTradeGroup}
          onDeleteGroup={deleteTradeGroup}
        />
      </PageBody>
    </AppLayout>
  );
};

export default Journal;
