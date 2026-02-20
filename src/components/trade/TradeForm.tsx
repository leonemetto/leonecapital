import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Trade, TradeFormData, SESSIONS } from '@/types/trade';
import { useSharedAccounts } from '@/contexts/AccountsContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreatableSelect } from '@/components/ui/creatable-select';
import { useCustomOptions } from '@/hooks/useCustomOptions';
import { toast } from 'sonner';
import { ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { TradeChecklist } from '@/components/criteria/TradeChecklist';
import { supabase } from '@/integrations/supabase/client';

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
  notes: '',
  accountId: '',
};

export function TradeForm({ initialData, onSubmit, submitLabel = 'Log Trade', onCancel }: TradeFormProps) {
  const navigate = useNavigate();
  const { accounts } = useSharedAccounts();
  const { instruments, confirmations, addInstrument, addConfirmation } = useCustomOptions();
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
        notes: initialData.notes,
        accountId: initialData.accountId || '',
      };
    }
    return { ...defaults, accountId: accounts.length === 1 ? accounts[0].id : '' };
  });

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

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
        navigate('/');
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

      {/* Row 3: P&L, R Multiple, Notes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">P&L Amount ($)</Label>
          <Input type="number" step="any" min="0" value={form.pnl} onChange={e => update('pnl', e.target.value)}
            placeholder="Enter amount" className="mt-1 bg-secondary border-border font-mono h-9" />
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
