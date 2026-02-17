import { Link, useNavigate } from 'react-router-dom';
import { PlusCircle, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSharedTrades } from '@/contexts/TradesContext';
import { format } from 'date-fns';

export function QuickActions() {
  const navigate = useNavigate();
  const { trades } = useSharedTrades();

  const handleDailyReview = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayTrades = trades.filter(t => t.date === today);

    if (todayTrades.length === 0) {
      navigate('/ai', { state: { prompt: "I haven't logged any trades today yet. What should I focus on based on my overall performance?" } });
      return;
    }

    const wins = todayTrades.filter(t => t.outcome === 'win').length;
    const losses = todayTrades.filter(t => t.outcome === 'loss').length;
    const be = todayTrades.filter(t => t.outcome === 'breakeven').length;
    const totalPnl = todayTrades.reduce((sum, t) => sum + t.pnl, 0);
    const instruments = [...new Set(todayTrades.map(t => t.instrument))];
    const sessions = [...new Set(todayTrades.map(t => t.session).filter(Boolean))];
    const strategies = [...new Set(todayTrades.map(t => t.strategy).filter(Boolean))];

    const summary = [
      `TODAY'S TRADES (${today}):`,
      `Total: ${todayTrades.length} | Wins: ${wins} | Losses: ${losses} | BE: ${be}`,
      `P&L: $${totalPnl.toFixed(2)}`,
      `Win Rate: ${todayTrades.length > 0 ? ((wins / todayTrades.length) * 100).toFixed(1) : 0}%`,
      `Instruments: ${instruments.join(', ')}`,
      sessions.length ? `Sessions: ${sessions.join(', ')}` : '',
      strategies.length ? `Strategies: ${strategies.join(', ')}` : '',
      '',
      'Individual trades:',
      ...todayTrades.map(t =>
        `  ${t.instrument} ${t.direction} — ${t.outcome.toUpperCase()} — $${t.pnl.toFixed(2)}${t.session ? ` (${t.session})` : ''}${t.strategy ? ` [${t.strategy}]` : ''}`
      ),
    ].filter(Boolean).join('\n');

    navigate('/ai', {
      state: {
        prompt: "Give me a daily review of my trading today. Summarize my performance, highlight what went well and what didn't, and suggest improvements for tomorrow.",
        extraContext: summary,
      },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="glass-card p-5 h-full"
    >
      <h3 className="text-sm font-bold mb-5">Quick Actions</h3>
      <div className="space-y-2.5">
        <Link
          to="/add-trade"
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-gradient-to-b from-white/[0.06] to-transparent border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_16px_rgba(48,209,88,0.08)] transition-all text-sm font-semibold"
        >
          <PlusCircle className="h-4 w-4 text-primary" />
          TRADE ENTRY
        </Link>
        <button
          onClick={handleDailyReview}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-gradient-to-b from-white/[0.06] to-transparent border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_16px_rgba(48,209,88,0.08)] transition-all text-sm font-semibold w-full text-left"
        >
          <FileText className="h-4 w-4 text-primary" />
          DAILY REVIEW
        </button>
      </div>
    </motion.div>
  );
}
