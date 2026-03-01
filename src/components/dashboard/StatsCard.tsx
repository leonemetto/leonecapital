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
      transition={{ duration: 0.3, delay: delay * 0.06 }}
      className={cn(
        'glass-card p-5 transition-all duration-200 hover:border-primary/20 group relative overflow-hidden',
        className
      )}
    >
      {/* Subtle gradient overlay */}
      <div className={cn(
        'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl',
        trend === 'up' && 'bg-gradient-to-br from-profit/[0.03] to-transparent',
        trend === 'down' && 'bg-gradient-to-br from-loss/[0.03] to-transparent',
      )} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="label-text">
            {title}
          </span>
          <div className={cn(
            'p-1.5 rounded-lg transition-colors',
            trend === 'up' ? 'bg-profit/10 text-profit' : trend === 'down' ? 'bg-loss/10 text-loss' : 'bg-muted text-muted-foreground'
          )}>
            <Icon className="h-3.5 w-3.5" />
          </div>
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
      </div>
    </motion.div>
  );
}