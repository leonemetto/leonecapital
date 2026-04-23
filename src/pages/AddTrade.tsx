import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { TradeForm } from '@/components/trade/TradeForm';
import { useSharedTrades } from '@/contexts/TradesContext';
import { ArrowLeft } from '@phosphor-icons/react';

const AddTrade = () => {
  const { addTrade } = useSharedTrades();
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="flex items-center justify-between border-b border-border" style={{ paddingBottom: 12, marginBottom: 20 }}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            style={{ padding: '6px', borderRadius: 8, background: 'transparent', border: 'none', color: 'var(--ef-ink-3)', cursor: 'pointer' }}
          >
            <ArrowLeft className="h-4 w-4" weight="regular" />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--ef-ink)' }}>Log Trade</h1>
            <div className="font-mono" style={{ fontSize: 12.5, color: 'var(--ef-ink-3)', marginTop: 2 }}>Record your trade and track your edge</div>
          </div>
        </div>
      </div>
      <div className="max-w-3xl space-y-3">
        <TradeForm onSubmit={addTrade} />
      </div>
    </AppLayout>
  );
};

export default AddTrade;
