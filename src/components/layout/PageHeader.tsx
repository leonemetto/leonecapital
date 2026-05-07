import { motion } from 'framer-motion';
import { ReactNode } from 'react';

const ease = [0.25, 0.46, 0.45, 0.94] as const;

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  disclaimer?: string;
  actions?: ReactNode;
  backButton?: ReactNode;
  mb?: number;
}

export function PageHeader({ title, subtitle, disclaimer, actions, backButton, mb = 20 }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease }}
      className="flex items-center justify-between border-b border-border"
      style={{ paddingBottom: 12, marginBottom: mb }}
    >
      <div className="flex items-center gap-3">
        {backButton}
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--ef-ink)' }}>
            {title}
          </h1>
          {subtitle && (
            <div className="font-mono" style={{ fontSize: 12.5, color: 'var(--ef-ink-3)', marginTop: 2 }}>
              {subtitle}
            </div>
          )}
          {disclaimer && (
            <div style={{ fontSize: 11, color: 'var(--ef-ink-4)', marginTop: 4 }}>
              {disclaimer}
            </div>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </motion.div>
  );
}

/* Thin wrapper that fades + slides up the page body below the header */
export function PageBody({ children, delay = 0.08 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease }}
    >
      {children}
    </motion.div>
  );
}
