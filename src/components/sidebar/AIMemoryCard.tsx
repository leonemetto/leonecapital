import { useState } from 'react';
import { Brain, CaretDown, CaretUp } from '@phosphor-icons/react';
import { useTraderProfile } from '@/hooks/useTraderProfile';

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
        className="flex items-center justify-between w-full px-2.5 py-2 rounded-md text-[12px] font-medium text-[rgba(255,255,255,0.35)] hover:text-white hover:bg-[rgba(255,255,255,0.04)] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Brain className="h-3.5 w-3.5" weight="regular" />
          <span>AI Memory</span>
        </div>
        {open
          ? <CaretUp className="h-3 w-3" weight="regular" />
          : <CaretDown className="h-3 w-3" weight="regular" />
        }
      </button>
      {open && (
        <div className="mt-1 space-y-1 px-2">
          {top3.map((m: any, i: number) => (
            <div
              key={i}
              className="text-[10px] text-[rgba(255,255,255,0.35)] bg-[rgba(255,255,255,0.04)] rounded px-2 py-1.5 leading-tight"
            >
              {typeof m === 'string' ? m : m.insight || JSON.stringify(m)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
