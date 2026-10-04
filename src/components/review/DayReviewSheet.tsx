import { useEffect, useMemo, useState } from 'react';
import { CaretLeft, CaretRight, X, Compass, Plus, ArrowUpRight, ArrowDownRight } from '@phosphor-icons/react';
import { addDays, format } from 'date-fns';
import { toast } from 'sonner';
import { SidePanel } from '@/components/ef/SidePanel';
import { Stat } from '@/components/ef/primitives';
import { FIELD, FIELD_LABEL, toggleClass } from '@/components/ef/field';
import { useView } from '@/contexts/ViewContext';
import { useSharedTrades } from '@/contexts/TradesContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useDailyJournals } from '@/hooks/useDailyJournal';
import { useShell } from '@/components/shell/ShellContext';
import { calculateAnalytics } from '@/lib/analytics';
import { cn, parseLocalDate, todayLocal } from '@/lib/utils';
import { fmtSignedMoney, fmtPct, toneOf, TONE_CLASS } from '@/lib/format';

const MOODS = [
  { value: 1, label: 'Tilted' },
  { value: 2, label: 'Uneasy' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'Focused' },
  { value: 5, label: 'Sharp' },
];

/**
 * The end-of-session review for one date: tag each trade against the plan,
 * record the mood, write one note and one lesson. Built to take two minutes.
 */
