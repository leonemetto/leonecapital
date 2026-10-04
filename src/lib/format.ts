// Number formatting shared across the app. Negatives use a true minus sign so
// columns of figures align and read cleanly in the mono face.

const MINUS = '−';

export function fmtMoney(value: number, digits = 0): string {
  const abs = Math.abs(value).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  return `${value < 0 ? MINUS : ''}$${abs}`;
}

/** Always carries a sign: +$120, −$45, $0. */
export function fmtSignedMoney(value: number, digits = 0): string {
  const abs = Math.abs(value).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  if (value > 0) return `+$${abs}`;
  if (value < 0) return `${MINUS}$${abs}`;
  return `$${abs}`;
}

export function fmtR(value: number | undefined | null, digits = 1): string {
  if (value == null || Number.isNaN(value)) return '—';
  const abs = Math.abs(value).toFixed(digits);
  if (value > 0) return `+${abs}R`;
  if (value < 0) return `${MINUS}${abs}R`;
  return `${abs}R`;
}

export function fmtPct(value: number, digits = 0): string {
  return `${value.toFixed(digits)}%`;
}

export function fmtSignedPct(value: number, digits = 1): string {
  const abs = Math.abs(value).toFixed(digits);
  if (value > 0) return `+${abs}%`;
  if (value < 0) return `${MINUS}${abs}%`;
  return `${abs}%`;
}

export type Tone = 'pos' | 'neg' | 'flat';

export function toneOf(value: number): Tone {
  return value > 0 ? 'pos' : value < 0 ? 'neg' : 'flat';
}

export const TONE_CLASS: Record<Tone, string> = {
  pos: 'text-ef-pos',
  neg: 'text-ef-neg',
  flat: 'text-ef-ink-3',
};
