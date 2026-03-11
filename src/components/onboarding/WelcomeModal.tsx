import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BookOpen, ArrowRight, Sparkles } from 'lucide-react';
import logoImg from '@/assets/logo.svg';

interface WelcomeModalProps {
  open: boolean;
  onSkip: () => void;
}

export function WelcomeModal({ open, onSkip }: WelcomeModalProps) {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onSkip(); }}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        {/* Header */}
        <div className="relative px-6 pt-8 pb-6 text-center">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
          <div className="relative">
            <div className="mx-auto mb-4 relative inline-block">
              <img src={logoImg} alt="EdgeFlow" className="h-14 w-14 rounded-2xl" />
              <div className="absolute -inset-2 bg-primary/10 rounded-2xl blur-lg -z-10" />
            </div>
            <h2 className="text-xl font-black tracking-tight mb-1">Welcome to EdgeFlow</h2>
            <p className="text-sm text-muted-foreground">Your trading intelligence platform is ready.</p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 space-y-3">
          <div className="glass-card p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              What's included
            </div>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>Demo account with 25 sample trades pre-loaded</li>
              <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>Leak detection & performance analytics</li>
              <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>Strategy optimizer with "What-If" simulations</li>
              <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>AI-powered trade advisor</li>
            </ul>
          </div>

          <Button
            className="w-full gap-2"
            onClick={() => {
              localStorage.setItem('edgeflow_welcome_seen', '1');
              navigate('/guide');
            }}
          >
            <BookOpen className="h-4 w-4" />
            View Platform Guide
            <ArrowRight className="h-4 w-4 ml-auto" />
          </Button>

          <Button
            variant="ghost"
            className="w-full text-xs text-muted-foreground"
            onClick={onSkip}
          >
            Skip — Go to Dashboard
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
