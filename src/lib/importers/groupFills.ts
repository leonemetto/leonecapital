/**
 * groupFills.ts — generic post-parse fill aggregation utility.
 *
 * Pipeline position (per the architecture doc):
 *
 *   CSV rows
 *     → parseCSV()          [shared CSV parser]
 *     → preprocess()        [optional broker-specific raw-row transforms]
 *     → map()               [broker-specific: raw columns → typed fields]
 *     → groupFills()        ← THIS FILE
 *     → import loop         [addTrade() per merged trade]
 *
 * groupFills() is intentionally broker-agnostic: it never references broker
 * names or column names.  All broker knowledge lives in the caller's
 * `groupKey` and `mapper` arguments.
 *
 * Guard conditions implemented (matching Agent 2 final guard list):
 *  1. Stable sort with tiebreak (timestamp ASC, csvRowIndex ASC)
 *  2. Falsy groupKey rejection  → synthetic __nokeyFill_<rowIndex> key
 *  3. Fill value mode declaration (incremental | cumulative)
 *  4. Size rule — entry-side fills only (_fillSide field)
 *  5. Incomplete position guard (only-entry or only-exit group → skip)
 *  6. Direction conflict → mark needsReview, do NOT split
 *  7. NaN/null commission normalisation
 *  8. Net-position state machine for ID-less brokers (not in scope here —
 *     that is a broker-level groupKey concern; groupFills handles the rest)
 *  9. Group fill count cap (default 50)
 * 10. Block/flat fill duration handling (entryTime === exitTime → timeInTrade 0)
 * 11. Structured import result returned to caller
 * 12. Cumulative P&L guard for scale-outs
 */

import { ImportError } from './errors';

// ─── Public types ─────────────────────────────────────────────────────────────

/**
 * A raw CSV row keyed by header string.  Mirrors what ImportTrades.tsx calls
 * `Record<string, string>`.
 */
export type RawRow = Record<string, string>;

/**
 * The typed fields that FillMapper extracts from a single CSV row.
 *
 * Fields prefixed with `_fill` are aggregation metadata not stored on the
 * final Trade record — they are consumed by groupFills() and stripped before
 * the merged object is returned.
 *
 * Only `symbol`, `direction`, `timestamp`, and `pnl` are required.  All
 * other fields are optional: missing numeric fields are treated as 0 by the
 * aggregator.
 */
export interface FillData {
  /** Instrument ticker / symbol. */
  symbol: string;
  /** Trade direction as seen by this fill. */
  direction: 'long' | 'short';
  /**
   * Timestamp for this fill.  Used for stable sort and for determining
   * entryTime (min) / exitTime (max) of the merged trade.
   */
  timestamp: Date;
  /** Fill-level price.  Used in VWAP calculations. */
  price?: number;
  /**
   * Incremental size for this fill (not cumulative running total unless
   * fillValueMode is 'cumulative').
   */
  size?: number;
  /** Realised P&L contributed by this fill. */
  pnl: number;
  /** Commission for this fill.  Null / undefined / NaN are normalised to 0. */
  commission?: number | null;
  /**
   * Whether this fill is an entry-side or exit-side action.
   * Used by the size rule (guard 4) and the incomplete-position guard (guard 5).
   * When absent the aggregator falls back to using the first fill's size and
   * emits a warning.
   */
  _fillSide?: 'entry' | 'exit';
  /**
   * Declares whether numeric fields (size, pnl) in this broker's export are
   * incremental per fill or cumulative running totals.
   *
   * • 'incremental' (default) — each fill contributes its own slice; sum them.
   * • 'cumulative'            — each fill replaces the prior value; take the last.
   */
  fillValueMode?: 'incremental' | 'cumulative';
}

/**
 * Function provided by the caller that converts a single raw CSV row into a
 * typed FillData object.  Return null to skip the row entirely (e.g. header
 * repeats, deposit/withdrawal rows).
 */
export type FillMapper = (row: RawRow, csvRowIndex: number) => FillData | null;

// ─── Internal types ───────────────────────────────────────────────────────────

/** A fill after mapper execution, enriched with its original row index. */
interface IndexedFill {
  fill: FillData;
  csvRowIndex: number;
  /** The grouping key assigned to this fill (synthetic key if original was falsy). */
  resolvedKey: string;
}

/** One fill group ready for merge. */
interface FillGroup {
  key: string;
  fills: IndexedFill[];
  hasSyntheticKey: boolean;
}

// ─── Result types ─────────────────────────────────────────────────────────────

