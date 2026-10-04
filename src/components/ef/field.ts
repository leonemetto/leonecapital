// Shared control styling for the app's forms. Applied as utilities so it
// overrides the base shadcn control classes.
export const FIELD =
  'h-9 w-full rounded-control border border-ef-line bg-ef-bg px-3 text-[13px] text-ef-ink placeholder:text-ef-ink-4 ' +
  'outline-none ring-0 backdrop-blur-none transition-colors hover:border-ef-line-strong ' +
  'focus:border-ef-ink-3 focus-visible:border-ef-ink-3 focus-visible:ring-0 focus:ring-0 md:text-[13px]';

export const FIELD_LABEL = 'mb-1.5 block text-[12px] font-medium leading-none text-ef-ink-2';

/** A two-or-more way toggle button inside a form. */
export function toggleClass(active: boolean, tone: 'ink' | 'pos' | 'neg' | 'flat' = 'ink'): string {
  const on = {
    ink: 'border-transparent bg-ef-ink text-ef-bg',
    pos: 'border-transparent bg-ef-pos-wash text-ef-pos',
    neg: 'border-transparent bg-ef-neg-wash text-ef-neg',
    flat: 'border-ef-line-strong bg-ef-sunken text-ef-ink',
  }[tone];
  return [
    'ef-focus flex h-9 flex-1 items-center justify-center gap-1.5 rounded-control border text-[12.5px] font-medium transition-colors',
    active ? on : 'border-ef-line bg-transparent text-ef-ink-3 hover:border-ef-line-strong hover:text-ef-ink',
  ].join(' ');
}
