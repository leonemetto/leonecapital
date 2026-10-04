import { useEffect, useRef, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { SandboxBanner } from '@/components/onboarding/SandboxBanner';
import { useView } from '@/contexts/ViewContext';
import { AtlasPanel } from '@/components/atlas/AtlasPanel';
import { LogTradeDialog } from '@/components/trade/LogTradeDialog';
import { TradeDrawer } from '@/components/trade/TradeDrawer';
import { DayReviewSheet } from '@/components/review/DayReviewSheet';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileDock } from './MobileDock';
import { CommandPalette } from './CommandPalette';
import { useShell } from './ShellContext';

const GO_TO: Record<string, string> = { d: '/dashboard', t: '/journal', i: '/insights', p: '/trading-plan' };

const isTyping = (el: EventTarget | null) => {
  const node = el as HTMLElement | null;
  if (!node) return false;
  return node.tagName === 'INPUT' || node.tagName === 'TEXTAREA' || node.tagName === 'SELECT' || node.isContentEditable;
};

/** Global shortcuts: ⌘K search, ⌘J Atlas, L log a trade, G then D/T/I/P to move. */
function useShortcuts() {
  const { setPaletteOpen, paletteOpen, openLogTrade, atlasOpen, openAtlas, closeAtlas } = useShell();
  const navigate = useNavigate();
  const pendingG = useRef<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const mod = e.metaKey || e.ctrlKey;

      if (mod && key === 'k') {
        e.preventDefault();
        setPaletteOpen(!paletteOpen);
        return;
      }
      if (mod && key === 'j') {
        e.preventDefault();
        if (atlasOpen) closeAtlas();
        else openAtlas();
        return;
      }

      // Single-key shortcuts stay out of the way of typing and open dialogs.
      if (mod || e.altKey || isTyping(e.target) || document.querySelector('[role="dialog"]')) return;

      if (pendingG.current) {
        window.clearTimeout(pendingG.current);
        pendingG.current = null;
        const path = GO_TO[key];
        if (path) {
          e.preventDefault();
          navigate(path);
        }
        return;
      }
      if (key === 'g') {
        pendingG.current = window.setTimeout(() => { pendingG.current = null; }, 900);
        return;
      }
      if (key === 'l') {
        e.preventDefault();
        openLogTrade();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setPaletteOpen, paletteOpen, openLogTrade, atlasOpen, openAtlas, closeAtlas, navigate]);
}

/**
 * The frame every signed-in screen sits in. Mounted once around the routes,
 * so the sidebar, Atlas and open panels survive navigation.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { atlasOpen } = useShell();
  const { account } = useView();
  useShortcuts();

  return (
    <div className="flex min-h-[100dvh] bg-ef-bg text-ef-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-control focus:bg-ef-ink focus:px-3 focus:py-2 focus:text-[13px] focus:font-medium focus:text-ef-bg"
      >
        Skip to content
      </a>
      <Sidebar />
      <div className={cn('flex min-w-0 flex-1 flex-col transition-[padding] duration-200', atlasOpen && 'xl:pr-[392px]')}>
        <TopBar />
        {account?.type === 'demo' && <SandboxBanner />}
        <main id="main" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
      </div>
      <AtlasPanel />
      <MobileDock />
      <CommandPalette />
      <LogTradeDialog />
      <DayReviewSheet />
      <TradeDrawer />
    </div>
  );
}
