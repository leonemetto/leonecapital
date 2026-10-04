import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight, ArrowDownRight, CaretUp, CaretDown, X, PencilSimple, Trash, Compass, Check, ArrowsClockwise, ArrowSquareOut,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { SidePanel } from '@/components/ef/SidePanel';
import { Kbd, Pill } from '@/components/ef/primitives';
import { toggleClass } from '@/components/ef/field';
import { TradeForm } from '@/components/trade/TradeForm';
import { useSharedTrades } from '@/contexts/TradesContext';
import { useSharedAccounts } from '@/contexts/AccountsContext';
import { useCriteria } from '@/hooks/useCriteria';
import { useTradeVerifications } from '@/hooks/useTradeVerifications';
import { useSignedUrl } from '@/hooks/useSignedUrl';
import { useShell } from '@/components/shell/ShellContext';
import { cn, parseLocalDate } from '@/lib/utils';
import { fmtR, fmtSignedMoney, toneOf, TONE_CLASS } from '@/lib/format';
import type { Trade, TradeFormData } from '@/types/trade';

const isTypingTarget = (el: EventTarget | null) => {
  const node = el as HTMLElement | null;
  if (!node) return false;
  return node.tagName === 'INPUT' || node.tagName === 'TEXTAREA' || node.tagName === 'SELECT' || node.isContentEditable;
};

/**
 * One trade, read and corrected in place. J and K step through the list it
 * was opened from, so a session can be reviewed without closing the panel.
 */
