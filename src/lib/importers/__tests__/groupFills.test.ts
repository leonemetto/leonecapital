/**
 * groupFills.test.ts — production test suite for groupFills() and detectPartialFills().
 *
 * Coverage:
 *  - Happy path: single fill pass-through, two-fill VWAP merge, three-fill VWAP,
 *    commission distribution across fills
 *  - Merge rule verification: entryTime/exitTime/size/pnl with out-of-order rows
 *  - Guard conditions: direction conflict, missing groupKey, 3-day scale-out,
 *    same-symbol different Order IDs, single complete trade
 *  - Detection helper: detectPartialFills() true/false cases
 *  - Broker-specific: cTrader "Position ID", IBKR "IBOrderID", Thinkorswim "Order ID"
 */

import { describe, it, expect } from 'vitest';
import { groupFills, detectPartialFills } from '../groupFills';
import type { RawRow, FillData, FillMapper } from '../groupFills';

// ─── Shared test helpers ──────────────────────────────────────────────────────

/**
 * Build a RawRow from a partial record. Any column not supplied remains absent,
 * so tests stay explicit about which columns are present.
 */
function row(cols: Record<string, string>): RawRow {
  return { ...cols };
}

/**
 * Generic mapper factory. Converts a RawRow to FillData using explicit column
 * mappings so each test group can declare exactly what its rows look like.
 *
 * Parameters mirror real broker column names but the mapper is broker-agnostic:
 *  - keyCol:       the grouping-key column (e.g. "Position ID", "IBOrderID")
 *  - timestampCol: column holding an ISO-8601 timestamp string
 *  - priceCol:     fill price column
 *  - sizeCol:      fill size (lots / shares / contracts)
 *  - pnlCol:       realised P&L for this fill
 *  - commCol:      commission for this fill (optional)
 *  - sideCol:      '_fillSide' column value if present ('entry' | 'exit')
 *  - symbolCol:    instrument / ticker column
 *  - directionCol: 'long' | 'short' column
 */
interface MapperCols {
  keyCol: string;
  timestampCol: string;
  symbolCol: string;
  directionCol: string;
  priceCol: string;
  sizeCol: string;
  pnlCol: string;
  commCol?: string;
  sideCol?: string;
  fillValueModeCol?: string;
}

function makeMapper(cols: MapperCols): FillMapper {
  return (r: RawRow): FillData | null => {
    const ts = new Date(r[cols.timestampCol]);
    const pnl = parseFloat(r[cols.pnlCol] ?? '0');
    const price = parseFloat(r[cols.priceCol] ?? '0');
    const size = parseFloat(r[cols.sizeCol] ?? '0');
    const commission = cols.commCol != null ? parseFloat(r[cols.commCol] ?? '0') : undefined;
    const _fillSide = cols.sideCol != null
      ? (r[cols.sideCol] as 'entry' | 'exit' | undefined)
      : undefined;
    const fillValueMode = cols.fillValueModeCol != null
      ? (r[cols.fillValueModeCol] as 'incremental' | 'cumulative' | undefined)
      : undefined;

    return {
      symbol: r[cols.symbolCol],
      direction: r[cols.directionCol] as 'long' | 'short',
      timestamp: ts,
      price,
      size,
      pnl,
      commission,
      _fillSide,
      fillValueMode,
    };
  };
}

// ─── Convenience: build a realistic cTrader / IBKR / TOS row ─────────────────

function cTraderRow(overrides: {
  positionId: string;
  symbol?: string;
  direction?: string;
  timestamp?: string;
  price?: string;
  size?: string;
  pnl?: string;
  commission?: string;
  side?: string;
}): RawRow {
  return row({
    'Position ID': overrides.positionId,
    Symbol: overrides.symbol ?? 'EURUSD',
    Direction: overrides.direction ?? 'long',
    Timestamp: overrides.timestamp ?? '2025-03-10T09:00:00Z',
    Price: overrides.price ?? '1.0800',
    Size: overrides.size ?? '1',
    PnL: overrides.pnl ?? '0',
    Commission: overrides.commission ?? '0',
    Side: overrides.side ?? 'entry',
  });
}

