import { useState, useRef, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useSharedTrades } from '@/contexts/TradesContext';
import { useAccounts } from '@/hooks/useAccounts';
import { calculateAnalytics, getStrategyPerformance, getSessionPerformance } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

type Msg = { role: 'user' | 'assistant'; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trade-advisor`;

function buildTradesSummary(trades: any[], accounts: any[]) {
  if (trades.length === 0) return 'No trades logged yet.';

  const analytics = calculateAnalytics(trades);
  const strategies = getStrategyPerformance(trades);
  const sessions = getSessionPerformance(trades);

  const instrumentMap = new Map<string, { wins: number; losses: number; pnl: number; total: number }>();
  const directionMap = new Map<string, { wins: number; losses: number; pnl: number; total: number }>();

  for (const t of trades) {
    // instrument
    const ik = t.instrument;
    const ic = instrumentMap.get(ik) || { wins: 0, losses: 0, pnl: 0, total: 0 };
    ic.total++; if (t.outcome === 'win') ic.wins++; else if (t.outcome === 'loss') ic.losses++;
    ic.pnl += t.pnl; instrumentMap.set(ik, ic);

    // direction
    const dk = t.direction;
    const dc = directionMap.get(dk) || { wins: 0, losses: 0, pnl: 0, total: 0 };
    dc.total++; if (t.outcome === 'win') dc.wins++; else if (t.outcome === 'loss') dc.losses++;
    dc.pnl += t.pnl; directionMap.set(dk, dc);
  }

  const lines = [
    `Total trades: ${analytics.totalTrades}`,
    `Win rate: ${analytics.winRate.toFixed(1)}%`,
    `Net P&L: $${analytics.netPnl.toFixed(2)}`,
    `Avg win: $${analytics.avgWin.toFixed(2)}, Avg loss: $${analytics.avgLoss.toFixed(2)}`,
    `Profit factor: ${analytics.profitFactor}`,
    `Max drawdown: $${analytics.maxDrawdown}`,
    `Current streak: ${analytics.currentStreak.count} ${analytics.currentStreak.type}`,
    '',
    'BY STRATEGY:',
    ...strategies.map(s => `  ${s.strategy}: ${s.total} trades, ${s.winRate}% WR, $${s.pnl} P&L`),
    '',
    'BY SESSION:',
    ...sessions.map(s => `  ${s.session}: ${s.total} trades, ${s.winRate}% WR, $${s.pnl} P&L`),
    '',
    'BY INSTRUMENT:',
    ...Array.from(instrumentMap.entries()).map(([k, v]) =>
      `  ${k}: ${v.total} trades, ${v.total > 0 ? ((v.wins / v.total) * 100).toFixed(1) : 0}% WR, $${v.pnl.toFixed(2)} P&L`),
    '',
    'BY DIRECTION:',
    ...Array.from(directionMap.entries()).map(([k, v]) =>
      `  ${k}: ${v.total} trades, ${v.total > 0 ? ((v.wins / v.total) * 100).toFixed(1) : 0}% WR, $${v.pnl.toFixed(2)} P&L`),
  ];

  return lines.join('\n');
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
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const tradesSummary = useMemo(() => buildTradesSummary(trades, accounts), [trades, accounts]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Msg = { role: 'user', content: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    let assistantSoFar = '';
    const allMessages = [...messages, userMsg];

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: allMessages.map(m => ({ role: m.role, content: m.content })),
          tradesSummary,
        }),
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({ error: 'Failed to connect' }));
        setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${err.error || 'Something went wrong.'}` }]);
        setIsLoading(false);
        return;
      }

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
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: 'assistant', content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Connection error. Please try again.' }]);
    }

    setIsLoading(false);
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-120px)]">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 py-4 px-1">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold mb-1">AI Trade Advisor</h2>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Ask me anything about your trading performance. I'll analyze your data and give you actionable insights.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {SUGGESTIONS.map(s => (
                  <Button key={s} variant="outline" size="sm" className="text-xs" onClick={() => send(s)}>
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="shrink-0 h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border'
              }`}>
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="shrink-0 h-7 w-7 rounded-full bg-muted flex items-center justify-center mt-0.5">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex gap-3">
              <div className="shrink-0 h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-muted-foreground">
                Thinking...
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border pt-3 pb-2">
          <form onSubmit={e => { e.preventDefault(); send(input); }} className="flex gap-2">
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
              placeholder="Ask about your trading performance..."
              className="min-h-[44px] max-h-[120px] resize-none text-sm"
              rows={1}
            />
            <Button type="submit" size="icon" disabled={!input.trim() || isLoading} className="shrink-0 h-[44px] w-[44px]">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
