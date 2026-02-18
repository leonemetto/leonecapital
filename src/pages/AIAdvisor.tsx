import { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useSharedTrades } from '@/contexts/TradesContext';
import { useAccounts } from '@/hooks/useAccounts';
import { useAuth } from '@/hooks/useAuth';
import { useTraderProfile } from '@/hooks/useTraderProfile';
import { calculateAnalytics, getStrategyPerformance, getSessionPerformance } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';

type Msg = { role: 'user' | 'assistant'; content: string; id: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trade-advisor`;
const INSIGHT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-insight`;
const STORAGE_KEY = 'ai-advisor-chat-history';
const MAX_STORED_CHATS = 10;

let msgId = 0;
const nextId = () => `msg-${++msgId}`;

function loadChatHistory(): Msg[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Msg[];
    return parsed.slice(-(MAX_STORED_CHATS * 2));
  } catch { return []; }
}

function saveChatHistory(messages: Msg[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-(MAX_STORED_CHATS * 2))));
  } catch {}
}

function buildTradesSummary(trades: any[], accounts: any[]) {
  if (trades.length === 0) return 'No trades logged yet.';
  const analytics = calculateAnalytics(trades);
  const strategies = getStrategyPerformance(trades);
  const sessions = getSessionPerformance(trades);
  const instrumentMap = new Map<string, { wins: number; losses: number; pnl: number; total: number }>();
  const directionMap = new Map<string, { wins: number; losses: number; pnl: number; total: number }>();
  const accountLookup = new Map(accounts.map((a: any) => [a.id, a.name]));
  const accountMap = new Map<string, { name: string; wins: number; losses: number; breakeven: number; pnl: number; total: number }>();

  for (const t of trades) {
    const ic = instrumentMap.get(t.instrument) || { wins: 0, losses: 0, pnl: 0, total: 0 };
    ic.total++; if (t.outcome === 'win') ic.wins++; else if (t.outcome === 'loss') ic.losses++;
    ic.pnl += t.pnl; instrumentMap.set(t.instrument, ic);

    const dc = directionMap.get(t.direction) || { wins: 0, losses: 0, pnl: 0, total: 0 };
    dc.total++; if (t.outcome === 'win') dc.wins++; else if (t.outcome === 'loss') dc.losses++;
    dc.pnl += t.pnl; directionMap.set(t.direction, dc);

    const acctId = t.accountId || 'unassigned';
    const acctName = t.accountId ? (accountLookup.get(t.accountId) || 'Unknown') : 'Unassigned';
    const ac = accountMap.get(acctId) || { name: acctName, wins: 0, losses: 0, breakeven: 0, pnl: 0, total: 0 };
    ac.total++; if (t.outcome === 'win') ac.wins++; else if (t.outcome === 'loss') ac.losses++; else ac.breakeven++;
    ac.pnl += t.pnl; accountMap.set(acctId, ac);
  }

  return [
    `Total trades: ${analytics.totalTrades}`, `Win rate: ${analytics.winRate.toFixed(1)}%`,
    `Net P&L: $${analytics.netPnl.toFixed(2)}`, `Avg win: $${analytics.avgWin.toFixed(2)}, Avg loss: $${analytics.avgLoss.toFixed(2)}`,
    `Profit factor: ${analytics.profitFactor}`, `Max drawdown: $${analytics.maxDrawdown}`,
    `Current streak: ${analytics.currentStreak.count} ${analytics.currentStreak.type}`,
    '', 'BY STRATEGY:', ...strategies.map(s => `  ${s.strategy}: ${s.total} trades, ${s.winRate}% WR, $${s.pnl} P&L`),
    '', 'BY SESSION:', ...sessions.map(s => `  ${s.session}: ${s.total} trades, ${s.winRate}% WR, $${s.pnl} P&L`),
    '', 'BY INSTRUMENT:', ...Array.from(instrumentMap.entries()).map(([k, v]) => `  ${k}: ${v.total} trades, ${v.total > 0 ? ((v.wins / v.total) * 100).toFixed(1) : 0}% WR, $${v.pnl.toFixed(2)} P&L`),
    '', 'BY DIRECTION:', ...Array.from(directionMap.entries()).map(([k, v]) => `  ${k}: ${v.total} trades, ${v.total > 0 ? ((v.wins / v.total) * 100).toFixed(1) : 0}% WR, $${v.pnl.toFixed(2)} P&L`),
    '', 'BY ACCOUNT:', ...Array.from(accountMap.values()).map(a => `  ${a.name}: ${a.total} trades, ${a.wins}W/${a.losses}L/${a.breakeven}BE, ${a.total > 0 ? ((a.wins / a.total) * 100).toFixed(1) : 0}% WR, $${a.pnl.toFixed(2)} P&L`),
  ].join('\n');
}

