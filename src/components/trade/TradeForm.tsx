import { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn, todayLocal } from '@/lib/utils';
import { Trade, TradeFormData, MirroredTradeFormData, SESSIONS, HTF_BIASES } from '@/types/trade';
import { splitPnlByCopyWeight } from '@/lib/mirroredTrades';
import { useSharedAccounts, ALL_ACCOUNTS } from '@/contexts/AccountsContext';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreatableSelect } from '@/components/ui/creatable-select';
import { useCustomOptions } from '@/hooks/useCustomOptions';
import { toast } from 'sonner';
import { ArrowUpRight, ArrowDownRight, CalendarBlank, CaretDown, ImageSquare, X } from '@phosphor-icons/react';
import { deleteTradeScreenshot } from '@/hooks/useTrades';
import { useSignedUrl } from '@/hooks/useSignedUrl';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RacCalendar } from '@/components/ui/calendar-rac';
import { useCriteria } from '@/hooks/useCriteria';
import { TradeChecklist } from '@/components/criteria/TradeChecklist';
import { supabase } from '@/integrations/supabase/client';
import { parseDate } from '@internationalized/date';
import type { DateValue } from 'react-aria-components';
import { FIELD, FIELD_LABEL, toggleClass } from '@/components/ef/field';
import { fmtSignedMoney } from '@/lib/format';

interface TradeFormProps {
  initialData?: Trade;
  onSubmit: (data: TradeFormData) => void | Promise<any>;
  /** Wire this from the log dialog to enable Mirrored mode. Editing flows leave it undefined. */
  onMirroredSubmit?: (data: MirroredTradeFormData) => void | Promise<any>;
  submitLabel?: string;
  onCancel?: () => void;
  /** Called after a successful save. When set, the form does not navigate away. */
  onSaved?: (opts: { another: boolean }) => void;
  /** Two columns puts the screenshot and note beside the fields. */
  columns?: 1 | 2;
}

const LAST_KEY = 'ef-last-trade';

interface LastUsed {
  instrument?: string;
  accountId?: string;
  strategy?: string;
}

function readLast(): LastUsed {
  try {
    return JSON.parse(localStorage.getItem(LAST_KEY) ?? '{}') as LastUsed;
  } catch {
    return {};
  }
}

// Detect trading session from the current UTC hour
function detectSession(): string {
  const h = new Date().getUTCHours();
  if (h >= 2 && h < 9) return 'Asian';
  if (h >= 7 && h < 12) return 'London';
  if (h >= 12 && h < 17) return 'New York';
  return '';
}

const blank = () => ({
  date: todayLocal(),
  instrument: '',
  direction: 'long' as 'long' | 'short',
  strategy: '',
  session: detectSession(),
  outcome: 'win' as 'win' | 'loss' | 'breakeven',
  pnl: '',
  rMultiple: '',
  riskPercent: '',
  htfBias: '',
  emotionalState: '',
  confidenceLevel: '',
  timeInTrade: '',
  followedPlan: '',
  notes: '',
  accountId: '',
});

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const MAX_SCREENSHOT_BYTES = 10 * 1024 * 1024; // 10 MB

// Only allow blob: (local preview) and https: (Supabase signed URLs)
const safeImgSrc = (url: string | null | undefined): string =>
  url && (url.startsWith('blob:') || url.startsWith('https://')) ? url : '';

