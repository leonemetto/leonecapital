import { Link } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export function QuickActions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="glass-card p-4 h-full"
    >
      <h3 className="text-sm font-bold mb-4">Quick Actions</h3>
      <div className="space-y-2">
        <Link
          to="/add-trade"
          className="flex items-center gap-2 px-3 py-2 rounded-md border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-sm font-medium"
        >
          <PlusCircle className="h-4 w-4 text-primary" />
          TRADE ENTRY
        </Link>
      </div>
    </motion.div>
  );
}
