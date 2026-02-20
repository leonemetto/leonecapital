import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CheckSquare, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ChecklistSetupProps {
  onDone: () => void;
}

export function ChecklistSetup({ onDone }: ChecklistSetupProps) {
  const navigate = useNavigate();

  const handleCreate = () => {
    onDone();
    navigate('/trading-plan');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="glass-card p-8 space-y-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
            <CheckSquare className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold">Entry Checklist</h1>
            <p className="text-sm text-muted-foreground">
              Set up your personal entry criteria checklist — the rules you must check before entering any trade.
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <Button onClick={handleCreate} className="w-full gap-2">
              Create My Checklist <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onDone} className="text-muted-foreground">
              Skip for now
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
