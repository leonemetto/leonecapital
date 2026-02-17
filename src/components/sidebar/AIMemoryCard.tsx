import { useState } from 'react';
import { Brain, ChevronDown, ChevronUp } from 'lucide-react';
import { useTraderProfile } from '@/hooks/useTraderProfile';
import { cn } from '@/lib/utils';

export function AIMemoryCard({ collapsed }: { collapsed: boolean }) {
  const { traderProfile } = useTraderProfile();
  const [open, setOpen] = useState(false);

  const memories = traderProfile?.behavioralMemory || [];
  const top3 = memories.slice(-3).reverse();

  if (collapsed || top3.length === 0) return null;

  return (
    <div className="px-2 pb-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-2.5 py-2 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Brain className="h-3.5 w-3.5" />
          <span>AI Memory</span>
        </div>
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      {open && (
        <div className="mt-1 space-y-1 px-2">
          {top3.map((m: any, i: number) => (
            <div
              key={i}
              className="text-[10px] text-muted-foreground bg-secondary/50 rounded px-2 py-1.5 leading-tight"
            >
              {typeof m === 'string' ? m : m.insight || JSON.stringify(m)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
