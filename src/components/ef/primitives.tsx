import type { ReactNode, CSSProperties } from 'react';
import { cn } from '@/lib/utils';

/* ─── Surface ───
   One elevated plane per band. Rows inside are separated with hairlines, not
   nested cards. */
export function Surface({
  children,
  className,
  style,
  as: Tag = 'section',
  ...rest
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  as?: 'section' | 'div' | 'article' | 'aside';
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag className={cn('ef-surface min-w-0', className)} style={style} {...rest}>
      {children}
    </Tag>
  );
}

export function SurfaceHead({
  label,
  title,
  actions,
  className,
}: {
  label?: string;
  title?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center justify-between gap-3 px-5 pt-4 pb-3', className)}>
      <div className="min-w-0">
        {label && <p className="ef-label m-0">{label}</p>}
        {title && (
          <h2 className={cn('m-0 text-[15px] font-medium leading-tight tracking-[-0.01em] text-ef-ink', label && 'mt-1.5')}>
            {title}
          </h2>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
    </div>
  );
}

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return <kbd className={cn('ef-kbd', className)}>{children}</kbd>;
}

/* ─── Segmented control ─── */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: ReactNode }[];
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn('inline-flex items-center gap-0.5 rounded-control border border-ef-line bg-ef-bg p-0.5', className)}
    >
      {options.map(o => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'ef-focus h-7 rounded-[8px] px-2.5 text-[12px] font-medium transition-colors',
              active ? 'bg-ef-elev text-ef-ink shadow-[0_0_0_1px_var(--ef-line)]' : 'text-ef-ink-3 hover:text-ef-ink',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Tabs that carry counts ─── */
export function CountTabs<T extends string>({
  value,
  onChange,
  tabs,
  ariaLabel,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  tabs: { key: T; label: string; count?: number; tone?: 'warn'; tour?: string }[];
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn('ef-scroll-quiet flex items-end gap-5 overflow-x-auto border-b border-ef-line', className)}
    >
      {tabs.map(t => {
        const active = t.key === value;
        return (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={active}
            data-tour={t.tour}
            onClick={() => onChange(t.key)}
            className={cn(
              'ef-focus relative -mb-px flex shrink-0 items-baseline gap-1.5 border-b-2 pb-2.5 pt-1 text-[13px] font-medium transition-colors',
              active ? 'border-ef-ink text-ef-ink' : 'border-transparent text-ef-ink-3 hover:text-ef-ink',
            )}
          >
            {t.label}
            {t.count != null && (
              <span
                className={cn(
                  'ef-num text-[11px]',
                  t.tone === 'warn' && t.count > 0 ? 'text-ef-warn' : active ? 'text-ef-ink-3' : 'text-ef-ink-4',
                )}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Tick meter ───
   A bar drawn as ticks, the same mark the trade tape uses. Tone follows how
   close the value is to its limit unless one is given. */
export function Meter({
  value,
  max,
  tone,
  className,
  label,
}: {
  value: number;
  max: number;
  tone?: 'ink' | 'pos' | 'warn' | 'neg';
  className?: string;
  label: string;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  const resolved = tone ?? (pct >= 100 ? 'neg' : pct >= 80 ? 'warn' : 'ink');
  const color = { ink: 'var(--ef-ink)', pos: 'var(--ef-pos)', warn: 'var(--ef-warn)', neg: 'var(--ef-neg)' }[resolved];
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(value, max)}
      className={cn('h-2 w-full overflow-hidden rounded-[2px]', className)}
      style={{ background: 'repeating-linear-gradient(90deg, var(--ef-line) 0 2px, transparent 2px 5px)' }}
    >
      <div
        className="h-full transition-[width] duration-300"
        style={{ width: `${pct}%`, background: `repeating-linear-gradient(90deg, ${color} 0 2px, transparent 2px 5px)` }}
      />
    </div>
  );
}

/* ─── Label + value pair ─── */
export function Stat({
  label,
  value,
  sub,
  tone,
  className,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: 'pos' | 'neg' | 'warn' | 'flat';
  className?: string;
}) {
  const toneClass =
    tone === 'pos' ? 'text-ef-pos' : tone === 'neg' ? 'text-ef-neg' : tone === 'warn' ? 'text-ef-warn' : 'text-ef-ink';
  return (
    <div className={cn('min-w-0', className)}>
      <p className="ef-label m-0">{label}</p>
      <p className={cn('ef-num m-0 mt-1.5 text-[18px] font-medium leading-none tracking-[-0.03em]', toneClass)}>{value}</p>
      {sub && <p className="m-0 mt-1.5 text-[11.5px] leading-tight text-ef-ink-3">{sub}</p>}
    </div>
  );
}

/* ─── Empty state ─── */
export function EmptyState({
  art,
  artAlt = '',
  title,
  body,
  children,
  className,
}: {
  art?: string;
  artAlt?: string;
  title: string;
  body?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-14 text-center', className)}>
      {art && <img src={art} alt={artAlt} className="ef-art mb-6 h-auto w-full max-w-[340px]" loading="lazy" />}
      <h2 className="m-0 max-w-md text-[18px] font-medium tracking-[-0.02em] text-ef-ink" style={{ textWrap: 'balance' }}>
        {title}
      </h2>
      {body && <p className="m-0 mt-2 max-w-[46ch] text-[13px] leading-relaxed text-ef-ink-3">{body}</p>}
      {children && <div className="mt-5 flex flex-wrap items-center justify-center gap-2">{children}</div>}
    </div>
  );
}

/* ─── Small state pill ─── */
export function Pill({
  children,
  tone = 'flat',
  className,
}: {
  children: ReactNode;
  tone?: 'pos' | 'neg' | 'warn' | 'flat';
  className?: string;
}) {
  const map = {
    pos: 'bg-ef-pos-wash text-ef-pos',
    neg: 'bg-ef-neg-wash text-ef-neg',
    warn: 'bg-ef-warn-wash text-ef-warn',
    flat: 'bg-ef-sunken text-ef-ink-3',
  } as const;
  return (
    <span className={cn('ef-num inline-flex h-5 items-center rounded-chip px-1.5 text-[10.5px] font-medium', map[tone], className)}>
      {children}
    </span>
  );
}
