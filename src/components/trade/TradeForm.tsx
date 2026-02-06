import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Trade, TradeFormData, INSTRUMENTS, STRATEGIES, SETUP_TYPES, EMOTIONS } from '@/types/trade';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowUpRight, ArrowDownRight, Save, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

interface TradeFormProps {
  initialData?: Trade;
  onSubmit: (data: TradeFormData) => void;
  submitLabel?: string;
  onCancel?: () => void;
}

const defaults = {
  date: new Date().toISOString().slice(0, 16),
  instrument: '',
  direction: 'long' as const,
  entryPrice: '',
  stopLoss: '',
  takeProfit: '',
  exitPrice: '',
  lotSize: '',
  riskAmount: '',
  pnl: '',
  strategy: '',
  setupType: '',
  emotionBefore: '',
  emotionAfter: '',
  notes: '',
};

export function TradeForm({ initialData, onSubmit, submitLabel = 'Log Trade', onCancel }: TradeFormProps) {
  const navigate = useNavigate();
  const [form, setForm] = useState(() => {
    if (initialData) {
      return {
        date: initialData.date,
        instrument: initialData.instrument,
        direction: initialData.direction,
        entryPrice: String(initialData.entryPrice),
        stopLoss: String(initialData.stopLoss),
        takeProfit: String(initialData.takeProfit),
        exitPrice: String(initialData.exitPrice),
        lotSize: String(initialData.lotSize),
        riskAmount: String(initialData.riskAmount),
        pnl: String(initialData.pnl),
        strategy: initialData.strategy,
        setupType: initialData.setupType,
        emotionBefore: initialData.emotionBefore,
        emotionAfter: initialData.emotionAfter,
        notes: initialData.notes,
      };
    }
    return defaults;
  });

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const rrRatio = useMemo(() => {
    const entry = parseFloat(form.entryPrice);
    const sl = parseFloat(form.stopLoss);
    const tp = parseFloat(form.takeProfit);
    if (!entry || !sl || !tp) return null;
    const risk = Math.abs(entry - sl);
    const reward = Math.abs(tp - entry);
    return risk > 0 ? (reward / risk).toFixed(2) : null;
  }, [form.entryPrice, form.stopLoss, form.takeProfit]);

  const outcome = useMemo(() => {
    const pnl = parseFloat(form.pnl);
    if (isNaN(pnl)) return null;
    return pnl > 0 ? 'WIN' : pnl < 0 ? 'LOSS' : 'BE';
  }, [form.pnl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entry = parseFloat(form.entryPrice);
    const sl = parseFloat(form.stopLoss);
    const tp = parseFloat(form.takeProfit);
    const exit = parseFloat(form.exitPrice);
    const pnl = parseFloat(form.pnl);

    if (!form.instrument || isNaN(entry) || isNaN(sl) || isNaN(tp) || isNaN(exit) || isNaN(pnl)) {
      toast.error('Please fill in all required price fields');
      return;
    }

    onSubmit({
      date: form.date,
      instrument: form.instrument,
      direction: form.direction as 'long' | 'short',
      entryPrice: entry,
      stopLoss: sl,
      takeProfit: tp,
      exitPrice: exit,
      lotSize: parseFloat(form.lotSize) || 0,
      riskAmount: parseFloat(form.riskAmount) || 0,
      pnl,
      strategy: form.strategy,
      setupType: form.setupType,
      emotionBefore: form.emotionBefore,
      emotionAfter: form.emotionAfter,
      notes: form.notes,
    });

    toast.success(initialData ? 'Trade updated!' : 'Trade logged!');
    if (!initialData) {
      setForm(defaults);
      navigate('/journal');
    }
    if (onCancel) onCancel();
  };

  const reset = () => setForm(defaults);

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Trade Details */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Trade Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="date" className="text-xs text-muted-foreground">Date & Time</Label>
            <Input id="date" type="datetime-local" value={form.date} onChange={e => update('date', e.target.value)}
              className="mt-1 bg-secondary border-border font-mono text-sm" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Instrument</Label>
            <Select value={form.instrument} onValueChange={v => update('instrument', v)}>
              <SelectTrigger className="mt-1 bg-secondary border-border">
                <SelectValue placeholder="Select instrument" />
              </SelectTrigger>
              <SelectContent>
                {INSTRUMENTS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Direction</Label>
            <div className="flex gap-2 mt-1">
              <button
                type="button"
                onClick={() => update('direction', 'long')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all border',
                  form.direction === 'long'
                    ? 'bg-profit/15 text-profit border-profit/30'
                    : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                )}
              >
                <ArrowUpRight className="h-4 w-4" /> Long
              </button>
              <button
                type="button"
                onClick={() => update('direction', 'short')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all border',
                  form.direction === 'short'
                    ? 'bg-loss/15 text-loss border-loss/30'
                    : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                )}
              >
                <ArrowDownRight className="h-4 w-4" /> Short
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Prices */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Prices</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground">Entry Price</Label>
            <Input type="number" step="any" value={form.entryPrice} onChange={e => update('entryPrice', e.target.value)}
              placeholder="0.00" className="mt-1 bg-secondary border-border font-mono" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Stop Loss</Label>
            <Input type="number" step="any" value={form.stopLoss} onChange={e => update('stopLoss', e.target.value)}
              placeholder="0.00" className="mt-1 bg-secondary border-border font-mono" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Take Profit</Label>
            <Input type="number" step="any" value={form.takeProfit} onChange={e => update('takeProfit', e.target.value)}
              placeholder="0.00" className="mt-1 bg-secondary border-border font-mono" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Exit Price</Label>
            <Input type="number" step="any" value={form.exitPrice} onChange={e => update('exitPrice', e.target.value)}
              placeholder="0.00" className="mt-1 bg-secondary border-border font-mono" />
          </div>
        </div>
        {rrRatio && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Planned R:R →</span>
            <span className="font-mono font-semibold text-primary">{rrRatio}</span>
          </div>
        )}
      </div>

      {/* Position */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Position & Result</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground">Lot Size</Label>
            <Input type="number" step="any" value={form.lotSize} onChange={e => update('lotSize', e.target.value)}
              placeholder="0.01" className="mt-1 bg-secondary border-border font-mono" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Risk Amount ($)</Label>
            <Input type="number" step="any" value={form.riskAmount} onChange={e => update('riskAmount', e.target.value)}
              placeholder="0.00" className="mt-1 bg-secondary border-border font-mono" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">P&L ($)</Label>
            <div className="relative">
              <Input type="number" step="any" value={form.pnl} onChange={e => update('pnl', e.target.value)}
                placeholder="0.00" className="mt-1 bg-secondary border-border font-mono" />
              {outcome && (
                <span className={cn(
                  'absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5',
                  outcome === 'WIN' ? 'bg-profit/20 text-profit' : outcome === 'LOSS' ? 'bg-loss/20 text-loss' : 'bg-secondary text-muted-foreground'
                )}>
                  {outcome}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Strategy */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Strategy</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground">Strategy</Label>
            <Select value={form.strategy} onValueChange={v => update('strategy', v)}>
              <SelectTrigger className="mt-1 bg-secondary border-border">
                <SelectValue placeholder="Select strategy" />
              </SelectTrigger>
              <SelectContent>
                {STRATEGIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Setup Type</Label>
            <Select value={form.setupType} onValueChange={v => update('setupType', v)}>
              <SelectTrigger className="mt-1 bg-secondary border-border">
                <SelectValue placeholder="Select setup" />
              </SelectTrigger>
              <SelectContent>
                {SETUP_TYPES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Psychology */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Psychology</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground">Emotion Before</Label>
            <Select value={form.emotionBefore} onValueChange={v => update('emotionBefore', v)}>
              <SelectTrigger className="mt-1 bg-secondary border-border">
                <SelectValue placeholder="How did you feel?" />
              </SelectTrigger>
              <SelectContent>
                {EMOTIONS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Emotion After</Label>
            <Select value={form.emotionAfter} onValueChange={v => update('emotionAfter', v)}>
              <SelectTrigger className="mt-1 bg-secondary border-border">
                <SelectValue placeholder="How do you feel now?" />
              </SelectTrigger>
              <SelectContent>
                {EMOTIONS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="glass-card p-6">
        <Label className="text-xs text-muted-foreground">Notes</Label>
        <Textarea
          value={form.notes}
          onChange={e => update('notes', e.target.value)}
          placeholder="Trade rationale, setup notes, lessons learned..."
          className="mt-1 bg-secondary border-border min-h-[100px] resize-y"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button type="submit" className="px-6">
          <Save className="h-4 w-4 mr-2" />
          {submitLabel}
        </Button>
        {!initialData && (
          <Button type="button" variant="outline" onClick={reset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        )}
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        )}
      </div>
    </motion.form>
  );
}
