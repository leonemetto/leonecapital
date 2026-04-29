import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/hooks/useOnboarding';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, MagnifyingGlass, Lightning, Brain, CalendarCheck, ArrowRight, ArrowLeft, CheckCircle,
} from '@phosphor-icons/react';

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
    icon: MagnifyingGlass,
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
    icon: Lightning,
    content: [
      { heading: 'Validating Your Edge', body: 'Click the ⚡ icon on any table row to load that segment into the Strategy Optimizer. It instantly shows you what your equity curve would look like if you only traded that setup — or removed it entirely.' },
      { heading: 'The Ghost Curve', body: 'The dashed gray line is your total portfolio. The bold green line is the filtered strategy. When the green line outperforms the gray — you\'ve found something worth keeping.' },
      { heading: 'From Hunch to Validated Strategy', body: 'Think XAUUSD longs are killing you? Don\'t guess — simulate. Filter them out and see the exact dollar impact on your P&L, drawdown, and expectancy.' },
    ],
  },
  {
    id: 'ai-advisor',
    title: 'Atlas',
    subtitle: 'Your Consultant',
    icon: Brain,
    content: [
      { heading: 'Deep Analysis', body: 'The Atlas analyzes patterns across all your trades. It identifies toxic combinations — like going long on instruments with a Bearish HTF FVG — that you might not notice manually.' },
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
        <div className="flex items-center justify-between border-b border-border" style={{ paddingBottom: 12, marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--ef-ink)' }}>Platform Guide</h1>
            <div className="font-mono" style={{ fontSize: 12.5, color: 'var(--ef-ink-3)', marginTop: 2 }}>
              {guideProgress.length}/{SECTIONS.length} sections completed
            </div>
          </div>
          <button
            style={{ fontSize: 12, color: 'var(--ef-ink-3)', background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={async () => {
              await completeOnboarding();
              navigate('/dashboard');
            }}
          >
            Skip Guide
          </button>
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
                      ? 'bg-white/10 text-white font-semibold border-l-2 border-white pl-[10px]'
                      : 'border-l-2 border-transparent pl-[10px] hover:bg-white/5 hover:text-white'
                  )}
                >
                  {done ? (
                    <CheckCircle size={16} weight="fill" color="var(--ef-ink)" />
                  ) : (
                    <Icon size={16} weight="regular" color="var(--ef-ink-3)" />
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
                    <div style={{ padding: 10, borderRadius: 10, background: 'var(--ef-bg-elev)', border: '1px solid var(--ef-line)' }}>
                      <activeSection.icon size={20} weight="regular" color="var(--ef-ink-3)" />
                    </div>
                    <div>
                      <h2 style={{ margin: 0, fontSize: 16, fontWeight: 500, color: 'var(--ef-ink)' }}>{activeSection.title}</h2>
                      {activeSection.subtitle && (
                        <p className="font-mono" style={{ margin: 0, fontSize: 11, color: 'var(--ef-ink-3)' }}>{activeSection.subtitle}</p>
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
                      <ArrowLeft size={12} weight="regular" /> Previous
                    </Button>

                    <div className="flex gap-1">
                      {SECTIONS.map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            'h-1.5 rounded-full transition-all',
                            i === activeIndex ? 'w-6 bg-white' : isCompleted(SECTIONS[i].id) ? 'w-1.5 bg-white/30' : 'w-1.5 bg-white/10'
                          )}
                        />
                      ))}
                    </div>

                    <Button
                      size="sm"
                      className="text-xs gap-1 bg-white text-black hover:bg-white/90 rounded-[24px]"
                      onClick={handleContinue}
                    >
                      {isLast ? 'Finish Guide' : 'Continue'}
                      <ArrowRight size={12} weight="regular" />
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
                    i === activeIndex ? 'bg-white text-black' : 'bg-white/5 text-white/50'
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
