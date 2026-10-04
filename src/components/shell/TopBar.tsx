import { List, MagnifyingGlass, Compass } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useShell } from './ShellContext';
import { SessionStrip } from './SessionStrip';
import { MOD_KEY } from './Sidebar';

export function TopBar() {
  const { setMobileNavOpen, setPaletteOpen, atlasOpen, openAtlas, closeAtlas } = useShell();

  return (
    <div
      className="sticky top-0 z-30 flex h-[52px] shrink-0 items-center gap-2 border-b border-ef-line px-4 md:px-6"
      style={{ background: 'color-mix(in oklab, var(--ef-bg) 88%, transparent)', backdropFilter: 'blur(12px)' }}
    >
      <button
        type="button"
        onClick={() => setMobileNavOpen(true)}
        aria-label="Open menu"
        className="ef-btn ef-btn-ghost w-9 px-0 lg:hidden"
      >
        <List className="h-[18px] w-[18px]" />
      </button>

      <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        className="ef-focus group flex h-9 min-w-0 flex-1 items-center gap-2 rounded-control border border-ef-line bg-ef-elev px-3 text-left transition-colors hover:border-ef-line-strong sm:max-w-[340px]"
      >
        <MagnifyingGlass className="h-3.5 w-3.5 shrink-0 text-ef-ink-4" />
        <span className="flex-1 truncate text-[13px] text-ef-ink-4 group-hover:text-ef-ink-3">Search or jump to…</span>
        <span className="hidden items-center gap-0.5 sm:flex">
          <kbd className="ef-kbd">{MOD_KEY}</kbd>
          <kbd className="ef-kbd">K</kbd>
        </span>
      </button>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <SessionStrip />
        <button
          type="button"
          onClick={() => (atlasOpen ? closeAtlas() : openAtlas())}
          aria-pressed={atlasOpen}
          aria-label="Ask Atlas"
          className={cn('ef-btn w-9 px-0 sm:w-auto sm:px-3', atlasOpen ? 'ef-btn-primary' : 'ef-btn-secondary')}
        >
          <Compass className="h-4 w-4" weight={atlasOpen ? 'fill' : 'regular'} />
          <span className="hidden sm:inline">Atlas</span>
        </button>
      </div>
    </div>
  );
}
