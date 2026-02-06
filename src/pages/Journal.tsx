import { AppLayout } from '@/components/layout/AppLayout';
import { TradeTable } from '@/components/trade/TradeTable';
import { useTrades } from '@/hooks/useTrades';

const Journal = () => {
  const { trades, updateTrade, deleteTrade } = useTrades();

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Trade Journal</h1>
        <p className="text-sm text-muted-foreground">Review, filter, and manage your trade history</p>
      </div>
      <TradeTable trades={trades} onUpdate={updateTrade} onDelete={deleteTrade} />
    </AppLayout>
  );
};

export default Journal;
