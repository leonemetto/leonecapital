import { AppLayout } from '@/components/layout/AppLayout';
import { TradeTable } from '@/components/trade/TradeTable';
import { useSharedTrades } from '@/contexts/TradesContext';

const Journal = () => {
  const { trades, updateTrade, deleteTrade } = useSharedTrades();

  return (
    <AppLayout>
      <div className="mb-4">
        <h1 className="text-xl font-bold">Journal</h1>
        <p className="text-xs text-muted-foreground">Trade history</p>
      </div>
      <TradeTable trades={trades} onUpdate={updateTrade} onDelete={deleteTrade} />
    </AppLayout>
  );
};

export default Journal;
