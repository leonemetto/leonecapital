import { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useSharedTrades } from '@/contexts/TradesContext';
import { useAccounts } from '@/hooks/useAccounts';
import { useAuth } from '@/hooks/useAuth';
import { useTraderProfile } from '@/hooks/useTraderProfile';
import { useCriteria } from '@/hooks/useCriteria';
import { useTradeVerifications } from '@/hooks/useTradeVerifications';
import { calculateAnalytics, getStrategyPerformance, getSessionPerformance } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Bot, User, Sparkles, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';

type Msg = { role: 'user' | 'assistant'; content: string; id: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trade-advisor`;
const INSIGHT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-insight`;
const MAX_MESSAGES = 10;

let msgId = Date.now();
const nextId = () => `msg-${++msgId}`;

function trimMessages(msgs: Msg[]): Msg[] {
  return msgs.length > MAX_MESSAGES ? msgs.slice(-MAX_MESSAGES) : msgs;
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
  const userId = session?.user?.id ?? '';
  const { traderProfile } = useTraderProfile();
  const { activeCriteria } = useCriteria();
  const tradeIds = useMemo(() => trades.map(t => t.id), [trades]);
  const { data: verificationsMap = {} } = useTradeVerifications(tradeIds);
  const location = useLocation();
  const [messages, setMessages] = useState<Msg[]>(() => {
    try {
      const stored = sessionStorage.getItem('ai-advisor-chat');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const streamingIdRef = useRef<string | null>(null);
  const hasHandledNavState = useRef(false);

  const tradesSummary = useMemo(() => buildTradesSummary(trades, accounts), [trades, accounts]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { try { sessionStorage.setItem('ai-advisor-chat', JSON.stringify(messages)); } catch {} }, [messages]);

  useEffect(() => {
    const state = location.state as { prompt?: string; extraContext?: string } | null;
    if (state?.prompt && !hasHandledNavState.current) {
      hasHandledNavState.current = true;
      window.history.replaceState({}, '');
      send(state.prompt, state.extraContext);
    }
  }, [location.state]);

  const clearChat = () => {
    setMessages([]);
    sessionStorage.removeItem('ai-advisor-chat');
  };

  const send = async (text: string, extraContext?: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Msg = { role: 'user', content: trimmed, id: nextId() };
    setMessages(prev => trimMessages([...prev, userMsg]));
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
        setMessages(prev => trimMessages([...prev, { role: 'assistant', content: `⚠️ ${err.error || 'Something went wrong.'}`, id: assistantId }]));
        setIsLoading(false);
        return;
      }

      setMessages(prev => trimMessages([...prev, { role: 'assistant', content: '', id: assistantId }]));

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
      setMessages(prev => trimMessages([...prev, { role: 'assistant', content: '⚠️ Connection error. Please try again.', id: assistantId }]));
    }

    streamingIdRef.current = null;
    setIsLoading(false);

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
        {/* Header */}
        {messages.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between pb-3 border-b border-border/50 mb-1"
          >
            <div className="flex items-center gap-2.5">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse-glow" />
              <span className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground">
                AI Advisor
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="text-[10px] tracking-wider uppercase text-muted-foreground/60 hover:text-destructive h-7 px-2.5 gap-1.5"
            >
              <Trash2 className="h-3 w-3" />
              Clear
            </Button>
          </motion.div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-5 py-5 px-1 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <AnimatePresence initial={false}>
            {messages.length === 0 && (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="flex flex-col items-center justify-center h-full text-center gap-6"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  className="relative"
                >
                  <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl scale-150" />
                  <div className="relative p-4 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/10">
                    <Sparkles className="h-10 w-10 text-primary" />
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  <h2 className="text-2xl font-black tracking-tight mb-2">AI Trade Advisor</h2>
                  <p className="text-sm text-muted-foreground/70 max-w-md leading-relaxed">
                    Your personal trading analyst. Ask anything about your performance — I'll surface patterns, risks, and actionable insights from your data.
                  </p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.4 }}
                  className="flex flex-wrap gap-2 justify-center mt-1"
                >
                  {SUGGESTIONS.map((s, i) => (
                    <motion.div
                      key={s}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + i * 0.06 }}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs border-border/60 bg-card/50 backdrop-blur-sm hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all duration-200"
                        onClick={() => send(s)}
                      >
                        {s}
                      </Button>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            )}

            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
              >
                {msg.role === 'assistant' && (
                  <div className="shrink-0 h-8 w-8 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/10 flex items-center justify-center mt-0.5">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/10'
                      : 'glass-card'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:my-1.5 [&>ul]:my-1.5 [&>ol]:my-1.5 [&>h1]:text-base [&>h2]:text-sm [&>h3]:text-sm [&>li]:text-muted-foreground [&>p]:text-foreground/90">
                      {msg.content ? <ReactMarkdown>{msg.content}</ReactMarkdown> : (
                        <span className="inline-flex gap-1.5 text-primary/60 py-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-pulse" />
                          <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-pulse [animation-delay:150ms]" />
                          <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-pulse [animation-delay:300ms]" />
                        </span>
                      )}
                    </div>
                  ) : msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="shrink-0 h-8 w-8 rounded-xl bg-muted/80 border border-border/50 flex items-center justify-center mt-0.5">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="pt-4 pb-2">
          <form
            onSubmit={e => { e.preventDefault(); send(input); }}
            className="relative flex items-end gap-2"
          >
            <div className="flex-1 relative">
              <Textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
                placeholder="Ask about your trading performance..."
                className="min-h-[48px] max-h-[120px] resize-none text-sm rounded-xl bg-card/80 backdrop-blur-sm border-border/60 focus:border-primary/40 focus:ring-primary/20 pr-4 py-3.5 transition-all duration-200"
                rows={1}
              />
            </div>
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading}
              className="shrink-0 h-[48px] w-[48px] rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all duration-200 disabled:shadow-none"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <p className="text-[10px] text-muted-foreground/40 text-center mt-2 tracking-wide">
            AI analyzes your trade data to provide personalized insights
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
