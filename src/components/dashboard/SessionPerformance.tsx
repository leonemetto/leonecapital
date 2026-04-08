import { useMemo } from 'react';
import { Trade } from '@/types/trade';
import { getSessionPerformance } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import { Trophy } from '@phosphor-icons/react';

interface Props { trades: Trade[] }

function winRateColor(winRate: number): string {
  const ratio = Math.max(0, Math.min(winRate, 100)) / 100;
  if (ratio <= 0.5) {
    const t = ratio * 2;
    return `rgb(${Math.round(248 + (245 - 248) * t)},${Math.round(113 + (158 - 113) * t)},${Math.round(113 + (11 - 113) * t)})`;
  } else {
    const t = (ratio - 0.5) * 2;
    return `rgb(${Math.round(245 + (16 - 245) * t)},${Math.round(158 + (185 - 158) * t)},${Math.round(11 + (129 - 11) * t)})`;
  }
}

export function SessionPerformance({ trades }: Props) {
  const sessions = useMemo(() => {
    const data = getSessionPerformance(trades).filter(s => s.total > 0);
    return data.sort((a, b) => b.winRate - a.winRate);
  }, [trades]);

  const bestKey = sessions.length > 0 ? sessions[0].session : null;
  const totalPnl = useMemo(
    () => sessions.reduce((sum, s) => sum + (s.pnl ?? 0), 0),
    [sessions]
  );

  return (
    <div className="rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.07)] p-5 px-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[rgba(255,255,255,0.3)]">
          Session Performance
        </span>
        {sessions.length > 0 && (
          <span className={cn(
            'text-[12px] font-bold font-mono tabular-nums',
            totalPnl >= 0 ? 'text-profit' : 'text-loss'
          )}>
            {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(0)}
          </span>
        )}
      </div>

      <div className="flex-1 space-y-0">
        {sessions.map(s => {
          const color = winRateColor(s.winRate);
          return (
            <div key={s.session} className="py-2.5 border-b border-[rgba(255,255,255,0.04)] last:border-0">
              <div className="flex items-center gap-3 mb-1.5">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <span className="text-[13px] font-semibold text-white truncate">{s.session}</span>
                  {s.session === bestKey && (
                    <Trophy className="h-3 w-3 text-[#f59e0b] shrink-0" weight="fill" />
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] text-[rgba(255,255,255,0.3)] font-mono tabular-nums">
                    {s.wins}W / {s.losses}L
                  </span>
                  <span
                    className="text-[13px] font-bold font-mono tabular-nums"
                    style={{ color }}
                  >
                    {s.winRate}%
                  </span>
                </div>
              </div>
              <div className="h-1 rounded-full bg-[rgba(255,255,255,0.05)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${s.winRate}%`, background: color }}
                />
              </div>
            </div>
          );
        })}
        {sessions.length === 0 && (
          <p className="text-xs text-[rgba(255,255,255,0.25)] text-center py-8">No session data yet</p>
        )}
      </div>
    </div>
  );
}