const SUGGESTIONS = [
  "What are my biggest weaknesses?",
  "Which session should I avoid?",
  "Analyze my strategy performance",
  "How can I improve my win rate?",
];

export default function AIAdvisor() {
  const { trades } = useSharedTrades();
  const { accounts } = useAccounts();
  const { session } = useAuth();
  const { traderProfile } = useTraderProfile();
  const location = useLocation();
  const [messages, setMessages] = useState<Msg[]>(() => loadChatHistory());
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const streamingIdRef = useRef<string | null>(null);
  const hasHandledNavState = useRef(false);

  const tradesSummary = useMemo(() => buildTradesSummary(trades, accounts), [trades, accounts]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { if (messages.length > 0) saveChatHistory(messages); }, [messages]);

  useEffect(() => {
    const state = location.state as { prompt?: string; extraContext?: string } | null;
    if (state?.prompt && !hasHandledNavState.current) {
      hasHandledNavState.current = true;
      window.history.replaceState({}, '');
      send(state.prompt, state.extraContext);
    }
  }, [location.state]);

  const send = async (text: string, extraContext?: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Msg = { role: 'user', content: trimmed, id: nextId() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    let assistantSoFar = '';
    const assistantId = nextId();
    streamingIdRef.current = assistantId;
    const allMessages = [...messages, userMsg];

    const messagesForApi = allMessages.map(m => ({ role: m.role, content: m.content }));
    if (extraContext) {
      const lastIdx = messagesForApi.length - 1;
      messagesForApi[lastIdx] = {
        ...messagesForApi[lastIdx],
        content: `[Context]\n${extraContext}\n\n[Question]\n${messagesForApi[lastIdx].content}`,
      };
    }

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: messagesForApi,
          tradesSummary,
          recentTrades: trades.slice(0, 50).map(t => ({
            date: t.date, instrument: t.instrument, direction: t.direction,
            strategy: t.strategy, session: t.session, outcome: t.outcome, pnl: t.pnl, notes: t.notes,
          })),
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
        setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${err.error || 'Something went wrong.'}`, id: assistantId }]);
        setIsLoading(false);
        return;
      }

      setMessages(prev => [...prev, { role: 'assistant', content: '', id: assistantId }]);

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
              setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: snapshot } : m));
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Connection error. Please try again.', id: assistantId }]);
    }

    streamingIdRef.current = null;
    setIsLoading(false);

    // Post-processing: extract behavioral insight
    if (assistantSoFar.length > 20) {
      const convoForInsight = [...allMessages, { role: 'assistant', content: assistantSoFar }]
        .map(m => ({ role: m.role, content: m.content }));
      fetch(INSIGHT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ conversation: convoForInsight }),
      }).catch(() => {});
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-120px)]">
        <div className="flex-1 overflow-y-auto space-y-4 py-4 px-1 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <AnimatePresence initial={false}>
            {messages.length === 0 && (
              <motion.div key="empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center justify-center h-full text-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10"><Sparkles className="h-8 w-8 text-primary" /></div>
                <div>
                  <h2 className="text-lg font-bold mb-1">AI Trade Advisor</h2>
                  <p className="text-sm text-muted-foreground max-w-sm">Ask me anything about your trading performance. I'll analyze your data and give you actionable insights.</p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {SUGGESTIONS.map(s => (<Button key={s} variant="outline" size="sm" className="text-xs" onClick={() => send(s)}>{s}</Button>))}
                </div>
              </motion.div>
            )}
            {messages.map((msg) => (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, ease: 'easeOut' }} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className="shrink-0 h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center mt-0.5"><Bot className="h-3.5 w-3.5 text-primary" /></div>
                )}
                <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border'}`}>
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1">
                      {msg.content ? <ReactMarkdown>{msg.content}</ReactMarkdown> : (
                        <span className="inline-flex gap-1 text-muted-foreground">
                          <span className="animate-pulse">●</span><span className="animate-pulse [animation-delay:150ms]">●</span><span className="animate-pulse [animation-delay:300ms]">●</span>
                        </span>
                      )}
                    </div>
                  ) : msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="shrink-0 h-7 w-7 rounded-full bg-muted flex items-center justify-center mt-0.5"><User className="h-3.5 w-3.5 text-muted-foreground" /></div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        <div className="pt-3 pb-2">
          <form onSubmit={e => { e.preventDefault(); send(input); }} className="flex gap-2">
            <Textarea value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
              placeholder="Ask about your trading performance..." className="min-h-[44px] max-h-[120px] resize-none text-sm" rows={1} />
            <Button type="submit" size="icon" disabled={!input.trim() || isLoading} className="shrink-0 h-[44px] w-[44px]"><Send className="h-4 w-4" /></Button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
