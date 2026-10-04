import { useMemo } from 'react';
import { useView } from '@/contexts/ViewContext';
import { useGoals } from '@/hooks/useGoals';
import { todayLocal, cn } from '@/lib/utils';
import { fmtMoney, fmtSignedMoney, toneOf, TONE_CLASS } from '@/lib/format';
import { Meter } from '@/components/ef/primitives';
import { useShell } from './ShellContext';

/** Today's numbers for the selected account, derived once and shared. */
export function useSessionStatus() {
  const { scaledTrades } = useView();
  const { goals } = useGoals();

  return useMemo(() => {
    const today = todayLocal();
    const todays = scaledTrades.filter(t => t.date.slice(0, 10) === today);
    const pnl = todays.reduce((s, t) => s + t.pnl, 0);
    const tagged = todays.filter(t => t.followedPlan !== undefined);
    const onPlan = tagged.filter(t => t.followedPlan).length;
    const limit = goals?.maxDailyLoss && goals.maxDailyLoss > 0 ? goals.maxDailyLoss : null;
    const lossUsed = Math.max(0, -pnl);
    const limitPct = limit ? (lossUsed / limit) * 100 : 0;
    return {
      today,
      trades: todays,
      count: todays.length,
      pnl,
      tagged: tagged.length,
      onPlan,
      limit,
      lossUsed,
      limitPct,
      limitState: !limit ? 'none' : limitPct >= 100 ? 'breached' : limitPct >= 80 ? 'near' : 'ok',
      dailyTarget: goals?.dailyTarget ?? null,
    } as const;
  }, [scaledTrades, goals]);
}

/**
 * The instrument cluster: today's result against the trader's own limit,
 * visible from every screen. Click to open today's review.
 */
export function SessionStrip({ className }: { className?: string }) {
  const s = useSessionStatus();
  const { openDayReview } = useShell();

  return (
    <button
      type="button"
      onClick={() => openDayReview(s.today)}
      title="Open today's review"
      className={cn(
        'ef-focus flex h-9 items-center gap-3 rounded-control border border-ef-line bg-ef-elev px-3 text-left transition-colors hover:border-ef-line-strong',
        className,
      )}
    >
      <span className="ef-label">Today</span>
      <span className={cn('ef-num text-[13px] font-medium', TONE_CLASS[toneOf(s.pnl)])}>
        {s.count === 0 ? '—' : fmtSignedMoney(s.pnl)}
      </span>
      <span className="ef-num hidden text-[11.5px] text-ef-ink-3 sm:inline">
        {s.count} {s.count === 1 ? 'trade' : 'trades'}
      </span>
      {s.limit && (
        <span className="hidden items-center gap-2 border-l border-ef-line pl-3 md:flex">
          <span className="text-[11.5px] text-ef-ink-3">Loss limit</span>
          <Meter value={s.lossUsed} max={s.limit} className="w-14" label={`Daily loss limit used: ${fmtMoney(s.lossUsed)} of ${fmtMoney(s.limit)}`} />
          <span
            className={cn(
              'ef-num text-[11.5px]',
              s.limitState === 'breached' ? 'text-ef-neg' : s.limitState === 'near' ? 'text-ef-warn' : 'text-ef-ink-3',
            )}
          >
            {Math.min(999, Math.round(s.limitPct))}%
          </span>
        </span>
      )}
    </button>
  );
}