export function TradeDrawer() {
  const { tradeId, tradeQueue, openTrade, closeTrade, openAtlas } = useShell();
  const { trades, updateTrade, updateTradeGroup, deleteTrade, deleteTradeGroup } = useSharedTrades();
  const { accounts } = useSharedAccounts();
  const { activeCriteria } = useCriteria();

  const trade = useMemo(() => trades.find(t => t.id === tradeId) ?? null, [trades, tradeId]);
  const legs = useMemo(
    () => (trade?.tradeGroupId ? trades.filter(t => t.tradeGroupId === trade.tradeGroupId) : null),
    [trades, trade],
  );
  const isGroup = !!legs && legs.length > 1;

  const [editing, setEditing] = useState<{ trade: Trade; group: boolean } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    setEditing(null);
    setConfirmDelete(false);
    setNote(trade?.notes ?? '');
  }, [trade?.id, trade?.notes]);

  // The trade disappeared (deleted, or filtered out by an account switch).
  useEffect(() => {
    if (tradeId && !trade && trades.length > 0) closeTrade();
  }, [tradeId, trade, trades.length, closeTrade]);

  const idx = tradeId ? tradeQueue.indexOf(tradeId) : -1;
  const prevId = idx > 0 ? tradeQueue[idx - 1] : null;
  const nextId = idx >= 0 && idx < tradeQueue.length - 1 ? tradeQueue[idx + 1] : null;

  const ids = useMemo(() => (trade ? [trade.id] : []), [trade]);
  const { data: verifications = {} } = useTradeVerifications(ids);
  const checks = trade ? verifications[trade.id] : undefined;

  const { data: shotUrl } = useSignedUrl(trade?.screenshotUrl || undefined);

  const totalPnl = isGroup ? legs!.reduce((s, l) => s + l.pnl, 0) : trade?.pnl ?? 0;
  const avgR = useMemo(() => {
    if (!isGroup) return trade?.rMultiple;
    const rs = legs!.map(l => l.rMultiple).filter((r): r is number => r != null);
    return rs.length ? rs.reduce((s, r) => s + r, 0) / rs.length : undefined;
  }, [isGroup, legs, trade]);

  const accountName = (id?: string) => (id ? accounts.find(a => a.id === id)?.name ?? '—' : '—');

  const applyShared = async (data: Partial<TradeFormData>) => {
    if (!trade) return;
    try {
      if (isGroup && trade.tradeGroupId) await updateTradeGroup(trade.tradeGroupId, data);
      else await updateTrade(trade.id, data);
    } catch (e: any) {
      toast.error(e?.message || 'Could not save the change');
    }
  };

  const saveNote = () => {
    if (!trade || note === trade.notes) return;
    applyShared({ notes: note });
  };

  const handleEditSubmit = async (data: TradeFormData) => {
    if (!editing) return;
    if (editing.group && editing.trade.tradeGroupId) {
      // Account and P&L belong to each leg, so a group edit leaves them alone.
      const { accountId: _a, pnl: _p, ...shared } = data;
      await updateTradeGroup(editing.trade.tradeGroupId, shared);
    } else {
      await updateTrade(editing.trade.id, data);
    }
  };

  const handleDelete = async () => {
    if (!trade) return;
    const target = nextId ?? prevId;
    try {
      if (isGroup && trade.tradeGroupId) await deleteTradeGroup(trade.tradeGroupId);
      else await deleteTrade(trade.id);
      toast.success(isGroup ? 'Mirrored trade deleted' : 'Trade deleted');
      if (target) openTrade(target, tradeQueue.filter(id => id !== trade.id));
      else closeTrade();
    } catch (e: any) {
      toast.error(e?.message || 'Could not delete the trade');
    }
  };

  const askAtlas = () => {
    if (!trade) return;
    const detail = [
      `TRADE ${trade.date.slice(0, 10)}: ${trade.instrument} ${trade.direction}`,
      `Outcome: ${trade.outcome}, P&L: $${totalPnl.toFixed(2)}${avgR != null ? `, R: ${avgR}` : ''}`,
      `Session: ${trade.session || 'n/a'}, Setup: ${trade.strategy || 'n/a'}, HTF bias: ${trade.htfBias || 'n/a'}`,
      `Followed plan: ${trade.followedPlan == null ? 'not tagged' : trade.followedPlan ? 'yes' : 'no'}`,
      `Emotional state: ${trade.emotionalState ?? 'n/a'}/5, Confidence: ${trade.confidenceLevel ?? 'n/a'}/5`,
      trade.notes ? `Notes: ${trade.notes}` : '',
    ].filter(Boolean).join('\n');
    closeTrade();
    openAtlas({ hint: { label: `${trade.instrument} on ${shortDate(trade.date)}`, detail } });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (editing || isTypingTarget(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
    const key = e.key.toLowerCase();
    if ((key === 'j' || e.key === 'ArrowDown') && nextId) {
      e.preventDefault();
      openTrade(nextId);
    } else if ((key === 'k' || e.key === 'ArrowUp') && prevId) {
      e.preventDefault();
      openTrade(prevId);
    } else if (key === 'e' && trade) {
      e.preventDefault();
      setEditing({ trade, group: isGroup });
    }
  };

  const tone = toneOf(totalPnl);

  return (
    <SidePanel
      open={!!tradeId && !!trade}
      onOpenChange={open => { if (!open) closeTrade(); }}
      label={trade ? `${trade.instrument} trade on ${shortDate(trade.date)}` : 'Trade'}
      width={editing ? 560 : 480}
      onKeyDown={onKeyDown}
    >
      {trade && (
        <>
          {/* Header */}
          <header className="flex h-[52px] shrink-0 items-center gap-2 border-b border-ef-line pl-5 pr-2">
            <span className="ef-num text-[12px] text-ef-ink-3">{longDate(trade.date)}</span>
            {idx >= 0 && tradeQueue.length > 1 && (
              <span className="ef-num text-[11px] text-ef-ink-4">{idx + 1} of {tradeQueue.length}</span>
            )}
            <div className="ml-auto flex items-center gap-0.5">
              <button type="button" disabled={!prevId} onClick={() => prevId && openTrade(prevId)} aria-label="Previous trade" title="Previous (K)" className="ef-btn ef-btn-ghost ef-btn-sm w-7 px-0">
                <CaretUp className="h-3.5 w-3.5" />
              </button>
              <button type="button" disabled={!nextId} onClick={() => nextId && openTrade(nextId)} aria-label="Next trade" title="Next (J)" className="ef-btn ef-btn-ghost ef-btn-sm w-7 px-0">
                <CaretDown className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={closeTrade} aria-label="Close" className="ef-btn ef-btn-ghost ef-btn-sm ml-1 w-7 px-0">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </header>

          {editing ? (
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              <h2 className="m-0 text-[16px] font-medium tracking-[-0.02em] text-ef-ink">
                {editing.group ? 'Edit mirrored trade' : 'Edit trade'}
              </h2>
              {editing.group && (
                <p className="m-0 mb-4 mt-1 text-[12.5px] leading-relaxed text-ef-ink-3">
                  Changes apply to every account leg. Each leg keeps its own account and P&amp;L.
                </p>
              )}
              <div className={cn(!editing.group && 'mt-4')}>
                <TradeForm
                  key={editing.trade.id}
                  initialData={editing.trade}
                  onSubmit={handleEditSubmit}
                  submitLabel="Save changes"
                  onCancel={() => setEditing(null)}
                  onSaved={() => setEditing(null)}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto">
                {/* Result */}
                <section className="px-5 pb-5 pt-5">
                  <div className="flex items-center gap-2">
                    <h2 className="m-0 text-[20px] font-medium leading-none tracking-[-0.02em] text-ef-ink">{trade.instrument}</h2>
                    <span className="inline-flex items-center gap-1 text-[12.5px] text-ef-ink-3">
                      {trade.direction === 'long'
                        ? <ArrowUpRight className="h-3.5 w-3.5" weight="bold" />
                        : <ArrowDownRight className="h-3.5 w-3.5" weight="bold" />}
                      {trade.direction === 'long' ? 'Long' : 'Short'}
                    </span>
                    {isGroup && (
                      <Pill className="ml-1 gap-1"><ArrowsClockwise className="h-2.5 w-2.5" weight="bold" /> {legs!.length} accounts</Pill>
                    )}
                  </div>
                  <div className="mt-4 flex items-baseline gap-3">
                    <span className={cn('ef-num text-[38px] font-medium leading-none tracking-[-0.045em]', TONE_CLASS[tone])}>
                      {fmtSignedMoney(totalPnl, 2)}
                    </span>
                    {avgR != null && <span className="ef-num text-[15px] text-ef-ink-2">{fmtR(avgR, 2)}</span>}
                  </div>
                </section>

                {/* Plan tag: the review step */}
                <section className="border-t border-ef-line px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="m-0 text-[13px] font-medium text-ef-ink">Did you follow your plan?</p>
                      <p className="m-0 mt-0.5 text-[11.5px] text-ef-ink-3">
                        {trade.followedPlan == null ? 'Not reviewed yet' : 'Reviewed'}
                      </p>
                    </div>
                    <div className="flex w-[152px] shrink-0 gap-1.5">
                      <button type="button" aria-pressed={trade.followedPlan === true} onClick={() => applyShared({ followedPlan: true })} className={toggleClass(trade.followedPlan === true)}>
                        Yes
                      </button>
                      <button type="button" aria-pressed={trade.followedPlan === false} onClick={() => applyShared({ followedPlan: false })} className={toggleClass(trade.followedPlan === false, 'neg')}>
                        No
                      </button>
                    </div>
                  </div>
                </section>

                {/* Per-account legs */}
                {isGroup && (
                  <section className="border-t border-ef-line px-5 py-4">
                    <p className="ef-label m-0 mb-2">Per-account legs</p>
                    <ul className="m-0 list-none p-0">
                      {legs!.map(leg => (
                        <li key={leg.id} className="flex items-center gap-2 border-b border-ef-line py-2 last:border-b-0">
                          <span className="min-w-0 flex-1 truncate text-[13px] text-ef-ink">{accountName(leg.accountId)}</span>
                          <span className={cn('ef-num text-[13px]', TONE_CLASS[toneOf(leg.pnl)])}>{fmtSignedMoney(leg.pnl, 2)}</span>
                          <button type="button" onClick={() => setEditing({ trade: leg, group: false })} aria-label={`Edit the ${accountName(leg.accountId)} leg`} className="ef-btn ef-btn-ghost ef-btn-sm w-7 px-0">
                            <PencilSimple className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Fields */}
                <section className="border-t border-ef-line px-5 py-2">
                  <dl className="m-0">
                    {!isGroup && accounts.length > 1 && <Row label="Account" value={accountName(trade.accountId)} />}
                    <Row label="Session" value={trade.session} />
                    <Row label="Setup" value={trade.strategy} />
                    <Row label="Risk" value={trade.riskPercent != null ? `${trade.riskPercent}%` : ''} mono />
                    <Row label="Higher-timeframe bias" value={trade.htfBias ?? ''} />
                    <Row label="Emotional state" value={trade.emotionalState != null ? `${trade.emotionalState} / 5` : ''} mono />
                    <Row label="Confidence" value={trade.confidenceLevel != null ? `${trade.confidenceLevel} / 5` : ''} mono />
                    <Row label="Time in trade" value={trade.timeInTrade != null ? `${trade.timeInTrade} min` : ''} mono />
                  </dl>
                </section>

                {/* Checklist */}
                {activeCriteria.length > 0 && (
                  <section className="border-t border-ef-line px-5 py-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="ef-label m-0">Entry checklist</p>
                      {checks && (
                        <span className="ef-num text-[11.5px] text-ef-ink-3">
                          {activeCriteria.filter(c => checks[c.id]).length} of {activeCriteria.length}
                        </span>
                      )}
                    </div>
                    {checks ? (
                      <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                        {activeCriteria.map(c => (
                          <li key={c.id} className="flex items-start gap-2 text-[12.5px] leading-snug">
                            <span className={cn('mt-0.5 grid h-3.5 w-3.5 shrink-0 place-items-center rounded-[4px] border', checks[c.id] ? 'border-transparent bg-ef-ink text-ef-bg' : 'border-ef-line-strong')}>
                              {checks[c.id] && <Check className="h-2.5 w-2.5" weight="bold" />}
                            </span>
                            <span className={checks[c.id] ? 'text-ef-ink-2' : 'text-ef-ink-4'}>{c.label}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="m-0 text-[12.5px] text-ef-ink-4">No checklist was recorded for this trade.</p>
                    )}
                  </section>
                )}

                {/* Note */}
                <section className="border-t border-ef-line px-5 py-4">
                  <label htmlFor="drawer-note" className="ef-label mb-2 block">Note</label>
                  <textarea
                    id="drawer-note"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    onBlur={saveNote}
                    rows={3}
                    placeholder="What did you see, and what would you repeat or change?"
                    className="w-full resize-y rounded-control border border-ef-line bg-ef-bg px-3 py-2.5 text-[13px] leading-relaxed text-ef-ink outline-none transition-colors placeholder:text-ef-ink-4 hover:border-ef-line-strong focus:border-ef-ink-3"
                  />
                </section>

                {/* Screenshot */}
                {trade.screenshotUrl && (
                  <section className="border-t border-ef-line px-5 py-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="ef-label m-0">Chart</p>
                      {shotUrl && (
                        <a href={shotUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11.5px] text-ef-ink-3 underline-offset-2 hover:text-ef-ink hover:underline">
                          Full size <ArrowSquareOut className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    {shotUrl ? (
                      <img src={shotUrl} alt={`Chart screenshot for the ${trade.instrument} trade`} className="block w-full rounded-control border border-ef-line" />
                    ) : (
                      <div className="h-40 animate-pulse rounded-control bg-ef-sunken" />
                    )}
                  </section>
                )}
              </div>

              {/* Actions */}
              <footer className="flex shrink-0 items-center gap-2 border-t border-ef-line px-5 py-3">
                {confirmDelete ? (
                  <>
                    <span className="mr-auto text-[12.5px] text-ef-ink-2">
                      {isGroup ? `Delete all ${legs!.length} legs? This cannot be undone.` : 'Delete this trade? This cannot be undone.'}
                    </span>
                    <button type="button" onClick={() => setConfirmDelete(false)} className="ef-btn ef-btn-ghost">Cancel</button>
                    <button type="button" onClick={handleDelete} className="ef-btn bg-ef-neg font-semibold text-white hover:opacity-90">Delete</button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={() => setEditing({ trade, group: isGroup })} className="ef-btn ef-btn-secondary">
                      <PencilSimple className="h-3.5 w-3.5" /> Edit <Kbd>E</Kbd>
                    </button>
                    <button type="button" onClick={askAtlas} className="ef-btn ef-btn-secondary">
                      <Compass className="h-3.5 w-3.5" /> Ask Atlas
                    </button>
                    <button type="button" onClick={() => setConfirmDelete(true)} aria-label="Delete trade" className="ef-btn ef-btn-ghost ml-auto w-9 px-0 hover:text-ef-neg">
                      <Trash className="h-4 w-4" />
                    </button>
                  </>
                )}
              </footer>
            </>
          )}
        </>
      )}
    </SidePanel>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-ef-line py-2.5 last:border-b-0">
      <dt className="text-[12.5px] text-ef-ink-3">{label}</dt>
      <dd className={cn('m-0 text-right text-[13px]', value ? 'text-ef-ink' : 'text-ef-ink-4', mono && 'ef-num')}>{value || '—'}</dd>
    </div>
  );
}

function shortDate(date: string) {
  return parseLocalDate(date).toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

function longDate(date: string) {
  return parseLocalDate(date).toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}