export function TradeForm({
  initialData,
  onSubmit,
  onMirroredSubmit,
  submitLabel = 'Log trade',
  onCancel,
  onSaved,
  columns = 1,
}: TradeFormProps) {
  const navigate = useNavigate();
  const { accounts, selectedAccountId } = useSharedAccounts();
  const { instruments, confirmations, addInstrument, addConfirmation } = useCustomOptions();
  const { activeCriteria } = useCriteria();
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLock = useRef(false);
  const anotherRef = useRef(false);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [screenshotRemoved, setScreenshotRemoved] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const { data: existingShotUrl } = useSignedUrl(initialData?.screenshotUrl);

  const hasAdvancedData = !!(initialData?.htfBias || initialData?.emotionalState || initialData?.confidenceLevel || initialData?.timeInTrade);
  const [showAdvanced, setShowAdvanced] = useState(!!initialData && hasAdvancedData);

  const defaultAccountId = () => {
    if (accounts.length === 1) return accounts[0].id;
    if (selectedAccountId !== ALL_ACCOUNTS && accounts.some(a => a.id === selectedAccountId)) return selectedAccountId;
    const last = readLast().accountId;
    return last && accounts.some(a => a.id === last) ? last : '';
  };

  const fresh = () => {
    const last = readLast();
    return { ...blank(), instrument: last.instrument ?? '', strategy: last.strategy ?? '', accountId: defaultAccountId() };
  };

  const [form, setForm] = useState(() => {
    if (initialData) {
      return {
        date: initialData.date,
        instrument: initialData.instrument,
        direction: initialData.direction,
        strategy: initialData.strategy,
        session: initialData.session,
        outcome: initialData.outcome,
        pnl: String(Math.abs(initialData.pnl)),
        rMultiple: initialData.rMultiple !== undefined ? String(initialData.rMultiple) : '',
        riskPercent: initialData.riskPercent !== undefined ? String(initialData.riskPercent) : '',
        htfBias: initialData.htfBias || '',
        emotionalState: initialData.emotionalState !== undefined ? String(initialData.emotionalState) : '',
        confidenceLevel: initialData.confidenceLevel !== undefined ? String(initialData.confidenceLevel) : '',
        timeInTrade: initialData.timeInTrade !== undefined ? String(initialData.timeInTrade) : '',
        followedPlan: initialData.followedPlan !== undefined ? (initialData.followedPlan ? 'yes' : 'no') : '',
        notes: initialData.notes,
        accountId: initialData.accountId || '',
      };
    }
    return fresh();
  });

  // ─── Mirrored trade state ───
  const mirrorAvailable = !initialData && !!onMirroredSubmit && accounts.length >= 2;
  const [mode, setMode] = useState<'single' | 'mirrored'>('single');
  const [selectedMirrorIds, setSelectedMirrorIds] = useState<string[]>([]);
  const [customized, setCustomized] = useState(false);
  // Manual overrides per account, keyed by accountId. Only applied when `customized`.
  const [legOverrides, setLegOverrides] = useState<Record<string, string>>({});

  const selectedMirrorAccounts = useMemo(
    () => accounts.filter(a => selectedMirrorIds.includes(a.id)),
    [accounts, selectedMirrorIds],
  );

  const signedTotal = (raw: string, outcome: string) => {
    const total = parseFloat(raw);
    if (isNaN(total)) return NaN;
    return outcome === 'breakeven' ? 0 : outcome === 'loss' ? -Math.abs(total) : Math.abs(total);
  };

  // Estimated split by capital exposed: startingBalance × quantity. A pool of 20
  // FTMO 50ks (qty 20, balance $50k) gets 20x the share of one 50k. copy_weight
  // remains an advanced override — non-default values still take precedence.
  const estimatedLegs = useMemo(() => {
    if (mode !== 'mirrored' || selectedMirrorAccounts.length === 0) return {};
    const signed = signedTotal(form.pnl, form.outcome);
    if (isNaN(signed)) return {};
    const effective = selectedMirrorAccounts.map(a => {
      const qty = a.quantity > 0 ? a.quantity : 1;
      // Default copy_weight = 1 → balance drives the split. Non-1 → user explicitly
      // overrode, respect it. Falls back to 1 unit of weight if balance is missing.
      const sizeWeight = a.startingBalance && a.startingBalance > 0 ? a.startingBalance : 1;
      const weight = a.copyWeight && a.copyWeight !== 1 ? a.copyWeight : sizeWeight;
      return { id: a.id, copyWeight: weight * qty };
    });
    return splitPnlByCopyWeight(signed, effective);
  }, [mode, selectedMirrorAccounts, form.pnl, form.outcome]);

  const toggleMirrorAccount = (id: string) => {
    setSelectedMirrorIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
    // Clear any stale override for an unticked account.
    setLegOverrides(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  // Difference indicator. NaN-safe — if user typed nothing yet, shows nothing.
  const customizationDelta = useMemo(() => {
    if (!customized || selectedMirrorAccounts.length === 0) return null;
    const total = signedTotal(form.pnl, form.outcome);
    if (isNaN(total)) return null;
    const sumOfLegs = selectedMirrorAccounts.reduce((s, a) => {
      const raw = legOverrides[a.id];
      const parsed = raw !== undefined && raw !== '' ? parseFloat(raw) : estimatedLegs[a.id] ?? 0;
      return s + (isNaN(parsed) ? 0 : parsed);
    }, 0);
    return { total, sum: sumOfLegs, diff: sumOfLegs - total };
  }, [customized, selectedMirrorAccounts, form.pnl, form.outcome, legOverrides, estimatedLegs]);

  const update = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (key === 'followedPlan' && activeCriteria.length > 0) {
      if (value === 'yes') {
        const allChecked: Record<string, boolean> = {};
        activeCriteria.forEach(c => { allChecked[c.id] = true; });
        setChecks(allChecked);
      } else if (value === 'no') {
        setChecks({});
      }
    }
  };

  const handleScreenshotSelect = (file: File) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Use a JPEG, PNG, GIF, WebP or SVG image.');
      return;
    }
    if (file.size > MAX_SCREENSHOT_BYTES) {
      toast.error('The screenshot must be under 10 MB.');
      return;
    }
    setScreenshotFile(file);
    setScreenshotPreview(URL.createObjectURL(file));
    setScreenshotRemoved(false);
  };

  const clearScreenshot = () => {
    setScreenshotFile(null);
    setScreenshotPreview(null);
    setScreenshotRemoved(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const another = anotherRef.current;
    anotherRef.current = false;
    const rawPnl = parseFloat(form.pnl);

    if (!form.instrument || isNaN(rawPnl)) {
      toast.error('Instrument and P&L are required');
      return;
    }

    const outcome = form.outcome;
    const pnl = outcome === 'breakeven' ? 0 : outcome === 'loss' ? -Math.abs(rawPnl) : Math.abs(rawPnl);

    if (mode === 'mirrored') {
      if (selectedMirrorAccounts.length < 2) {
        toast.error('Pick at least 2 accounts for a mirrored trade');
        return;
      }
      if (!onMirroredSubmit) {
        toast.error('Mirrored mode not available here');
        return;
      }
    }

    if (submitLock.current) return;
    submitLock.current = true;
    setIsSubmitting(true);
    try {
      // Upload screenshot first so we can store path in one insert
      let screenshotPath: string | undefined = initialData?.screenshotUrl;
      if (screenshotRemoved && initialData?.screenshotUrl && !screenshotFile) {
        await deleteTradeScreenshot(initialData.screenshotUrl).catch(() => {});
        // Empty string (not undefined) so the update clears the stored path.
        screenshotPath = '';
      }
      if (screenshotFile) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          if (initialData?.screenshotUrl) {
            await deleteTradeScreenshot(initialData.screenshotUrl).catch(() => {});
          }
          const ext = screenshotFile.name.split('.').pop() ?? 'jpg';
          const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
          const { error: uploadErr } = await supabase.storage
            .from('trade-screenshots')
            .upload(path, screenshotFile, { upsert: true });
          if (uploadErr) throw uploadErr;
          screenshotPath = path;
        }
      }

      const sharedFields = {
        date: form.date,
        instrument: form.instrument,
        direction: form.direction,
        strategy: form.strategy,
        session: form.session,
        rMultiple: form.rMultiple ? parseFloat(form.rMultiple) : undefined,
        riskPercent: form.riskPercent ? parseFloat(form.riskPercent) : undefined,
        htfBias: form.htfBias || undefined,
        emotionalState: form.emotionalState ? parseInt(form.emotionalState) : undefined,
        confidenceLevel: form.confidenceLevel ? parseInt(form.confidenceLevel) : undefined,
        timeInTrade: form.timeInTrade ? parseInt(form.timeInTrade) : undefined,
        followedPlan: form.followedPlan === 'yes' ? true : form.followedPlan === 'no' ? false : undefined,
        notes: form.notes,
        screenshotUrl: screenshotPath,
      } as const;

      let savedTrade: any = null;
      let savedTrades: any[] = [];

      if (mode === 'mirrored' && onMirroredSubmit) {
        // Build legs from either customized overrides or the estimated split.
        const legs = selectedMirrorAccounts.map(a => {
          const raw = legOverrides[a.id];
          const fromOverride = customized && raw !== undefined && raw !== '' ? parseFloat(raw) : NaN;
          const legPnl = !isNaN(fromOverride) ? fromOverride : estimatedLegs[a.id] ?? 0;
          return { accountId: a.id, pnl: legPnl };
        });
        const result = await onMirroredSubmit({ ...sharedFields, outcome, legs });
        savedTrades = Array.isArray(result) ? result : [];
        savedTrade = savedTrades[0];
      } else {
        savedTrade = await onSubmit({
          ...sharedFields,
          outcome,
          pnl,
          accountId: form.accountId || undefined,
        });
      }

      // Checklist verification: write to every saved trade (so mirrored legs all get
      // the same checklist record). Skip when no checks toggled.
      const idsToVerify = savedTrades.length > 0
        ? savedTrades.map(t => t.id).filter(Boolean)
        : savedTrade?.id ? [savedTrade.id] : [];
      if (idsToVerify.length > 0 && Object.keys(checks).length > 0) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const rows = idsToVerify.map(tradeId => ({ trade_id: tradeId, user_id: user.id, checks }));
          await supabase.from('trade_verifications').upsert(rows, { onConflict: 'trade_id' });
        }
      }

      toast.success(initialData ? 'Trade updated' : 'Trade logged');
      if (!initialData) {
        try {
          localStorage.setItem(LAST_KEY, JSON.stringify({ instrument: form.instrument, accountId: form.accountId, strategy: form.strategy } satisfies LastUsed));
        } catch {
          // ignore
        }
        setForm(fresh());
        setChecks({});
        setScreenshotFile(null);
        setScreenshotPreview(null);
        if (onSaved) onSaved({ another });
        else navigate('/dashboard');
      } else if (onSaved) {
        onSaved({ another: false });
      }
      if (onCancel && !onSaved) onCancel();
    } catch (err: any) {
      if (err.message?.includes('Trial ended') || err.message?.includes('Upgrade to Pro')) {
        toast.error('Your Pro trial ended. Upgrade to Pro to continue logging trades.', {
          duration: 6000,
          action: { label: 'Upgrade', onClick: () => (window.location.href = '/profile') },
        });
      } else {
        toast.error(err.message || 'Failed to save trade');
      }
    } finally {
      submitLock.current = false;
      setIsSubmitting(false);
    }
  };

  const shotSrc = screenshotPreview ?? (screenshotRemoved ? null : existingShotUrl ?? null);
  const two = columns === 2;

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-col">
      <div className={cn('grid gap-x-7 gap-y-6', two && 'md:grid-cols-[minmax(0,1fr)_252px]')}>
        {/* ─── Fields ─── */}
        <div className="min-w-0 space-y-4">
          {/* Account + mode */}
          {accounts.length > 1 && (
            <div className="space-y-3">
              {mirrorAvailable && (
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={() => setMode('single')} className={toggleClass(mode === 'single', 'flat')}>
                    One account
                  </button>
                  <button type="button" onClick={() => setMode('mirrored')} className={toggleClass(mode === 'mirrored', 'flat')}>
                    Mirrored across accounts
                  </button>
                </div>
              )}

              {mode === 'single' ? (
                <div>
                  <label className={FIELD_LABEL} htmlFor="trade-account">Account</label>
                  <Select value={form.accountId} onValueChange={v => update('accountId', v)}>
                    <SelectTrigger id="trade-account" className={FIELD}><SelectValue placeholder="Select account" /></SelectTrigger>
                    <SelectContent>
                      {accounts.map(a => (
                        <SelectItem key={a.id} value={a.id}>{a.name} ({a.type}) · {a.currency}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div>
                  <span className={FIELD_LABEL}>Accounts (pick 2 or more)</span>
                  <div className="flex flex-wrap gap-1.5">
                    {accounts.map(a => {
                      const active = selectedMirrorIds.includes(a.id);
                      return (
                        <button
                          key={a.id}
                          type="button"
                          aria-pressed={active}
                          onClick={() => toggleMirrorAccount(a.id)}
                          className="ef-chip"
                          data-active={active}
                        >
                          {a.name}
                          {a.quantity > 1 && <span className="text-ef-ink-4">×{a.quantity}</span>}
                        </button>
                      );
                    })}
                  </div>
                  {selectedMirrorIds.length === 1 && (
                    <p className="m-0 mt-2 text-[11.5px] text-ef-ink-3">Pick one more account or switch back to one account.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Instrument, P&L */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={FIELD_LABEL} htmlFor="trade-instrument">Instrument</label>
              <CreatableSelect
                id="trade-instrument"
                value={form.instrument}
                onChange={v => update('instrument', v)}
                options={instruments}
                onAddOption={addInstrument}
                placeholder="Select or add"
                uppercase
              />
            </div>
            <div>
              <label className={FIELD_LABEL} htmlFor="trade-pnl">{mode === 'mirrored' ? 'Total P&L ($)' : 'P&L ($)'}</label>
              <Input
                id="trade-pnl"
                type="number"
                step="any"
                min="0"
                inputMode="decimal"
                value={form.pnl}
                onChange={e => update('pnl', e.target.value)}
                placeholder="Amount, without a sign"
                className={cn(FIELD, 'ef-num')}
              />
            </div>
          </div>

          {/* Direction, Result */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <span className={FIELD_LABEL}>Direction</span>
              <div className="flex gap-1.5">
                <button type="button" aria-pressed={form.direction === 'long'} onClick={() => update('direction', 'long')} className={toggleClass(form.direction === 'long')}>
                  <ArrowUpRight className="h-3.5 w-3.5" weight="bold" /> Long
                </button>
                <button type="button" aria-pressed={form.direction === 'short'} onClick={() => update('direction', 'short')} className={toggleClass(form.direction === 'short')}>
                  <ArrowDownRight className="h-3.5 w-3.5" weight="bold" /> Short
                </button>
              </div>
            </div>
            <div>
              <span className={FIELD_LABEL}>Result</span>
              <div className="flex gap-1.5">
                <button type="button" aria-pressed={form.outcome === 'win'} onClick={() => update('outcome', 'win')} className={toggleClass(form.outcome === 'win', 'pos')}>Win</button>
                <button type="button" aria-pressed={form.outcome === 'loss'} onClick={() => update('outcome', 'loss')} className={toggleClass(form.outcome === 'loss', 'neg')}>Loss</button>
                <button type="button" aria-pressed={form.outcome === 'breakeven'} onClick={() => update('outcome', 'breakeven')} className={toggleClass(form.outcome === 'breakeven', 'flat')}>Breakeven</button>
              </div>
            </div>
          </div>

          {/* Date, Session, Setup */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <span className={FIELD_LABEL}>Date</span>
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" className={cn(FIELD, 'ef-num flex items-center justify-between text-left')}>
                    {form.date ? form.date.slice(0, 10) : 'Pick a date'}
                    <CalendarBlank className="h-3.5 w-3.5 text-ef-ink-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="pointer-events-auto w-auto border-ef-line bg-ef-elev p-3 backdrop-blur-none" align="start">
                  <RacCalendar
                    value={form.date ? parseDate(form.date.slice(0, 10)) : undefined}
                    onChange={(val: DateValue) => { if (val) update('date', val.toString()); }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className={FIELD_LABEL} htmlFor="trade-session">Session</label>
              <Select value={form.session} onValueChange={v => update('session', v)}>
                <SelectTrigger id="trade-session" className={FIELD}><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {SESSIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className={FIELD_LABEL} htmlFor="trade-setup">Setup</label>
              <CreatableSelect
                id="trade-setup"
                value={form.strategy}
                onChange={v => update('strategy', v)}
                options={confirmations}
                onAddOption={addConfirmation}
                placeholder="Select or add"
              />
            </div>
          </div>

          {/* R, Risk, Plan */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className={FIELD_LABEL} htmlFor="trade-r">R multiple</label>
              <Input id="trade-r" type="number" step="0.1" inputMode="decimal" value={form.rMultiple} onChange={e => update('rMultiple', e.target.value)} placeholder="2.5" className={cn(FIELD, 'ef-num')} />
            </div>
            <div>
              <label className={FIELD_LABEL} htmlFor="trade-risk">Risk %</label>
              <Input id="trade-risk" type="number" step="0.1" min="0" max="100" inputMode="decimal" value={form.riskPercent} onChange={e => update('riskPercent', e.target.value)} placeholder="1.0" className={cn(FIELD, 'ef-num')} />
            </div>
            <div>
              <span className={FIELD_LABEL}>Followed plan</span>
              <div className="flex gap-1.5">
                <button type="button" aria-pressed={form.followedPlan === 'yes'} onClick={() => update('followedPlan', form.followedPlan === 'yes' ? '' : 'yes')} className={toggleClass(form.followedPlan === 'yes')}>Yes</button>
                <button type="button" aria-pressed={form.followedPlan === 'no'} onClick={() => update('followedPlan', form.followedPlan === 'no' ? '' : 'no')} className={toggleClass(form.followedPlan === 'no', 'neg')}>No</button>
              </div>
            </div>
          </div>

          {/* ─── Mirrored P&L breakdown ─── */}
          {mode === 'mirrored' && selectedMirrorAccounts.length >= 2 && (
            <div className="space-y-2 rounded-control border border-ef-line bg-ef-bg p-3">
              <div className="flex items-center justify-between">
                <span className="ef-label">Per-account split · {customized ? 'custom' : 'estimated'}</span>
                <button
                  type="button"
                  onClick={() => {
                    if (!customized) {
                      // Seed overrides from current estimate so user starts from the split, not blanks.
                      const seed: Record<string, string> = {};
                      selectedMirrorAccounts.forEach(a => { seed[a.id] = String(estimatedLegs[a.id] ?? 0); });
                      setLegOverrides(seed);
                    }
                    setCustomized(v => !v);
                  }}
                  className="text-[11.5px] font-medium text-ef-ink-3 underline-offset-2 hover:text-ef-ink hover:underline"
                >
                  {customized ? 'Use auto-split' : 'Customize per account'}
                </button>
              </div>

              <div className="space-y-1.5">
                {selectedMirrorAccounts.map(a => {
                  const est = estimatedLegs[a.id] ?? 0;
                  const name = (
                    <span className="min-w-0 flex-1 truncate text-[12.5px] text-ef-ink">
                      {a.name}
                      {a.quantity > 1 && <span className="text-ef-ink-4"> ×{a.quantity}</span>}
                    </span>
                  );
                  if (customized) {
                    return (
                      <div key={a.id} className="flex items-center gap-2">
                        {name}
                        <Input
                          type="number"
                          step="any"
                          aria-label={`P&L for ${a.name}`}
                          value={legOverrides[a.id] ?? ''}
                          onChange={e => setLegOverrides(prev => ({ ...prev, [a.id]: e.target.value }))}
                          className={cn(FIELD, 'ef-num h-8 w-32 text-right')}
                        />
                      </div>
                    );
                  }
                  const perInstance = a.quantity > 1 ? est / a.quantity : null;
                  return (
                    <div key={a.id} className="flex items-center justify-between gap-2">
                      {name}
                      <span className="text-right">
                        <span className={cn('ef-num text-[12.5px]', est > 0 ? 'text-ef-pos' : est < 0 ? 'text-ef-neg' : 'text-ef-ink-3')}>
                          {fmtSignedMoney(est, 2)}
                        </span>
                        {perInstance !== null && (
                          <span className="ef-num ml-2 text-[10.5px] text-ef-ink-4">({fmtSignedMoney(perInstance, 2)} each)</span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>

              {customizationDelta && Math.abs(customizationDelta.diff) > 0.01 && (
                <div className="flex items-center justify-between border-t border-ef-line pt-1.5 text-[11.5px]">
                  <span className="text-ef-ink-3">
                    Legs total <span className="ef-num">{customizationDelta.sum.toFixed(2)}</span> against <span className="ef-num">{customizationDelta.total.toFixed(2)}</span>
                  </span>
                  <span className={cn('ef-num font-medium', Math.abs(customizationDelta.diff) > 1 ? 'text-ef-warn' : 'text-ef-ink-3')}>
                    Δ {fmtSignedMoney(customizationDelta.diff, 2)}
                  </span>
                </div>
              )}
              <p className="m-0 text-[11px] leading-snug text-ef-ink-4">
                The estimate splits P&L by account size. Customize it if slippage or a missed fill changed a real result.
              </p>
            </div>
          )}

          {/* ─── Optional context ─── */}
          <div>
            <button
              type="button"
              aria-expanded={showAdvanced}
              onClick={() => setShowAdvanced(v => !v)}
              className="ef-focus -ml-1 flex items-center gap-1.5 rounded-chip px-1 py-0.5 text-[12px] font-medium text-ef-ink-3 transition-colors hover:text-ef-ink"
            >
              <CaretDown className={cn('h-3 w-3 transition-transform', showAdvanced && 'rotate-180')} weight="bold" />
              {showAdvanced ? 'Hide context' : 'Add context: bias, emotion, confidence, duration'}
            </button>

            {showAdvanced && (
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={FIELD_LABEL} htmlFor="trade-bias">Higher-timeframe bias</label>
                  <Select value={form.htfBias} onValueChange={v => update('htfBias', v)}>
                    <SelectTrigger id="trade-bias" className={FIELD}><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {HTF_BIASES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className={FIELD_LABEL} htmlFor="trade-time">Time in trade (min)</label>
                  <Input id="trade-time" type="number" min="0" inputMode="numeric" value={form.timeInTrade} onChange={e => update('timeInTrade', e.target.value)} placeholder="45" className={cn(FIELD, 'ef-num')} />
                </div>
                <Scale label="Emotional state" hint="1 tilted, 5 calm" value={form.emotionalState} onChange={v => update('emotionalState', v)} />
                <Scale label="Confidence" hint="1 low, 5 high" value={form.confidenceLevel} onChange={v => update('confidenceLevel', v)} />
              </div>
            )}
          </div>

          {/* ─── Entry checklist ───
              Recorded when a trade is logged. Edits do not rewrite it, so it is
              shown read-only in the drawer instead of here. */}
          {!initialData && activeCriteria.length > 0 && (
            <div className="rounded-control border border-ef-line bg-ef-bg p-3.5">
              <TradeChecklist checks={checks} onChange={setChecks} />
            </div>
          )}
        </div>

        {/* ─── Chart and note ─── */}
        <div className="min-w-0 space-y-4">
          <div>
            <span className={FIELD_LABEL}>Chart screenshot</span>
            {shotSrc ? (
              <div className="relative overflow-hidden rounded-control border border-ef-line bg-ef-bg">
                <img src={safeImgSrc(shotSrc)} alt="Chart screenshot attached to this trade" className="block max-h-56 w-full object-contain" />
                <button
                  type="button"
                  onClick={clearScreenshot}
                  aria-label="Remove screenshot"
                  className="ef-focus absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-chip border border-ef-line bg-ef-elev text-ef-ink-2 hover:text-ef-ink"
                >
                  <X className="h-3 w-3" weight="bold" />
                </button>
              </div>
            ) : (
              <label
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) handleScreenshotSelect(f);
                }}
                className={cn(
                  'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-control border border-dashed px-3 text-center transition-colors focus-within:border-ef-ink-3',
                  two ? 'h-36' : 'h-24',
                  dragOver ? 'border-ef-ink-3 bg-ef-hover' : 'border-ef-line-strong bg-ef-bg hover:border-ef-ink-3',
                )}
              >
                <ImageSquare className="h-5 w-5 text-ef-ink-4" />
                <span className="text-[12px] leading-snug text-ef-ink-3">Drop the chart here, or click to choose</span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleScreenshotSelect(f); }}
                />
              </label>
            )}
          </div>
          <div>
            <label className={FIELD_LABEL} htmlFor="trade-notes">Note</label>
            <Textarea
              id="trade-notes"
              value={form.notes}
              onChange={e => update('notes', e.target.value)}
              placeholder="What did you see, and what would you repeat or change?"
              className={cn(FIELD, 'h-auto min-h-[104px] resize-y py-2.5 leading-relaxed')}
            />
          </div>
        </div>
      </div>

      {/* ─── Actions ─── */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="ef-btn h-9 bg-[#10b981] px-4 font-semibold text-black hover:bg-[#10b981]/90"
        >
          {isSubmitting ? 'Saving…' : submitLabel}
        </button>
        {!initialData && onSaved && (
          <button
            type="submit"
            disabled={isSubmitting}
            onClick={() => { anotherRef.current = true; }}
            className="ef-btn ef-btn-secondary h-9"
          >
            Save and log another
          </button>
        )}
        {onCancel && (
          <button type="button" onClick={onCancel} className="ef-btn ef-btn-ghost h-9">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function Scale({ label, hint, value, onChange }: { label: string; hint: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <span className={FIELD_LABEL}>
        {label} <span className="font-normal text-ef-ink-4">· {hint}</span>
      </span>
      <div className="flex gap-1" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === String(n)}
            onClick={() => onChange(value === String(n) ? '' : String(n))}
            className={cn(toggleClass(value === String(n), 'flat'), 'ef-num')}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
