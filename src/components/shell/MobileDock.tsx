import { NavLink } from 'react-router-dom';
import { Plus } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from './Sidebar';
import { useShell } from './ShellContext';

/** Thumb-reach navigation on phones: the four destinations around Log. */
export function MobileDock() {
  const { openLogTrade } = useShell();
  const [a, b, c, d] = NAV_ITEMS;

  const item = (it: (typeof NAV_ITEMS)[number]) => (
    <NavLink
      key={it.path}
      to={it.path}
      className={({ isActive }) =>
        cn(
          'ef-focus flex h-12 flex-1 flex-col items-center justify-center gap-1 rounded-control text-[9.5px] font-medium tracking-[0.02em] transition-colors',
          isActive ? 'text-ef-ink' : 'text-ef-ink-4',
        )
      }
    >
      {({ isActive }) => (
        <>
          <it.Icon className="h-[19px] w-[19px]" weight={isActive ? 'fill' : 'regular'} />
          {it.short}
        </>
      )}
    </NavLink>
  );

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-ef-line lg:hidden"
      style={{
        background: 'color-mix(in oklab, var(--ef-bg) 92%, transparent)',
        backdropFilter: 'blur(14px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="mx-auto flex max-w-md items-center gap-1 px-3 py-1.5">
        {item(a)}
        {item(b)}
        <button
          type="button"
          onClick={openLogTrade}
          aria-label="Log trade"
          className="ef-focus mx-1 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ef-ink text-ef-bg transition-transform active:scale-95"
        >
          <Plus className="h-5 w-5" weight="bold" />
        </button>
        {item(c)}
        {item(d)}
      </div>
    </nav>
  );
}
