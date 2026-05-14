import { useState, useEffect, useRef } from 'react';
import { useGoals, TraderGoals } from '@/hooks/useGoals';
import { Trade } from '@/types/trade';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  startOfDay, endOfDay, startOfWeek, endOfWeek,
  startOfMonth, endOfMonth, isWithinInterval, parseISO
} from 'date-fns';
import { Target, PencilSimple, Check, X } from '@phosphor-icons/react';

interface Props { trades: Trade[] }

function periodPnl(trades: Trade[], from: Date, to: Date): number {
  return trades
    .filter(t => {
      if (!t.date) return false;
      const d = parseISO(t.date);
      if (isNaN(d.getTime())) return false;
      return isWithinInterval(d, { start: from, end: to });
    })
    .reduce((sum, t) => sum + t.pnl, 0);
}

interface GoalRowProps {
  label: string;
  current: number;
  target: number | null;
  isLoss?: boolean;
}

function GoalRow({ label, current, target, isLoss = false }: GoalRowProps) {
  const hasTarget = target !== null && target > 0;
  const pct = hasTarget ? Math.min(Math.abs(current) / target * 100, 100) : 0;
  const exceeded = hasTarget && Math.abs(current) >= target;

  let barColor = '#10b981';
  let textColor = current >= 0 ? '#10b981' : '#f87171';

  if (isLoss) {
    barColor = exceeded ? '#f87171' : '#fb923c';
    textColor = current < 0 ? '#f87171' : 'var(--ef-ink-3)';
  } else {
    barColor = '#10b981';
    textColor = current > 0 ? '#10b981' : current < 0 ? '#f87171' : 'var(--ef-ink-3)';
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground/60">{label}</span>
        <div className="flex items-center gap-1.5">
          <span className={cn('text-[13px] font-bold font-mono tabular-nums')} style={{ color: textColor }}>
            {current >= 0 ? '+' : ''}${current.toFixed(0)}
          </span>
          {hasTarget && (
            <span className="text-[11px] text-muted-foreground/40 font-mono">
              / ${target!.toFixed(0)}
            </span>
          )}
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        {hasTarget ? (
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: barColor }}
          />
        ) : (
          <div className="h-full w-full flex items-center">
            <span className="text-[9px] text-muted-foreground/40 pl-1">No target set</span>
          </div>
        )}
      </div>
      {hasTarget && (
        <div className="flex justify-between">
          <span className="text-[10px] text-muted-foreground/40">
            {exceeded ? (isLoss ? '⚠ Limit hit' : '✓ Target reached') : `${pct.toFixed(0)}%`}
          </span>
          {!exceeded && hasTarget && (
            <span className="text-[10px] text-muted-foreground/40 font-mono">
              ${(target! - Math.abs(current)).toFixed(0)} to go
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function GoalsWidget({ trades }: Props) {
  const { goals, save } = useGoals();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Partial<TraderGoals>>({});

  useEffect(() => {
    if (goals) setDraft({ ...goals });
  }, [goals]);

  const alertedRef = useRef<Record<string, boolean>>({});
  const now = new Date();
  const todayPnl    = periodPnl(trades, startOfDay(now), endOfDay(now));
  const weekPnl     = periodPnl(trades, startOfWeek(now, { weekStartsOn: 1 }), endOfWeek(now, { weekStartsOn: 1 }));
  const monthPnl    = periodPnl(trades, startOfMonth(now), endOfMonth(now));

  const handleSave = async () => {
    await save({
      dailyTarget:  draft.dailyTarget  ? Number(draft.dailyTarget)  : null,
      weeklyTarget: draft.weeklyTarget ? Number(draft.weeklyTarget) : null,
      monthlyTarget:draft.monthlyTarget? Number(draft.monthlyTarget): null,
      maxDailyLoss: draft.maxDailyLoss ? Number(draft.maxDailyLoss) : null,
    });
    setEditing(false);
  };

  const field = (key: keyof TraderGoals, label: string, placeholder: string) => (
    <div>
      <label className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">
        {label}
      </label>
      <div className="relative mt-1">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 text-sm">$</span>
        <input
          type="number"
          min="0"
          step="1"
          value={draft[key] ?? ''}
          onChange={e => setDraft(p => ({ ...p, [key]: e.target.value === '' ? null : Number(e.target.value) }))}
          placeholder={placeholder}
          className="w-full h-9 pl-7 pr-3 bg-muted border border-border rounded-lg text-sm font-mono text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-foreground/25 transition-colors"
        />
      </div>
    </div>
  );

  // Fire toast alerts for daily loss limit
  useEffect(() => {
    if (!goals?.maxDailyLoss || todayPnl >= 0) return;
    const pct = Math.abs(todayPnl) / goals.maxDailyLoss;
    if (pct >= 1 && !alertedRef.current['hit']) {
      alertedRef.current['hit'] = true;
      toast.error(`Daily loss limit hit — $${Math.abs(todayPnl).toFixed(0)} lost today. Stop trading.`, { duration: 8000 });
    } else if (pct >= 0.8 && !alertedRef.current['warn']) {
      alertedRef.current['warn'] = true;
      toast.warning(`80% of daily loss limit reached — $${Math.abs(todayPnl).toFixed(0)} / $${goals.maxDailyLoss} lost.`, { duration: 6000 });
    }
  }, [todayPnl, goals?.maxDailyLoss]);

  const lossWarning = goals?.maxDailyLoss && todayPnl < 0 && Math.abs(todayPnl) >= goals.maxDailyLoss * 0.8;

  return (
    <div className={cn(
      'rounded-xl border p-5 px-6 transition-colors',
      lossWarning
        ? 'bg-[rgba(248,113,113,0.05)] border-[rgba(248,113,113,0.25)]'
        : 'bg-card border-border'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Target className="h-3.5 w-3.5 text-muted-foreground/50" weight="regular" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">
            P&L Targets
          </span>
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-[10px] text-muted-foreground/50 hover:text-foreground transition-colors outline-none"
          >
            <PencilSimple className="h-3 w-3" weight="bold" /> Edit
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={() => setEditing(false)} className="text-muted-foreground/50 hover:text-foreground outline-none transition-colors">
              <X className="h-3.5 w-3.5" weight="bold" />
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1 text-[10px] bg-foreground text-background px-3 h-7 rounded-[24px] font-semibold outline-none"
            >
              <Check className="h-3 w-3" weight="bold" /> Save
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="grid grid-cols-2 gap-3">
          {field('dailyTarget',   'Daily target',      '200')}
          {field('weeklyTarget',  'Weekly target',     '1000')}
          {field('monthlyTarget', 'Monthly target',    '4000')}
          {field('maxDailyLoss',  'Max daily loss',    '100')}
        </div>
      ) : (
        <div className="space-y-4">
          <GoalRow label="Today"        current={todayPnl}  target={goals?.dailyTarget   ?? null} />
          <GoalRow label="This week"    current={weekPnl}   target={goals?.weeklyTarget  ?? null} />
          <GoalRow label="This month"   current={monthPnl}  target={goals?.monthlyTarget ?? null} />
          {(goals?.maxDailyLoss ?? null) !== null && (
            <GoalRow label="Daily loss limit" current={todayPnl} target={goals!.maxDailyLoss} isLoss />
          )}
        </div>
      )}
    </div>
  );
}
