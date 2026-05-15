import { Trade } from '@/types/trade';
import { TradingAccount } from '@/types/account';

/**
 * Split a total P&L across selected accounts using each account's copy_weight.
 *
 * Formula: legPnL = totalPnL * account.copyWeight / sum(selectedAccount.copyWeight)
 *
 * Missing/zero/negative copyWeight is normalized to 1 — the DB constraint enforces
 * > 0 server-side, but the migration may not have been applied yet in dev, so we
 * defend at the math layer too.
 *
 * Rounding: each leg is rounded to 2 decimals. The last leg absorbs the rounding
 * residual so the sum of legs always equals totalPnL exactly. Without this fix the
 * difference indicator would show false mismatches on perfectly proportional splits.
 */
export function splitPnlByCopyWeight(
  totalPnl: number,
  accounts: { id: string; copyWeight: number }[],
): Record<string, number> {
  if (accounts.length === 0) return {};

  const weights = accounts.map(a => (a.copyWeight > 0 ? a.copyWeight : 1));
  const totalWeight = weights.reduce((s, w) => s + w, 0);

  const result: Record<string, number> = {};
  let assignedSoFar = 0;
  accounts.forEach((a, i) => {
    if (i === accounts.length - 1) {
      // Last leg = residual, ensures exact total.
      result[a.id] = round2(totalPnl - assignedSoFar);
    } else {
      const share = round2((totalPnl * weights[i]) / totalWeight);
      result[a.id] = share;
      assignedSoFar += share;
    }
  });
  return result;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/**
 * Collapse mirrored trade groups for analytics consumption.
 *
 * Behavioral metrics (count, win rate, expectancy by setup, frequency, leak
 * detection) should treat one mirrored group as ONE decision, not N executions.
 * Monetary metrics (net P&L, drawdown) should still SUM across all legs.
 *
 * This helper produces one synthetic trade per group with:
 *  - shared fields from the first row in the group (they're all identical anyway)
 *  - pnl = sum of all legs' pnl (so net P&L stays accurate)
 *  - rMultiple = average across legs (proportional, identical when weights match)
 *
 * Non-grouped trades pass through untouched.
 */
export function dedupeTradesByGroup(trades: Trade[]): Trade[] {
  const groups = new Map<string, Trade[]>();
  const singles: Trade[] = [];

  for (const t of trades) {
    if (t.tradeGroupId) {
      const arr = groups.get(t.tradeGroupId) ?? [];
      arr.push(t);
      groups.set(t.tradeGroupId, arr);
    } else {
      singles.push(t);
    }
  }

  const collapsed: Trade[] = [];
  for (const legs of groups.values()) {
    const head = legs[0];
    const totalPnl = legs.reduce((s, t) => s + t.pnl, 0);
    const rValues = legs.map(t => t.rMultiple).filter((r): r is number => r != null);
    const avgR = rValues.length ? rValues.reduce((s, r) => s + r, 0) / rValues.length : undefined;
    collapsed.push({
      ...head,
      pnl: totalPnl,
      rMultiple: avgR,
      // accountId on a deduped row is meaningless — clear it so per-account filters
      // don't silently include the synthetic row.
      accountId: undefined,
    });
  }

  return [...collapsed, ...singles];
}

/**
 * Sum all child legs in a group. Used where we want monetary totals across the group.
 */
export function sumGroupPnl(trades: Trade[], groupId: string): number {
  return trades.filter(t => t.tradeGroupId === groupId).reduce((s, t) => s + t.pnl, 0);
}

/**
 * Return all trades in a group, sorted by account name lookup-stable order.
 */
export function getGroupLegs(trades: Trade[], groupId: string): Trade[] {
  return trades.filter(t => t.tradeGroupId === groupId);
}

/**
 * Group trades by trade_group_id for the Trades DB collapsed view.
 * Returns an array of either a single trade or a group of N trades.
 */
export type DisplayRow =
  | { kind: 'single'; trade: Trade }
  | { kind: 'group'; groupId: string; legs: Trade[] };

export function groupTradesForDisplay(trades: Trade[]): DisplayRow[] {
  const seenGroups = new Set<string>();
  const rows: DisplayRow[] = [];
  for (const t of trades) {
    if (t.tradeGroupId) {
      if (seenGroups.has(t.tradeGroupId)) continue;
      seenGroups.add(t.tradeGroupId);
      const legs = trades.filter(x => x.tradeGroupId === t.tradeGroupId);
      rows.push({ kind: 'group', groupId: t.tradeGroupId, legs });
    } else {
      rows.push({ kind: 'single', trade: t });
    }
  }
  return rows;
}

/**
 * Convenience: lookup account by id with safe default copy weight.
 */
export function getAccountCopyWeight(accounts: TradingAccount[], id: string): number {
  const a = accounts.find(x => x.id === id);
  if (!a) return 1;
  return a.copyWeight > 0 ? a.copyWeight : 1;
}
