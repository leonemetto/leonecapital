import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * A trade date is a calendar date with no timezone. Never parse a date-only
 * string with `new Date("2026-06-11")` — that resolves to UTC midnight and
 * renders a day early for users west of UTC. Parse the parts as local instead.
 * Handles "YYYY-MM", "YYYY-MM-DD", and "YYYY-MM-DDTHH:..." inputs.
 */
export function parseLocalDate(value: string): Date {
  const [datePart] = value.split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/** Local calendar date as "YYYY-MM-DD" — the inverse of parseLocalDate. */
export function todayLocal(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
