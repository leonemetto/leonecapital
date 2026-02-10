import { Link } from 'react-router-dom';
import { PlusCircle, FileText } from 'lucide-react';
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
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-sm font-semibold"
        >
          <PlusCircle className="h-4 w-4 text-primary" />
          TRADE ENTRY
        </Link>
        <button
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-sm font-semibold w-full text-left"
        >
          <FileText className="h-4 w-4 text-primary" />
          DAILY REVIEW
        </button>
      </div>
    </motion.div>
  );
}
