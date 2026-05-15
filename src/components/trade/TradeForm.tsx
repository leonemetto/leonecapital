import { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Trade, TradeFormData, MirroredTradeFormData, SESSIONS, HTF_BIASES } from '@/types/trade';
import { splitPnlByCopyWeight } from '@/lib/mirroredTrades';
import { useSharedAccounts } from '@/contexts/AccountsContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreatableSelect } from '@/components/ui/creatable-select';
import { useCustomOptions } from '@/hooks/useCustomOptions';
import { toast } from 'sonner';
import { ArrowUpRight, ArrowDownRight, Lightning, Question, CalendarBlank, CaretDown, CaretUp, Image, X } from '@phosphor-icons/react';
import { deleteTradeScreenshot } from '@/hooks/useTrades';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RacCalendar } from '@/components/ui/calendar-rac';
import { useCriteria } from '@/hooks/useCriteria';
import { TradeChecklist } from '@/components/criteria/TradeChecklist';
import { supabase } from '@/integrations/supabase/client';
import { parseDate } from '@internationalized/date';
import type { DateValue } from 'react-aria-components';

interface TradeFormProps {
  initialData?: Trade;
  onSubmit: (data: TradeFormData) => void | Promise<any>;
  /** Wire this from AddTrade to enable Mirrored mode. Editing flows leave it undefined. */
  onMirroredSubmit?: (data: MirroredTradeFormData) => void | Promise<any>;
  submitLabel?: string;
  onCancel?: () => void;
}

const LABEL = 'text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60';
const INPUT = 'mt-1 h-9';

const btn = (active: boolean, variant: 'neutral' | 'loss' | 'be' = 'neutral') => cn(
  'flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold transition-all border h-9 outline-none',
  active
    ? variant === 'loss' ? 'bg-[rgba(248,113,113,0.12)] text-[#f87171] border-[rgba(248,113,113,0.25)]'
    : variant === 'be'   ? 'bg-muted text-foreground border-border'
    : 'bg-foreground text-background border-transparent'
    : 'bg-transparent border-border text-muted-foreground/60 hover:text-foreground hover:border-foreground/25'
);

// Detect trading session from local hour
function detectSession(): string {
  const h = new Date().getUTCHours();
  if (h >= 2 && h < 9)  return 'Asian';
  if (h >= 7 && h < 12) return 'London';
  if (h >= 12 && h < 17) return 'New York';
  if (h >= 11 && h < 14) return 'Overlap';
  return '';
}

const defaults = {
  date: new Date().toISOString().slice(0, 10),
  instrument: '',
  direction: 'long' as const,
  strategy: '',
  session: detectSession(),
  outcome: 'win' as const,
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
};