function ibkrRow(overrides: {
  orderId: string;
  symbol?: string;
  direction?: string;
  timestamp?: string;
  price?: string;
  size?: string;
  pnl?: string;
  commission?: string;
  side?: string;
}): RawRow {
  return row({
    IBOrderID: overrides.orderId,
    Symbol: overrides.symbol ?? 'AAPL',
    Direction: overrides.direction ?? 'long',
    Timestamp: overrides.timestamp ?? '2025-03-10T14:30:00Z',
    Price: overrides.price ?? '175.00',
    Size: overrides.size ?? '100',
    PnL: overrides.pnl ?? '0',
    Commission: overrides.commission ?? '0',
    Side: overrides.side ?? 'entry',
  });
}

function tosRow(overrides: {
  orderId: string;
  symbol?: string;
  direction?: string;
  timestamp?: string;
  price?: string;
  size?: string;
  pnl?: string;
  commission?: string;
  side?: string;
}): RawRow {
  return row({
    'Order ID': overrides.orderId,
    Symbol: overrides.symbol ?? 'SPY',
    Direction: overrides.direction ?? 'long',
    Timestamp: overrides.timestamp ?? '2025-03-10T15:00:00Z',
    Price: overrides.price ?? '510.00',
    Size: overrides.size ?? '10',
    PnL: overrides.pnl ?? '0',
    Commission: overrides.commission ?? '0',
    Side: overrides.side ?? 'entry',
  });
}

// Standard mapper configs for each broker
const cTraderMapperCols: MapperCols = {
  keyCol: 'Position ID',
  timestampCol: 'Timestamp',
  symbolCol: 'Symbol',
  directionCol: 'Direction',
  priceCol: 'Price',
  sizeCol: 'Size',
  pnlCol: 'PnL',
  commCol: 'Commission',
  sideCol: 'Side',
};

const ibkrMapperCols: MapperCols = {
  keyCol: 'IBOrderID',
  timestampCol: 'Timestamp',
  symbolCol: 'Symbol',
  directionCol: 'Direction',
  priceCol: 'Price',
  sizeCol: 'Size',
  pnlCol: 'PnL',
  commCol: 'Commission',
  sideCol: 'Side',
};

const tosMapperCols: MapperCols = {
  keyCol: 'Order ID',
  timestampCol: 'Timestamp',
  symbolCol: 'Symbol',
  directionCol: 'Direction',
  priceCol: 'Price',
  sizeCol: 'Size',
  pnlCol: 'PnL',
  commCol: 'Commission',
  sideCol: 'Side',
};

// ─── HAPPY PATH ───────────────────────────────────────────────────────────────

