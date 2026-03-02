import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { TradeForm } from '@/components/trade/TradeForm';
import { useSharedTrades } from '@/contexts/TradesContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const AddTrade = () => {
  const { addTrade } = useSharedTrades();
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="mb-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Log Trade</h1>
          <p className="text-xs text-muted-foreground">Quick entry — under 5 seconds</p>
        </div>
      </div>
      <div className="max-w-3xl">
        <TradeForm onSubmit={addTrade} />
      </div>
    </AppLayout>
  );
};

export default AddTrade;
