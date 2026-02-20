import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useCriteria } from '@/hooks/useCriteria';
import { Loader2 } from 'lucide-react';

interface TradeChecklistProps {
  checks: Record<string, boolean>;
  onChange: (checks: Record<string, boolean>) => void;
}

export function TradeChecklist({ checks, onChange }: TradeChecklistProps) {
  const { activeCriteria, isLoading } = useCriteria();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" /> Loading checklist...
      </div>
    );
  }

  if (activeCriteria.length === 0) return null;

  // Group by category
  const grouped: Record<string, typeof activeCriteria> = {};
  for (const c of activeCriteria) {
    const cat = c.category || 'General';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(c);
  }

  const handleToggle = (id: string, checked: boolean) => {
    onChange({ ...checks, [id]: checked });
  };

  const checkedCount = activeCriteria.filter(c => checks[c.id]).length;
  const total = activeCriteria.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Entry Checklist</Label>
        <span className={`text-[10px] font-mono font-semibold ${checkedCount === total ? 'text-profit' : 'text-muted-foreground'}`}>
          {checkedCount}/{total}
        </span>
      </div>

      <div className="space-y-3">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            {Object.keys(grouped).length > 1 && (
              <p className="text-[9px] text-muted-foreground/60 uppercase tracking-widest mb-1.5 ml-0.5">{category}</p>
            )}
            <div className="space-y-1.5">
              {items.map(c => (
                <div key={c.id} className="flex items-center gap-2.5">
                  <Checkbox
                    id={`check-${c.id}`}
                    checked={!!checks[c.id]}
                    onCheckedChange={(val) => handleToggle(c.id, !!val)}
                    className="h-3.5 w-3.5"
                  />
                  <label
                    htmlFor={`check-${c.id}`}
                    className={`text-xs cursor-pointer select-none transition-colors ${
                      checks[c.id] ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {c.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
