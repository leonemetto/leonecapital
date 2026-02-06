import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatsCardProps {
  title: string;
  value: string | number;
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
        'glass-card p-4 transition-all duration-150 hover:border-primary/20 group',
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          {title}
        </span>
        <Icon className={cn(
          'h-3.5 w-3.5',
          trend === 'up' ? 'text-profit' : trend === 'down' ? 'text-loss' : 'text-muted-foreground'
        )} />
      </div>
      <div
        className={cn(
          'text-xl font-bold font-mono tracking-tight',
          trend === 'up' && 'text-profit',
          trend === 'down' && 'text-loss',
        )}
      >
        {value}
      </div>
    </motion.div>
  );
}
