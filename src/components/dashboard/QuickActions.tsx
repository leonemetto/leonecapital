import { Link } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export function QuickActions() {
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
      </div>
    </motion.div>
  );
}
