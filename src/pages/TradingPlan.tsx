import { AppLayout } from '@/components/layout/AppLayout';
import { CriteriaManager } from '@/components/criteria/CriteriaManager';
import { ClipboardText } from '@phosphor-icons/react';

export default function TradingPlan() {
  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between border-b border-border" style={{ paddingBottom: 12, marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--ef-ink)' }}>
              Trading Plan
            </h1>
            <div className="font-mono" style={{ fontSize: 12.5, color: 'var(--ef-ink-3)', marginTop: 2 }}>
              Entry checklist — shown on every trade
            </div>
          </div>
          <ClipboardText size={20} color="var(--ef-ink-3)" weight="regular" />
        </div>

        <div style={{ background: 'var(--ef-bg-elev)', border: '1px solid var(--ef-line)', borderRadius: 14, padding: '20px 22px' }}>
          <CriteriaManager />
        </div>
      </div>
    </AppLayout>
  );
}