export function TradeForm({ initialData, onSubmit, onMirroredSubmit, submitLabel = 'Log Trade', onCancel }: TradeFormProps) {
  const navigate = useNavigate();
  const { accounts } = useSharedAccounts();
  const { instruments, confirmations, addInstrument, addConfirmation } = useCustomOptions();
  const { activeCriteria } = useCriteria();
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLock = useRef(false);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  // Show advanced by default when editing an existing trade that has advanced fields
  const hasAdvancedData = !!(initialData?.htfBias || initialData?.emotionalState || initialData?.confidenceLevel || initialData?.timeInTrade || initialData?.followedPlan !== undefined || initialData?.notes || initialData?.screenshotUrl);
  const [showAdvanced, setShowAdvanced] = useState(!!initialData && hasAdvancedData);
  const [form, setForm] = useState(() => {
    if (initialData) {
      return {
        date: initialData.date,
        instrument: initialData.instrument,
        direction: initialData.direction,
        strategy: initialData.strategy,
        session: initialData.session,
        outcome: initialData.outcome,
        pnl: String(initialData.pnl),
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
    return { ...defaults, accountId: accounts.length === 1 ? accounts[0].id : '' };
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
    [accounts, selectedMirrorIds]
  );

  // Estimated split based on total P&L + copy weights. Pure derived state.
  const estimatedLegs = useMemo(() => {
    if (mode !== 'mirrored' || selectedMirrorAccounts.length === 0) return {};
    const totalPnl = parseFloat(form.pnl);
    if (isNaN(totalPnl)) return {};
    const signed = form.outcome === 'breakeven' ? 0
      : form.outcome === 'loss' ? -Math.abs(totalPnl)
      : Math.abs(totalPnl);
    return splitPnlByCopyWeight(signed, selectedMirrorAccounts);
  }, [mode, selectedMirrorAccounts, form.pnl, form.outcome]);

  const toggleMirrorAccount = (id: string) => {
    setSelectedMirrorIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    // Clear any stale override for an unticked account.
    setLegOverrides(prev => { const next = { ...prev }; delete next[id]; return next; });
  };

  // Difference indicator. NaN-safe — if user typed nothing yet, shows nothing.
  const customizationDelta = useMemo(() => {
    if (!customized || selectedMirrorAccounts.length === 0) return null;
    const total = parseFloat(form.pnl);
    if (isNaN(total)) return null;
    const signedTotal = form.outcome === 'breakeven' ? 0
      : form.outcome === 'loss' ? -Math.abs(total)
      : Math.abs(total);
    const sumOfLegs = selectedMirrorAccounts.reduce((s, a) => {
      const raw = legOverrides[a.id];
      const parsed = raw !== undefined && raw !== '' ? parseFloat(raw) : estimatedLegs[a.id] ?? 0;
      return s + (isNaN(parsed) ? 0 : parsed);
    }, 0);
    return { total: signedTotal, sum: sumOfLegs, diff: sumOfLegs - signedTotal };
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

  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  const MAX_SCREENSHOT_BYTES = 10 * 1024 * 1024; // 10 MB

  const handleScreenshotSelect = (file: File) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast({ title: 'Invalid file type', description: 'Please upload a JPEG, PNG, GIF, WebP or SVG image.', variant: 'destructive' });
      return;
    }
    if (file.size > MAX_SCREENSHOT_BYTES) {
      toast({ title: 'File too large', description: 'Screenshot must be under 10 MB.', variant: 'destructive' });
      return;
    }
    setScreenshotFile(file);
    setScreenshotPreview(URL.createObjectURL(file));
  };

  const safeImgSrc = (url: string | null | undefined): string => {
    if (!url) return '';
    // Only allow blob: (local preview) and https: (Supabase signed URLs)
    if (url.startsWith('blob:') || url.startsWith('https://')) return url;
    return '';
  };

  const clearScreenshot = () => {
    setScreenshotFile(null);
    setScreenshotPreview(null);
  };

  const [openTooltip, setOpenTooltip] = useState<string | null>(null);

  const renderTooltip = (id: string, text: string) => (
    <TooltipProvider delayDuration={0}>
      <Tooltip open={openTooltip === id} onOpenChange={() => {}}>
        <TooltipTrigger asChild>
          <button type="button" className="ml-1 inline-flex outline-none" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpenTooltip(prev => prev === id ? null : id); }}>
            <Question className="h-3 w-3 text-muted-foreground/40 hover:text-muted-foreground transition-colors" weight="regular" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[200px] text-xs" onPointerDownOutside={() => setOpenTooltip(null)}>
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawPnl = parseFloat(form.pnl);

    if (!form.instrument || isNaN(rawPnl)) {
      toast.error('Instrument and P&L are required');
      return;
    }

    const outcome = form.outcome as 'win' | 'loss' | 'breakeven';
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
        direction: form.direction as 'long' | 'short',
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
          const fromOverride = customized && raw !== undefined && raw !== ''
            ? parseFloat(raw)
            : NaN;
          const legPnl = !isNaN(fromOverride) ? fromOverride : (estimatedLegs[a.id] ?? 0);
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
          const rows = idsToVerify.map(tradeId => ({
            trade_id: tradeId,
            user_id: user.id,
            checks,
          }));
          await supabase.from('trade_verifications').upsert(rows, { onConflict: 'trade_id' });
        }
      }

      toast.success(initialData ? 'Trade updated!' : 'Trade logged!');
      if (!initialData) {
        setForm(defaults);
        setChecks({});
        navigate('/dashboard');
      }
      if (onCancel) onCancel();
    } catch (err: any) {
      if (err.message?.includes('Free tier limit reached')) {
        toast.error('You\'ve reached the 50-trade limit on the free plan. Upgrade to Pro to log more trades.', {
          duration: 6000,
          action: {
            label: 'Upgrade',
            onClick: () => window.location.href = '/pricing',
          },
        });
      } else {
        toast.error(err.message || 'Failed to save trade');
      }
    } finally {
      submitLock.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-3"
    >
      {/* ─── Core Fields ─── */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border/60" style={{ background: 'var(--ef-bg-sunken)' }}>
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/40">Trade Details</span>
        </div>
      <div className="p-5 space-y-4">

        {/* Account + Mode */}
        {accounts.length > 1 && (
          <div className="space-y-3">
            {mirrorAvailable && (
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={() => setMode('single')} className={btn(mode === 'single')}>
                  Single account
                </button>
                <button type="button" onClick={() => setMode('mirrored')} className={btn(mode === 'mirrored')}>
                  Mirrored across accounts
                </button>
              </div>
            )}

            {mode === 'single' ? (
              <div className="max-w-xs">
                <Label className={LABEL}>Account</Label>
                <Select value={form.accountId} onValueChange={v => update('accountId', v)}>
                  <SelectTrigger className={INPUT}><SelectValue placeholder="Select account" /></SelectTrigger>
                  <SelectContent>
                    {accounts.map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.name} ({a.type}) — {a.currency}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div>
                <Label className={LABEL}>Accounts (pick 2 or more)</Label>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {accounts.map(a => {
                    const active = selectedMirrorIds.includes(a.id);
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => toggleMirrorAccount(a.id)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all',
                          active
                            ? 'bg-foreground text-background border-transparent'
                            : 'bg-transparent border-border text-muted-foreground hover:border-foreground/25 hover:text-foreground'
                        )}
                      >
                        {a.name} <span className="opacity-60">· w{a.copyWeight}</span>
                      </button>
                    );
                  })}
                </div>
                {selectedMirrorIds.length === 1 && (
                  <p className="mt-2 text-[11px] text-muted-foreground/60">Pick one more account or switch back to Single.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Row 1: Date, Instrument, Direction */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Label className={LABEL}>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    'mt-1 flex h-9 w-full items-center justify-between rounded-md border bg-background border-input px-3 py-2 text-sm font-mono outline-none hover:border-foreground/25 transition-colors',
                    !form.date && 'text-muted-foreground/60'
                  )}
                >
                  {form.date ? form.date.slice(0, 10) : 'Pick a date'}
                  <CalendarBlank className="h-3.5 w-3.5 text-muted-foreground/50" weight="regular" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3 pointer-events-auto" align="start">
                <RacCalendar
                  value={form.date ? parseDate(form.date.slice(0, 10)) : undefined}
                  onChange={(val: DateValue) => { if (val) update('date', val.toString()); }}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label className={LABEL}>Instrument</Label>
            <CreatableSelect
              value={form.instrument}
              onChange={v => update('instrument', v)}
              options={instruments}
              onAddOption={addInstrument}
              placeholder="Select or add..."
              uppercase
            />
          </div>
          <div>
            <Label className={LABEL}>Direction</Label>
            <div className="flex gap-1.5 mt-1">
              <button type="button" onClick={() => update('direction', 'long')} className={btn(form.direction === 'long')}>
                <ArrowUpRight className="h-3.5 w-3.5" weight="bold" /> Long
              </button>
              <button type="button" onClick={() => update('direction', 'short')} className={btn(form.direction === 'short')}>
                <ArrowDownRight className="h-3.5 w-3.5" weight="bold" /> Short
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Setup, Session, Result */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Label className={LABEL}>Setup / Pattern</Label>
            <CreatableSelect
              value={form.strategy}
              onChange={v => update('strategy', v)}
              options={confirmations}
              onAddOption={addConfirmation}
              placeholder="Select or add..."
            />
          </div>
          <div>
            <Label className={LABEL}>Session</Label>
            <Select value={form.session} onValueChange={v => update('session', v)}>
              <SelectTrigger className={INPUT}><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {SESSIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className={LABEL}>Result</Label>
            <div className="flex gap-1 mt-1">
              <button type="button" onClick={() => update('outcome', 'win')} className={btn(form.outcome === 'win')}>WIN</button>
              <button type="button" onClick={() => update('outcome', 'loss')} className={btn(form.outcome === 'loss', 'loss')}>LOSS</button>
              <button type="button" onClick={() => update('outcome', 'breakeven')} className={btn(form.outcome === 'breakeven', 'be')}>BE</button>
            </div>
          </div>
        </div>

        {/* Row 3: P&L, R-Multiple, Risk % */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Label className={LABEL}>{mode === 'mirrored' ? 'Total P&L Amount ($)' : 'P&L Amount ($)'}</Label>
            <Input type="number" step="any" min="0" value={form.pnl} onChange={e => update('pnl', e.target.value)}
              placeholder="Enter amount" className={cn(INPUT, 'font-mono')} />
          </div>
          <div>
            <Label className={LABEL}>R-Multiple</Label>
            <Input type="number" step="0.1" value={form.rMultiple} onChange={e => update('rMultiple', e.target.value)}
              placeholder="e.g. 2.5" className={cn(INPUT, 'font-mono')} />
          </div>
          <div>
            <Label className={LABEL}>Risk %</Label>
            <Input type="number" step="0.1" min="0" max="100" value={form.riskPercent} onChange={e => update('riskPercent', e.target.value)}
              placeholder="e.g. 1.0" className={cn(INPUT, 'font-mono')} />
          </div>
        </div>

        {/* ─── Mirrored P&L breakdown ─── */}
        {mode === 'mirrored' && selectedMirrorAccounts.length >= 2 && (
          <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">
                Per-account split {customized ? '(customized)' : '(estimated)'}
              </span>
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
                className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {customized ? 'Use auto-split' : 'Customize per account'}
              </button>
            </div>

            <div className="space-y-1.5">
              {selectedMirrorAccounts.map(a => {
                const est = estimatedLegs[a.id] ?? 0;
                if (customized) {
                  return (
                    <div key={a.id} className="flex items-center gap-2">
                      <span className="text-[12px] flex-1 truncate text-foreground">
                        {a.name} <span className="text-muted-foreground/60">· w{a.copyWeight}</span>
                      </span>
                      <Input
                        type="number"
                        step="any"
                        value={legOverrides[a.id] ?? ''}
                        onChange={e => setLegOverrides(prev => ({ ...prev, [a.id]: e.target.value }))}
                        className={cn('h-8 w-32 font-mono text-right')}
                      />
                    </div>
                  );
                }
                return (
                  <div key={a.id} className="flex items-center justify-between text-[12px]">
                    <span className="text-foreground">
                      {a.name} <span className="text-muted-foreground/60">· w{a.copyWeight}</span>
                    </span>
                    <span className={cn(
                      'font-mono',
                      est > 0 ? 'text-[#10b981]' : est < 0 ? 'text-[#f87171]' : 'text-muted-foreground'
                    )}>
                      {est >= 0 ? '+' : ''}{est.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>

            {customizationDelta && Math.abs(customizationDelta.diff) > 0.01 && (
              <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-border/60">
                <span className="text-muted-foreground/70">
                  Sum of legs: <span className="font-mono">{customizationDelta.sum.toFixed(2)}</span> vs Total: <span className="font-mono">{customizationDelta.total.toFixed(2)}</span>
                </span>
                <span className={cn(
                  'font-mono font-semibold',
                  Math.abs(customizationDelta.diff) > 1 ? 'text-[#f59e0b]' : 'text-muted-foreground'
                )}>
                  Δ {customizationDelta.diff >= 0 ? '+' : ''}{customizationDelta.diff.toFixed(2)}
                </span>
              </div>
            )}
            <p className="text-[10px] text-muted-foreground/50 pt-0.5">
              Estimates use each account's copy weight. Slippage and missed fills can make real outcomes differ — customize when needed.
            </p>
          </div>
        )}
        </div>
      </div>

      {/* ─── Advanced Toggle ─── */}
      <button
        type="button"
        onClick={() => setShowAdvanced(v => !v)}
        className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground/50 hover:text-muted-foreground transition-colors outline-none px-1"
      >
        {showAdvanced
          ? <CaretUp className="h-3 w-3" weight="bold" />
          : <CaretDown className="h-3 w-3" weight="bold" />
        }
        {showAdvanced ? 'Hide advanced fields' : 'Advanced fields — psychology, HTF bias, notes'}
      </button>

      {/* ─── Advanced Fields ─── */}
      <AnimatePresence initial={false}>
        {showAdvanced && (
          <motion.div
            key="advanced"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="rounded-xl bg-card border border-border overflow-hidden">
              <div className="px-5 py-3 border-b border-border/60" style={{ background: 'var(--ef-bg-sunken)' }}>
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/40">Psychology & Context</span>
              </div>
            <div className="p-5 space-y-4">
              {/* Row 4: HTF Bias, Emotional State, Confidence */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className={LABEL}>HTF Bias</Label>
                  <Select value={form.htfBias} onValueChange={v => update('htfBias', v)}>
                    <SelectTrigger className={INPUT}><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {HTF_BIASES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className={LABEL}>
                    Emotional State (1-5){renderTooltip('emotional', 'Rate your emotional state. 1 = anxious/tilted, 5 = calm and focused.')}
                  </Label>
                  <div className="flex gap-1 mt-1">
                    {[1,2,3,4,5].map(n => (
                      <button key={n} type="button" onClick={() => update('emotionalState', String(n))} className={btn(form.emotionalState === String(n))}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className={LABEL}>
                    Confidence (1-5){renderTooltip('confidence', 'How confident were you in this setup? 1 = low conviction, 5 = very high conviction.')}
                  </Label>
                  <div className="flex gap-1 mt-1">
                    {[1,2,3,4,5].map(n => (
                      <button key={n} type="button" onClick={() => update('confidenceLevel', String(n))} className={btn(form.confidenceLevel === String(n))}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 5: Time in Trade, Followed Plan, Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className={LABEL}>Time in Trade (min)</Label>
                  <Input type="number" min="0" value={form.timeInTrade} onChange={e => update('timeInTrade', e.target.value)}
                    placeholder="e.g. 45" className={cn(INPUT, 'font-mono')} />
                </div>
                <div>
                  <Label className={LABEL}>
                    Followed Plan?{renderTooltip('plan', 'Did you follow every item on your entry checklist? YES auto-ticks all checklist items.')}
                  </Label>
                  <div className="flex gap-1.5 mt-1">
                    <button type="button" onClick={() => update('followedPlan', 'yes')} className={btn(form.followedPlan === 'yes')}>YES</button>
                    <button type="button" onClick={() => update('followedPlan', 'no')} className={btn(form.followedPlan === 'no', 'loss')}>NO</button>
                  </div>
                </div>
                <div>
                  <Label className={LABEL}>Notes</Label>
                  <Textarea
                    value={form.notes}
                    onChange={e => update('notes', e.target.value)}
                    placeholder="Quick notes..."
                    className="mt-1 min-h-[36px] h-9 resize-none text-sm py-2"
                  />
                </div>
              </div>

              {/* Screenshot upload */}
              <div>
                <Label className={LABEL}>Chart Screenshot</Label>
                {screenshotPreview || initialData?.screenshotUrl ? (
                  <div className="mt-1 relative inline-block">
                    <img
                      src={safeImgSrc(screenshotPreview ?? initialData?.screenshotUrl)}
                      alt="Chart screenshot"
                      className="h-28 w-auto rounded-lg border border-border object-cover"
                    />
                    <button
                      type="button"
                      onClick={clearScreenshot}
                      className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-[#f87171] flex items-center justify-center outline-none"
                    >
                      <X className="h-2.5 w-2.5 text-white" weight="bold" />
                    </button>
                  </div>
                ) : (
                  <label className="mt-1 flex flex-col items-center justify-center gap-1.5 h-20 rounded-lg border border-dashed border-border cursor-pointer hover:border-foreground/25 transition-colors">
                    <Image className="h-5 w-5 text-muted-foreground/40" weight="regular" />
                    <span className="text-[11px] text-muted-foreground/50">Click or drag to attach chart</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleScreenshotSelect(f); }}
                    />
                  </label>
                )}
              </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Entry Checklist ─── */}
      {activeCriteria.length > 0 && (
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          <div className="px-5 py-3 border-b border-border/60" style={{ background: 'var(--ef-bg-sunken)' }}>
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/40">Entry Checklist</span>
          </div>
          <div className="p-5">
            <TradeChecklist checks={checks} onChange={setChecks} />
          </div>
        </div>
      )}

      {/* ─── Actions ─── */}
      <div className="flex items-center gap-2 pt-1">
        <Button
          type="submit"
          size="sm"
          disabled={isSubmitting}
          className="gap-1.5 px-5 bg-[#10b981] hover:bg-[#10b981]/90 text-black font-semibold rounded-[24px] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Lightning className="h-3.5 w-3.5" weight="fill" />
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}
            className="text-muted-foreground/60 hover:text-foreground">
            Cancel
          </Button>
        )}
      </div>
    </motion.form>
  );
}
