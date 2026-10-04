import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { startOfMonth, startOfWeek, format } from 'date-fns';
import { toast } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Meter, Stat, Surface } from '@/components/ef/primitives';
import { FIELD, FIELD_LABEL } from '@/components/ef/field';
import { CriteriaManager } from '@/components/criteria/CriteriaManager';
import { useView } from '@/contexts/ViewContext';
import { useCriteria } from '@/hooks/useCriteria';
import { useGoals, type TraderGoals } from '@/hooks/useGoals';
import { useTradeVerifications } from '@/hooks/useTradeVerifications';
import { useSessionStatus } from '@/components/shell/SessionStrip';
import { getExpectancyByPlanAdherence } from '@/lib/analytics';
import { cn, todayLocal } from '@/lib/utils';
import { fmtMoney, fmtPct, fmtSignedMoney, toneOf } from '@/lib/format';

type GoalKey = keyof TraderGoals;

const GOAL_FIELDS: { key: GoalKey; label: string; hint: string }[] = [
  { key: 'maxDailyLoss', label: 'Daily loss limit', hint: 'Stop trading for the day at this loss' },
  { key: 'dailyTarget', label: 'Daily target', hint: 'A good day' },
  { key: 'weeklyTarget', label: 'Weekly target', hint: 'Monday to Sunday' },
  { key: 'monthlyTarget', label: 'Monthly target', hint: 'Calendar month' },
];

const toInput = (v: number | null | undefined) => (v == null ? '' : String(v));
const toNumber = (v: string) => {
  const n = parseFloat(v);
  return v.trim() === '' || Number.isNaN(n) || n <= 0 ? null : n;
};

/**
 * The plan: the rules checked before every entry and the limits that bound a
 * day. What happens here shows up on Today and in the session strip.
 */
