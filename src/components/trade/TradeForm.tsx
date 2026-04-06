import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Trade, TradeFormData, SESSIONS, HTF_BIASES } from '@/types/trade';
import { useSharedAccounts } from '@/contexts/AccountsContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreatableSelect } from '@/components/ui/creatable-select';
import { useCustomOptions } from '@/hooks/useCustomOptions';
import { toast } from 'sonner';
import { ArrowUpRight, ArrowDownRight, Zap, HelpCircle, CalendarIcon } from 'lucide-react';
import { motion } from 'framer-motion';
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
  submitLabel?: string;
  onCancel?: () => void;
}

const defaults = {
  date: new Date().toISOString().slice(0, 10),
  instrument: '',
  direction: 'long' as const,
  strategy: '',
  session: '',
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

export function TradeForm({ initialData, onSubmit, submitLabel = 'Log Trade', onCancel }: TradeFormProps) {
  const navigate = useNavigate();
  const { accounts } = useSharedAccounts();
  const { instruments, confirmations, addInstrument, addConfirmation } = useCustomOptions();
  const { activeCriteria } = useCriteria();
  const [checks, setChecks] = useState<Record<string, boolean>>({});
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

  const [openTooltip, setOpenTooltip] = useState<string | null>(null);

  const toggleTooltip = (id: string) => {
    setOpenTooltip(prev => prev === id ? null : id);
  };

  const renderTooltip = (id: string, text: string) => (
    <TooltipProvider delayDuration={0}>
      <Tooltip open={openTooltip === id} onOpenChange={() => {}}>
        <TooltipTrigger asChild>
          <button type="button" className="ml-1 inline-flex" onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleTooltip(id); }}>
            <HelpCircle className="h-3 w-3 text-muted-foreground/60 hover:text-muted-foreground transition-colors" />
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

    try {
      const savedTrade = await onSubmit({
        date: form.date,
        instrument: form.instrument,
        direction: form.direction as 'long' | 'short',
        strategy: form.strategy,
        session: form.session,
        outcome,
        pnl,
        rMultiple: form.rMultiple ? parseFloat(form.rMultiple) : undefined,
        riskPercent: form.riskPercent ? parseFloat(form.riskPercent) : undefined,
        htfBias: form.htfBias || undefined,
        emotionalState: form.emotionalState ? parseInt(form.emotionalState) : undefined,
        confidenceLevel: form.confidenceLevel ? parseInt(form.confidenceLevel) : undefined,
        timeInTrade: form.timeInTrade ? parseInt(form.timeInTrade) : undefined,
        followedPlan: form.followedPlan === 'yes' ? true : form.followedPlan === 'no' ? false : undefined,
        notes: form.notes,
        accountId: form.accountId || undefined,
      });

      // Save checklist verifications if there are any checks
      if (savedTrade?.id && Object.keys(checks).length > 0) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('trade_verifications' as any).upsert({
            trade_id: savedTrade.id,
            user_id: user.id,
            checks,
          }, { onConflict: 'trade_id' });
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
      toast.error(err.message || 'Failed to save trade');
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="glass-card p-5 space-y-4"
    >
      {/* Account selector */}
      {accounts.length > 0 && (
        <div className="max-w-xs">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Account</Label>
          <Select value={form.accountId} onValueChange={v => update('accountId', v)}>
            <SelectTrigger className="mt-1 bg-secondary border-border h-9">
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map(a => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name} ({a.type}) — {a.currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Row 1: Date, Instrument, Direction */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <Label htmlFor="date" className="text-[10px] text-muted-foreground uppercase tracking-wider">Date</Label>
          <Input id="date" type="date" value={form.date.slice(0, 10)} onChange={e => update('date', e.target.value)}
            className="mt-1 bg-secondary border-border font-mono text-sm h-9" />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Instrument</Label>
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
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Direction</Label>
          <div className="flex gap-1.5 mt-1">
            <button
              type="button"
              onClick={() => update('direction', 'long')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1 py-2 rounded-md text-xs font-semibold transition-all border h-9',
                form.direction === 'long'
                  ? 'bg-profit/15 text-profit border-profit/30'
                  : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
              )}
            >
              <ArrowUpRight className="h-3 w-3" /> Long
            </button>
            <button
              type="button"
              onClick={() => update('direction', 'short')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1 py-2 rounded-md text-xs font-semibold transition-all border h-9',
                form.direction === 'short'
                  ? 'bg-loss/15 text-loss border-loss/30'
                  : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
              )}
            >
              <ArrowDownRight className="h-3 w-3" /> Short
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: Strategy, Session, Result */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Entry Confirmation</Label>
          <CreatableSelect
            value={form.strategy}
            onChange={v => update('strategy', v)}
            options={confirmations}
            onAddOption={addConfirmation}
            placeholder="Select or add..."
          />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Session</Label>
          <Select value={form.session} onValueChange={v => update('session', v)}>
            <SelectTrigger className="mt-1 bg-secondary border-border h-9">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {SESSIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Result</Label>
          <div className="flex gap-1 mt-1">
            {(['win', 'loss', 'breakeven'] as const).map(o => (
              <button
                key={o}
                type="button"
                onClick={() => update('outcome', o)}
                className={cn(
                  'flex-1 py-2 rounded-md text-xs font-semibold transition-all border h-9',
                  form.outcome === o
                    ? o === 'win' ? 'bg-profit/15 text-profit border-profit/30'
                      : o === 'loss' ? 'bg-loss/15 text-loss border-loss/30'
                      : 'bg-secondary text-foreground border-foreground/20'
                    : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                )}
              >
                {o === 'breakeven' ? 'BE' : o.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: P&L, R-Multiple, Risk % */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">P&L Amount ($)</Label>
          <Input type="number" step="any" min="0" value={form.pnl} onChange={e => update('pnl', e.target.value)}
            placeholder="Enter amount" className="mt-1 bg-secondary border-border font-mono h-9" />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">R-Multiple</Label>
          <Input type="number" step="0.1" value={form.rMultiple} onChange={e => update('rMultiple', e.target.value)}
            placeholder="e.g. 2.5" className="mt-1 bg-secondary border-border font-mono h-9" />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Risk %</Label>
          <Input type="number" step="0.1" min="0" max="100" value={form.riskPercent} onChange={e => update('riskPercent', e.target.value)}
            placeholder="e.g. 1.0" className="mt-1 bg-secondary border-border font-mono h-9" />
        </div>
      </div>

      {/* Row 4: HTF Bias, Emotional State, Confidence */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">HTF Bias</Label>
          <Select value={form.htfBias} onValueChange={v => update('htfBias', v)}>
            <SelectTrigger className="mt-1 bg-secondary border-border h-9">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {HTF_BIASES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Emotional State (1-5){renderTooltip("emotional", "Rate your emotional state before/during the trade. 1 = very anxious/tilted, 5 = calm and focused.")}</Label>
          <div className="flex gap-1 mt-1">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => update('emotionalState', String(n))}
                className={cn(
                  'flex-1 py-2 rounded-md text-xs font-semibold transition-all border h-9',
                  form.emotionalState === String(n)
                    ? 'bg-primary/15 text-primary border-primary/30'
                    : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Confidence (1-5){renderTooltip("confidence", "How confident were you in this trade setup before entering? 1 = low conviction, 5 = very high conviction.")}</Label>
          <div className="flex gap-1 mt-1">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => update('confidenceLevel', String(n))}
                className={cn(
                  'flex-1 py-2 rounded-md text-xs font-semibold transition-all border h-9',
                  form.confidenceLevel === String(n)
                    ? 'bg-primary/15 text-primary border-primary/30'
                    : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Row 5: Time in Trade, Followed Plan, Notes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Time in Trade (min)</Label>
          <Input type="number" min="0" value={form.timeInTrade} onChange={e => update('timeInTrade', e.target.value)}
            placeholder="e.g. 45" className="mt-1 bg-secondary border-border font-mono h-9" />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Followed Plan?{renderTooltip("plan", "Did you follow every item on your entry checklist? Selecting YES will auto-tick all checklist items below.")}</Label>
          <div className="flex gap-1.5 mt-1">
            {[{ val: 'yes', label: 'YES' }, { val: 'no', label: 'NO' }].map(o => (
              <button
                key={o.val}
                type="button"
                onClick={() => update('followedPlan', o.val)}
                className={cn(
                  'flex-1 py-2 rounded-md text-xs font-semibold transition-all border h-9',
                  form.followedPlan === o.val
                    ? o.val === 'yes' ? 'bg-profit/15 text-profit border-profit/30'
                      : 'bg-loss/15 text-loss border-loss/30'
                    : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Notes (optional)</Label>
          <Textarea
            value={form.notes}
            onChange={e => update('notes', e.target.value)}
            placeholder="Quick notes..."
            className="mt-1 bg-secondary border-border min-h-[36px] h-9 resize-none text-sm py-2"
          />
        </div>
      </div>

      {/* Entry Checklist */}
      <div className="border-t border-border pt-4">
        <TradeChecklist checks={checks} onChange={setChecks} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <Button type="submit" size="sm" className="gap-1.5 px-5">
          <Zap className="h-3.5 w-3.5" />
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        )}
      </div>
    </motion.form>
  );
}
