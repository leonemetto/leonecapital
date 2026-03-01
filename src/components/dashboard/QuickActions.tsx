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
      <h3 className="label-text mb-5">Quick Actions</h3>
      <div className="space-y-2.5">
        <Link
          to="/add-trade"
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-primary/10 to-primary/[0.03] border border-primary/15 hover:border-primary/30 hover:from-primary/15 transition-all text-sm font-semibold group"
        >
          <div className="p-1.5 rounded-lg bg-primary/15 group-hover:bg-primary/20 transition-colors">
            <PlusCircle className="h-4 w-4 text-primary" />
          </div>
          <span>TRADE ENTRY</span>
        </Link>
        <button
          onClick={handleDailyReview}
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-secondary/80 to-transparent border border-border/50 hover:border-border transition-all text-sm font-semibold w-full text-left group"
        >
          <div className="p-1.5 rounded-lg bg-secondary group-hover:bg-muted transition-colors">
            <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <span>DAILY REVIEW</span>
        </button>
      </div>
    </motion.div>
  );
}
