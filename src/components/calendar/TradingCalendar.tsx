import { useState, useMemo } from 'react';
import { Trade } from '@/types/trade';
import { getDailyPnl } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import {
  startOfMonth, endOfMonth, eachDayOfInterval, format, getDay,
  addMonths, subMonths, isSameMonth, startOfWeek,
} from 'date-fns';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface TradingCalendarProps {
  trades: Trade[];
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

interface WeekData {
  days: (Date | null)[];
  pnl: number;
  trades: number;
}

export function TradingCalendar({ trades }: TradingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const dailyPnl = useMemo(() => getDailyPnl(trades), [trades]);

  const monthPnl = useMemo(() => {
    let total = 0;
    dailyPnl.forEach((data, day) => {
      if (isSameMonth(new Date(day), currentMonth)) total += data.pnl;
    });
    return total;
  }, [dailyPnl, currentMonth]);

  const monthTrades = useMemo(() => {
    let total = 0;
    dailyPnl.forEach((data, day) => {
      if (isSameMonth(new Date(day), currentMonth)) total += data.trades;
    });
    return total;
  }, [dailyPnl, currentMonth]);

  const weeks = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const weekMap = new Map<string, WeekData>();

    for (const day of allDays) {
      const dow = getDay(day);
      if (dow === 0 || dow === 6) continue;

      const ws = startOfWeek(day, { weekStartsOn: 1 });
      const key = format(ws, 'yyyy-MM-dd');

      if (!weekMap.has(key)) {
        weekMap.set(key, { days: [null, null, null, null, null], pnl: 0, trades: 0 });
      }

      const week = weekMap.get(key)!;
      week.days[dow - 1] = day;

      const dateStr = format(day, 'yyyy-MM-dd');
      const data = dailyPnl.get(dateStr);
      if (data) {
        week.pnl += data.pnl;
        week.trades += data.trades;
      }
    }

    return Array.from(weekMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
  }, [currentMonth, dailyPnl]);

  const selectedTrades = useMemo(() => {
    if (!selectedDate) return [];
    return trades.filter(t => t.date.split('T')[0] === selectedDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [trades, selectedDate]);

  const fmtPnl = (v: number) => {
    if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(1)}K`;
    return v.toFixed(1);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <div className="glass-card p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentMonth(p => subMonths(p, 1))}
              className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h3 className="text-sm font-bold min-w-[150px] text-center">
              {format(currentMonth, 'MMMM-yyyy')}
            </h3>
            <button onClick={() => setCurrentMonth(p => addMonths(p, 1))}
              className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
            <button onClick={() => setCurrentMonth(new Date())}
              className="p-1.5 rounded-lg hover:bg-secondary transition-colors ml-1">
              <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
          <div className="flex items-center gap-5 text-xs">
            <span className="text-muted-foreground">
              P/L: <span className={cn('font-mono font-bold text-sm', monthPnl > 0 ? 'text-profit' : monthPnl < 0 ? 'text-loss' : '')}>
                {fmtPnl(monthPnl)}
              </span>
            </span>
            <span className="text-muted-foreground">
              Trades: <span className="font-mono font-bold text-sm text-foreground">{monthTrades}</span>
            </span>
          </div>
        </div>

        {/* Grid header */}
        <div className="grid grid-cols-6 gap-px rounded-t-lg overflow-hidden">
          {WEEKDAYS.map(d => (
            <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-2.5 bg-secondary/40 uppercase tracking-widest">
              {d}
            </div>
          ))}
          <div className="text-center text-[10px] font-semibold text-muted-foreground py-2.5 bg-secondary/40 uppercase tracking-widest">
            Summary
          </div>
        </div>

        {/* Rows */}
        <div className="grid gap-px rounded-b-lg overflow-hidden border border-border/30">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-6 gap-px bg-border/20">
              {week.days.map((day, di) => {
                if (!day) return <div key={di} className="bg-background min-h-[76px]" />;

                const dateStr = format(day, 'yyyy-MM-dd');
                const data = dailyPnl.get(dateStr);
                const isSel = selectedDate === dateStr;

                return (
                  <button
                    key={di}
                    onClick={() => setSelectedDate(isSel ? null : dateStr)}
                    className={cn(
                      'min-h-[76px] p-2.5 text-left transition-all relative',
                      data && data.pnl > 0 && 'bg-[hsl(142,71%,45%,0.08)] hover:bg-[hsl(142,71%,45%,0.14)]',
                      data && data.pnl < 0 && 'bg-[hsl(0,84%,60%,0.08)] hover:bg-[hsl(0,84%,60%,0.14)]',
                      (!data || data.pnl === 0) && 'bg-background hover:bg-secondary/30',
                      isSel && 'ring-1 ring-primary ring-inset',
                    )}
                  >
                    <span className="text-xs text-muted-foreground font-medium">{format(day, 'd')}</span>
                    {data && (
                      <div className="mt-1.5 text-center">
                        <div className={cn('text-sm font-bold', data.pnl > 0 ? 'text-profit' : 'text-loss')}>
                          {data.trades}
                        </div>
                        <div className={cn('text-xs font-mono font-bold', data.pnl > 0 ? 'text-profit' : 'text-loss')}>
                          {fmtPnl(data.pnl)}
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
              {/* Summary */}
              <div className="min-h-[76px] p-2.5 flex flex-col justify-center items-center bg-background">
                {week.trades > 0 && (
                  <>
                    <span className="text-[10px] text-muted-foreground">{week.trades} trades</span>
                    <span className={cn('text-xs font-mono font-bold mt-0.5', week.pnl > 0 ? 'text-profit' : week.pnl < 0 ? 'text-loss' : '')}>
                      {fmtPnl(week.pnl)}
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected day detail */}
      {selectedDate && selectedTrades.length > 0 && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="glass-card p-4 mt-3">
          <h4 className="text-xs font-semibold mb-2">{format(new Date(selectedDate), 'MMM d, yyyy')}</h4>
          <div className="space-y-1.5">
            {selectedTrades.map(t => (
              <div key={t.id} className="flex items-center gap-2 py-1.5 px-2.5 rounded-lg bg-secondary/50 text-xs">
                <span className="font-semibold">{t.instrument}</span>
                <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded',
                  t.direction === 'long' ? 'bg-profit/15 text-profit' : 'bg-loss/15 text-loss'
                )}>
                  {t.direction === 'long' ? 'L' : 'S'}
                </span>
                <span className="text-muted-foreground">{t.strategy}</span>
                <span className={cn('ml-auto font-mono font-semibold',
                  t.pnl > 0 ? 'text-profit' : t.pnl < 0 ? 'text-loss' : ''
                )}>
                  {t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {selectedDate && selectedTrades.length === 0 && (
        <div className="glass-card p-4 mt-3 text-center text-xs text-muted-foreground">
          No trades on {format(new Date(selectedDate), 'MMM d, yyyy')}
        </div>
      )}
    </motion.div>
  );
}
