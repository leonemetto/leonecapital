import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useSharedTrades } from '@/contexts/TradesContext';
import { useSharedAccounts } from '@/contexts/AccountsContext';
import { ArrowLeft, UploadSimple, CheckCircle, Warning, FileText, X } from '@phosphor-icons/react';
import { TradeFormData } from '@/types/trade';
import { cn } from '@/lib/utils';

// ─── Column mapping templates ───────────────────────────────────────────────
const TEMPLATES: Record<string, { label: string; hint: string; map: (row: Record<string, string>) => Partial<TradeFormData> | null }> = {
  edgeflow: {
    label: 'EdgeFlow Export',
    hint: 'CSV exported from EdgeFlow Trades DB',
    map: (row) => {
      const date = row['Date'] || row['date'];
      const instrument = row['Instrument'] || row['instrument'];
      const direction = (row['Direction'] || row['direction'])?.toLowerCase();
      const outcome = (row['Outcome'] || row['outcome'])?.toLowerCase();
      const pnl = parseFloat(row['P&L ($)'] || row['P&L'] || row['pnl'] || '0');
      if (!date || !instrument || !direction || !outcome) return null;
      return {
        date, instrument,
        direction: direction === 'long' ? 'long' : 'short',
        outcome: outcome === 'win' ? 'win' : outcome === 'loss' ? 'loss' : 'breakeven',
        pnl,
        strategy: row['Strategy'] || row['strategy'] || '',
        session: row['Session'] || row['session'] || '',
        rMultiple: row['R-Multiple'] ? parseFloat(row['R-Multiple']) : undefined,
        riskPercent: row['Risk %'] ? parseFloat(row['Risk %']) : undefined,
        htfBias: row['HTF Bias'] || row['htfBias'] || undefined,
        emotionalState: row['Emotional State'] ? parseInt(row['Emotional State']) : undefined,
        confidenceLevel: row['Confidence'] ? parseInt(row['Confidence']) : undefined,
        timeInTrade: row['Time (min)'] ? parseInt(row['Time (min)']) : undefined,
        followedPlan: row['Followed Plan'] === 'Yes' ? true : row['Followed Plan'] === 'No' ? false : undefined,
        notes: row['Notes'] || row['notes'] || '',
      };
    },
  },
  mt4: {
    label: 'MT4 / MT5',
    hint: 'Export from MetaTrader 4 or 5 Account History',
    map: (row) => {
      // MT4 columns: Ticket, Open Time, Type, Size, Item, Price, S/L, T/P, Close Time, Price, Commission, Swap, Profit
      const ticket = row['Ticket'] || row['ticket'];
      const symbol = row['Item'] || row['Symbol'] || row['symbol'];
      const type = (row['Type'] || row['type'] || '').toLowerCase();
      const profit = parseFloat(row['Profit'] || row['profit'] || '0');
      const openTime = row['Open Time'] || row['open_time'] || row['OpenTime'];
      if (!symbol || !openTime) return null;
      const date = openTime.slice(0, 10);
      const isBuy = type.includes('buy');
      const isSell = type.includes('sell');
      if (!isBuy && !isSell) return null;
      return {
        date,
        instrument: symbol,
        direction: isBuy ? 'long' : 'short',
        outcome: profit > 0 ? 'win' : profit < 0 ? 'loss' : 'breakeven',
        pnl: profit,
        notes: ticket ? `MT4 Ticket #${ticket}` : '',
        strategy: '',
        session: '',
      };
    },
  },
  generic: {
    label: 'Generic CSV',
    hint: 'Map any CSV with date, instrument, direction, outcome, P&L columns',
    map: (row) => {
      // Try common column name variations
      const date = row['date'] || row['Date'] || row['trade_date'] || row['TradeDate'] || row['open_date'];
      const instrument = row['instrument'] || row['Instrument'] || row['symbol'] || row['Symbol'] || row['pair'] || row['Pair'];
      const rawDir = (row['direction'] || row['Direction'] || row['side'] || row['Side'] || row['type'] || row['Type'] || '').toLowerCase();
      const rawOut = (row['outcome'] || row['Outcome'] || row['result'] || row['Result'] || '').toLowerCase();
      const pnl = parseFloat(row['pnl'] || row['PnL'] || row['P&L'] || row['profit'] || row['Profit'] || row['net_pnl'] || '0');
      if (!date || !instrument) return null;
      const direction: 'long' | 'short' = rawDir.includes('buy') || rawDir.includes('long') ? 'long' : 'short';
      let outcome: 'win' | 'loss' | 'breakeven' = 'breakeven';
      if (rawOut.includes('win') || pnl > 0) outcome = 'win';
      else if (rawOut.includes('loss') || pnl < 0) outcome = 'loss';
      return {
        date: date.slice(0, 10),
        instrument,
        direction,
        outcome,
        pnl,
        notes: '',
        strategy: '',
        session: '',
      };
    },
  },
};

