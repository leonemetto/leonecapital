import { useMemo } from 'react';
import { Trade } from '@/types/trade';
import { getSessionPerformance } from '@/lib/analytics';
import { cn } from '@/lib/utils';

interface Props { trades: Trade[] }

/**
 * Maps win rate (0–100) to a single solid color:
 *   0%  → #f87171 (red)
 *   50% → #f59e0b (amber)
 *   100%→ #10b981 (green)
 */
function winRateColor(winRate: number): string {
  const ratio = Math.max(0, Math.min(winRate, 100)) / 100;

  if (ratio <= 0.5) {
    // Interpolate red → amber
    const t = ratio * 2;
    const r = Math.round(248 + (245 - 248) * t);
    const g = Math.round(113 + (158 - 113) * t);
    const b = Math.round(113 + (11  - 113) * t);
    return `rgb(${r},${g},${b})`;
  } else {
    // Interpolate amber → green
    const t = (ratio - 0.5) * 2;
    const r = Math.round(245 + (74  - 245) * t);
    const g = Math.round(158 + (222 - 158) * t);
    const b = Math.round(11  + (128 - 11 ) * t);
    return `rgb(${r},${g},${b})`;
  }
}

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
                  background: winRateColor(s.winRate),
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
