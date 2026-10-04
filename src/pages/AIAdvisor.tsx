import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus, Trash, UploadSimple } from '@phosphor-icons/react';
import { AppLayout } from '@/components/layout/AppLayout';
import { EmptyState, Surface } from '@/components/ef/primitives';
import { AtlasThread } from '@/components/atlas/AtlasThread';
import { ATLAS_TRADE_GATE, useAtlas } from '@/components/atlas/AtlasProvider';
import { useSharedTrades } from '@/contexts/TradesContext';
import { useShell } from '@/components/shell/ShellContext';

/**
 * Atlas at full width, for longer sessions. It shares one conversation with
 * the side panel, so moving between them keeps the thread.
 */
export default function AIAdvisor() {
  const { trades } = useSharedTrades();
  const { messages, send, clear, ready } = useAtlas();
  const { openLogTrade, atlasOpen, closeAtlas } = useShell();
  const location = useLocation();
  const handled = useRef(false);

  // The panel and the page would show the same thread twice.
  useEffect(() => {
    if (atlasOpen) closeAtlas();
  }, [atlasOpen, closeAtlas]);

  // Other screens can link here with a question to send on arrival.
  useEffect(() => {
    if (!ready || handled.current) return;
    const state = location.state as { prompt?: string; extraContext?: string } | null;
    if (state?.prompt) {
      handled.current = true;
      window.history.replaceState({}, '');
      send(state.prompt, state.extraContext);
    }
  }, [location.state, ready, send]);

  if (trades.length < ATLAS_TRADE_GATE) {
    return (
      <AppLayout width="narrow">
        <Surface>
          <EmptyState
            art="/art/atlas-globe.webp"
            title="Atlas is ready when you are"
            body="Log one trade and Atlas starts reading it. If you have history elsewhere, import your broker file and get a full breakdown straight away."
          >
            <button type="button" onClick={openLogTrade} className="ef-btn ef-btn-primary">
              <Plus className="h-3.5 w-3.5" weight="bold" /> Log a trade
            </button>
            <Link to="/import-trades" className="ef-btn ef-btn-secondary">
              <UploadSimple className="h-3.5 w-3.5" /> Import history
            </Link>
          </EmptyState>
        </Surface>
      </AppLayout>
    );
  }

  return (
    <AppLayout width="narrow">
      <Surface className="flex h-[calc(100dvh-52px-56px)] min-h-[440px] flex-col overflow-hidden lg:h-[calc(100dvh-52px-76px)]">
        <header className="flex h-[52px] shrink-0 items-center justify-between border-b border-ef-line px-5">
          <div className="flex items-baseline gap-2">
            <h1 className="m-0 text-[15px] font-medium tracking-[-0.01em] text-ef-ink">Atlas</h1>
            <span className="ef-label">Performance analyst</span>
          </div>
          {messages.length > 0 && (
            <button type="button" onClick={clear} className="ef-btn ef-btn-ghost ef-btn-sm">
              <Trash className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </header>
        <div className="flex min-h-0 flex-1 flex-col px-4">
          <AtlasThread variant="page" autoFocus />
        </div>
      </Surface>
    </AppLayout>
  );
}
