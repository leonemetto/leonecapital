import { useMemo, useState } from 'react';
import { addMonths, eachDayOfInterval, endOfMonth, format, getDay, startOfMonth } from 'date-fns';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import type { Trade } from '@/types/trade';
import { getDailyPnl } from '@/lib/analytics';
import { cn, todayLocal } from '@/lib/utils';
import { fmtSignedMoney, toneOf, TONE_CLASS } from '@/lib/format';
import { hasJournalContent, type DailyJournal } from '@/hooks/useDailyJournal';

const compact = (v: number) => {
  const abs = Math.abs(v);
  const body = abs >= 10_000 ? `${(abs / 1000).toFixed(0)}k` : abs >= 1000 ? `${(abs / 1000).toFixed(1)}k` : abs.toFixed(0);
  return `${v > 0 ? '+' : v < 0 ? '−' : ''}${body}`;
};

/**
 * A month of results you can act on: each day shows its P&L and opens that
 * day's review. Weekend columns appear only when the month has weekend trades.
 */
export function PnlCalendar({
  trades,
  journals,
  onSelectDay,
}: {
  trades: Trade[];
  journals: Record<string, DailyJournal>;
  onSelectDay: (date: string) => void;
}) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const daily = useMemo(() => getDailyPnl(trades), [trades]);
  const today = todayLocal();

  const { cells, columns, stats, maxAbs } = useMemo(() => {
    const days = eachDayOfInterval({ start: month, end: endOfMonth(month) });
    const keyed = days.map(d => ({ date: d, key: format(d, 'yyyy-MM-dd'), dow: (getDay(d) + 6) % 7 })); // Monday = 0
    const hasWeekend = keyed.some(d => d.dow >= 5 && daily.has(d.key));
    const cols = hasWeekend ? 7 : 5;
    const visible = keyed.filter(d => d.dow < cols);
    const lead = visible.length ? visible[0].dow : 0;

    let net = 0, up = 0, down = 0, max = 0;
    for (const d of keyed) {
      const entry = daily.get(d.key);
      if (!entry) continue;
      net += entry.pnl;
      max = Math.max(max, Math.abs(entry.pnl));
      if (entry.pnl > 0) up++;
      if (entry.pnl < 0) down++;
    }
    return {
      cells: [...Array.from({ length: lead }, () => null), ...visible],
      columns: cols,
      stats: { net, up, down },
      maxAbs: max || 1,
    };
  }, [month, daily]);

  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].slice(0, columns);
  const atCurrentMonth = format(month, 'yyyy-MM') === today.slice(0, 7);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-4">
        <div className="min-w-0">
          <p className="ef-label m-0">Calendar</p>
          <h2 className="m-0 mt-1.5 text-[15px] font-medium tracking-[-0.01em] text-ef-ink">{format(month, 'MMMM yyyy')}</h2>
        </div>
        <div className="flex items-center gap-3">
          <p className="ef-num m-0 hidden text-[11.5px] text-ef-ink-3 sm:block">
            <span className={TONE_CLASS[toneOf(stats.net)]}>{fmtSignedMoney(stats.net)}</span>
            <span className="mx-1.5 text-ef-ink-4">·</span>
            {stats.up} up, {stats.down} down
          </p>
          <div className="flex items-center gap-0.5">
            <button type="button" onClick={() => setMonth(m => addMonths(m, -1))} aria-label="Previous month" className="ef-btn ef-btn-ghost ef-btn-sm w-7 px-0">
              <CaretLeft className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={() => setMonth(m => addMonths(m, 1))} disabled={atCurrentMonth} aria-label="Next month" className="ef-btn ef-btn-ghost ef-btn-sm w-7 px-0">
              <CaretRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-4 pb-4">
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }} aria-hidden>
          {labels.map(l => (
            <div key={l} className="ef-label pb-1.5 pl-1.5">{l}</div>
          ))}
        </div>
        {/* Rows share the card's height, so the month fills whatever space it is given. */}
        <div className="grid flex-1 gap-1" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gridAutoRows: 'minmax(58px, 1fr)' }}>
          {cells.map((cell, i) => {
            if (!cell) return <div key={`lead-${i}`} aria-hidden />;
            const entry = daily.get(cell.key);
            const future = cell.key > today;
            const isToday = cell.key === today;
            const tone = entry ? toneOf(entry.pnl) : 'flat';
            const strength = entry ? 35 + Math.round((Math.abs(entry.pnl) / maxAbs) * 65) : 0;
            const wash = tone === 'pos' ? 'var(--ef-pos-wash)' : tone === 'neg' ? 'var(--ef-neg-wash)' : 'var(--ef-bg-sunken)';
            const noted = hasJournalContent(journals[cell.key]);
            return (
              <button
                key={cell.key}
                type="button"
                disabled={future}
                onClick={() => onSelectDay(cell.key)}
                aria-label={`${format(cell.date, 'EEEE d MMMM')}${entry ? `, ${fmtSignedMoney(entry.pnl)}, ${entry.trades} ${entry.trades === 1 ? 'trade' : 'trades'}` : ', no trades'}${noted ? ', has a session note' : ''}`}
                className={cn(
                  'ef-focus group relative flex min-h-[58px] flex-col justify-between rounded-[8px] border p-1.5 text-left transition-colors',
                  isToday ? 'border-ef-ink' : 'border-transparent',
                  future ? 'cursor-default opacity-35' : 'hover:border-ef-line-strong',
                )}
                style={{ background: entry ? `color-mix(in oklab, ${wash} ${strength}%, transparent)` : 'var(--ef-bg)' }}
              >
                <span className="flex items-center justify-between">
                  <span className={cn('ef-num text-[10.5px] leading-none', isToday ? 'font-medium text-ef-ink' : 'text-ef-ink-4')}>
                    {format(cell.date, 'd')}
                  </span>
                  {noted && <span aria-hidden className="h-1 w-1 rounded-full bg-ef-ink-3" />}
                </span>
                {entry && (
                  <span className="flex items-baseline justify-between gap-1">
                    <span className={cn('ef-num truncate text-[12px] font-medium leading-none', TONE_CLASS[tone])}>{compact(entry.pnl)}</span>
                    <span className="ef-num hidden text-[10px] leading-none text-ef-ink-4 sm:inline">{entry.trades}</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p className="m-0 mt-3 pl-1.5 text-[11.5px] text-ef-ink-4">
          Select a day to review it. A dot marks days with a session note.
        </p>
      </div>
    </div>
  );
}
