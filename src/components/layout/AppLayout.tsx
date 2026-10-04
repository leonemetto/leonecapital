import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
  /** Optional column pinned to the right of the page on wide screens. */
  rail?: ReactNode;
  /** Narrower measure for forms and settings. */
  width?: 'wide' | 'narrow';
}

/**
 * Page container. The sidebar, top bar and panels live in AppShell, which
 * wraps the routes once; this only sets the page's measure and padding.
 */
export function AppLayout({ children, rail, width = 'wide' }: AppLayoutProps) {
  return (
    <div className="flex min-w-0">
      <div
        className={cn(
          'mx-auto w-full min-w-0 px-4 pb-28 pt-6 md:px-6 lg:pb-12 lg:pt-7',
          width === 'narrow' ? 'max-w-[1040px]' : 'max-w-[1440px]',
        )}
      >
        {children}
      </div>
      {rail && (
        <aside className="sticky top-[52px] hidden h-[calc(100dvh-52px)] w-[300px] shrink-0 overflow-y-auto border-l border-ef-line xl:block">
          {rail}
        </aside>
      )}
    </div>
  );
}
