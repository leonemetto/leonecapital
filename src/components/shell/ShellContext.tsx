import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';

/** What Atlas should know about the screen it was opened from. */
export interface AtlasContextHint {
  /** Short label shown in the panel, e.g. "XAUUSD leak". */
  label: string;
  /** Plain-text context sent with the next question. */
  detail: string;
}

interface ShellContextType {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;

  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;

  logTradeOpen: boolean;
  openLogTrade: () => void;
  closeLogTrade: () => void;

  atlasOpen: boolean;
  atlasHint: AtlasContextHint | null;
  /** Open the panel, optionally with screen context and a question to send. */
  openAtlas: (opts?: { hint?: AtlasContextHint; prompt?: string }) => void;
  closeAtlas: () => void;
  clearAtlasHint: () => void;
  /** A question queued by openAtlas, consumed once by the panel. */
  pendingPrompt: string | null;
  consumePendingPrompt: () => string | null;

  /** Trade open in the detail drawer. */
  tradeId: string | null;
  /** Ids the drawer can step through with J and K, in display order. */
  tradeQueue: string[];
  openTrade: (id: string, queue?: string[]) => void;
  closeTrade: () => void;

  /** Date ("YYYY-MM-DD") open in the day review. */
  reviewDate: string | null;
  openDayReview: (date: string) => void;
  closeDayReview: () => void;
}

const ShellContext = createContext<ShellContextType | null>(null);
const COLLAPSE_KEY = 'ef-sidebar-collapsed';

export function ShellProvider({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [logTradeOpen, setLogTradeOpen] = useState(false);
  const [atlasOpen, setAtlasOpen] = useState(false);
  const [atlasHint, setAtlasHint] = useState<AtlasContextHint | null>(null);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [tradeId, setTradeId] = useState<string | null>(null);
  const [tradeQueue, setTradeQueue] = useState<string[]>([]);
  const [reviewDate, setReviewDate] = useState<string | null>(null);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const openAtlas = useCallback((opts?: { hint?: AtlasContextHint; prompt?: string }) => {
    if (opts?.hint) setAtlasHint(opts.hint);
    if (opts?.prompt) setPendingPrompt(opts.prompt);
    setAtlasOpen(true);
  }, []);

  const consumePendingPrompt = useCallback(() => {
    const p = pendingPrompt;
    if (p) setPendingPrompt(null);
    return p;
  }, [pendingPrompt]);

  const openTrade = useCallback((id: string, queue?: string[]) => {
    setTradeId(id);
    if (queue) setTradeQueue(queue);
  }, []);

  const value = useMemo<ShellContextType>(() => ({
    sidebarCollapsed,
    toggleSidebar,
    mobileNavOpen,
    setMobileNavOpen,
    paletteOpen,
    setPaletteOpen,
    logTradeOpen,
    openLogTrade: () => setLogTradeOpen(true),
    closeLogTrade: () => setLogTradeOpen(false),
    atlasOpen,
    atlasHint,
    openAtlas,
    closeAtlas: () => setAtlasOpen(false),
    clearAtlasHint: () => setAtlasHint(null),
    pendingPrompt,
    consumePendingPrompt,
    tradeId,
    tradeQueue,
    openTrade,
    closeTrade: () => setTradeId(null),
    reviewDate,
    openDayReview: (date: string) => setReviewDate(date),
    closeDayReview: () => setReviewDate(null),
  }), [
    sidebarCollapsed, toggleSidebar, mobileNavOpen, paletteOpen, logTradeOpen,
    atlasOpen, atlasHint, openAtlas, pendingPrompt, consumePendingPrompt,
    tradeId, tradeQueue, openTrade, reviewDate,
  ]);

  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

export function useShell(): ShellContextType {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error('useShell must be used within ShellProvider');
  return ctx;
}
