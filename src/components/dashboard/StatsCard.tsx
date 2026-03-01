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
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: delay * 0.06 }}
      className={cn(
        'glass-card p-6 md:p-8 transition-all duration-200 hover:translate-y-[-2px] group',
        className
      )}
    >
      <div
        className={cn(
          'text-3xl md:text-4xl font-bold font-mono tracking-tight tabular-nums mb-2',
          trend === 'up' && 'text-profit',
          trend === 'down' && 'text-loss',
          !trend && 'text-foreground',
        )}
      >
        {value}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-muted-foreground uppercase tracking-[0.08em]">
          {title}
        </span>
        <Icon className={cn(
          'h-3.5 w-3.5 opacity-30',
          trend === 'up' ? 'text-profit' : trend === 'down' ? 'text-loss' : 'text-muted-foreground'
        )} />
      </div>
    </motion.div>
  );
}
