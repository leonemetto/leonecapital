import { startOfYear, subDays, format } from 'date-fns';
import type { Trade } from '@/types/trade';

export type RangeKey = 'week' | 'month' | 'quarter' | 'year' | 'all';

export const RANGE_OPTIONS: { key: RangeKey; label: string; short: string }[] = [
  { key: 'week', label: 'Last 7 days', short: '7d' },
  { key: 'month', label: 'Last 30 days', short: '30d' },
  { key: 'quarter', label: 'Last 90 days', short: '90d' },
  { key: 'year', label: 'This year', short: 'YTD' },
  { key: 'all', label: 'All time', short: 'All' },
];

export function rangeLabel(key: RangeKey): string {
  return RANGE_OPTIONS.find(o => o.key === key)?.label ?? 'All time';
}

const iso = (d: Date) => format(d, 'yyyy-MM-dd');

/**
 * Inclusive start date ("YYYY-MM-DD") for a range, or null for all time.
 * The short ranges roll with today, so the view is never empty on the first
 * day of a week or month and each has a previous period of equal length.
 */
export function rangeStart(key: RangeKey, now = new Date()): string | null {
  switch (key) {
    case 'week': return iso(subDays(now, 6));
    case 'month': return iso(subDays(now, 29));
    case 'quarter': return iso(subDays(now, 89));
    case 'year': return iso(startOfYear(now));
    default: return null;
  }
}

/** The window of equal length immediately before the current range. */
export function previousWindow(key: RangeKey, now = new Date()): { start: string; end: string } | null {
  const start = rangeStart(key, now);
  if (!start) return null;
  const startDate = new Date(`${start}T00:00:00`);
  const days = Math.max(1, Math.round((now.getTime() - startDate.getTime()) / 86_400_000) + 1);
  return { start: iso(subDays(startDate, days)), end: iso(subDays(startDate, 1)) };
}

const day = (t: Trade) => t.date.slice(0, 10);

// Trade dates are plain calendar dates, so string comparison is exact and
// avoids the timezone drift of Date parsing.
export function filterByRange(trades: Trade[], key: RangeKey, now = new Date()): Trade[] {
  const start = rangeStart(key, now);
  if (!start) return trades;
  return trades.filter(t => day(t) >= start);
}

export function filterByWindow(trades: Trade[], start: string, end: string): Trade[] {
  return trades.filter(t => day(t) >= start && day(t) <= end);
}
