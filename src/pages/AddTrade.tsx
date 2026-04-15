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
      <div className="mb-5 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg text-[rgba(255,255,255,0.35)] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-all outline-none"
        >
          <ArrowLeft className="h-4 w-4" weight="regular" />
        </button>
        <div>
          <h1 className="text-[24px] font-bold text-white tracking-[-0.5px]">Log Trade</h1>
          <p className="text-xs text-[rgba(255,255,255,0.35)]">Record your trade and track your edge</p>
        </div>
      </div>
      <div className="max-w-3xl space-y-3">
        <TradeForm onSubmit={addTrade} />
      </div>
    </AppLayout>
  );
};

export default AddTrade;