// ─── CSV parser ──────────────────────────────────────────────────────────────
function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map((line) => {
    const values: string[] = [];
    let cur = '', inQuote = false;
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; continue; }
      if (ch === ',' && !inQuote) { values.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    values.push(cur.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ''; });
    return row;
  });
}

export default function ImportTrades() {
  const navigate = useNavigate();
  const { addTrade } = useSharedTrades();
  const { accounts } = useSharedAccounts();
  const fileRef = useRef<HTMLInputElement>(null);

  const [template, setTemplate] = useState<keyof typeof TEMPLATES>('edgeflow');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  // Default to the first account so imported trades are always assigned
  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState<Array<{ parsed: Partial<TradeFormData> | null; raw: Record<string, string> }>>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [error, setError] = useState('');

  function handleFile(file: File) {
    setResult(null);
    setError('');
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      setRows(parsed);
      const tmpl = TEMPLATES[template];
      setPreview(parsed.slice(0, 5).map((r) => ({ parsed: tmpl.map(r), raw: r })));
    };
    reader.readAsText(file);
  }

  function handleTemplateChange(t: keyof typeof TEMPLATES) {
    setTemplate(t);
    if (rows.length > 0) {
      const tmpl = TEMPLATES[t];
      setPreview(rows.slice(0, 5).map((r) => ({ parsed: tmpl.map(r), raw: r })));
    }
  }

  async function handleImport() {
    if (rows.length === 0) return;
    setImporting(true);
    setError('');
    const tmpl = TEMPLATES[template];
    let imported = 0, skipped = 0;

    for (const row of rows) {
      const parsed = tmpl.map(row);
      if (!parsed || !parsed.date || !parsed.instrument) { skipped++; continue; }
      try {
        await addTrade({
          date: parsed.date,
          instrument: parsed.instrument,
          direction: parsed.direction ?? 'long',
          outcome: parsed.outcome ?? 'breakeven',
          pnl: parsed.pnl ?? 0,
          strategy: parsed.strategy ?? '',
          session: parsed.session ?? '',
          notes: parsed.notes ?? '',
          rMultiple: parsed.rMultiple,
          riskPercent: parsed.riskPercent,
          htfBias: parsed.htfBias,
          emotionalState: parsed.emotionalState,
          confidenceLevel: parsed.confidenceLevel,
          timeInTrade: parsed.timeInTrade,
          followedPlan: parsed.followedPlan,
          accountId: selectedAccountId || undefined,
        });
        imported++;
      } catch {
        skipped++;
      }
    }

    setImporting(false);
    setResult({ imported, skipped });
  }

  const validCount = preview.filter((p) => p.parsed !== null).length;

  return (
    <AppLayout>
      <div className="max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border" style={{ paddingBottom: 12, marginBottom: 20 }}>
          <button onClick={() => navigate(-1)} style={{ padding: '6px', borderRadius: 8, background: 'transparent', border: 'none', color: 'var(--ef-ink-3)', cursor: 'pointer' }}>
            <ArrowLeft className="h-4 w-4" weight="regular" />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--ef-ink)' }}>Import Trades</h1>
            <div className="font-mono" style={{ fontSize: 12.5, color: 'var(--ef-ink-3)', marginTop: 2 }}>Import from CSV — EdgeFlow export, MT4/MT5, or generic</div>
          </div>
        </div>

        {result ? (
          /* ── Result state ── */
          <div className="text-center" style={{ background: 'var(--ef-bg-elev)', border: '1px solid var(--ef-line)', borderRadius: 14, padding: '32px 24px' }}>
            <CheckCircle size={40} color="var(--ef-pos)" weight="fill" style={{ margin: '0 auto 16px' }} />
            <div>
              <p style={{ fontSize: 20, fontWeight: 500, color: 'var(--ef-ink)', margin: '0 0 4px' }}>{result.imported} trades imported</p>
              {result.skipped > 0 && <p style={{ fontSize: 13, color: 'var(--ef-ink-3)', margin: 0 }}>{result.skipped} rows skipped (missing required fields)</p>}
            </div>
            <div className="flex gap-3 justify-center pt-2">
              <button onClick={() => navigate('/journal')} className="px-5 py-2 rounded-[24px] bg-foreground text-background text-sm font-semibold">View Trades</button>
              <button onClick={() => { setResult(null); setRows([]); setFileName(''); setPreview([]); }} className="px-5 py-2 rounded-[24px] border border-border text-foreground text-sm">Import More</button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Step 1 — Template */}
            <div className="rounded-[14px] p-5" style={{ background: 'var(--ef-bg-elev)', border: '1px solid var(--ef-line)' }}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60 mb-3">1. Select Format</p>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(TEMPLATES) as (keyof typeof TEMPLATES)[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => handleTemplateChange(key)}
                    className={cn(
                      'text-left p-3 rounded-xl border transition-all',
                      template === key
                        ? 'border-foreground/30 bg-muted'
                        : 'border-border hover:border-foreground/25'
                    )}
                  >
                    <p className="text-sm font-semibold text-foreground mb-0.5">{TEMPLATES[key].label}</p>
                    <p className="text-[11px] text-muted-foreground/60 leading-snug">{TEMPLATES[key].hint}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2 — Account */}
            {accounts.length > 0 && (
              <div className="rounded-[14px] p-5" style={{ background: 'var(--ef-bg-elev)', border: '1px solid var(--ef-line)' }}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60 mb-3">2. Assign to Account</p>
                <div className="flex flex-wrap gap-2">
                  {accounts.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setSelectedAccountId(a.id)}
                      className={cn('px-3 py-1.5 rounded-full text-xs border transition-all', selectedAccountId === a.id ? 'border-foreground/30 bg-foreground text-background' : 'border-border text-muted-foreground')}
                    >
                      {a.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3 — Upload */}
            <div className="rounded-[14px] p-5" style={{ background: 'var(--ef-bg-elev)', border: '1px solid var(--ef-line)' }}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60 mb-3">3. Upload CSV File</p>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
              {!fileName ? (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full border border-dashed border-border rounded-xl py-10 flex flex-col items-center gap-3 hover:border-foreground/25 hover:bg-muted/30 transition-all"
                >
                  <UploadSimple className="h-8 w-8 text-muted-foreground/40" weight="regular" />
                  <p className="text-sm text-muted-foreground/60">Click to select a CSV file</p>
                </button>
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border">
                  <FileText className="h-5 w-5 text-muted-foreground/60 shrink-0" weight="regular" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{fileName}</p>
                    <p className="text-xs text-muted-foreground/50">{rows.length} rows detected</p>
                  </div>
                  <button onClick={() => { setFileName(''); setRows([]); setPreview([]); if (fileRef.current) fileRef.current.value = ''; }} className="text-muted-foreground/40 hover:text-foreground">
                    <X className="h-4 w-4" weight="regular" />
                  </button>
                </div>
              )}
            </div>

            {/* Preview */}
            {preview.length > 0 && (
              <div className="rounded-[14px] p-5" style={{ background: 'var(--ef-bg-elev)', border: '1px solid var(--ef-line)' }}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60 mb-3">Preview (first 5 rows)</p>
                <div className="space-y-2">
                  {preview.map((p, i) => (
                    <div key={i} className={cn('flex items-center gap-3 p-3 rounded-lg text-sm', p.parsed ? 'bg-[rgba(16,185,129,0.06)] border border-[rgba(16,185,129,0.2)]' : 'bg-[rgba(248,113,113,0.06)] border border-[rgba(248,113,113,0.2)]')}>
                      {p.parsed ? (
                        <CheckCircle className="h-4 w-4 text-[#10b981] shrink-0" weight="fill" />
                      ) : (
                        <Warning className="h-4 w-4 text-[#f87171] shrink-0" weight="fill" />
                      )}
                      {p.parsed ? (
                        <span className="text-foreground font-mono text-xs">
                          {p.parsed.date} · {p.parsed.instrument} · {p.parsed.direction} · {p.parsed.outcome} · ${p.parsed.pnl?.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60 text-xs">Row {i + 1} — missing required fields (date, instrument)</span>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground/50 mt-3">
                  {rows.length} total rows — estimated {Math.round((validCount / Math.min(preview.length, rows.length)) * rows.length)} will import successfully
                </p>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-[rgba(248,113,113,0.08)] border border-[rgba(248,113,113,0.2)] text-[#f87171] text-sm">
                <Warning className="h-4 w-4 shrink-0" weight="fill" />
                {error}
              </div>
            )}

            {rows.length > 0 && (
              <button
                onClick={handleImport}
                disabled={importing}
                className="w-full py-3 rounded-[24px] bg-white text-black font-semibold text-sm hover:bg-white/90 transition-all disabled:opacity-50"
              >
                {importing ? 'Importing…' : `Import ${rows.length} Rows`}
              </button>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
