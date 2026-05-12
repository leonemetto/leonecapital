import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import React from 'react';

type DottedSurfaceProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'ref'>;

export function DottedSurface({ className, style, ...props }: DottedSurfaceProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const dot = isDark ? 'rgba(230,230,230,0.5)' : 'rgba(80,80,80,0.35)';

  return (
    <div
      aria-hidden
      className={cn('absolute inset-0 pointer-events-none overflow-hidden', className)}
      style={{
        backgroundImage: `radial-gradient(circle, ${dot} 1px, transparent 1.5px)`,
        backgroundSize: '24px 24px',
        maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
        ...style,
      }}
      {...props}
    />
  );
}
