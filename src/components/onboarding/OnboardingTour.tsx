import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { X, ArrowRight, Zap, AlertTriangle, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  {
    selector: '[data-tour="leak-badge"]',
    fallbackSelector: '.bg-loss\\/5',
    title: 'Leak Detection',
    description: 'Rows highlighted in red with the "LEAK" badge have negative expectancy. These are segments bleeding your account.',
    icon: AlertTriangle,
    position: 'bottom' as const,
  },
  {
    selector: '[data-tour="simulate-btn"]',
    fallbackSelector: 'button[title*="Simulate"]',
    title: 'Run Simulation',
    description: 'Click the ⚡ icon on any row to instantly load those filters into the Strategy Optimizer below.',
    icon: Zap,
    position: 'left' as const,
  },
  {
    selector: '[data-tour="simulator"]',
    fallbackSelector: '.glass-card:last-child',
    title: 'Strategy Optimizer',
    description: 'Use "What-If" filters to simulate removing leaky setups. See how your equity curve and expectancy would change.',
    icon: BarChart3,
    position: 'top' as const,
  },
];

interface OnboardingTourProps {
  onComplete: () => void;
}

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const findElement = useCallback((stepIndex: number) => {
    const s = STEPS[stepIndex];
    let el = document.querySelector(s.selector);
    if (!el) el = document.querySelector(s.fallbackSelector);
    return el;
  }, []);

  useEffect(() => {
    const el = findElement(step);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        setRect(el.getBoundingClientRect());
      }, 400);
    } else {
      setRect(null);
    }
  }, [step, findElement]);

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  const tooltipStyle: React.CSSProperties = rect ? {
    position: 'fixed',
    zIndex: 10001,
    ...(current.position === 'bottom' && { top: rect.bottom + 12, left: rect.left + rect.width / 2, transform: 'translateX(-50%)' }),
    ...(current.position === 'top' && { bottom: window.innerHeight - rect.top + 12, left: rect.left + rect.width / 2, transform: 'translateX(-50%)' }),
    ...(current.position === 'left' && { top: rect.top + rect.height / 2, right: window.innerWidth - rect.left + 12, transform: 'translateY(-50%)' }),
  } : {
    position: 'fixed',
    zIndex: 10001,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[10000] bg-background/60 backdrop-blur-sm" />

      {/* Spotlight cutout */}
      {rect && (
        <div
          className="fixed z-[10000] rounded-lg ring-2 ring-primary/50 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]"
          style={{
            top: rect.top - 4,
            left: rect.left - 4,
            width: rect.width + 8,
            height: rect.height + 8,
          }}
        />
      )}

      {/* Tooltip */}
      <div style={tooltipStyle} className="w-72">
        <div className="glass-card p-4 border border-primary/20 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Icon className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">
                {step + 1}/{STEPS.length}
              </span>
            </div>
            <button onClick={onComplete} className="text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <h4 className="text-sm font-bold mb-1">{current.title}</h4>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">{current.description}</p>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setStep(s => s - 1)}>
                Back
              </Button>
            )}
            <Button
              size="sm"
              className={cn('text-xs h-7 gap-1 ml-auto')}
              onClick={() => isLast ? onComplete() : setStep(s => s + 1)}
            >
              {isLast ? 'Finish Tour' : 'Next'}
              {!isLast && <ArrowRight className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
