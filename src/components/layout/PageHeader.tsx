import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  disclaimer?: string;
  actions?: ReactNode;
  backButton?: ReactNode;
  mb?: number;
  className?: string;
}

export function PageHeader({ title, subtitle, disclaimer, actions, backButton, mb = 20, className }: PageHeaderProps) {
  return (
    <header
      className={cn('flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between', className)}
      style={{ marginBottom: mb }}
    >
      <div className="flex min-w-0 items-center gap-3">
        {backButton}
        <div className="min-w-0">
          <h1 className="m-0 text-[22px] font-medium leading-tight tracking-[-0.02em] text-ef-ink">{title}</h1>
          {subtitle && <div className="mt-1 text-[13px] leading-snug text-ef-ink-3">{subtitle}</div>}
          {disclaimer && <div className="mt-1 text-[11px] leading-snug text-ef-ink-4">{disclaimer}</div>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/* Kept as a plain wrapper so existing pages need no change. Page-level entry
   animation was removed: this is a tool opened many times a day. */
export function PageBody({ children }: { children: ReactNode; delay?: number }) {
  return <div>{children}</div>;
}