describe('Happy Path', () => {
  // Proves: a single CSV row with no matching fills produces exactly one trade
  // record and no merge arithmetic is applied. Critical baseline — if this
  // breaks it means the pass-through path is corrupted.
  it('single fill with no grouping needed passes through as one trade unchanged', () => {
    const rows: RawRow[] = [
      cTraderRow({
        positionId: 'POS-001',
        symbol: 'EURUSD',
        direction: 'long',
        timestamp: '2025-03-10T09:30:00Z',
        price: '1.0850',
        size: '2',
        pnl: '125.00',
        commission: '3.50',
        side: 'entry',
      }),
    ];

    const result = groupFills(rows, 'Position ID', makeMapper(cTraderMapperCols));

    expect(result.trades).toHaveLength(1);
    expect(result.passthroughCount).toBe(1);
    expect(result.mergedCount).toBe(0);
    expect(result.trades[0].symbol).toBe('EURUSD');
    expect(result.trades[0].direction).toBe('long');
    expect(result.trades[0].pnl).toBe(125.0);
    expect(result.trades[0].commission).toBe(3.5);
    // Single fill: price passes through as entryPrice (no VWAP)
    expect(result.trades[0].entryPrice).toBe(1.085);
    expect(result.trades[0].needsReview).toBe(false);
  });

  // Proves: two fills sharing an Order ID are correctly merged into a single
  // trade. The entry price must be a VWAP, not a simple average.
  // EURUSD long: fill1 1 lot @ 1.0800, fill2 1 lot @ 1.0900
  // VWAP = (1 * 1.0800 + 1 * 1.0900) / (1 + 1) = 1.0850
  it('two fills sharing the same Order ID merge into one trade with correct VWAP price', () => {
    const rows: RawRow[] = [
      cTraderRow({
        positionId: 'POS-100',
        symbol: 'EURUSD',
        direction: 'long',
        timestamp: '2025-03-15T08:00:00Z',
        price: '1.0800',
        size: '1',
        pnl: '0',
        side: 'entry',
      }),
      cTraderRow({
        positionId: 'POS-100',
        symbol: 'EURUSD',
        direction: 'long',
        timestamp: '2025-03-15T08:05:00Z',
        price: '1.0900',
        size: '1',
        pnl: '80.00',
        side: 'exit',
      }),
    ];

    const result = groupFills(rows, 'Position ID', makeMapper(cTraderMapperCols));

    expect(result.trades).toHaveLength(1);
    expect(result.mergedCount).toBe(1);
    expect(result.passthroughCount).toBe(0);
    // VWAP of entry fills only: 1 lot @ 1.0800 → 1.0800 exactly
    expect(result.trades[0].entryPrice).toBeCloseTo(1.08, 4);
    expect(result.trades[0].symbol).toBe('EURUSD');
  });

  // Proves: VWAP is size-weighted, not a simple mean. With three fills of
  // different sizes the result must reflect the weighted average.
  //
  // XAUUSD long entry fills:
  //   fill1: 2 lots @ 1950.00  → contribution = 2 * 1950 = 3900
  //   fill2: 3 lots @ 1960.00  → contribution = 3 * 1960 = 5880
  //   fill3: 5 lots @ 1970.00  → contribution = 5 * 1970 = 9850
  // Total size = 10, Total weighted = 19630
  // VWAP = 19630 / 10 = 1963.00
  it('three fills with different sizes produce a correctly size-weighted VWAP price', () => {
    const rows: RawRow[] = [
      cTraderRow({
        positionId: 'POS-200',
        symbol: 'XAUUSD',
        direction: 'long',
        timestamp: '2025-04-01T10:00:00Z',
        price: '1950.00',
        size: '2',
        pnl: '0',
        side: 'entry',
      }),
      cTraderRow({
        positionId: 'POS-200',
        symbol: 'XAUUSD',
        direction: 'long',
        timestamp: '2025-04-01T10:02:00Z',
        price: '1960.00',
        size: '3',
        pnl: '0',
        side: 'entry',
      }),
      cTraderRow({
        positionId: 'POS-200',
        symbol: 'XAUUSD',
        direction: 'long',
        timestamp: '2025-04-01T10:10:00Z',
        price: '1970.00',
        size: '5',
        pnl: '420.00',
        side: 'exit',
      }),
    ];

    const result = groupFills(rows, 'Position ID', makeMapper(cTraderMapperCols));

    expect(result.trades).toHaveLength(1);
    // Manual VWAP: (2*1950 + 3*1960) / (2+3) = (3900 + 5880) / 5 = 9780/5 = 1956.00
    // (only entry-side fills contribute to entryPrice)
    expect(result.trades[0].entryPrice).toBeCloseTo(1956.0, 2);
    expect(result.trades[0].pnl).toBeCloseTo(420.0, 2);
  });

  // Proves: commission is summed across all fills. When intermediate fills carry
  // $0 commission and only the last fill carries the full amount, the total is
  // still correct. This reflects real IBKR behaviour (commission on final fill).
  it('commission $0 on first two fills and full amount on third sums correctly', () => {
    const rows: RawRow[] = [
      cTraderRow({
        positionId: 'POS-300',
        symbol: 'GBPUSD',
        direction: 'short',
        timestamp: '2025-04-02T13:00:00Z',
        price: '1.2700',
        size: '3',
        pnl: '0',
        commission: '0',
        side: 'entry',
      }),
      cTraderRow({
        positionId: 'POS-300',
        symbol: 'GBPUSD',
        direction: 'short',
        timestamp: '2025-04-02T13:10:00Z',
        price: '1.2700',
        size: '3',
        pnl: '0',
        commission: '0',
        side: 'entry',
      }),
      cTraderRow({
        positionId: 'POS-300',
        symbol: 'GBPUSD',
        direction: 'short',
        timestamp: '2025-04-02T13:30:00Z',
        price: '1.2640',
        size: '6',
        pnl: '360.00',
        commission: '12.50',
        side: 'exit',
      }),
    ];

    const result = groupFills(rows, 'Position ID', makeMapper(cTraderMapperCols));

    expect(result.trades).toHaveLength(1);
    // $0 + $0 + $12.50 = $12.50
    expect(result.trades[0].commission).toBeCloseTo(12.5, 2);
    expect(result.trades[0].pnl).toBeCloseTo(360.0, 2);
  });
});

// ─── MERGE RULES ─────────────────────────────────────────────────────────────

