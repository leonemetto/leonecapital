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
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg text-[rgba(255,255,255,0.35)] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-all">
            <ArrowLeft className="h-4 w-4" weight="regular" />
          </button>
          <div>
            <h1 className="text-[24px] font-bold text-white tracking-[-0.5px]">Import Trades</h1>
            <p className="text-xs text-[rgba(255,255,255,0.35)]">Import from CSV — EdgeFlow export, MT4/MT5, or generic</p>
          </div>
        </div>

        {result ? (
          /* ── Result state ── */
          <div className="rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.07)] p-8 text-center space-y-4">
            <CheckCircle className="h-10 w-10 text-[#10b981] mx-auto" weight="fill" />
            <div>
              <p className="text-xl font-bold text-white">{result.imported} trades imported</p>
              {result.skipped > 0 && <p className="text-sm text-[rgba(255,255,255,0.4)] mt-1">{result.skipped} rows skipped (missing required fields)</p>}
            </div>
            <div className="flex gap-3 justify-center pt-2">
              <button onClick={() => navigate('/journal')} className="px-5 py-2 rounded-[24px] bg-white text-black text-sm font-semibold">View Trades</button>
              <button onClick={() => { setResult(null); setRows([]); setFileName(''); setPreview([]); }} className="px-5 py-2 rounded-[24px] border border-[rgba(255,255,255,0.15)] text-white text-sm">Import More</button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Step 1 — Template */}
            <div className="rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.07)] p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[rgba(255,255,255,0.35)] mb-3">1. Select Format</p>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(TEMPLATES) as (keyof typeof TEMPLATES)[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => handleTemplateChange(key)}
                    className={cn(
                      'text-left p-3 rounded-xl border transition-all',
                      template === key
                        ? 'border-white/30 bg-white/05'
                        : 'border-[rgba(255,255,255,0.07)] hover:border-[rgba(255,255,255,0.15)]'
                    )}
                  >
                    <p className="text-sm font-semibold text-white mb-0.5">{TEMPLATES[key].label}</p>
                    <p className="text-[11px] text-[rgba(255,255,255,0.35)] leading-snug">{TEMPLATES[key].hint}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2 — Account */}
            {accounts.length > 0 && (
              <div className="rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.07)] p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[rgba(255,255,255,0.35)] mb-3">2. Assign to Account</p>
                <div className="flex flex-wrap gap-2">
                  {accounts.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setSelectedAccountId(a.id)}
                      className={cn('px-3 py-1.5 rounded-full text-xs border transition-all', selectedAccountId === a.id ? 'border-white/30 text-white' : 'border-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.4)]')}
                    >
                      {a.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3 — Upload */}
            <div className="rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.07)] p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[rgba(255,255,255,0.35)] mb-3">3. Upload CSV File</p>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
              {!fileName ? (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full border border-dashed border-[rgba(255,255,255,0.15)] rounded-xl py-10 flex flex-col items-center gap-3 hover:border-[rgba(255,255,255,0.3)] hover:bg-[rgba(255,255,255,0.02)] transition-all"
                >
                  <UploadSimple className="h-8 w-8 text-[rgba(255,255,255,0.3)]" weight="regular" />
                  <p className="text-sm text-[rgba(255,255,255,0.5)]">Click to select a CSV file</p>
                </button>
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.07)]">
                  <FileText className="h-5 w-5 text-[rgba(255,255,255,0.5)] shrink-0" weight="regular" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{fileName}</p>
                    <p className="text-xs text-[rgba(255,255,255,0.35)]">{rows.length} rows detected</p>
                  </div>
                  <button onClick={() => { setFileName(''); setRows([]); setPreview([]); if (fileRef.current) fileRef.current.value = ''; }} className="text-[rgba(255,255,255,0.3)] hover:text-white">
                    <X className="h-4 w-4" weight="regular" />
                  </button>
                </div>
              )}
            </div>

            {/* Preview */}
            {preview.length > 0 && (
              <div className="rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.07)] p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[rgba(255,255,255,0.35)] mb-3">Preview (first 5 rows)</p>
                <div className="space-y-2">
                  {preview.map((p, i) => (
                    <div key={i} className={cn('flex items-center gap-3 p-3 rounded-lg text-sm', p.parsed ? 'bg-[rgba(16,185,129,0.05)] border border-[rgba(16,185,129,0.15)]' : 'bg-[rgba(248,113,113,0.05)] border border-[rgba(248,113,113,0.15)]')}>
                      {p.parsed ? (
                        <CheckCircle className="h-4 w-4 text-[#10b981] shrink-0" weight="fill" />
                      ) : (
                        <Warning className="h-4 w-4 text-[#f87171] shrink-0" weight="fill" />
                      )}
                      {p.parsed ? (
                        <span className="text-[rgba(255,255,255,0.7)] font-mono text-xs">
                          {p.parsed.date} · {p.parsed.instrument} · {p.parsed.direction} · {p.parsed.outcome} · ${p.parsed.pnl?.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-[rgba(255,255,255,0.4)] text-xs">Row {i + 1} — missing required fields (date, instrument)</span>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[rgba(255,255,255,0.35)] mt-3">
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
