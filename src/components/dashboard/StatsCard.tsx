import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatsCardProps {
  title: string;
  value: React.ReactNode;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
  delay?: number;
}

export function StatsCard({ title, value, icon: Icon, trend, className, delay = 0 }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: delay * 0.04 }}
      className={cn(
        'glass-card p-5 transition-all duration-150 hover:border-primary/20 group',
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest opacity-50">
          {title}
        </span>
        <Icon className={cn(
          'h-4 w-4',
          trend === 'up' ? 'text-profit' : trend === 'down' ? 'text-loss' : 'text-muted-foreground'
        )} />
      </div>
      <div
        className={cn(
          'text-2xl font-bold font-mono tracking-tight tabular-nums',
          trend === 'up' && 'text-profit',
          trend === 'down' && 'text-loss',
          !trend && 'text-foreground',
        )}
      >
        {value}
      </div>
    </motion.div>
  );
}