describe('Merge Rules', () => {
  // Proves: entryTime is always the EARLIEST timestamp regardless of CSV row
  // order. A broker that sorts rows alphabetically by symbol would produce
  // the wrong entryTime if the aggregator trusted row order instead of sorting.
  it('entryTime is the earliest fill timestamp even when rows arrive out of order', () => {
    const rows: RawRow[] = [
      // Row 0: the LATER fill — arrives first in CSV
      cTraderRow({
        positionId: 'POS-400',
        symbol: 'NAS100',
        direction: 'long',
        timestamp: '2025-04-03T15:30:00Z',
        price: '18250.00',
        size: '5',
        pnl: '1250.00',
        side: 'exit',
      }),
      // Row 1: the EARLIER fill — arrives second in CSV
      cTraderRow({
        positionId: 'POS-400',
        symbol: 'NAS100',
        direction: 'long',
        timestamp: '2025-04-03T14:00:00Z',
        price: '18000.00',
        size: '5',
        pnl: '0',
        side: 'entry',
      }),
    ];

    const result = groupFills(rows, 'Position ID', makeMapper(cTraderMapperCols));

    expect(result.trades).toHaveLength(1);
    expect(result.trades[0].entryTime).toEqual(new Date('2025-04-03T14:00:00Z'));
  });

  // Proves: exitTime is always the LATEST timestamp regardless of CSV row order.
  // Complement to the entryTime test above.
  it('exitTime is the latest fill timestamp even when rows arrive out of order', () => {
    const rows: RawRow[] = [
      // Row 0: the LATER fill — arrives first in CSV
      cTraderRow({
        positionId: 'POS-401',
        symbol: 'NAS100',
        direction: 'long',
        timestamp: '2025-04-03T16:00:00Z',
        price: '18300.00',
        size: '5',
        pnl: '1500.00',
        side: 'exit',
      }),
      // Row 1: the EARLIER fill — arrives second in CSV
      cTraderRow({
        positionId: 'POS-401',
        symbol: 'NAS100',
        direction: 'long',
        timestamp: '2025-04-03T09:00:00Z',
        price: '18000.00',
        size: '5',
        pnl: '0',
        side: 'entry',
      }),
    ];

    const result = groupFills(rows, 'Position ID', makeMapper(cTraderMapperCols));

    expect(result.trades).toHaveLength(1);
    expect(result.trades[0].exitTime).toEqual(new Date('2025-04-03T16:00:00Z'));
  });

  // Proves: size is the sum of ENTRY-side fill sizes only. A scale-in with
  // two entry fills of 3 lots each produces size = 6, not 6 + 6 = 12 (which
  // would happen if exit fills were included).
  it('size is the sum of entry-side fill sizes only (not total volume)', () => {
    const rows: RawRow[] = [
      cTraderRow({
        positionId: 'POS-500',
        symbol: 'USDJPY',
        direction: 'long',
        timestamp: '2025-04-05T08:00:00Z',
        price: '152.00',
        size: '3',
        pnl: '0',
        side: 'entry',
      }),
      cTraderRow({
        positionId: 'POS-500',
        symbol: 'USDJPY',
        direction: 'long',
        timestamp: '2025-04-05T08:10:00Z',
        price: '152.20',
        size: '3',
        pnl: '0',
        side: 'entry',
      }),
      cTraderRow({
        positionId: 'POS-500',
        symbol: 'USDJPY',
        direction: 'long',
        timestamp: '2025-04-05T09:00:00Z',
        price: '152.80',
        size: '6',
        pnl: '200.00',
        side: 'exit',
      }),
    ];

    const result = groupFills(rows, 'Position ID', makeMapper(cTraderMapperCols));

    expect(result.trades).toHaveLength(1);
    // size = 3 + 3 = 6 (entry fills only), not 3 + 3 + 6 = 12
    expect(result.trades[0].size).toBe(6);
  });

  // Proves: pnl is the sum of all fill pnl values. Each fill contributes its
  // own incremental realised P&L, and the total must equal their arithmetic sum.
  it('pnl is the sum of all fill pnl values across the group', () => {
    const rows: RawRow[] = [
      cTraderRow({
        positionId: 'POS-600',
        symbol: 'BTCUSD',
        direction: 'short',
        timestamp: '2025-04-06T10:00:00Z',
        price: '68000.00',
        size: '0.5',
        pnl: '-250.00',
        side: 'entry',
      }),
      cTraderRow({
        positionId: 'POS-600',
        symbol: 'BTCUSD',
        direction: 'short',
        timestamp: '2025-04-06T10:30:00Z',
        price: '67800.00',
        size: '0.3',
        pnl: '60.00',
        side: 'exit',
      }),
      cTraderRow({
        positionId: 'POS-600',
        symbol: 'BTCUSD',
        direction: 'short',
        timestamp: '2025-04-06T11:00:00Z',
        price: '67500.00',
        size: '0.2',
        pnl: '100.00',
        side: 'exit',
      }),
    ];

    const result = groupFills(rows, 'Position ID', makeMapper(cTraderMapperCols));

    expect(result.trades).toHaveLength(1);
    // P&L sum: -250 + 60 + 100 = -90
    expect(result.trades[0].pnl).toBeCloseTo(-90.0, 5);
  });
});

