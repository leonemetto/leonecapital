import { Link, useNavigate } from 'react-router-dom';
import { Plus, FileText } from '@phosphor-icons/react';
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
      className="rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.07)] p-5 h-full"
    >
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[rgba(255,255,255,0.25)] mb-5">Quick Actions</h3>
      <div className="space-y-2.5">
        <Link
          to="/add-trade"
          className="flex items-center gap-3 px-4 py-3 rounded-[24px] bg-white hover:bg-white/90 transition-all text-sm font-semibold text-black group"
        >
          <Plus className="h-4 w-4 text-black" weight="bold" />
          <span>TRADE ENTRY</span>
        </Link>
        <button
          onClick={handleDailyReview}
          className="flex items-center gap-3 px-4 py-3 rounded-[24px] border border-[rgba(255,255,255,0.12)] hover:border-[rgba(255,255,255,0.25)] hover:bg-[rgba(255,255,255,0.03)] transition-all text-sm font-semibold w-full text-left text-[rgba(255,255,255,0.7)]"
        >
          <FileText className="h-4 w-4 text-[rgba(255,255,255,0.4)]" weight="regular" />
          <span>DAILY REVIEW</span>
        </button>
      </div>
    </motion.div>
  );
}
