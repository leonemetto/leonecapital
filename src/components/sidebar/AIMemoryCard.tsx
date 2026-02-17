import { useState } from 'react';
import { Brain, ChevronDown, ChevronUp } from 'lucide-react';
import { useTraderProfile } from '@/hooks/useTraderProfile';
import { cn } from '@/lib/utils';

interface MemoryEntry {
  insight: string;
  date: string;
}

export function AIMemoryCard({ collapsed }: { collapsed: boolean }) {
  const { traderProfile } = useTraderProfile();
  const [open, setOpen] = useState(false);

  if (collapsed) return null;

  const memories: MemoryEntry[] = Array.isArray(traderProfile?.behavioralMemory)
    ? (traderProfile.behavioralMemory as MemoryEntry[]).slice(-3).reverse()
    : [];

  if (memories.length === 0) return null;

  return (
    <div className="mx-2 mb-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-2.5 py-2 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-colors"
      >
        <Brain className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="flex-1 text-left">AI Memory</span>
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {open && (
        <div className="mt-1 space-y-1.5 px-2">
          {memories.map((m, i) => (
            <div
              key={i}
              className="rounded-md bg-primary/5 border border-border px-2.5 py-1.5 text-[11px] text-muted-foreground leading-tight"
            >
              <span className="text-primary/60 mr-1">{m.date}</span>
              {m.insight}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
