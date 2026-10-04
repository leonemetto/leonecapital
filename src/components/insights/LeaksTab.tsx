import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Flask, ListChecks } from '@phosphor-icons/react';
import { EmptyState, Meter, Pill, Stat, Surface } from '@/components/ef/primitives';
import { computeLeaks, tradesForLeak, LEAK_MIN_TRADES, type Leak } from '@/lib/leaks';
import { useShell } from '@/components/shell/ShellContext';
import { cn, parseLocalDate } from '@/lib/utils';
import { fmtMoney, fmtPct, fmtSignedMoney, toneOf, TONE_CLASS } from '@/lib/format';
import type { Trade } from '@/types/trade';

const SEVERITY: Record<Leak['severity'], { label: string; tone: 'neg' | 'warn' }> = {
  critical: { label: 'Critical', tone: 'neg' },
  high: { label: 'High', tone: 'warn' },
  medium: { label: 'Medium', tone: 'warn' },
};

export function whatIfPath(leak: Leak): string {
  return `/insights/what-if?field=${leak.field}&key=${encodeURIComponent(leak.key)}&exclude=true`;
}

/**
 * Leaks ranked by money lost. Selecting one shows why it was flagged and the
 * trades behind it, with the next step one click away.
 */
export function LeaksTab({ trades, totalTrades }: { trades: Trade[]; totalTrades: number }) {
  const navigate = useNavigate();
  const { openTrade, openAtlas } = useShell();
  const leaks = useMemo(() => computeLeaks(trades), [trades]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = leaks.find(l => l.id === selectedId) ?? leaks[0] ?? null;
  const behind = useMemo(() => (selected ? tradesForLeak(selected, trades) : []), [selected, trades]);

  // Visiting the tab clears the sidebar's "new leaks" badge.
  useEffect(() => {
    if (totalTrades >= LEAK_MIN_TRADES) {
      try { localStorage.setItem('leaks_last_seen_count', String(leaks.length)); } catch { /* ignore */ }
    }
  }, [leaks.length, totalTrades]);

  if (totalTrades < LEAK_MIN_TRADES) {
    return (
      <Surface>
        <EmptyState
          art="/art/leak-lines.webp"
          title={`${LEAK_MIN_TRADES - totalTrades} more ${LEAK_MIN_TRADES - totalTrades === 1 ? 'trade' : 'trades'} until leaks can be found`}
          body={`Leak detection compares instruments, sessions and plan adherence. It needs at least ${LEAK_MIN_TRADES} trades to say anything reliable.`}
        >
          <div className="flex items-center gap-3">
            <Meter value={totalTrades} max={LEAK_MIN_TRADES} tone="ink" className="w-40" label="Trades logged toward leak detection" />
            <span className="ef-num text-[11.5px] text-ef-ink-3">{totalTrades} of {LEAK_MIN_TRADES}</span>
          </div>
        </EmptyState>
      </Surface>
    );
  }

  if (leaks.length === 0 || !selected) {
    return (
      <Surface>
        <EmptyState
          art="/art/leak-lines.webp"
          title="No leaks in this range"
          body="No instrument, session or plan habit shows a net loss beyond the threshold. Widen the date range to check a longer period."
        />
      </Surface>
    );
  }

  const totalImpact = leaks.reduce((s, l) => s + l.impact, 0);
  const maxImpact = Math.max(...leaks.map(l => l.impact), 1);
  const critical = leaks.filter(l => l.severity === 'critical').length;
  const grossLoss = Math.abs(trades.filter(t => t.pnl < 0).reduce((s, t) => s + t.pnl, 0));
  const queue = behind.map(t => t.id);

  return (
    <div className="flex flex-col gap-3">
      <Surface>
        <dl className="m-0 grid grid-cols-3 gap-4 px-5 py-4">
          <Stat label="Cost of leaks" value={fmtMoney(-totalImpact)} tone="neg" />
          <Stat label="Leaks found" value={String(leaks.length)} />
          <Stat label="Critical" value={String(critical)} tone={critical > 0 ? 'neg' : 'flat'} />
        </dl>
      </Surface>

      <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        {/* Ranked list */}
        <Surface>
          <p className="ef-label m-0 px-5 pb-2 pt-4">Ranked by money lost</p>
          <ul className="m-0 list-none p-2 pt-0">
            {leaks.map((l, i) => {
              const active = l.id === selected.id;
              return (
                <li key={l.id}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelectedId(l.id)}
                    className={cn(
                      'ef-focus w-full rounded-control px-3 py-3 text-left transition-colors',
                      active ? 'bg-ef-sunken' : 'hover:bg-ef-hover',
                    )}
                  >
                    <span className="flex items-baseline gap-3">
                      <span className="ef-num w-4 shrink-0 text-[11.5px] text-ef-ink-4">{i + 1}</span>
                      <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-ef-ink">{l.title}</span>
                      <span className="ef-num shrink-0 text-[13.5px] font-medium text-ef-neg">{fmtMoney(-l.impact)}</span>
                    </span>
                    <span className="mt-2 flex items-center gap-3 pl-7">
                      <span className="h-1.5 flex-1 overflow-hidden rounded-[1px] bg-ef-line" aria-hidden>
                        <span className="block h-full bg-ef-neg" style={{ width: `${(l.impact / maxImpact) * 100}%` }} />
                      </span>
                      <span className="ef-num w-[104px] shrink-0 text-right text-[11px] text-ef-ink-3">
                        {l.trades} trades · {fmtPct(l.winRate)} win
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="m-0 border-t border-ef-line px-5 py-3 text-[11.5px] leading-relaxed text-ef-ink-4">
            A segment is flagged when it has three or more trades and a net loss beyond $50. Past results only; removing a leak does not guarantee future profit.
          </p>
        </Surface>

        {/* Detail */}
        <Surface>
          <div className="px-5 pb-4 pt-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <Pill tone={SEVERITY[selected.severity].tone}>{SEVERITY[selected.severity].label}</Pill>
              {selected.tags.slice(-1).map(t => <Pill key={t}>{t}</Pill>)}
            </div>
            <h2 className="m-0 mt-3 text-[19px] font-medium tracking-[-0.02em] text-ef-ink">{selected.title}</h2>
            <p className="m-0 mt-1.5 max-w-[58ch] text-[13px] leading-relaxed text-ef-ink-2">{selected.note}</p>
            <dl className="m-0 mt-5 grid grid-cols-3 gap-4">
              <Stat label="Net result" value={fmtSignedMoney(selected.pnl)} tone="neg" />
              <Stat label="Win rate" value={fmtPct(selected.winRate)} />
              <Stat label="Share of losses" value={grossLoss > 0 ? fmtPct(Math.min(100, (selected.impact / grossLoss) * 100)) : '—'} />
            </dl>
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" onClick={() => navigate(whatIfPath(selected))} className="ef-btn ef-btn-primary">
                <Flask className="h-3.5 w-3.5" /> Test removing this
              </button>
              <button
                type="button"
                onClick={() => openAtlas({
                  hint: { label: selected.title, detail: `LEAK: ${selected.title}\n${selected.pattern}\nNet: $${selected.pnl.toFixed(2)} over ${selected.trades} trades, ${selected.winRate.toFixed(0)}% win rate.` },
                  prompt: `Why is "${selected.title}" a leak for me, and what should I change?`,
                })}
                className="ef-btn ef-btn-secondary"
              >
                <Compass className="h-3.5 w-3.5" /> Ask Atlas why
              </button>
              <button
                type="button"
                onClick={() => navigate('/trading-plan', { state: { suggestRule: ruleFor(selected) } })}
                className="ef-btn ef-btn-secondary"
              >
                <ListChecks className="h-3.5 w-3.5" /> Add a rule
              </button>
            </div>
          </div>

          <div className="border-t border-ef-line px-3 pb-2 pt-3">
            <p className="ef-label m-0 px-2 pb-1">The trades behind it</p>
            <ul className="m-0 max-h-[320px] list-none overflow-y-auto p-0">
              {behind.map(t => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => openTrade(t.id, queue)}
                    className="ef-focus flex h-9 w-full items-center gap-3 rounded-[8px] px-2 text-left transition-colors hover:bg-ef-hover"
                  >
                    <span className="ef-num w-12 shrink-0 text-[11.5px] text-ef-ink-4">
                      {parseLocalDate(t.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] text-ef-ink">
                      {t.instrument}
                      <span className="ml-2 text-ef-ink-4">{t.direction === 'long' ? 'Long' : 'Short'} · {t.session || 'no session'}</span>
                    </span>
                    <span className={cn('ef-num shrink-0 text-[13px]', TONE_CLASS[toneOf(t.pnl)])}>{fmtSignedMoney(t.pnl)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </Surface>
      </div>
    </div>
  );
}

/** A plain-language rule a trader could add to their plan for this leak. */
export function ruleFor(leak: Leak): string {
  if (leak.field === 'instrument') return `No ${leak.key} trades until the setup is retested`;
  if (leak.field === 'session') return `No trades in the ${leak.key} session`;
  return 'Every checklist item ticked before entry';
}
