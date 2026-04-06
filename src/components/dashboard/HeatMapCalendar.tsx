import { useState, useMemo } from 'react';
import { Trade } from '@/types/trade';
import { getDailyPnl } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import {
  startOfMonth, endOfMonth, eachDayOfInterval, format, getDay,
  addMonths, subMonths, isSameMonth, startOfWeek,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';

interface Props { trades: Trade[] }

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

function pnlIntensity(pnl: number, maxAbs: number): string {
  const ratio = Math.min(Math.abs(pnl) / Math.max(maxAbs, 1), 1);
  if (pnl > 0) {
    if (ratio > 0.6) return 'rgba(74,222,128,0.6)';
    if (ratio > 0.3) return 'rgba(74,222,128,0.35)';
    return 'rgba(74,222,128,0.15)';
  }
  if (ratio > 0.6) return 'rgba(248,113,113,0.6)';
  if (ratio > 0.3) return 'rgba(248,113,113,0.35)';
  return 'rgba(248,113,113,0.15)';
}

export function HeatMapCalendar({ trades }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const dailyPnl = useMemo(() => getDailyPnl(trades), [trades]);

  const { weeks, monthStats, maxAbsPnl } = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const weekMap = new Map<string, (Date | null)[]>();

    for (const day of allDays) {
      const dow = getDay(day);
      if (dow === 0 || dow === 6) continue;
      const ws = format(startOfWeek(day, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      if (!weekMap.has(ws)) weekMap.set(ws, [null, null, null, null, null]);
      weekMap.get(ws)![dow - 1] = day;
    }

    let totalPnl = 0, winDays = 0, lossDays = 0, bestDay = 0, worstDay = 0;
    let maxAbs = 0;
    dailyPnl.forEach((data, day) => {
      if (!isSameMonth(new Date(day), currentMonth)) return;
      totalPnl += data.pnl;
      maxAbs = Math.max(maxAbs, Math.abs(data.pnl));
      if (data.pnl > 0) { winDays++; bestDay = Math.max(bestDay, data.pnl); }
      if (data.pnl < 0) { lossDays++; worstDay = Math.min(worstDay, data.pnl); }
    });

    return {
      weeks: Array.from(weekMap.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v),
      monthStats: { totalPnl, winDays, lossDays, bestDay, worstDay },
      maxAbsPnl: maxAbs,
    };
  }, [currentMonth, dailyPnl]);

  const fmtPnl = (v: number) => {
    if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(1)}K`;
    return `$${v.toFixed(0)}`;
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.07)] p-5 px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setCurrentMonth(p => subMonths(p, 1))} className="text-[rgba(255,255,255,0.4)] hover:text-foreground transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold min-w-[130px] text-center">{format(currentMonth, 'MMMM yyyy')}</span>
            <button onClick={() => setCurrentMonth(p => addMonths(p, 1))} className="text-[rgba(255,255,255,0.4)] hover:text-foreground transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-5 gap-1 mb-1">
          {WEEKDAYS.map(d => (
            <div key={d} className="text-center text-[10px] font-medium text-[rgba(255,255,255,0.25)] uppercase tracking-widest py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid gap-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-5 gap-1">
              {week.map((day, di) => {
                if (!day) return <div key={di} className="min-h-[52px]" />;
                const dateStr = format(day, 'yyyy-MM-dd');
                const data = dailyPnl.get(dateStr);

                return (
                  <Tooltip key={di}>
                    <TooltipTrigger asChild>
                      <div
                        className="min-h-[52px] rounded-md p-1.5 flex flex-col items-center justify-center transition-all hover:ring-1 hover:ring-[rgba(255,255,255,0.15)] cursor-default"
                        style={{ backgroundColor: data ? pnlIntensity(data.pnl, maxAbsPnl) : 'transparent' }}
                      >
                        <span className="text-[11px] text-[rgba(255,255,255,0.4)] tabular-nums">{format(day, 'd')}</span>
                        {data && (
                          <span className={cn('text-[10px] font-mono font-bold tabular-nums mt-0.5',
                            data.pnl > 0 ? 'text-profit' : 'text-loss'
                          )}>
                            {data.pnl >= 0 ? '+' : ''}{fmtPnl(data.pnl)}
                          </span>
                        )}
                      </div>
                    </TooltipTrigger>
                    {data && (
                      <TooltipContent>
                        <p className="text-xs">
                          {data.trades} trade{data.trades !== 1 ? 's' : ''} · {data.pnl >= 0 ? '+' : ''}{fmtPnl(data.pnl)}
                        </p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </div>

        {/* Summary strip */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[rgba(255,255,255,0.05)]">
          {[
            { label: 'Total P&L', value: fmtPnl(monthStats.totalPnl), color: monthStats.totalPnl >= 0 ? 'text-profit' : 'text-loss' },
            { label: 'Win Days', value: String(monthStats.winDays), color: 'text-profit' },
            { label: 'Loss Days', value: String(monthStats.lossDays), color: 'text-loss' },
            { label: 'Best Day', value: monthStats.bestDay > 0 ? `+${fmtPnl(monthStats.bestDay)}` : '—', color: 'text-profit' },
            { label: 'Worst Day', value: monthStats.worstDay < 0 ? fmtPnl(monthStats.worstDay) : '—', color: 'text-loss' },
          ].map(s => (
            <div key={s.label} className="flex flex-col items-center flex-1">
              <span className="text-[10px] text-[rgba(255,255,255,0.3)] uppercase tracking-wider">{s.label}</span>
              <span className={cn('text-xs font-bold tabular-nums', s.color)}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