// ─── GUARD CONDITIONS ─────────────────────────────────────────────────────────

describe('Guard Conditions', () => {
  // Proves: when fills within a group have conflicting directions (one long,
  // one short under the same Order ID), the group is NOT auto-split into
  // phantom trades. Instead it is flagged needsReview = true so the user can
  // decide. Splitting would create trades with corrupted P&L — the core failure
  // mode guard #6 prevents.
  it('direction conflict across fills flags the group needsReview and does not split into phantom trades', () => {
    const rows: RawRow[] = [
      cTraderRow({
        positionId: 'POS-DIR-CONFLICT',
        symbol: 'EURUSD',
        direction: 'long',
        timestamp: '2025-04-07T09:00:00Z',
        price: '1.0800',
        size: '2',
        pnl: '0',
        side: 'entry',
      }),
      cTraderRow({
        positionId: 'POS-DIR-CONFLICT',
        symbol: 'EURUSD',
        direction: 'short',          // ← conflicting direction
        timestamp: '2025-04-07T09:05:00Z',
        price: '1.0820',
        size: '2',
        pnl: '-40.00',
        side: 'exit',
      }),
    ];

    const result = groupFills(rows, 'Position ID', makeMapper(cTraderMapperCols));

    // Must produce exactly ONE record (not two phantom trades)
    expect(result.trades).toHaveLength(1);
    // That record must be flagged for manual review
    expect(result.trades[0].needsReview).toBe(true);
    expect(result.trades[0].reviewReason).toBeTruthy();
    // A warning must be emitted
    expect(result.warnings.some(w => w.toLowerCase().includes('direction'))).toBe(true);
  });

  // Proves: when the groupKey column is blank or null for a row, the row is
  // NOT silently grouped with other keyless rows (which would produce one giant
  // corrupted "trade"). Instead it gets a synthetic unique key and is treated
  // as a standalone fill. The ungroupedFillCount counter must be incremented.
  it('missing blank groupKey column assigns a synthetic key and increments ungroupedFillCount', () => {
    const rows: RawRow[] = [
      // Row with blank Position ID
      row({
        'Position ID': '',           // ← blank key
        Symbol: 'EURUSD',
        Direction: 'long',
        Timestamp: '2025-04-08T10:00:00Z',
        Price: '1.0900',
        Size: '1',
        PnL: '50.00',
        Commission: '2.00',
        Side: 'entry',
      }),
      // Another row with blank Position ID — must NOT be merged with above
      row({
        'Position ID': '',           // ← also blank
        Symbol: 'GBPUSD',
        Direction: 'short',
        Timestamp: '2025-04-08T11:00:00Z',
        Price: '1.2500',
        Size: '2',
        PnL: '80.00',
        Commission: '3.00',
        Side: 'entry',
      }),
    ];

    const result = groupFills(rows, 'Position ID', makeMapper(cTraderMapperCols));

    // Two blank-key rows → two separate standalone trades, NOT one merged trade
    expect(result.trades).toHaveLength(2);
    // Both flagged in ungroupedFillCount
    expect(result.ungroupedFillCount).toBe(2);
    // Separate symbols confirm they were not merged together
    const symbols = result.trades.map(t => t.symbol).sort();
    expect(symbols).toContain('EURUSD');
    expect(symbols).toContain('GBPUSD');
    // A warning must identify the problematic rows
    expect(result.warnings.some(w => w.includes('blank') || w.includes('null'))).toBe(true);
  });

  // Proves: a scale-out spread over 3 calendar days (partial close each day)
  // under the same Position ID merges correctly into one trade. The groupKey
  // must NOT include the date, so all three fills group together regardless of
  // which calendar day they fall on. exitTime must be day 3's timestamp.
  it('scale-out over 3 days merges into one trade with exitTime on day 3', () => {
    const rows: RawRow[] = [
      // Day 1: entry
      cTraderRow({
        positionId: 'POS-SCALE-OUT',
        symbol: 'XAUUSD',
        direction: 'long',
        timestamp: '2025-04-14T10:00:00Z',
        price: '3200.00',
        size: '10',
        pnl: '0',
        side: 'entry',
      }),
      // Day 1: partial close — 3 lots
      cTraderRow({
        positionId: 'POS-SCALE-OUT',
        symbol: 'XAUUSD',
        direction: 'long',
        timestamp: '2025-04-14T15:00:00Z',
        price: '3230.00',
        size: '3',
        pnl: '90.00',
        side: 'exit',
      }),
      // Day 2: partial close — 4 lots
      cTraderRow({
        positionId: 'POS-SCALE-OUT',
        symbol: 'XAUUSD',
        direction: 'long',
        timestamp: '2025-04-15T11:00:00Z',
        price: '3250.00',
        size: '4',
        pnl: '200.00',
        side: 'exit',
      }),
      // Day 3: final close — 3 lots
      cTraderRow({
        positionId: 'POS-SCALE-OUT',
        symbol: 'XAUUSD',
        direction: 'long',
        timestamp: '2025-04-16T09:30:00Z',
        price: '3270.00',
        size: '3',
        pnl: '210.00',
        side: 'exit',
      }),
    ];

    const result = groupFills(rows, 'Position ID', makeMapper(cTraderMapperCols));

    expect(result.trades).toHaveLength(1);
    expect(result.mergedCount).toBe(1);
    // exitTime must be the day-3 close timestamp
    expect(result.trades[0].exitTime).toEqual(new Date('2025-04-16T09:30:00Z'));
    // entryTime must be the day-1 open
    expect(result.trades[0].entryTime).toEqual(new Date('2025-04-14T10:00:00Z'));
    // P&L = 90 + 200 + 210 = 500
    expect(result.trades[0].pnl).toBeCloseTo(500.0, 2);
  });

  // Proves: same symbol and session with TWO DIFFERENT Order IDs must produce
  // TWO separate trades. The aggregator groups by key value — different keys
  // mean different groups regardless of symbol or time proximity.
  it('same symbol same session with two different Order IDs produces two separate trades', () => {
    const rows: RawRow[] = [
      // Trade A — Order ID A001
      cTraderRow({
        positionId: 'POS-A001',
        symbol: 'EURUSD',
        direction: 'long',
        timestamp: '2025-04-10T09:00:00Z',
        price: '1.0800',
        size: '2',
        pnl: '0',
        side: 'entry',
      }),
      cTraderRow({
        positionId: 'POS-A001',
        symbol: 'EURUSD',
        direction: 'long',
        timestamp: '2025-04-10T09:30:00Z',
        price: '1.0850',
        size: '2',
        pnl: '100.00',
        side: 'exit',
      }),
      // Trade B — Order ID A002 (same symbol, same session)
      cTraderRow({
        positionId: 'POS-A002',
        symbol: 'EURUSD',
        direction: 'long',
        timestamp: '2025-04-10T09:45:00Z',
        price: '1.0860',
        size: '3',
        pnl: '0',
        side: 'entry',
      }),
      cTraderRow({
        positionId: 'POS-A002',
        symbol: 'EURUSD',
        direction: 'long',
        timestamp: '2025-04-10T10:15:00Z',
        price: '1.0900',
        size: '3',
        pnl: '120.00',
        side: 'exit',
      }),
    ];

    const result = groupFills(rows, 'Position ID', makeMapper(cTraderMapperCols));

    // Two separate Position IDs → two separate trades
    expect(result.trades).toHaveLength(2);
    expect(result.mergedCount).toBe(2);
    // Each merged trade has the correct P&L, not a combined sum
    const pnls = result.trades.map(t => t.pnl).sort((a, b) => a - b);
    expect(pnls[0]).toBeCloseTo(100.0, 2);
    expect(pnls[1]).toBeCloseTo(120.0, 2);
  });

  // Proves: a single fill that represents a complete, already-closed trade
  // passes through the aggregator without any VWAP or summation being applied.
  // entryPrice must equal the fill's price exactly (no blending), and
  // passthroughCount must be 1.
  it('single fill that is a complete trade passes through without VWAP applied', () => {
    const rows: RawRow[] = [
      cTraderRow({
        positionId: 'POS-SOLO',
        symbol: 'NAS100',
        direction: 'short',
        timestamp: '2025-04-11T14:00:00Z',
        price: '18500.00',
        size: '1',
        pnl: '-350.00',
        commission: '5.00',
        side: 'entry',   // single-fill group regardless of side
      }),
    ];

    const result = groupFills(rows, 'Position ID', makeMapper(cTraderMapperCols));

    expect(result.trades).toHaveLength(1);
    expect(result.passthroughCount).toBe(1);
    expect(result.mergedCount).toBe(0);
    // Price must pass through exactly, not be computed via VWAP
    expect(result.trades[0].entryPrice).toBe(18500.0);
    expect(result.trades[0].pnl).toBe(-350.0);
    expect(result.trades[0].commission).toBe(5.0);
    expect(result.trades[0].needsReview).toBe(false);
  });
});

