import { Checkbox } from '@/components/ui/checkbox';
import { useCriteria } from '@/hooks/useCriteria';
import { CircleNotch } from '@phosphor-icons/react';

interface TradeChecklistProps {
  checks: Record<string, boolean>;
  onChange: (checks: Record<string, boolean>) => void;
}

export function TradeChecklist({ checks, onChange }: TradeChecklistProps) {
  const { activeCriteria, isLoading } = useCriteria();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-[rgba(255,255,255,0.35)]">
        <CircleNotch className="h-3 w-3 animate-spin" weight="regular" /> Loading checklist...
      </div>
    );
  }

  if (activeCriteria.length === 0) return null;

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
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[rgba(255,255,255,0.3)]">
          Entry Checklist
        </span>
        <span className={`text-[10px] font-mono font-semibold ${checkedCount === total && total > 0 ? 'text-white' : 'text-[rgba(255,255,255,0.3)]'}`}>
          {checkedCount}/{total}
        </span>
      </div>

      <div className="space-y-3">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            {Object.keys(grouped).length > 1 && (
              <p className="text-[9px] text-[rgba(255,255,255,0.25)] uppercase tracking-widest mb-1.5 ml-0.5">{category}</p>
            )}
            <div className="space-y-2">
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
                      checks[c.id] ? 'text-white' : 'text-[rgba(255,255,255,0.45)]'
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
