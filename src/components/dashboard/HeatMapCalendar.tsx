import { useState, useMemo } from 'react';
import { Trade } from '@/types/trade';
import { getDailyPnl } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import {
  startOfMonth, endOfMonth, eachDayOfInterval, format, getDay,
  addMonths, subMonths, isSameMonth, startOfWeek,
} from 'date-fns';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';

interface Props { trades: Trade[] }

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

function pnlIntensity(pnl: number, maxAbs: number): string {
  // Zero P&L (breakeven days) and no-trade days stay transparent
  if (pnl === 0) return 'transparent';
  const ratio = Math.min(Math.abs(pnl) / Math.max(maxAbs, 1), 1);
  if (pnl > 0) {
    if (ratio > 0.6) return 'rgba(16,185,129,0.6)';
    if (ratio > 0.3) return 'rgba(16,185,129,0.35)';
    return 'rgba(16,185,129,0.15)';
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
      <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-5 px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setCurrentMonth(p => subMonths(p, 1))} className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all">
              <CaretLeft className="h-3.5 w-3.5" weight="bold" />
            </button>
            <span className="text-[13px] font-semibold min-w-[120px] text-center tracking-[-0.01em] text-gray-900">{format(currentMonth, 'MMMM yyyy')}</span>
            <button onClick={() => setCurrentMonth(p => addMonths(p, 1))} className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all">
              <CaretRight className="h-3.5 w-3.5" weight="bold" />
            </button>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-5 gap-1 mb-1">
          {WEEKDAYS.map(d => (
            <div key={d} className="text-center text-[10px] font-medium text-gray-400 uppercase tracking-widest py-1">
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
                        className="min-h-[56px] rounded-lg p-2 flex flex-col justify-between transition-all hover:ring-1 hover:ring-gray-200 cursor-default"
                        style={{
                          backgroundColor: data ? pnlIntensity(data.pnl, maxAbsPnl) : '#F9FAFB',
                          border: '0.5px solid #F3F4F6',
                        }}
                      >
                        <span className={cn(
                          'text-[10px] font-medium tabular-nums leading-none',
                          data ? 'text-gray-700' : 'text-gray-300'
                        )}>{format(day, 'd')}</span>
                        {data && (
                          <span className={cn(
                            'text-[9px] font-mono font-bold tabular-nums leading-none self-end',
                            data.pnl > 0 ? 'text-[#10b981]' : data.pnl < 0 ? 'text-[#f87171]' : 'text-gray-400'
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
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
          {[
            { label: 'Month P&L', value: (monthStats.totalPnl >= 0 ? '+' : '') + fmtPnl(monthStats.totalPnl), color: monthStats.totalPnl >= 0 ? '#10b981' : '#f87171' },
            { label: 'Win Days',  value: String(monthStats.winDays),  color: '#10b981' },
            { label: 'Loss Days', value: String(monthStats.lossDays), color: '#f87171' },
            { label: 'Best Day',  value: monthStats.bestDay > 0 ? `+${fmtPnl(monthStats.bestDay)}` : '—', color: '#10b981' },
            { label: 'Worst',     value: monthStats.worstDay < 0 ? fmtPnl(monthStats.worstDay) : '—', color: '#f87171' },
          ].map(s => (
            <div key={s.label} className="flex flex-col gap-0.5 flex-1 px-2 py-1.5 rounded-md bg-gray-50">
              <span className="text-[9px] font-medium text-gray-400 uppercase tracking-[0.08em] leading-none">{s.label}</span>
              <span className="text-[11px] font-bold font-mono tabular-nums leading-none" style={{ color: s.color }}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