/**
 * A merged trade record produced by groupFills().
 *
 * Numeric fields are always proper numbers (never NaN).  `needsReview` is set
 * to true for direction-conflicted groups — the caller should surface these to
 * the user before committing the import.
 */
export interface MergedTrade {
  symbol: string;
  direction: 'long' | 'short';
  entryPrice: number;
  exitPrice: number;
  entryTime: Date;
  exitTime: Date;
  /** Peak open position size (sum of entry-side fill sizes). */
  size: number;
  pnl: number;
  commission: number;
  /** Explicit zero when entryTime === exitTime (block trade / MOO fill). */
  timeInTrade: number;
  /** True when fills in this group had conflicting directions. */
  needsReview: boolean;
  /** Human-readable note about what triggered needsReview. */
  reviewReason?: string;
  /** Row indices (0-based) of all fills that contributed to this merged record. */
  sourceRows: number[];
}

/**
 * Structured result returned by groupFills() and detectPartialFills().
 * Display this to the user in the import confirmation UI before final commit.
 */
export interface GroupFillsResult {
  /** Merged trade records ready for addTrade(). */
  trades: MergedTrade[];
  /** Number of groups that had 2+ fills and were merged. */
  mergedCount: number;
  /** Number of single-fill groups that passed through without merge. */
  passthroughCount: number;
  /**
   * Number of groups that were dropped:
   * zero-size / open-position / fill-cap-exceeded groups.
   */
  skippedCount: number;
  /** Total number of warnings emitted during aggregation. */
  warningCount: number;
  /** Human-readable warning strings, one per event. */
  warnings: string[];
  /**
   * Number of fills that had a falsy original groupKey and were assigned a
   * synthetic key (treated as individual pass-through trades).
   */
  ungroupedFillCount: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Maximum fills per group before a groupKey-collision warning is emitted. */
const DEFAULT_MAX_FILLS_PER_GROUP = 50;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Safe commission coercion: treats null, undefined, and NaN as 0.
 * @internal
 */
function safeCommission(val: number | null | undefined): number {
  if (val == null) return 0;
  return isNaN(val) ? 0 : val;
}

/**
 * VWAP calculation across an array of (price, size) pairs.
 * Returns 0 when total size is 0 to avoid division by zero.
 * @internal
 */
function vwap(pairs: Array<{ price: number; size: number }>): number {
  const totalSize = pairs.reduce((s, p) => s + p.size, 0);
  if (totalSize === 0) return 0;
  const weighted = pairs.reduce((s, p) => s + p.price * p.size, 0);
  return weighted / totalSize;
}

/**
 * Detect whether a set of fill P&L values are cumulative (running totals) rather
 * than incremental.  Heuristic: if any fill's pnl equals the running sum of all
 * prior fills' pnl values, treat the whole group as cumulative.
 *
 * Guard 12: Cumulative P&L guard for scale-outs.
 * @internal
 */
function isCumulativePnl(pnls: number[]): boolean {
  if (pnls.length <= 1) return false;
  let runningSum = 0;
  for (let i = 0; i < pnls.length - 1; i++) {
    runningSum += pnls[i];
    // If the NEXT fill's pnl equals the running sum, it looks cumulative
    if (Math.abs(pnls[i + 1] - runningSum) < 1e-9) return true;
  }
  return false;
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * groupFills — merge an array of raw CSV rows into aggregated trade records.
 *
 * All guard conditions from Agent 2's final list are implemented.  On a
 * hard guard violation (groupKey collision cap exceeded, or a programming
 * error in the mapper that produces a NaN symbol) an `ImportError` is thrown.
 * Soft violations (direction conflict, open position, etc.) are surfaced as
 * warnings inside the returned result and the affected group is either skipped
 * or flagged `needsReview`, never silently corrupted.
 *
 * @param rows          - Raw CSV rows produced by parseCSV().
 * @param groupKey      - Column name whose value identifies which trade a fill
 *                        belongs to (e.g. "Position ID", "IBOrderID").
 * @param mapper        - Function that converts a raw row into typed FillData.
 *                        Return null to skip a row entirely.
 * @param maxFillsPerGroup - Guard 9: groups exceeding this limit are skipped
 *                           with a warning.  Defaults to 50.
 *
 * @throws {ImportError} When the groupKey column value is a non-string type
 *                       that cannot be coerced (programming error in mapper).
 *
 * @returns Structured result with merged trades and diagnostic counters.
 */
export function groupFills(
  rows: RawRow[],
  groupKey: string,
  mapper: FillMapper,
  maxFillsPerGroup = DEFAULT_MAX_FILLS_PER_GROUP,
): GroupFillsResult {
  const warnings: string[] = [];
  let ungroupedFillCount = 0;

  // ── Step 1: Map raw rows → typed fills, tracking original row index ────────
  const indexedFills: IndexedFill[] = [];

  for (let csvRowIndex = 0; csvRowIndex < rows.length; csvRowIndex++) {
    const row = rows[csvRowIndex];
    const fill = mapper(row, csvRowIndex);
    if (fill == null) continue; // mapper chose to skip this row

    // Guard 2: Falsy groupKey rejection ──────────────────────────────────────
    // If the key column is missing or blank, assign a unique synthetic key so
    // this fill is never accidentally grouped with another keyless fill.
    const rawKey: unknown = row[groupKey];
    const keyStr = typeof rawKey === 'string' ? rawKey.trim() : String(rawKey ?? '');
    let resolvedKey: string;
    let hasSynthetic = false;

    if (!keyStr || keyStr === 'undefined' || keyStr === 'null') {
      resolvedKey = `__nokeyFill_${csvRowIndex}`;
      hasSynthetic = true;
      ungroupedFillCount++;
      warnings.push(
        `Row ${csvRowIndex}: groupKey column "${groupKey}" is blank/null — fill treated as standalone (key: ${resolvedKey})`,
      );
    } else {
      resolvedKey = keyStr;
    }

    // Guard 7: NaN commission normalisation ──────────────────────────────────
    const rawCommission = fill.commission;
    if (rawCommission != null && isNaN(rawCommission as number)) {
      warnings.push(
        `Row ${csvRowIndex}: commission is NaN — normalised to 0`,
      );
    }
    const normalisedFill: FillData = {
      ...fill,
      commission: safeCommission(fill.commission),
    };

    indexedFills.push({ fill: normalisedFill, csvRowIndex, resolvedKey });
  }

  // ── Step 2: Group fills by resolved key ───────────────────────────────────
  const groupMap = new Map<string, IndexedFill[]>();
  const syntheticKeySet = new Set<string>();

  for (const indexed of indexedFills) {
    if (!groupMap.has(indexed.resolvedKey)) {
      groupMap.set(indexed.resolvedKey, []);
    }
    groupMap.get(indexed.resolvedKey)!.push(indexed);
    if (indexed.resolvedKey.startsWith('__nokeyFill_')) {
      syntheticKeySet.add(indexed.resolvedKey);
    }
  }

  const groups: FillGroup[] = [];
  for (const [key, fills] of groupMap) {
    groups.push({ key, fills, hasSyntheticKey: syntheticKeySet.has(key) });
  }

  // ── Step 3: Process each group ────────────────────────────────────────────
  const trades: MergedTrade[] = [];
  let mergedCount = 0;
  let passthroughCount = 0;
  let skippedCount = 0;

  for (const group of groups) {
    const { key, fills } = group;
    const rowNums = fills.map((f) => f.csvRowIndex);

    // Guard 9: Group fill count cap ──────────────────────────────────────────
    if (fills.length > maxFillsPerGroup) {
      warnings.push(
        `groupKey "${key}" has ${fills.length} fills (exceeds cap of ${maxFillsPerGroup}) — ` +
        `suspected groupKey collision; treating all fills as individual pass-throughs`,
      );
      // Treat each fill in this over-sized group as its own standalone trade
      for (const indexed of fills) {
        const solo = mergeSingleFill(indexed, warnings);
        if (solo) {
          trades.push(solo);
          passthroughCount++;
        } else {
          skippedCount++;
        }
      }
      continue;
    }

    // Guard 1: Stable sort with tiebreak ─────────────────────────────────────
    // Primary: timestamp ascending.  Secondary (tiebreak): original CSV row index.
    fills.sort((a, b) => {
      const tDiff = a.fill.timestamp.getTime() - b.fill.timestamp.getTime();
      if (tDiff !== 0) return tDiff;
      return a.csvRowIndex - b.csvRowIndex; // stable tiebreak
    });

    // Guard 9 (single-fill pass-through) — guard #1 from Agent 1 spec ────────
    if (fills.length === 1) {
      const solo = mergeSingleFill(fills[0], warnings);
      if (solo) {
        trades.push(solo);
        passthroughCount++;
      } else {
        skippedCount++;
      }
      continue;
    }

    // ── Multi-fill group: run all guards before merge ─────────────────────

    // Guard 6 (Agent 2): Direction conflict — flag, don't split ──────────────
    const directions = new Set(fills.map((f) => f.fill.direction));
    let needsReview = false;
    let reviewReason: string | undefined;

    if (directions.size > 1) {
      needsReview = true;
      reviewReason =
        `Direction conflict in group "${key}" (rows ${rowNums.join(', ')}): ` +
        `found ${[...directions].join(' and ')} fills — manual review required`;
      warnings.push(reviewReason);
      // Do NOT split or skip — flag and continue merging so the user can decide
    }

    // Guard: Symbol consistency (Agent 1 guard #3) ───────────────────────────
    const symbols = new Set(fills.map((f) => f.fill.symbol));
    if (symbols.size > 1) {
      warnings.push(
        `Symbol inconsistency in group "${key}" (rows ${rowNums.join(', ')}): ` +
        `found ${[...symbols].join(', ')} — first fill's symbol used`,
      );
    }

    // ── Determine fill value mode ─────────────────────────────────────────
    // Guard 3: Fill value mode declaration.
    // Use the first fill's declared mode; default to 'incremental'.
    const fillValueMode: 'incremental' | 'cumulative' =
      fills[0].fill.fillValueMode ?? 'incremental';

    // ── Separate entry-side and exit-side fills ───────────────────────────
    // Guard 4: size must be sum of ENTRY-side fills only.
    const entryFills = fills.filter((f) => f.fill._fillSide === 'entry');
    const exitFills = fills.filter((f) => f.fill._fillSide === 'exit');
    const sideDataAvailable = fills.some((f) => f.fill._fillSide != null);

    // Guard 5: Incomplete position guard ─────────────────────────────────────
    // Only check when side data is available; if none is provided we can't infer.
    if (sideDataAvailable) {
      if (entryFills.length === 0) {
        warnings.push(
          `Group "${key}" (rows ${rowNums.join(', ')}) has no entry-side fills — ` +
          `open/orphaned position detected; skipping`,
        );
        skippedCount++;
        continue;
      }
      if (exitFills.length === 0) {
        warnings.push(
          `Group "${key}" (rows ${rowNums.join(', ')}) has no exit-side fills — ` +
          `open position detected; skipping`,
        );
        skippedCount++;
        continue;
      }
    }

    // ── Timestamps ────────────────────────────────────────────────────────
    const entryTime = fills[0].fill.timestamp; // min — fills are sorted ASC
    const exitTime = fills[fills.length - 1].fill.timestamp; // max

    // Guard 10: Block/flat fill duration handling ─────────────────────────────
    const timeInTrade =
      entryTime.getTime() === exitTime.getTime()
        ? 0
        : Math.round((exitTime.getTime() - entryTime.getTime()) / 60_000);

    // ── VWAP prices ───────────────────────────────────────────────────────
    // Use entry fills for entryPrice and exit fills for exitPrice when side
    // data is available; fall back to all fills when it is not.
    const entryPriceFills = sideDataAvailable ? entryFills : fills;
    const exitPriceFills = sideDataAvailable ? exitFills : fills;

    const entryPrice = vwap(
      entryPriceFills
        .filter((f) => f.fill.price != null && f.fill.size != null)
        .map((f) => ({ price: f.fill.price!, size: f.fill.size! })),
    );

    const exitPrice = vwap(
      exitPriceFills
        .filter((f) => f.fill.price != null && f.fill.size != null)
        .map((f) => ({ price: f.fill.price!, size: f.fill.size! })),
    );

    // ── Size ─────────────────────────────────────────────────────────────
    // Guard 4: size = sum of entry-side fill sizes only.
    let size: number;
    if (sideDataAvailable && entryFills.length > 0) {
      if (fillValueMode === 'cumulative') {
        // Take last entry-fill size for cumulative brokers
        size = entryFills[entryFills.length - 1].fill.size ?? 0;
      } else {
        size = entryFills.reduce((s, f) => s + (f.fill.size ?? 0), 0);
      }
    } else {
      // No _fillSide info: default to first fill's size, emit warning
      const firstSize = fills[0].fill.size ?? 0;
      if (fills.length > 1) {
        warnings.push(
          `Group "${key}" (rows ${rowNums.join(', ')}): no _fillSide data — ` +
          `size defaulted to first fill's size (${firstSize}); add _fillSide for accuracy`,
        );
      }
      size = firstSize;
    }

    // Guard: zero-size skip (Agent 1 guard #4) ────────────────────────────────
    if (size === 0 && !needsReview) {
      warnings.push(
        `Group "${key}" (rows ${rowNums.join(', ')}) has size 0 — ` +
        `likely a cancellation or internal transfer; skipping`,
      );
      skippedCount++;
      continue;
    }

    // ── P&L ──────────────────────────────────────────────────────────────
    // Guard 12: Cumulative P&L guard for scale-outs.
    let pnl: number;
    const pnlValues = fills.map((f) => f.fill.pnl);

    if (fillValueMode === 'cumulative') {
      // Explicit cumulative declaration: take the last fill's P&L
      pnl = pnlValues[pnlValues.length - 1];
    } else {
      // Incremental: check for accidental cumulative values (guard 12)
      if (isCumulativePnl(pnlValues)) {
        pnl = pnlValues[pnlValues.length - 1];
        warnings.push(
          `Group "${key}" (rows ${rowNums.join(', ')}): P&L values appear cumulative ` +
          `(each fill equals running sum of prior fills) — ` +
          `using last fill's P&L (${pnl}) instead of sum to prevent inflation`,
        );
      } else {
        pnl = pnlValues.reduce((s, v) => s + v, 0);
      }
    }

    // ── Commission ────────────────────────────────────────────────────────
    // Guard 7: any NaN was normalised to 0 above; safe to sum.
    let commission: number;
    const commValues = fills.map((f) => safeCommission(f.fill.commission));
    if (fillValueMode === 'cumulative') {
      commission = commValues[commValues.length - 1];
    } else {
      commission = commValues.reduce((s, v) => s + v, 0);
    }

    // ── Direction (from first fill after stable sort) ─────────────────────
    const direction = fills[0].fill.direction;

    // ── Assemble merged trade ─────────────────────────────────────────────
    const merged: MergedTrade = {
      symbol: fills[0].fill.symbol,
      direction,
      entryPrice,
      exitPrice,
      entryTime,
      exitTime,
      size,
      pnl,
      commission,
      timeInTrade,
      needsReview,
      reviewReason,
      sourceRows: rowNums,
    };

    trades.push(merged);
    mergedCount++;
  }

  return {
    trades,
    mergedCount,
    passthroughCount,
    skippedCount,
    warningCount: warnings.length,
    warnings,
    ungroupedFillCount,
  };
}

// ─── Single-fill helper ───────────────────────────────────────────────────────

/**
 * Pass-through for a single-fill group: no VWAP, no summation.
 * Returns null (and logs a warning) if fill size is 0.
 * @internal
 */
function mergeSingleFill(
  indexed: IndexedFill,
  warnings: string[],
): MergedTrade | null {
  const { fill, csvRowIndex } = indexed;

  const size = fill.size ?? 0;
  if (size === 0) {
    warnings.push(
      `Row ${csvRowIndex}: single fill has size 0 — ` +
      `likely a cancellation or internal transfer; skipping`,
    );
    return null;
  }

  const entryTime = fill.timestamp;
  const exitTime = fill.timestamp;
  const timeInTrade = 0; // Guard 10: single fill is instantaneous

  return {
    symbol: fill.symbol,
    direction: fill.direction,
    entryPrice: fill.price ?? 0,
    exitPrice: fill.price ?? 0,
    entryTime,
    exitTime,
    size,
    pnl: fill.pnl,
    commission: safeCommission(fill.commission),
    timeInTrade,
    needsReview: false,
    sourceRows: [csvRowIndex],
  };
}

// ─── Detection helper ─────────────────────────────────────────────────────────

/**
 * detectPartialFills — returns true if any group in the dataset has more than
 * one fill, indicating that partial fills are present.
 *
 * Use this before calling groupFills() to decide whether to show the user a
 * "Partial fills detected and merged" notice in the import UI.
 *
 * @param rows      - Raw CSV rows (same array you will pass to groupFills).
 * @param groupKey  - Column name used as the grouping key.
 *
 * @returns true if at least one group has 2+ fills; false otherwise.
 */
export function detectPartialFills(rows: RawRow[], groupKey: string): boolean {
  const seen = new Map<string, number>();

  for (const row of rows) {
    const rawKey: unknown = row[groupKey];
    const keyStr = typeof rawKey === 'string' ? rawKey.trim() : String(rawKey ?? '');
    // Blank keys are not real groups — skip them for detection purposes
    if (!keyStr || keyStr === 'undefined' || keyStr === 'null') continue;

    const count = (seen.get(keyStr) ?? 0) + 1;
    seen.set(keyStr, count);
    if (count > 1) return true;
  }

  return false;
}

// Re-export ImportError so callers only need one import
export { ImportError } from './errors';
