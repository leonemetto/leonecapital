import { useState, useMemo } from 'react';
import { Trade } from '@/types/trade';
import { getDailyPnl } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import {
  startOfMonth, endOfMonth, eachDayOfInterval, format, getDay,
  addMonths, subMonths, isToday, isSameMonth,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface TradingCalendarProps {
  trades: Trade[];
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function TradingCalendar({ trades }: TradingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const dailyPnl = useMemo(() => getDailyPnl(trades), [trades]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart);

  const selectedTrades = useMemo(() => {
    if (!selectedDate) return [];
    return trades.filter(t => t.date.split('T')[0] === selectedDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [trades, selectedDate]);

  const monthPnl = useMemo(() => {
    let total = 0;
    dailyPnl.forEach((data, day) => {
      const d = new Date(day);
      if (isSameMonth(d, currentMonth)) total += data.pnl;
    });
    return total;
  }, [dailyPnl, currentMonth]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="glass-card p-6">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">{format(currentMonth, 'MMMM yyyy')}</h3>
            <span className={cn(
              'text-sm font-mono',
              monthPnl > 0 ? 'text-profit' : monthPnl < 0 ? 'text-loss' : 'text-muted-foreground'
            )}>
              {monthPnl >= 0 ? '+' : ''}${monthPnl.toFixed(2)} this month
            </span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-xs font-medium text-muted-foreground"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map(d => (
            <div key={d} className="text-center text-[11px] font-medium text-muted-foreground py-2 uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array(startPadding).fill(null).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const data = dailyPnl.get(dateStr);
            const today = isToday(day);

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(selectedDate === dateStr ? null : dateStr)}
                className={cn(
                  'aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all relative',
                  data && data.pnl > 0 && 'bg-profit/10 hover:bg-profit/20',
                  data && data.pnl < 0 && 'bg-loss/10 hover:bg-loss/20',
                  data && data.pnl === 0 && 'bg-secondary/50 hover:bg-secondary',
                  !data && 'text-muted-foreground/50 hover:bg-secondary/30',
                  today && 'ring-1 ring-primary/50',
                  selectedDate === dateStr && 'ring-2 ring-primary',
                )}
              >
                <span className={cn(
                  'text-xs font-medium',
                  data && data.pnl > 0 && 'text-profit',
                  data && data.pnl < 0 && 'text-loss',
                )}>
                  {format(day, 'd')}
                </span>
                {data && (
                  <span className={cn(
                    'text-[9px] font-mono font-semibold mt-0.5',
                    data.pnl > 0 ? 'text-profit' : data.pnl < 0 ? 'text-loss' : 'text-muted-foreground',
                  )}>
                    {data.pnl >= 0 ? '+' : ''}{data.pnl.toFixed(0)}
                  </span>
                )}
                {data && data.trades > 0 && (
                  <div className="absolute top-1 right-1 flex">
                    {Array(Math.min(data.trades, 3)).fill(0).map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          'w-1 h-1 rounded-full -ml-0.5 first:ml-0',
                          data.pnl > 0 ? 'bg-profit' : data.pnl < 0 ? 'bg-loss' : 'bg-muted-foreground',
                        )}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day trades */}
      {selectedDate && selectedTrades.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="glass-card p-5 mt-4"
        >
          <h4 className="text-sm font-semibold mb-3">
            Trades on {format(new Date(selectedDate), 'MMM d, yyyy')}
          </h4>
          <div className="space-y-2">
            {selectedTrades.map(t => (
              <div key={t.id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-secondary/50 text-sm">
                <span className="font-semibold">{t.instrument}</span>
                <span className={cn(
                  'text-xs font-semibold px-1.5 py-0.5 rounded',
                  t.direction === 'long' ? 'bg-profit/15 text-profit' : 'bg-loss/15 text-loss'
                )}>
                  {t.direction === 'long' ? 'L' : 'S'}
                </span>
                <span className="text-muted-foreground">{t.strategy}</span>
                <span className={cn(
                  'ml-auto font-mono font-semibold',
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
        <div className="glass-card p-5 mt-4 text-center text-sm text-muted-foreground">
          No trades on {format(new Date(selectedDate), 'MMM d, yyyy')}
        </div>
      )}
    </motion.div>
  );
}