export function DayReviewSheet() {
  const { reviewDate, openDayReview, closeDayReview, openTrade, openLogTrade, openAtlas } = useShell();
  const { accountTrades } = useView();
  const { updateTrade, updateTradeGroup } = useSharedTrades();
  const { countBreakevenInWinRate } = useSettings();
  const { journals, save } = useDailyJournals();

  const date = reviewDate ?? todayLocal();
  const dayTrades = useMemo(
    () => accountTrades
      .filter(t => t.date.slice(0, 10) === date)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [accountTrades, date],
  );
  const stats = useMemo(() => calculateAnalytics(dayTrades, { countBreakevenInWinRate }), [dayTrades, countBreakevenInWinRate]);
  const tagged = dayTrades.filter(t => t.followedPlan !== undefined);
  const onPlan = tagged.filter(t => t.followedPlan).length;

  const stored = journals[date];
  const [mood, setMood] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [lesson, setLesson] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMood(stored?.mood ?? null);
    setNotes(stored?.notes ?? '');
    setLesson(stored?.keyLesson ?? '');
  }, [date, stored?.mood, stored?.notes, stored?.keyLesson]);

  const dirty = mood !== (stored?.mood ?? null) || notes !== (stored?.notes ?? '') || lesson !== (stored?.keyLesson ?? '');

  const shift = (days: number) => openDayReview(format(addDays(parseLocalDate(date), days), 'yyyy-MM-dd'));
  const isToday = date === todayLocal();

  const handleSave = async () => {
    setSaving(true);
    try {
      await save({ date, mood, notes, keyLesson: lesson });
      toast.success('Review saved');
    } catch (e: any) {
      toast.error(e?.message || 'Could not save the review');
    } finally {
      setSaving(false);
    }
  };

  const setPlan = async (tradeId: string, groupId: string | undefined, value: boolean) => {
    try {
      if (groupId) await updateTradeGroup(groupId, { followedPlan: value });
      else await updateTrade(tradeId, { followedPlan: value });
    } catch (e: any) {
      toast.error(e?.message || 'Could not save the change');
    }
  };

  const askAtlas = () => {
    const summary = [
      `TRADES ON ${date}:`,
      `Total: ${stats.totalTrades} | Wins: ${stats.wins} | Losses: ${stats.losses} | BE: ${stats.breakevens}`,
      `P&L: $${stats.netPnl.toFixed(2)}`,
      ...dayTrades.map(t => `  ${t.instrument} ${t.direction} — ${t.outcome.toUpperCase()} — $${t.pnl.toFixed(2)}${t.followedPlan === false ? ' (off plan)' : ''}`),
      notes ? `Trader's note: ${notes}` : '',
    ].filter(Boolean).join('\n');
    closeDayReview();
    openAtlas({
      hint: { label: `${isToday ? 'Today' : heading(date, 'short')}`, detail: summary },
      prompt: dayTrades.length > 0
        ? `Give me a review of my trading on ${isToday ? 'today' : date}.`
        : "I haven't logged any trades for this day. What should I focus on based on my overall performance?",
    });
  };

  const queue = dayTrades.map(t => t.id);

  return (
    <SidePanel
      open={!!reviewDate}
      onOpenChange={open => { if (!open) closeDayReview(); }}
      label={`Review for ${heading(date, 'long')}`}
      width={520}
    >
      <header className="flex h-[52px] shrink-0 items-center gap-1 border-b border-ef-line pl-3 pr-2">
        <button type="button" onClick={() => shift(-1)} aria-label="Previous day" className="ef-btn ef-btn-ghost ef-btn-sm w-7 px-0">
          <CaretLeft className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={() => shift(1)} disabled={isToday} aria-label="Next day" className="ef-btn ef-btn-ghost ef-btn-sm w-7 px-0">
          <CaretRight className="h-3.5 w-3.5" />
        </button>
        {!isToday && (
          <button type="button" onClick={() => openDayReview(todayLocal())} className="ef-btn ef-btn-ghost ef-btn-sm">
            Today
          </button>
        )}
        <button type="button" onClick={closeDayReview} aria-label="Close" className="ef-btn ef-btn-ghost ef-btn-sm ml-auto w-7 px-0">
          <X className="h-3.5 w-3.5" />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <section className="px-5 pb-5 pt-5">
          <p className="ef-label m-0">{isToday ? 'Today' : 'Day review'}</p>
          <h2 className="m-0 mt-1.5 text-[20px] font-medium leading-tight tracking-[-0.02em] text-ef-ink">{heading(date, 'long')}</h2>
          <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
            <Stat label="Net P&L" value={dayTrades.length ? fmtSignedMoney(stats.netPnl) : '—'} tone={dayTrades.length ? toneOf(stats.netPnl) : 'flat'} />
            <Stat label="Trades" value={String(stats.totalTrades)} />
            <Stat label="Win rate" value={dayTrades.length ? fmtPct(stats.winRate) : '—'} />
            <Stat label="On plan" value={tagged.length ? `${onPlan} of ${tagged.length}` : '—'} />
          </div>
        </section>

        {/* Trades */}
        <section className="border-t border-ef-line px-5 py-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="ef-label m-0">Trades</p>
            {dayTrades.length - tagged.length > 0 && (
              <span className="text-[11.5px] text-ef-warn">{dayTrades.length - tagged.length} to tag</span>
            )}
          </div>
          {dayTrades.length === 0 ? (
            <div className="rounded-control border border-dashed border-ef-line-strong px-4 py-6 text-center">
              <p className="m-0 text-[13px] text-ef-ink-2">No trades logged for this day.</p>
              <button
                type="button"
                onClick={() => {
                  closeDayReview();
                  openLogTrade();
                }}
                className="ef-btn ef-btn-secondary ef-btn-sm mt-3"
              >
                <Plus className="h-3 w-3" weight="bold" /> Log a trade
              </button>
            </div>
          ) : (
            <ul className="m-0 list-none p-0">
              {dayTrades.map(t => (
                <li key={t.id} className="flex items-center gap-3 border-b border-ef-line py-2.5 last:border-b-0">
                  <button
                    type="button"
                    onClick={() => openTrade(t.id, queue)}
                    className="ef-focus -mx-1.5 flex min-w-0 flex-1 items-center gap-2 rounded-chip px-1.5 py-1 text-left transition-colors hover:bg-ef-hover"
                  >
                    {t.direction === 'long'
                      ? <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-ef-ink-3" weight="bold" />
                      : <ArrowDownRight className="h-3.5 w-3.5 shrink-0 text-ef-ink-3" weight="bold" />}
                    <span className="truncate text-[13px] font-medium text-ef-ink">{t.instrument}</span>
                    <span className="hidden truncate text-[12px] text-ef-ink-4 sm:inline">{t.session}</span>
                    <span className={cn('ef-num ml-auto shrink-0 text-[13px]', TONE_CLASS[toneOf(t.pnl)])}>{fmtSignedMoney(t.pnl, 2)}</span>
                  </button>
                  <div className="flex w-[124px] shrink-0 gap-1" role="group" aria-label={`Followed plan on ${t.instrument}`}>
                    <button type="button" aria-pressed={t.followedPlan === true} onClick={() => setPlan(t.id, t.tradeGroupId, true)} className={cn(toggleClass(t.followedPlan === true), 'h-7 text-[11.5px]')}>
                      On plan
                    </button>
                    <button type="button" aria-pressed={t.followedPlan === false} onClick={() => setPlan(t.id, t.tradeGroupId, false)} className={cn(toggleClass(t.followedPlan === false, 'neg'), 'h-7 text-[11.5px]')}>
                      Off
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Check-in */}
        <section className="space-y-4 border-t border-ef-line px-5 py-4">
          <div>
            <span className={FIELD_LABEL}>How were you trading?</span>
            <div className="flex gap-1.5" role="radiogroup" aria-label="Mood">
              {MOODS.map(m => (
                <button
                  key={m.value}
                  type="button"
                  role="radio"
                  aria-checked={mood === m.value}
                  onClick={() => setMood(mood === m.value ? null : m.value)}
                  className={cn(toggleClass(mood === m.value, 'flat'), 'h-12 flex-col gap-0.5')}
                >
                  <span className="ef-num text-[13px]">{m.value}</span>
                  <span className="text-[10px] font-normal">{m.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="review-notes" className={FIELD_LABEL}>Session note</label>
            <textarea
              id="review-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={4}
              placeholder="What happened, in your own words."
              className={cn(FIELD, 'h-auto resize-y py-2.5 leading-relaxed')}
            />
          </div>
          <div>
            <label htmlFor="review-lesson" className={FIELD_LABEL}>One lesson to carry forward</label>
            <input
              id="review-lesson"
              value={lesson}
              onChange={e => setLesson(e.target.value)}
              placeholder="Wait for the retest before entering."
              className={FIELD}
            />
          </div>
        </section>
      </div>

      <footer className="flex shrink-0 items-center gap-2 border-t border-ef-line px-5 py-3">
        <button type="button" onClick={handleSave} disabled={!dirty || saving} className="ef-btn ef-btn-primary">
          {saving ? 'Saving…' : !dirty && stored ? 'Saved' : 'Save review'}
        </button>
        <button type="button" onClick={askAtlas} className="ef-btn ef-btn-secondary">
          <Compass className="h-3.5 w-3.5" /> Review with Atlas
        </button>
      </footer>
    </SidePanel>
  );
}

function heading(date: string, style: 'long' | 'short') {
  return parseLocalDate(date).toLocaleDateString(
    'en',
    style === 'long'
      ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
      : { month: 'short', day: 'numeric' },
  );
}