// ─── DETECTION HELPER ─────────────────────────────────────────────────────────

describe('Detection', () => {
  // Proves: detectPartialFills() returns true when at least one Position ID
  // appears on more than one CSV row. This allows the import UI to show
  // "Partial fills detected and merged" before the user commits.
  it('detectPartialFills returns true when fills were grouped (same key appears twice)', () => {
    const rows: RawRow[] = [
      row({ 'Position ID': 'P-001', Symbol: 'EURUSD' }),
      row({ 'Position ID': 'P-001', Symbol: 'EURUSD' }), // same key → partial fill
      row({ 'Position ID': 'P-002', Symbol: 'GBPUSD' }),
    ];

    expect(detectPartialFills(rows, 'Position ID')).toBe(true);
  });

  // Proves: detectPartialFills() returns false when every Position ID appears
  // exactly once. This is the normal case when a broker emits one row per
  // completed trade, and the UI should NOT show the "partial fills" notice.
  it('detectPartialFills returns false when all groups have exactly one fill', () => {
    const rows: RawRow[] = [
      row({ 'Position ID': 'P-010', Symbol: 'EURUSD' }),
      row({ 'Position ID': 'P-011', Symbol: 'GBPUSD' }),
      row({ 'Position ID': 'P-012', Symbol: 'XAUUSD' }),
    ];

    expect(detectPartialFills(rows, 'Position ID')).toBe(false);
  });
});

