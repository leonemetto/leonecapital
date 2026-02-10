import { AppLayout } from '@/components/layout/AppLayout';
import { TradeForm } from '@/components/trade/TradeForm';
import { useSharedTrades } from '@/contexts/TradesContext';

const AddTrade = () => {
  const { addTrade } = useSharedTrades();

  return (
    <AppLayout>
      <div className="mb-4">
        <h1 className="text-xl font-bold">Log Trade</h1>
        <p className="text-xs text-muted-foreground">Quick entry — under 5 seconds</p>
      </div>
      <div className="max-w-3xl">
        <TradeForm onSubmit={addTrade} />
      </div>
    </AppLayout>
  );
};

export default AddTrade;