export default function Plan() {
  const location = useLocation();
  const suggested = (location.state as { suggestRule?: string } | null)?.suggestRule;
  const { accountTrades, scaledTrades } = useView();
  const { criteria } = useCriteria();
  const { goals, save, isLoading: goalsLoading } = useGoals();
  const session = useSessionStatus();

  // Tick rates come from the latest 200 trades: recent habits, and a bounded query.
  const tradeIds = useMemo(() => accountTrades.slice(0, 200).map(t => t.id), [accountTrades]);
  const { data: verifications = {} } = useTradeVerifications(tradeIds);

  const tickRates = useMemo(() => {
    const out: Record<string, { ticked: number; total: number }> = {};
    const records = Object.values(verifications);
    for (const c of criteria) {
      out[c.id] = { ticked: records.filter(r => r[c.id]).length, total: records.length };
    }
    return out;
  }, [verifications, criteria]);

  // ─── Adherence ───
  const adherence = useMemo(() => {
    const rows = getExpectancyByPlanAdherence(accountTrades);
    const on = rows.find(r => r.key === 'Plan Followed');
    const off = rows.find(r => r.key === 'Plan Violated');
    const tagged = (on?.trades ?? 0) + (off?.trades ?? 0);
    return { on, off, tagged, rate: tagged > 0 ? ((on?.trades ?? 0) / tagged) * 100 : null };
  }, [accountTrades]);

  // ─── Limits form ───
  const [form, setForm] = useState<Record<GoalKey, string>>({ maxDailyLoss: '', dailyTarget: '', weeklyTarget: '', monthlyTarget: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      maxDailyLoss: toInput(goals?.maxDailyLoss),
      dailyTarget: toInput(goals?.dailyTarget),
      weeklyTarget: toInput(goals?.weeklyTarget),
      monthlyTarget: toInput(goals?.monthlyTarget),
    });
  }, [goals]);

  const dirty = GOAL_FIELDS.some(f => form[f.key] !== toInput(goals?.[f.key]));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await save({
        maxDailyLoss: toNumber(form.maxDailyLoss),
        dailyTarget: toNumber(form.dailyTarget),
        weeklyTarget: toNumber(form.weeklyTarget),
        monthlyTarget: toNumber(form.monthlyTarget),
      });
      toast.success('Limits saved');
    } catch (err: any) {
      toast.error(err?.message || 'Could not save the limits');
    } finally {
      setSaving(false);
    }
  };

  // ─── Progress for the current day, week and month ───
  const progress = useMemo(() => {
    const now = new Date();
    const today = todayLocal();
    const week = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const month = format(startOfMonth(now), 'yyyy-MM-dd');
    const sum = (from: string) => scaledTrades.filter(t => t.date.slice(0, 10) >= from).reduce((s, t) => s + t.pnl, 0);
    return { day: sum(today), week: sum(week), month: sum(month) };
  }, [scaledTrades]);

  const active = criteria.filter(c => c.isActive).length;

  return (
    <AppLayout width="narrow">
      <PageHeader
        title="Plan"
        subtitle="The rules you check before every entry and the limits that bound a day."
      />

      <div className="flex flex-col gap-3">
        {/* What following the plan is worth */}
        <Surface>
          <div className="flex items-center justify-between px-5 pb-1 pt-4">
            <p className="ef-label m-0">Plan adherence</p>
            {adherence.rate != null && <span className="ef-num text-[11.5px] text-ef-ink-3">{adherence.tagged} trades tagged</span>}
          </div>
          {adherence.tagged === 0 ? (
            <p className="m-0 max-w-[60ch] px-5 pb-5 pt-2 text-[13px] leading-relaxed text-ef-ink-3">
              No trades are tagged on or off plan yet. Tag them when you log or review a trade and this shows what following the plan is worth.
            </p>
          ) : (
            <div className="grid gap-x-8 gap-y-5 px-5 pb-5 pt-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <Stat label="Followed" value={fmtPct(adherence.rate ?? 0)} />
                <Meter value={adherence.rate ?? 0} max={100} tone="ink" className="mt-3" label={`Plan followed on ${fmtPct(adherence.rate ?? 0)} of tagged trades`} />
              </div>
              <Stat
                label="On plan"
                value={adherence.on ? fmtSignedMoney(adherence.on.pnl) : '—'}
                tone={adherence.on ? toneOf(adherence.on.pnl) : 'flat'}
                sub={adherence.on ? `${adherence.on.trades} trades · ${fmtPct(adherence.on.winRate)} win` : 'None yet'}
              />
              <Stat
                label="Off plan"
                value={adherence.off ? fmtSignedMoney(adherence.off.pnl) : '—'}
                tone={adherence.off ? toneOf(adherence.off.pnl) : 'flat'}
                sub={adherence.off ? `${adherence.off.trades} trades · ${fmtPct(adherence.off.winRate)} win` : 'None yet'}
              />
              <Stat
                label="Per trade"
                value={adherence.on && adherence.off
                  ? fmtSignedMoney(adherence.on.pnl / adherence.on.trades - adherence.off.pnl / adherence.off.trades)
                  : '—'}
                sub="On-plan average minus off-plan average"
              />
            </div>
          )}
        </Surface>

        {/* Limits and targets */}
        <Surface>
          <form onSubmit={handleSave}>
            <div className="px-5 pb-1 pt-4">
              <p className="ef-label m-0">Limits and targets</p>
              <p className="m-0 mt-2 max-w-[62ch] text-[12.5px] leading-relaxed text-ef-ink-3">
                In your account currency. The daily loss limit drives the meter in the top bar: amber at 80%, red at 100%.
              </p>
            </div>
            <div className="grid gap-x-5 gap-y-4 px-5 pb-4 pt-4 sm:grid-cols-2 lg:grid-cols-4">
              {GOAL_FIELDS.map(f => (
                <div key={f.key}>
                  <label htmlFor={`goal-${f.key}`} className={FIELD_LABEL}>{f.label}</label>
                  <input
                    id={`goal-${f.key}`}
                    type="number"
                    min="0"
                    step="any"
                    inputMode="decimal"
                    value={form[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder="Not set"
                    disabled={goalsLoading}
                    className={cn(FIELD, 'ef-num')}
                  />
                  <p className="m-0 mt-1.5 text-[11px] text-ef-ink-4">{f.hint}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-x-8 gap-y-4 border-t border-ef-line px-5 py-4 sm:grid-cols-2 lg:grid-cols-4">
              <Progress
                label="Loss today"
                value={session.lossUsed}
                max={goals?.maxDailyLoss ?? null}
                text={goals?.maxDailyLoss ? `${fmtMoney(session.lossUsed)} of ${fmtMoney(goals.maxDailyLoss)}` : 'No limit set'}
              />
              <Progress label="Today" value={progress.day} max={goals?.dailyTarget ?? null} target text={goals?.dailyTarget ? `${fmtSignedMoney(progress.day)} of ${fmtMoney(goals.dailyTarget)}` : fmtSignedMoney(progress.day)} />
              <Progress label="This week" value={progress.week} max={goals?.weeklyTarget ?? null} target text={goals?.weeklyTarget ? `${fmtSignedMoney(progress.week)} of ${fmtMoney(goals.weeklyTarget)}` : fmtSignedMoney(progress.week)} />
              <Progress label="This month" value={progress.month} max={goals?.monthlyTarget ?? null} target text={goals?.monthlyTarget ? `${fmtSignedMoney(progress.month)} of ${fmtMoney(goals.monthlyTarget)}` : fmtSignedMoney(progress.month)} />
            </div>

            <div className="flex items-center gap-3 border-t border-ef-line px-5 py-3">
              <button type="submit" disabled={!dirty || saving} className="ef-btn ef-btn-primary">
                {saving ? 'Saving…' : 'Save limits'}
              </button>
              {!dirty && goals && <span className="text-[12px] text-ef-ink-4">Saved</span>}
            </div>
          </form>
        </Surface>

        {/* Entry rules */}
        <Surface>
          <div className="flex items-end justify-between gap-3 px-5 pb-3 pt-4">
            <div>
              <p className="ef-label m-0">Entry rules</p>
              <p className="m-0 mt-2 max-w-[62ch] text-[12.5px] leading-relaxed text-ef-ink-3">
                Shown as a checklist whenever you log a trade. Keep it short and built around the mistakes that cost you money.
              </p>
            </div>
            {criteria.length > 0 && <span className="ef-num shrink-0 text-[11.5px] text-ef-ink-3">{active} of {criteria.length} on</span>}
          </div>
          <CriteriaManager tickRates={tickRates} suggested={suggested} />
        </Surface>
      </div>
    </AppLayout>
  );
}

function Progress({ label, value, max, text, target }: { label: string; value: number; max: number | null; text: string; target?: boolean }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2 text-[12px]">
        <span className="text-ef-ink-3">{label}</span>
        <span className="ef-num text-ef-ink-2">{text}</span>
      </div>
      {max ? (
        <Meter
          value={Math.max(0, value)}
          max={max}
          tone={target ? (value >= max ? 'pos' : 'ink') : undefined}
          label={`${label}: ${text}`}
        />
      ) : (
        <div aria-hidden className="h-2 rounded-[2px]" style={{ background: 'repeating-linear-gradient(90deg, var(--ef-line) 0 2px, transparent 2px 5px)' }} />
      )}
    </div>
  );
}
