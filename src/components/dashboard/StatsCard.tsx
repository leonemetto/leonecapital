import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
  className?: string;
  delay?: number;
}

export function StatsCard({ title, value, icon: Icon, trend, subtitle, className, delay = 0 }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: delay * 0.05 }}
      className={cn(
        'glass-card p-5 transition-all duration-200 hover:border-primary/20',
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          {title}
        </span>
        <div className="p-1.5 rounded-md bg-secondary">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>
      <div
        className={cn(
          'text-2xl font-bold font-mono tracking-tight',
          trend === 'up' && 'text-profit',
          trend === 'down' && 'text-loss',
        )}
      >
        {value}
      </div>
      {subtitle && (
        <p className="text-[11px] text-muted-foreground mt-1.5">{subtitle}</p>
      )}
    </motion.div>
  );
}
