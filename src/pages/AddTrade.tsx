import { AppLayout } from '@/components/layout/AppLayout';
import { TradeForm } from '@/components/trade/TradeForm';
import { useTrades } from '@/hooks/useTrades';

const AddTrade = () => {
  const { addTrade } = useTrades();

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Log Trade</h1>
        <p className="text-sm text-muted-foreground">Record your trade details and psychology</p>
      </div>
      <div className="max-w-4xl">
        <TradeForm onSubmit={addTrade} />
      </div>
    </AppLayout>
  );
};

export default AddTrade;