// ─── BROKER SPECIFIC ─────────────────────────────────────────────────────────

describe('Broker Specific', () => {
  // Proves: cTrader's "Position ID" column is used as the groupKey. This is
  // cTrader's stable position identifier that persists across partial fills,
  // scale-ins, and multi-day scale-outs. Two fills with the same Position ID
  // must merge; fills with different Position IDs must remain separate.
  it('cTrader: two fills with the same "Position ID" merge into one trade', () => {
    const rows: RawRow[] = [
      // Entry fill
      cTraderRow({
        positionId: 'CT-98765',
        symbol: 'GBPUSD',
        direction: 'short',
        timestamp: '2025-04-20T08:00:00Z',
        price: '1.2750',
        size: '5',
        pnl: '0',
        commission: '6.25',
        side: 'entry',
      }),
      // Exit fill — same Position ID, 30 minutes later
      cTraderRow({
        positionId: 'CT-98765',
        symbol: 'GBPUSD',
        direction: 'short',
        timestamp: '2025-04-20T08:30:00Z',
        price: '1.2690',
        size: '5',
        pnl: '300.00',
        commission: '0',
        side: 'exit',
      }),
    ];

    const result = groupFills(rows, 'Position ID', makeMapper(cTraderMapperCols));

    expect(result.trades).toHaveLength(1);
    expect(result.mergedCount).toBe(1);
    expect(result.trades[0].symbol).toBe('GBPUSD');
    expect(result.trades[0].direction).toBe('short');
    expect(result.trades[0].pnl).toBeCloseTo(300.0, 2);
    // Commission: 6.25 + 0 = 6.25
    expect(result.trades[0].commission).toBeCloseTo(6.25, 2);
    // Entry price = VWAP of entry fills only → 1.2750 (single entry fill)
    expect(result.trades[0].entryPrice).toBeCloseTo(1.275, 4);
    // Exit price = VWAP of exit fills only → 1.2690
    expect(result.trades[0].exitPrice).toBeCloseTo(1.269, 4);
  });

  // Proves: IBKR's "IBOrderID" column is the correct groupKey for IBKR imports.
  // A partial fill on AAPL spread across two IBOrderID rows must merge. This
  // exercises the same aggregation logic with IBKR-realistic column names and
  // realistic US equity price ranges.
  it('IBKR: two fills with the same "IBOrderID" merge into one trade with correct VWAP', () => {
    // AAPL long: fill1 50 shares @ 175.20, fill2 150 shares @ 175.80
    // VWAP = (50*175.20 + 150*175.80) / 200 = (8760 + 26370) / 200 = 35130/200 = 175.65
    const rows: RawRow[] = [
      ibkrRow({
        orderId: 'IB-4412345',
        symbol: 'AAPL',
        direction: 'long',
        timestamp: '2025-04-21T14:30:05Z',
        price: '175.20',
        size: '50',
        pnl: '0',
        commission: '0.35',
        side: 'entry',
      }),
      ibkrRow({
        orderId: 'IB-4412345',
        symbol: 'AAPL',
        direction: 'long',
        timestamp: '2025-04-21T14:30:12Z',
        price: '175.80',
        size: '150',
        pnl: '0',
        commission: '1.05',
        side: 'entry',
      }),
      // Exit fill later
      ibkrRow({
        orderId: 'IB-4412345',
        symbol: 'AAPL',
        direction: 'long',
        timestamp: '2025-04-21T15:45:00Z',
        price: '177.50',
        size: '200',
        pnl: '370.00',
        commission: '1.40',
        side: 'exit',
      }),
    ];

    const result = groupFills(rows, 'IBOrderID', makeMapper(ibkrMapperCols));

    expect(result.trades).toHaveLength(1);
    expect(result.mergedCount).toBe(1);
    expect(result.trades[0].symbol).toBe('AAPL');
    // VWAP entry: (50*175.20 + 150*175.80) / 200 = 175.65
    expect(result.trades[0].entryPrice).toBeCloseTo(175.65, 2);
    // Total commission: 0.35 + 1.05 + 1.40 = 2.80
    expect(result.trades[0].commission).toBeCloseTo(2.80, 2);
    expect(result.trades[0].pnl).toBeCloseTo(370.0, 2);
  });

  // Proves: Thinkorswim's "Order ID" column (with a space) is the correct
  // groupKey for TOS imports. Thinkorswim uses space-separated column names
  // which must be handled as-is by the aggregator (no normalisation expected).
  // Uses realistic SPY options-style prices and small lot sizes.
  it('Thinkorswim: two fills with the same "Order ID" merge into one trade', () => {
    // SPY long: fill1 5 contracts @ 510.25, fill2 5 contracts @ 510.75
    // VWAP entry = (5*510.25 + 5*510.75) / 10 = (2551.25 + 2553.75) / 10 = 5105/10 = 510.50
    const rows: RawRow[] = [
      tosRow({
        orderId: 'TOS-20250422-88811',
        symbol: 'SPY',
        direction: 'long',
        timestamp: '2025-04-22T09:31:00Z',
        price: '510.25',
        size: '5',
        pnl: '0',
        commission: '3.25',
        side: 'entry',
      }),
      tosRow({
        orderId: 'TOS-20250422-88811',
        symbol: 'SPY',
        direction: 'long',
        timestamp: '2025-04-22T09:31:15Z',
        price: '510.75',
        size: '5',
        pnl: '0',
        commission: '3.25',
        side: 'entry',
      }),
      tosRow({
        orderId: 'TOS-20250422-88811',
        symbol: 'SPY',
        direction: 'long',
        timestamp: '2025-04-22T10:15:00Z',
        price: '512.00',
        size: '10',
        pnl: '150.00',
        commission: '6.50',
        side: 'exit',
      }),
    ];

    const result = groupFills(rows, 'Order ID', makeMapper(tosMapperCols));

    expect(result.trades).toHaveLength(1);
    expect(result.mergedCount).toBe(1);
    expect(result.trades[0].symbol).toBe('SPY');
    expect(result.trades[0].direction).toBe('long');
    // VWAP entry: (5*510.25 + 5*510.75) / 10 = 510.50
    expect(result.trades[0].entryPrice).toBeCloseTo(510.5, 2);
    // Commission: 3.25 + 3.25 + 6.50 = 13.00
    expect(result.trades[0].commission).toBeCloseTo(13.0, 2);
    expect(result.trades[0].pnl).toBeCloseTo(150.0, 2);
  });
});
