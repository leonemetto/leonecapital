import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/hooks/useOnboarding';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, Search, Zap, Brain, CalendarCheck, ArrowRight, ArrowLeft, CheckCircle2,
} from 'lucide-react';

const SECTIONS = [
  {
    id: 'philosophy',
    title: 'The EdgeFlow Philosophy',
    icon: Target,
    content: [
      { heading: 'The Truth Machine', body: 'EdgeFlow is designed to separate emotion from execution. Every trade you log becomes data. Every pattern in that data becomes a signal. Your job is to log honestly — EdgeFlow\'s job is to show you the truth.' },
      { heading: 'No Opinions, Only Data', body: 'Unlike conventional journals, EdgeFlow doesn\'t care about your feelings about a trade. It cares about the statistical reality: Did this setup make money over time? If not, it\'s a leak — and EdgeFlow will find it.' },
      { heading: 'Your Edge is Quantifiable', body: 'A real edge isn\'t a hunch. It\'s a measurable statistical advantage across a meaningful sample size. EdgeFlow helps you prove — or disprove — every strategy you trade.' },
    ],
  },
  {
    id: 'analyst',
    title: 'Performance Analyst',
    subtitle: 'The Leak Detector',
    icon: Search,
    content: [
      { heading: 'How to Spot Your Leaks', body: 'The Performance Analyst breaks down your trades by instrument, session, direction, HTF bias, confidence, and emotional state. Any segment with negative R-expectancy gets flagged with a "LEAK" badge.' },
      { heading: 'What the LEAK Badge Means', body: 'A LEAK badge means that segment has negative expectancy — on average, you lose money every time you trade that combination. It\'s the mathematical equivalent of a hole in your pocket.' },
      { heading: 'Heat-Bars & Visual Signals', body: 'Green bars = positive edge. Red bars = bleeding money. The wider the bar, the stronger the signal. Use these visual cues to quickly scan your entire trading profile for weaknesses.' },
    ],
  },
  {
    id: 'optimizer',
    title: 'Strategy Optimizer',
    subtitle: 'The Proof',
    icon: Zap,
    content: [
      { heading: 'Validating Your Edge', body: 'Click the ⚡ icon on any table row to load that segment into the Strategy Optimizer. It instantly shows you what your equity curve would look like if you only traded that setup — or removed it entirely.' },
      { heading: 'The Ghost Curve', body: 'The dashed gray line is your total portfolio. The bold green line is the filtered strategy. When the green line outperforms the gray — you\'ve found something worth keeping.' },
      { heading: 'From Hunch to Validated Strategy', body: 'Think XAUUSD longs are killing you? Don\'t guess — simulate. Filter them out and see the exact dollar impact on your P&L, drawdown, and expectancy.' },
    ],
  },
  {
    id: 'ai-advisor',
    title: 'AI Advisor',
    subtitle: 'Your Consultant',
    icon: Brain,
    content: [
      { heading: 'Deep Analysis', body: 'The AI Advisor analyzes patterns across all your trades. It identifies toxic combinations — like going long on instruments with a Bearish HTF FVG — that you might not notice manually.' },
      { heading: 'Behavioral Patterns', body: 'Beyond setups, the AI tracks your behavior: revenge trading after losses, overtrading on Fridays, emotional state correlations. It sees the trader behind the trades.' },
      { heading: 'Actionable Recommendations', body: 'Every insight comes with a specific, actionable recommendation. Not just "you\'re losing money on gold" but "your XAUUSD longs against bearish HTF bias have -0.8R expectancy over 5 trades — consider eliminating this setup."' },
    ],
  },
  {
    id: 'workflow',
    title: 'Daily Workflow',
    subtitle: 'Your Routine',
    icon: CalendarCheck,
    content: [
      { heading: 'Step 1: Review Performance Analyst', body: 'Start each day by checking the Performance Analyst for any new leaks or deteriorating segments. Are any previously profitable setups turning negative?' },
      { heading: 'Step 2: Test in Optimizer', body: 'If you spot a concern, run it through the Strategy Optimizer. Simulate removing or adjusting the setup. See the projected impact before making real changes.' },
      { heading: 'Step 3: Log Trades in Trades DB', body: 'After your session, log every trade with complete details: instrument, session, HTF bias, confidence, emotional state, and plan adherence. The more data, the smarter EdgeFlow becomes.' },
      { heading: 'Continuous Improvement', body: 'This cycle — Detect → Test → Execute → Log — is how professional traders evolve. EdgeFlow automates the detection and testing. You focus on execution.' },
    ],
  },
];

export default function Guide() {
  const navigate = useNavigate();
  const { guideProgress, markSectionComplete, completeOnboarding } = useOnboarding();
  const [activeIndex, setActiveIndex] = useState(0);

  const activeSection = SECTIONS[activeIndex];
  const isCompleted = (id: string) => guideProgress.includes(id);
  const isLast = activeIndex === SECTIONS.length - 1;

  const handleContinue = async () => {
    await markSectionComplete(activeSection.id);
    if (isLast) {
      await completeOnboarding();
      navigate('/analyst?tour=1');
    } else {
      setActiveIndex(i => i + 1);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold">Platform Guide</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {guideProgress.length}/{SECTIONS.length} sections completed
            </p>
          </div>
          <Button variant="ghost" size="sm" className="text-xs" onClick={async () => {
            await completeOnboarding();
            navigate('/');
          }}>
            Skip Guide
          </Button>
        </div>

        <div className="flex gap-6">
          {/* Side nav */}
          <nav className="hidden md:flex flex-col gap-1 w-56 shrink-0">
            {SECTIONS.map((s, i) => {
              const Icon = s.icon;
              const done = isCompleted(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveIndex(i)}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all text-xs',
                    i === activeIndex
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                  )}
                >
                  {done ? (
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  ) : (
                    <Icon className="h-4 w-4 shrink-0" />
                  )}
                  <span className="truncate">{s.title}</span>
                </button>
              );
            })}
          </nav>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection.id}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
              >
                <div className="glass-card p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2.5 rounded-xl bg-primary/10">
                      <activeSection.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">{activeSection.title}</h2>
                      {activeSection.subtitle && (
                        <p className="text-xs text-muted-foreground">{activeSection.subtitle}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-5">
                    {activeSection.content.map((block, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                      >
                        <h3 className="text-sm font-semibold mb-1">{block.heading}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">{block.body}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs gap-1"
                      disabled={activeIndex === 0}
                      onClick={() => setActiveIndex(i => i - 1)}
                    >
                      <ArrowLeft className="h-3 w-3" /> Previous
                    </Button>

                    <div className="flex gap-1">
                      {SECTIONS.map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            'h-1.5 rounded-full transition-all',
                            i === activeIndex ? 'w-6 bg-primary' : isCompleted(SECTIONS[i].id) ? 'w-1.5 bg-primary/40' : 'w-1.5 bg-border'
                          )}
                        />
                      ))}
                    </div>

                    <Button
                      size="sm"
                      className="text-xs gap-1"
                      onClick={handleContinue}
                    >
                      {isLast ? 'Finish Guide' : 'Continue'}
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Mobile section selector */}
            <div className="flex md:hidden gap-1 mt-4 overflow-x-auto pb-2">
              {SECTIONS.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setActiveIndex(i)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-[10px] font-medium whitespace-nowrap transition-all',
                    i === activeIndex ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                  )}
                >
                  {s.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
