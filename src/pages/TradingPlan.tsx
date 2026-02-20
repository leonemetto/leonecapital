import { AppLayout } from '@/components/layout/AppLayout';
import { CriteriaManager } from '@/components/criteria/CriteriaManager';
import { CheckSquare } from 'lucide-react';

export default function TradingPlan() {
  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold">Trading Plan</h1>
          <p className="text-xs text-muted-foreground">Manage your entry criteria checklist</p>
        </div>

        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
            <div>
              <h2 className="text-sm font-semibold">Entry Checklist</h2>
              <p className="text-xs text-muted-foreground">These items appear as a checklist when logging every trade</p>
            </div>
          </div>
          <CriteriaManager />
        </div>
      </div>
    </AppLayout>
  );
}
