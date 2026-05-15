import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader, PageBody } from '@/components/layout/PageHeader';
import { TradeForm } from '@/components/trade/TradeForm';
import { useSharedTrades } from '@/contexts/TradesContext';
import { ArrowLeft } from '@phosphor-icons/react';

const AddTrade = () => {
  const { addTrade, addMirroredTrade } = useSharedTrades();
  const navigate = useNavigate();

  const backBtn = (
    <button
      onClick={() => navigate(-1)}
      style={{ padding: '6px', borderRadius: 8, background: 'transparent', border: 'none', color: 'var(--ef-ink-3)', cursor: 'pointer' }}
    >
      <ArrowLeft className="h-4 w-4" weight="regular" />
    </button>
  );

  return (
    <AppLayout>
      <PageHeader
        title="Log Trade"
        subtitle="Record your trade and track your edge"
        backButton={backBtn}
      />
      <PageBody>
        <div className="max-w-3xl space-y-3">
          <TradeForm onSubmit={addTrade} onMirroredSubmit={addMirroredTrade} />
        </div>
      </PageBody>
    </AppLayout>
  );
};

export default AddTrade;
