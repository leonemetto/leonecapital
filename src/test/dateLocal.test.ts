import { describe, it, expect } from 'vitest';
import { parseLocalDate, todayLocal } from '@/lib/utils';

// Regression for the "trade dates show one day early" bug.
// A trade date is a calendar date with no timezone. Parsing a date-only
// string with `new Date("2026-06-11")` resolves to UTC midnight, which
// renders a day early for users west of UTC. These tests assert that
// parseLocalDate keeps the calendar day stable regardless of local TZ.
describe('parseLocalDate', () => {
  it('keeps the calendar day for a date-only string', () => {
    const d = parseLocalDate('2026-06-11');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(5); // June (0-indexed)
    expect(d.getDate()).toBe(11);
  });

  it('does not shift the day the way new Date() would in a west-of-UTC TZ', () => {
    // The buggy path: new Date("2026-06-11") is UTC midnight, so in a
    // negative-offset TZ the local date is the 10th. parseLocalDate must
    // still report the 11th.
    const local = parseLocalDate('2026-06-11');
    const label = local.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    expect(label).toBe('Jun 11');
  });

  it('ignores a time component', () => {
    const d = parseLocalDate('2026-06-11T14:30:00');
    expect(d.getDate()).toBe(11);
    expect(d.getMonth()).toBe(5);
  });

  it('handles a month-only key (YYYY-MM) used by the monthly equity axis', () => {
    const d = parseLocalDate('2026-06');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(5);
    expect(d.getDate()).toBe(1);
  });
});

describe('todayLocal', () => {
  it('returns a YYYY-MM-DD string matching the local calendar date', () => {
    const s = todayLocal();
    expect(s).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const now = new Date();
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    expect(s).toBe(expected);
  });

  it('round-trips through parseLocalDate to the same calendar day', () => {
    const d = parseLocalDate(todayLocal());
    const now = new Date();
    expect(d.getDate()).toBe(now.getDate());
    expect(d.getMonth()).toBe(now.getMonth());
  });
});
