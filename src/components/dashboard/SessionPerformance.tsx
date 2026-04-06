import { useMemo } from 'react';
import { Trade } from '@/types/trade';
import { getSessionPerformance } from '@/lib/analytics';
import { cn } from '@/lib/utils';

interface Props { trades: Trade[] }

export function SessionPerformance({ trades }: Props) {
  const sessions = useMemo(() => {
    const data = getSessionPerformance(trades).filter(s => s.total > 0);
    return data.sort((a, b) => b.winRate - a.winRate);
  }, [trades]);

  const bestKey = sessions.length > 0 ? sessions[0].session : null;

  return (
    <div className="rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.07)] p-5 px-6 h-full">
      <span className="text-sm text-[rgba(255,255,255,0.4)]">Session Performance</span>
      <div className="mt-4 space-y-0">
        {sessions.map(s => (
          <div key={s.session} className="py-2.5 flex items-center gap-3">
            <div className="flex items-center gap-2 w-[130px] shrink-0">
              <span className="text-xs font-medium text-foreground truncate">{s.session}</span>
              {s.session === bestKey && (
                <span className="text-[9px] font-bold text-profit bg-profit/15 px-1.5 py-0.5 rounded-full">BEST</span>
              )}
            </div>
            <div className="flex-1 h-1.5 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${s.winRate}%`,
                  background: `linear-gradient(90deg, #f87171, #4ade80)`,
                  backgroundSize: '100% 100%',
                  backgroundPosition: `${100 - s.winRate}% 0`,
                }}
              />
            </div>
            <span className="text-xs font-bold tabular-nums text-foreground w-[40px] text-right">{s.winRate}%</span>
          </div>
        ))}
        {sessions.length === 0 && (
          <p className="text-xs text-[rgba(255,255,255,0.25)] text-center py-8">No session data yet</p>
        )}
      </div>
    </div>
  );
}
