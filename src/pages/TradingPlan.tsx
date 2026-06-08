import { AppLayout } from '@/components/layout/AppLayout';
import { CriteriaManager } from '@/components/criteria/CriteriaManager';
import { useCriteria } from '@/hooks/useCriteria';
import { ClipboardText, ShieldCheck, Target, ListChecks } from '@phosphor-icons/react';
import type { CSSProperties } from 'react';

const PANEL_STYLE: CSSProperties = {
  borderRadius: 20,
  border: '1px solid color-mix(in oklab, var(--ef-line) 88%, white 4%)',
  background: `
    radial-gradient(circle at 92% 0%, color-mix(in oklab, var(--ef-pos-wash) 22%, transparent) 0, transparent 38%),
    linear-gradient(180deg, color-mix(in oklab, var(--ef-bg-elev) 94%, white 2%) 0%, var(--ef-bg-elev) 100%)
  `,
  boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 22px 70px rgba(0,0,0,0.20)',
};

export default function TradingPlan() {
  const { criteria } = useCriteria();
  const activeCount = criteria.filter(c => c.isActive).length;
  const categories = new Set(criteria.map(c => c.category).filter(Boolean)).size;

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl space-y-5">
        <section className="relative overflow-hidden p-6 md:p-7" style={PANEL_STYLE}>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-8 bottom-0 h-px opacity-70"
            style={{ background: 'linear-gradient(90deg, transparent, var(--ef-pos), transparent)' }}
          />
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                <ClipboardText className="h-3.5 w-3.5" weight="bold" />
                Execution rules
              </div>
              <h1 className="m-0 text-[34px] font-semibold leading-none tracking-[-0.045em] text-foreground">
                Trading plan
              </h1>
              <p className="mt-3 max-w-lg text-[14px] leading-6 text-muted-foreground">
                The checklist that appears before every trade. Keep it short, strict, and built around the mistakes that actually cost you money.
              </p>
            </div>

            <div className="grid w-full grid-cols-3 gap-2 lg:w-[390px]">
              {[
                { label: 'Active', value: activeCount, Icon: ShieldCheck, color: 'var(--ef-pos)' },
                { label: 'Rules', value: criteria.length, Icon: ListChecks, color: 'var(--ef-ink)' },
                { label: 'Groups', value: categories || '—', Icon: Target, color: 'var(--ef-warn)' },
              ].map(({ label, value, Icon, color }) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-black/25 px-3 py-3">
                  <Icon className="mb-4 h-4 w-4" style={{ color }} weight="regular" />
                  <div className="metric-number text-[22px] leading-none" style={{ color }}>{value}</div>
                  <div className="mt-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/55">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="p-5 md:p-6" style={PANEL_STYLE}>
          <CriteriaManager />
        </section>
      </div>
    </AppLayout>
  );
}
