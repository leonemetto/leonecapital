import { createContext, useContext, useState, useRef, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { useSharedTrades } from '@/contexts/TradesContext';
import { useSharedAccounts } from '@/contexts/AccountsContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/hooks/useAuth';
import { useTraderProfile } from '@/hooks/useTraderProfile';
import { useCriteria } from '@/hooks/useCriteria';
import { useTradeVerifications } from '@/hooks/useTradeVerifications';
import { buildTradesSummary } from '@/lib/atlasSummary';

export type AtlasMsg = { role: 'user' | 'assistant'; content: string; id: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trade-advisor`;
const INSIGHT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-insight`;
const MAX_MESSAGES = 10;
const STORAGE_KEY = 'ai-advisor-chat';

// Atlas unlocks on the first logged trade. It was once gated at 10, a number
// almost nobody reached. Kept at 1 so it always has something real to read.
export const ATLAS_TRADE_GATE = 1;

let msgId = Date.now();
const nextId = () => `msg-${++msgId}`;

const trim = (msgs: AtlasMsg[]) => (msgs.length > MAX_MESSAGES ? msgs.slice(-MAX_MESSAGES) : msgs);

interface AtlasContextType {
  messages: AtlasMsg[];
  isLoading: boolean;
  /** Id of the assistant message currently streaming, if any. */
  streamingId: string | null;
  /** True once the auth session is known, so a queued question can be sent. */
  ready: boolean;
  send: (text: string, extraContext?: string) => Promise<void>;
  clear: () => void;
}

const AtlasContext = createContext<AtlasContextType | null>(null);

/**
 * One Atlas conversation shared by the side panel and the full-page view.
 * The request, streaming and insight-extraction logic is the same as before
 * the redesign; only where it lives has changed.
 */
export function AtlasProvider({ children }: { children: ReactNode }) {
  const { trades } = useSharedTrades();
  const { accounts } = useSharedAccounts();
  const { countBreakevenInWinRate } = useSettings();
  const { session, loading: authLoading } = useAuth();
  const { traderProfile } = useTraderProfile();
  const { activeCriteria } = useCriteria();
  // Checklist results are only sent for the 50 most recent trades, so only those are fetched.
  const tradeIds = useMemo(() => trades.slice(0, 50).map(t => t.id), [trades]);
  const { data: verificationsMap = {} } = useTradeVerifications(tradeIds);

  const [messages, setMessages] = useState<AtlasMsg[]>(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const loadingRef = useRef(false);

  const tradesSummary = useMemo(
    () => buildTradesSummary(trades, accounts, countBreakevenInWinRate),
    [trades, accounts, countBreakevenInWinRate],
  );

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  const clear = useCallback(() => {
    setMessages([]);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const send = useCallback(async (text: string, extraContext?: string) => {
    const trimmed = text.trim();
    if (!trimmed || loadingRef.current) return;

    const userMsg: AtlasMsg = { role: 'user', content: trimmed, id: nextId() };
    const allMessages = [...messagesRef.current, userMsg];
    setMessages(prev => trim([...prev, userMsg]));
    loadingRef.current = true;
    setIsLoading(true);

    let assistantSoFar = '';
    const assistantId = nextId();
    setStreamingId(assistantId);

    const messagesForApi = allMessages.map(m => ({ role: m.role, content: m.content }));
    if (extraContext) {
      const lastIdx = messagesForApi.length - 1;
      messagesForApi[lastIdx] = {
        ...messagesForApi[lastIdx],
        content: `[Context]\n${extraContext}\n\n[Question]\n${messagesForApi[lastIdx].content}`,
      };
    }

    const finish = () => {
      setStreamingId(null);
      loadingRef.current = false;
      setIsLoading(false);
    };

    if (!session?.access_token) {
      setMessages(prev => trim([...prev, { role: 'assistant', content: 'Your session expired. Refresh the page and sign in again.', id: assistantId }]));
      finish();
      return;
    }

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages: messagesForApi,
          tradesSummary,
          recentTrades: trades.slice(0, 50).map(t => ({
            date: t.date, instrument: t.instrument, direction: t.direction,
            strategy: t.strategy, session: t.session, outcome: t.outcome, pnl: t.pnl, notes: t.notes,
            rMultiple: t.rMultiple ?? null, riskPercent: t.riskPercent ?? null,
            htfBias: t.htfBias ?? null, emotionalState: t.emotionalState ?? null,
            confidenceLevel: t.confidenceLevel ?? null, timeInTrade: t.timeInTrade ?? null,
            followedPlan: t.followedPlan ?? null,
            accountName: accounts.find(a => a.id === t.accountId)?.name ?? 'Unassigned',
            checklistChecked: activeCriteria.filter(c => verificationsMap[t.id]?.[c.id]).length,
            checklistTotal: activeCriteria.length,
            checklistFollowed: activeCriteria.length > 0
              ? activeCriteria.every(c => verificationsMap[t.id]?.[c.id])
              : null,
          })),
          criteriaDefinitions: activeCriteria.map(c => ({ label: c.label, category: c.category })),
          traderProfile: traderProfile ? {
            trading_style: traderProfile.tradingStyle,
            favorite_instruments: traderProfile.favoriteInstruments,
            favorite_sessions: traderProfile.favoriteSessions,
            account_goals: traderProfile.accountGoals,
            common_mistakes: traderProfile.commonMistakes,
            trading_rules: traderProfile.tradingRules,
            risk_per_trade: traderProfile.riskPerTrade,
            mental_triggers: traderProfile.mentalTriggers,
            behavioral_memory: traderProfile.behavioralMemory,
            notes: traderProfile.notes,
          } : null,
        }),
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({ error: 'Failed to connect' }));
        const content = err.error === 'upgrade_required'
          ? 'Your Pro trial ended. Upgrade to Pro to keep using Atlas with your trading data.'
          : err.error || 'Something went wrong. Try again.';
        setMessages(prev => trim([...prev, { role: 'assistant', content, id: assistantId }]));
        finish();
        return;
      }

      setMessages(prev => trim([...prev, { role: 'assistant', content: '', id: assistantId }]));

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              const snapshot = assistantSoFar;
              setMessages(prev => prev.map(m => (m.id === assistantId ? { ...m, content: snapshot } : m)));
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => trim([...prev, { role: 'assistant', content: 'The connection dropped. Try again.', id: assistantId }]));
    }

    finish();

    if (assistantSoFar.length > 20 && session?.access_token) {
      const convoForInsight = [...allMessages, { role: 'assistant', content: assistantSoFar }]
        .map(m => ({ role: m.role, content: m.content }));
      fetch(INSIGHT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ conversation: convoForInsight }),
      }).catch(() => {});
    }
  }, [session, tradesSummary, trades, accounts, activeCriteria, verificationsMap, traderProfile]);

  const value = useMemo(
    () => ({ messages, isLoading, streamingId, ready: !authLoading, send, clear }),
    [messages, isLoading, streamingId, authLoading, send, clear],
  );

  return <AtlasContext.Provider value={value}>{children}</AtlasContext.Provider>;
}

export function useAtlas(): AtlasContextType {
  const ctx = useContext(AtlasContext);
  if (!ctx) throw new Error('useAtlas must be used within AtlasProvider');
  return ctx;
}
