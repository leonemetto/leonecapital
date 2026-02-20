import { useState } from 'react';
import { motion } from 'framer-motion';
import { useCriteria } from '@/hooks/useCriteria';
import { Button } from '@/components/ui/button';
import { CheckSquare, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ChecklistSetupProps {
  onDone: () => void;
}

const DEFAULT_CRITERIA = [
  { label: 'Less than 2h POI', category: 'Timeframe' },
  { label: 'Clear DOL (Draw on Liquidity)', category: 'Liquidity' },
  { label: 'Risk-to-Reward >1:2', category: 'Risk' },
  { label: 'Higher Timeframe Alignment', category: 'Trend' },
  { label: 'ICT Kill Zone Active', category: 'Session' },
  { label: 'No News in Next 30min', category: 'Risk' },
];

export function ChecklistSetup({ onDone }: ChecklistSetupProps) {
  const { seedDefaults } = useCriteria();
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set(DEFAULT_CRITERIA.map((_, i) => i)));

  const toggle = (i: number) => setSelected(prev => {
    const next = new Set(prev);
    next.has(i) ? next.delete(i) : next.add(i);
    return next;
  });

  const handleUseDefaults = async () => {
    setLoading(true);
    try {
      await seedDefaults();
      toast.success('Entry checklist created!');
      onDone();
    } catch (err: any) {
      toast.error(err.message || 'Failed to set up checklist');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="glass-card p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
              <CheckSquare className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-xl font-bold">Entry Checklist Setup</h1>
            <p className="text-sm text-muted-foreground">
              Define the criteria you must check before entering a trade. We've pre-loaded industry-standard items — customize later in Settings.
            </p>
          </div>

          <div className="space-y-2">
            {DEFAULT_CRITERIA.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggle(i)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                  selected.has(i)
                    ? 'bg-primary/10 border-primary/30 text-foreground'
                    : 'bg-secondary border-border text-muted-foreground'
                }`}
              >
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                  selected.has(i) ? 'bg-primary border-primary' : 'border-muted-foreground/40'
                }`}>
                  {selected.has(i) && (
                    <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold">{c.label}</p>
                  <p className="text-[10px] text-muted-foreground">{c.category}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-2 pt-1">
            <Button onClick={handleUseDefaults} disabled={loading} className="flex-1 gap-1.5">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckSquare className="h-4 w-4" />}
              {loading ? 'Setting up...' : 'Use These Defaults'}
            </Button>
            <Button variant="ghost" onClick={onDone} disabled={loading}>
              Skip
            </Button>
          </div>

          <p className="text-[10px] text-center text-muted-foreground">
            You can add, edit, or remove criteria anytime in Settings → Trading Plan
          </p>
        </div>
      </motion.div>
    </div>
  );
}
