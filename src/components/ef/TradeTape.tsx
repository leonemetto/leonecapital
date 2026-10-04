import { useMemo } from 'react';
import type { Trade } from '@/types/trade';
import { cn, parseLocalDate } from '@/lib/utils';
import { fmtSignedMoney } from '@/lib/format';

/**
 * The trade tape: one tick per trade in the order they were taken. Wins rise
 * from the centre line, losses fall, and height follows the size of the
 * result. Streaks and clusters show up as shapes before any number is read.
 */
export function TradeTape({
  trades,
  limit = 60,
  height = 44,
  onSelect,
  className,
}: {
  trades: Trade[];
  limit?: number;
  height?: number;
  onSelect?: (trade: Trade) => void;
  className?: string;
}) {
  const ticks = useMemo(() => {
    const ordered = [...trades]
      .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt))
      .slice(-limit);
    const maxAbs = Math.max(...ordered.map(t => Math.abs(t.pnl)), 1);
    return ordered.map(t => ({
      trade: t,
      // Square-root scale keeps small results visible beside one large outlier.
      size: t.pnl === 0 ? 0 : Math.max(0.14, Math.sqrt(Math.abs(t.pnl) / maxAbs)),
    }));
  }, [trades, limit]);

  if (ticks.length === 0) return null;
  const half = height / 2;

  return (
    <div
      className={cn('relative flex w-full items-stretch gap-[2px]', className)}
      style={{ height }}
      role="img"
      aria-label={`Last ${ticks.length} trades in order. Wins rise above the line, losses fall below.`}
    >
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-ef-line" />
      {ticks.map(({ trade, size }) => {
        const win = trade.pnl > 0;
        const flat = trade.pnl === 0;
        const title = `${parseLocalDate(trade.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })} · ${trade.instrument} · ${fmtSignedMoney(trade.pnl)}`;
        const bar = (
          <span
            aria-hidden
            className="absolute left-0 right-0 rounded-[1px]"
            style={
              flat
                ? { top: half - 1, height: 2, background: 'var(--ef-ink-4)' }
                : win
                  ? { bottom: half, height: size * (half - 1), background: 'var(--ef-pos)' }
                  : { top: half, height: size * (half - 1), background: 'var(--ef-neg)' }
            }
          />
        );
        const base = 'relative min-w-[2px] max-w-[7px] flex-1';
        return onSelect ? (
          <button
            key={trade.id}
            type="button"
            title={title}
            aria-label={title}
            onClick={() => onSelect(trade)}
            className={cn(base, 'outline-none transition-opacity hover:opacity-60 focus-visible:opacity-60')}
          >
            {bar}
          </button>
        ) : (
          <span key={trade.id} title={title} className={base}>
            {bar}
          </span>
        );
      })}
    </div>
  );
}
