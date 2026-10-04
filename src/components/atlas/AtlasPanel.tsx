import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowsOutSimple, Trash, X } from '@phosphor-icons/react';
import { useSharedTrades } from '@/contexts/TradesContext';
import { useSharedSubscription } from '@/contexts/SubscriptionContext';
import { UpgradeModal } from '@/components/billing/UpgradeModal';
import { useShell } from '@/components/shell/ShellContext';
import { cn } from '@/lib/utils';
import { ATLAS_TRADE_GATE, useAtlas } from './AtlasProvider';
import { AtlasThread, DEFAULT_SUGGESTIONS } from './AtlasThread';

// Questions that fit the screen the panel was opened from.
function suggestionsFor(pathname: string): string[] {
  if (pathname.startsWith('/dashboard')) {
    return ['Review my trading today', 'What should I focus on this week?', 'Is my recent drawdown normal for me?', 'Where did this month’s P&L come from?'];
  }
  if (pathname.startsWith('/journal')) {
    return ['Which setups are costing me the most?', 'Compare my on-plan and off-plan trades', 'What do my losing trades have in common?', 'Am I more profitable long or short?'];
  }
  if (pathname.startsWith('/insights')) {
    return ['Explain my biggest leak', 'Which session should I stop trading?', 'How does my emotional state affect results?', 'What one rule would help most?'];
  }
  if (pathname.startsWith('/trading-plan')) {
    return ['Which of my rules do I break most?', 'What does breaking my plan cost me?', 'Suggest one rule based on my data', 'Is my daily loss limit sensible?'];
  }
  return DEFAULT_SUGGESTIONS;
}

export const ATLAS_PANEL_WIDTH = 392;

/**
 * Atlas beside the data. On wide screens it docks and the page reflows; on
 * smaller ones it slides over the content.
 */
export function AtlasPanel() {
  const { atlasOpen, closeAtlas, atlasHint, clearAtlasHint, pendingPrompt, consumePendingPrompt } = useShell();
  const { trades } = useSharedTrades();
  const { hasProAccess, isLoading: subLoading } = useSharedSubscription();
  const { messages, send, clear, ready } = useAtlas();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const suggestions = useMemo(() => suggestionsFor(pathname), [pathname]);

  const locked = !subLoading && !hasProAccess;
  const gated = trades.length < ATLAS_TRADE_GATE;

  // A question queued by another screen ("Explain this leak") sends once the
  // panel is open and the session is known.
  useEffect(() => {
    if (!atlasOpen || !pendingPrompt || !ready || locked || gated) return;
    const prompt = consumePendingPrompt();
    if (prompt) {
      send(prompt, atlasHint?.detail);
      clearAtlasHint();
    }
  }, [atlasOpen, pendingPrompt, ready, locked, gated, consumePendingPrompt, send, atlasHint, clearAtlasHint]);

  // Escape closes the panel when nothing else (a dialog, the drawer) is open.
  useEffect(() => {
    if (!atlasOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.querySelector('[role="dialog"]')) closeAtlas();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [atlasOpen, closeAtlas]);

  if (!atlasOpen) return null;

  return (
    <>
      <div
        aria-hidden
        className="fixed inset-0 z-40 xl:hidden"
        style={{ background: 'var(--ef-scrim)' }}
        onClick={closeAtlas}
      />
      <aside
        aria-label="Atlas"
        className={cn(
          'fixed right-0 top-0 z-40 flex h-[100dvh] w-full flex-col border-l border-ef-line bg-ef-elev sm:w-[392px]',
          'animate-in slide-in-from-right-8 fade-in-0 duration-200',
        )}
        style={{ boxShadow: 'var(--ef-shadow-pop)' }}
      >
        <header className="flex h-[52px] shrink-0 items-center justify-between border-b border-ef-line pl-4 pr-2">
          <div className="flex items-baseline gap-2">
            <h2 className="m-0 text-[14px] font-medium tracking-[-0.01em] text-ef-ink">Atlas</h2>
            <span className="ef-label">Performance analyst</span>
          </div>
          <div className="flex items-center gap-0.5">
            {messages.length > 0 && (
              <button type="button" onClick={clear} aria-label="Clear conversation" title="Clear conversation" className="ef-btn ef-btn-ghost ef-btn-sm w-7 px-0">
                <Trash className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                closeAtlas();
                navigate('/ai');
              }}
              aria-label="Open full page"
              title="Open full page"
              className="ef-btn ef-btn-ghost ef-btn-sm w-7 px-0"
            >
              <ArrowsOutSimple className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={closeAtlas} aria-label="Close Atlas" className="ef-btn ef-btn-ghost ef-btn-sm w-7 px-0">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </header>

        {locked ? (
          <PanelNotice
            title="Atlas is part of Pro"
            body="Upgrade to ask questions about your trades and get answers from your own data."
            action="Upgrade to Pro"
            onAction={() => setUpgradeOpen(true)}
          />
        ) : gated ? (
          <PanelNotice
            title="Log one trade to start"
            body="Atlas reads your logged trades. Add one, or import your history, and it has something real to work with."
            action="Import history"
            onAction={() => {
              closeAtlas();
              navigate('/import-trades');
            }}
          />
        ) : (
          <AtlasThread variant="panel" suggestions={suggestions} hint={atlasHint} onClearHint={clearAtlasHint} autoFocus />
        )}
      </aside>
      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </>
  );
}

function PanelNotice({ title, body, action, onAction }: { title: string; body: string; action: string; onAction: () => void }) {
  return (
    <div className="flex flex-1 flex-col justify-end px-4 pb-6">
      <img src="/art/atlas-globe.webp" alt="" width={148} height={148} className="ef-art -ml-3 mb-1" />
      <h3 className="m-0 text-[17px] font-medium tracking-[-0.02em] text-ef-ink">{title}</h3>
      <p className="m-0 mt-1.5 text-[13px] leading-relaxed text-ef-ink-3">{body}</p>
      <button type="button" onClick={onAction} className="ef-btn ef-btn-primary mt-4 self-start">
        {action}
      </button>
    </div>
  );
}
