import { useNavigate } from 'react-router-dom';
import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  motion, useInView, useScroll, useReducedMotion, AnimatePresence,
} from 'framer-motion';
import { cn } from '@/lib/utils';
import { ContainerScroll } from '@/components/ui/container-scroll-animation';
import {
  ArrowRight, Brain, CheckCircle, X, List, CaretDown,
} from '@phosphor-icons/react';

/* ─── Logo ─── */
function EdgeFlowMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden>
      <line x1="3" y1="3" x2="3" y2="17" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square"/>
      <line x1="3" y1="3" x2="16" y2="3" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square"/>
      <line x1="3" y1="10" x2="12" y2="10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square"/>
      <line x1="12" y1="10" x2="16" y2="6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square"/>
      <line x1="3" y1="17" x2="16" y2="17" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square"/>
    </svg>
  );
}

/* ─── Scroll reveal ─── */
function Reveal({ children, delay = 0, className = '' }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const reduced = useReducedMotion();
  if (reduced) return <div ref={ref} className={className}>{children}</div>;
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y: 32, filter: 'blur(8px)' }}
      animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

/* ══════════════════════════════════
   MOCK SCREENS
   ══════════════════════════════════ */

function MockDashboard() {
  return (
    <div className="w-full h-full bg-[#080808] flex overflow-hidden text-white">
      <div className="w-[52px] bg-[#0a0a0a] border-r border-white/[0.05] flex flex-col items-center py-4 gap-3 shrink-0">
        <div className="mb-3 text-[#10b981]"><EdgeFlowMark size={14}/></div>
        {[true,false,false,false,false,false].map((a,i) => (
          <div key={i} className={cn('w-7 h-7 rounded-lg flex items-center justify-center', a ? 'bg-white' : '')}>
            <div className={cn('w-3 h-0.5 rounded-full', a ? 'bg-black' : 'bg-white/15')}/>
          </div>
        ))}
      </div>
      <div className="flex-1 p-5 overflow-hidden flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white text-[12px] font-semibold">Good morning, Alex</p>
            <p className="text-white/25 text-[10px]">Your edge summary</p>
          </div>
          <div className="flex gap-2">
            <div className="px-3 py-1.5 rounded-full border border-white/10 text-[9px] text-white/30">Checklist</div>
            <div className="px-3 py-1.5 rounded-full bg-white text-black text-[9px] font-bold">+ Log Trade</div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Net P&L',  value: '+$8,420', color: '#10b981' },
            { label: 'Win Rate', value: '67%',      color: '#10b981' },
            { label: 'Avg R',    value: '2.1R',     color: 'white'   },
            { label: 'Max DD',   value: '$340',     color: '#f87171' },
          ].map(s => (
            <div key={s.label} className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-2.5">
              <p className="text-[8px] text-white/25 uppercase tracking-widest mb-1">{s.label}</p>
              <p className="text-[14px] font-bold tabular-nums" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3.5 flex-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[8px] text-white/25 uppercase tracking-widest">Equity Curve</p>
            <div className="flex gap-1">
              {['D','W','M'].map((p,i) => (
                <span key={p} className={cn('text-[8px] px-2 py-0.5 rounded', i===0?'bg-white text-black font-bold':'text-white/20')}>{p}</span>
              ))}
            </div>
          </div>
          <svg viewBox="0 0 500 80" className="w-full">
            <defs>
              <linearGradient id="dash-g" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.2"/>
                <stop offset="100%" stopColor="#10b981" stopOpacity="0"/>
              </linearGradient>
            </defs>
            {[20,40,60].map(y => <line key={y} x1="0" y1={y} x2="500" y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>)}
            <path d="M0 72 C50 68 80 62 120 55 S180 44 230 36 S290 24 340 18 S400 10 450 7 S480 5 500 4"
              stroke="#10b981" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            <path d="M0 72 C50 68 80 62 120 55 S180 44 230 36 S290 24 340 18 S400 10 450 7 S480 5 500 4 L500 80 L0 80Z"
              fill="url(#dash-g)"/>
          </svg>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3">
            <p className="text-[8px] text-white/25 uppercase tracking-widest mb-2">Recent Trades</p>
            {[['XAUUSD','Long','+$340',true],['NQ100','Short','−$120',false],['GBPUSD','Long','+$210',true]].map(([p,d,v,w]) => (
              <div key={String(p)} className="flex items-center justify-between py-1 border-b border-white/[0.03] last:border-0">
                <div className="flex items-center gap-1.5">
                  <div className={cn('w-0.5 h-3.5 rounded-full', w ? 'bg-[#10b981]' : 'bg-[#f87171]')}/>
                  <span className="text-[10px] font-medium">{p}</span>
                  <span className="text-[8px] text-white/25">{d}</span>
                </div>
                <span className={cn('text-[10px] font-bold tabular-nums', w ? 'text-[#10b981]' : 'text-[#f87171]')}>{v}</span>
              </div>
            ))}
          </div>
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3">
            <p className="text-[8px] text-white/25 uppercase tracking-widest mb-2">By Session</p>
            {[['London',74],['New York',48],['Asia',61],['Overlap',82]].map(([s,w]) => (
              <div key={String(s)} className="flex items-center gap-2 py-1">
                <span className="text-[9px] text-white/35 w-14 shrink-0">{s}</span>
                <div className="flex-1 h-1 bg-white/[0.05] rounded-full">
                  <div className={cn('h-full rounded-full', Number(w)>=50?'bg-[#10b981]':'bg-[#f87171]')} style={{width:`${w}%`}}/>
                </div>
                <span className={cn('text-[9px] font-semibold tabular-nums', Number(w)>=50?'text-[#10b981]':'text-[#f87171]')}>{w}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MockLeaks() {
  return (
    <div className="w-full h-full bg-[#080808] p-5 overflow-hidden flex flex-col text-white">
      <div className="mb-4">
        <p className="text-white font-semibold text-[12px]">Leak Detection</p>
        <p className="text-white/30 text-[10px]">Patterns quietly draining your account</p>
      </div>
      <div className="space-y-2.5">
        {[
          { sev:'critical', title:'New York session — Short trades', detail:'0% win rate across 14 trades. −$2,340 total.', avg:'−$167 / trade avg' },
          { sev:'warning',  title:'Emotional state below 3/5',        detail:'23% win rate when low vs 71% when confident.',  avg:'−$340 / trade avg' },
          { sev:'warning',  title:'Friday afternoon — all pairs',      detail:'31% win rate. 9 consecutive losses in 3 weeks.', avg:'−$89 / trade avg'  },
        ].map((l,i) => (
          <div key={i} className={cn('rounded-xl border p-3.5', l.sev==='critical'?'border-[#f87171]/20 bg-[#f87171]/[0.04]':'border-white/[0.07] bg-white/[0.02]')}>
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <p className="text-[11px] font-semibold text-white">{l.title}</p>
              <span className={cn('text-[8px] font-bold px-2 py-0.5 rounded-full shrink-0 uppercase', l.sev==='critical'?'bg-[#f87171]/15 text-[#f87171]':'bg-[#f59e0b]/15 text-[#f59e0b]')}>{l.sev}</span>
            </div>
            <p className="text-[10px] text-white/35 mb-1">{l.detail}</p>
            <p className="text-[10px] font-semibold text-[#f87171]">{l.avg}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockAnalyst() {
  return (
    <div className="w-full h-full bg-[#080808] p-5 overflow-hidden flex flex-col text-white">
      <div className="mb-4">
        <p className="text-white font-semibold text-[12px]">Performance Analytics</p>
        <p className="text-white/30 text-[10px]">Expectancy breakdown by every variable</p>
      </div>
      <div className="grid grid-cols-4 gap-2 mb-3.5">
        {[['+0.42R','R-Expect','#10b981'],['67%','Win Rate','#10b981'],['2.4','Prof. Factor','white'],['$420','Max DD','#f87171']].map(([v,l,c]) => (
          <div key={String(l)} className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-2.5">
            <p className="text-[8px] text-white/25 uppercase tracking-widest mb-1">{l}</p>
            <p className="text-[13px] font-bold tabular-nums" style={{ color: c as string }}>{v}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2.5 flex-1">
        {[
          { title:'By Instrument', rows:[['XAUUSD','72%','+0.68R',true],['NQ100','50%','+0.12R',true],['EUR/USD','38%','−0.34R',false],['GBP/USD','33%','−0.41R',false]] },
          { title:'By Session',    rows:[['London','74%','+0.82R',true],['Overlap','82%','+1.20R',true],['New York','48%','+0.11R',true],['Asia','33%','−0.41R',false]] },
        ].map(({ title, rows }) => (
          <div key={title} className="rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
            <div className="px-3 py-2 border-b border-white/[0.05]">
              <p className="text-[8px] font-semibold uppercase tracking-widest text-white/25">{title}</p>
            </div>
            {rows.map(r => (
              <div key={String(r[0])} className="flex items-center px-3 py-1.5 border-b border-white/[0.03] last:border-0">
                <div className="flex items-center gap-1.5 flex-1">
                  <div className={cn('w-0.5 h-3 rounded-full', r[3]?'bg-[#10b981]':'bg-[#f87171]')}/>
                  <span className="text-[10px] text-white/65">{r[0]}</span>
                </div>
                <span className="text-[9px] text-[#10b981] w-8 text-right">{r[1]}</span>
                <span className={cn('text-[9px] font-semibold tabular-nums w-12 text-right', r[3]?'text-[#10b981]':'text-[#f87171]')}>{r[2]}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function MockAI() {
  return (
    <div className="w-full h-full bg-[#080808] p-5 flex flex-col overflow-hidden text-white">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-xl bg-[#10b981]/10 border border-[#10b981]/20 flex items-center justify-center">
          <Brain className="h-3.5 w-3.5 text-[#10b981]" weight="regular"/>
        </div>
        <div>
          <p className="text-white font-semibold text-[12px]">AI Advisor</p>
          <p className="text-white/30 text-[10px]">Based on your last 42 trades</p>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse"/>
          <span className="text-[9px] text-[#10b981]">Live</span>
        </div>
      </div>
      <div className="flex-1 space-y-2.5 overflow-hidden">
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-3.5">
          <p className="text-[11px] text-white/65 leading-relaxed">
            Your <span className="text-white font-semibold">London session</span> is carrying your account. 74% win rate, +0.82R expectancy. New York is the opposite — 48% at +0.11R. That's not a bad month, that's structural.
          </p>
        </div>
        <div className="bg-[#f87171]/[0.04] border border-[#f87171]/20 rounded-xl p-3.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-1 h-1 rounded-full bg-[#f87171]"/>
            <p className="text-[9px] font-bold text-[#f87171] uppercase tracking-widest">Pattern Detected</p>
          </div>
          <p className="text-[11px] text-white/60 leading-relaxed">
            You lose <span className="text-[#f87171] font-semibold">$340 on average</span> when emotional state is below 3/5. That's not variance — your data shows it across 11 trades.
          </p>
        </div>
        <div className="flex justify-end">
          <div className="bg-white text-black rounded-xl rounded-tr-sm px-3.5 py-2.5 max-w-[75%]">
            <p className="text-[11px]">What should I stop trading?</p>
          </div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-3.5 max-w-[90%]">
          <p className="text-[11px] text-white/65 leading-relaxed">
            Cut NY session shorts. 0% win rate across 14 trades, −$2,340 total. That's your clearest drain.
          </p>
        </div>
      </div>
    </div>
  );
}

function MockOptimizer() {
  return (
    <div className="w-full h-full bg-[#080808] p-5 overflow-hidden flex flex-col text-white">
      <div className="mb-4">
        <p className="text-white font-semibold text-[12px]">What-If Simulator</p>
        <p className="text-white/30 text-[10px]">Simulate before you change anything</p>
      </div>
      <div className="rounded-xl bg-white/[0.03] border border-white/[0.07] p-3.5 mb-3">
        <p className="text-[9px] text-white/30 uppercase tracking-widest mb-2.5">Scenario: Remove NY session shorts</p>
        <div className="grid grid-cols-3 gap-3">
          {[['Net P&L','$4,120 → $6,460','text-[#10b981]'],['Win Rate','62% → 74%','text-[#10b981]'],['Max DD','$840 → $420','text-[#10b981]']].map(([l,v,c]) => (
            <div key={String(l)}>
              <p className="text-[8px] text-white/25 mb-0.5">{l}</p>
              <p className={cn('text-[10px] font-semibold tabular-nums', c)}>{v}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3 flex-1">
        <div className="flex items-center gap-4 mb-2.5">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-white/20 rounded-full" style={{ borderStyle:'dashed' }}/>
            <span className="text-[8px] text-white/25">Current</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-[#10b981] rounded-full"/>
            <span className="text-[8px] text-[#10b981]">Simulated</span>
          </div>
        </div>
        <svg viewBox="0 0 400 100" className="w-full" style={{ maxHeight: 120 }}>
          <defs>
            <linearGradient id="opt-g" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.15"/>
              <stop offset="100%" stopColor="#10b981" stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path d="M0 85 C40 78 80 70 120 62 S170 54 210 50 S260 46 300 49 S350 54 400 58"
            stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeDasharray="4,3"/>
          <path d="M0 85 C40 76 80 65 120 55 S170 42 210 34 S260 22 300 15 S350 9 400 5"
            stroke="#10b981" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          <path d="M0 85 C40 76 80 65 120 55 S170 42 210 34 S260 22 300 15 S350 9 400 5 L400 100 L0 100Z"
            fill="url(#opt-g)"/>
        </svg>
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   SCROLL STORY
   ══════════════════════════════════ */

const FEATURES = [
  {
    id: 'leaks',
    tag: 'Leak Detection',
    title: 'Find what\'s\nquietly draining\nyour account.',
    body: 'EdgeFlow scans every combination of session, setup, emotion, and direction. It surfaces the exact patterns with negative expectancy — not hunches, actual numbers from your own data.',
    Screen: MockLeaks,
  },
  {
    id: 'analytics',
    tag: 'Performance Analytics',
    title: 'Know your edge\nby the numbers.\nNot by feel.',
    body: 'Expectancy, win rate, R-multiple, and profit factor — broken down by instrument, session, strategy, HTF bias, and emotional state. Every variable you track becomes a data dimension you can filter and act on.',
    Screen: MockAnalyst,
  },
  {
    id: 'ai',
    tag: 'AI Advisor',
    title: 'An analyst who\nhas read every\ntrade you\'ve taken.',
    body: 'Ask it anything. It responds with your actual data — not generic trading advice. "Which session should I cut?" "Why do I keep losing on Fridays?" It knows because it\'s analyzed every entry.',
    Screen: MockAI,
  },
  {
    id: 'optimizer',
    tag: 'What-If Simulator',
    title: 'Before you change\nanything — see\nthe numbers first.',
    body: 'What if you only traded London? What if you skipped every low-confidence day? Run the simulation. See the exact P&L difference. Then decide.',
    Screen: MockOptimizer,
  },
];

function ScrollStory() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    return scrollYProgress.on('change', v => {
      setActive(Math.min(Math.floor(v * FEATURES.length), FEATURES.length - 1));
    });
  }, [scrollYProgress, reduced]);

  if (reduced) {
    return (
      <div className="max-w-6xl mx-auto px-6 space-y-24 py-12">
        {FEATURES.map(f => (
          <div key={f.id} className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/25 mb-5">{f.tag}</p>
              <h3 className="text-[32px] font-black tracking-[-1.5px] text-white leading-[1.1] mb-5 whitespace-pre-line">{f.title}</h3>
              <p className="text-white/40 text-[15px] leading-relaxed">{f.body}</p>
            </div>
            <div className="rounded-2xl border border-white/[0.09] overflow-hidden" style={{ height: 380, background: '#050505' }}>
              <f.Screen />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ height: `${FEATURES.length * 100}vh` }}>
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 w-full">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Text */}
            <div className="relative" style={{ height: 340 }}>
              <AnimatePresence mode="wait">
                {FEATURES.map((f, i) => i === active && (
                  <motion.div key={f.id}
                    initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -16, filter: 'blur(6px)' }}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0 flex flex-col justify-center">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30 mb-5">{f.tag}</p>
                    <h3 className="font-black tracking-[-2px] text-white leading-[1.08] mb-6 whitespace-pre-line"
                      style={{ fontSize: 'clamp(26px,3.2vw,40px)' }}>
                      {f.title}
                    </h3>
                    <p className="text-white/40 text-[15px] leading-relaxed max-w-md">{f.body}</p>
                    <div className="flex gap-2 mt-8">
                      {FEATURES.map((_, j) => (
                        <div key={j} className={cn(
                          'h-0.5 rounded-full transition-all duration-500',
                          j === active ? 'w-8 bg-white' : 'w-2 bg-white/15'
                        )}/>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Screen */}
            <div className="relative hidden md:block">
              <div className="absolute -inset-8 rounded-3xl blur-3xl opacity-10 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse, rgba(16,185,129,0.7) 0%, transparent 65%)' }}/>
              <div className="relative rounded-2xl border border-white/[0.09] overflow-hidden shadow-2xl"
                style={{ background: '#050505' }}>
                <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/[0.05]">
                  {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-white/10"/>)}
                  <AnimatePresence mode="wait">
                    {FEATURES.map((f, i) => i === active && (
                      <motion.span key={f.id}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="ml-2 text-[10px] text-white/18">
                        leone.capital / {f.tag.toLowerCase().replace(/\s/g, '-')}
                      </motion.span>
                    ))}
                  </AnimatePresence>
                </div>
                <AnimatePresence mode="wait">
                  {FEATURES.map((f, i) => i === active && (
                    <motion.div key={f.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                      style={{ height: 420 }}>
                      <f.Screen />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   PRICING
   ══════════════════════════════════ */
const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: '',
    sub: 'Start logging. See what the data says.',
    cta: 'Start for Free',
    featured: false,
    features: ['Up to 50 trades', 'Equity curve & calendar', 'Win/loss breakdown', '1 trading account', 'Session journal'],
    missing: ['AI Advisor', 'Leak Detection', 'What-If Simulator'],
  },
  {
    name: 'Pro',
    price: '$12',
    period: '/mo',
    sub: 'For traders serious about performance.',
    cta: 'Start Pro',
    featured: true,
    features: ['Unlimited trades', 'Full analytics suite', 'AI Advisor', 'Leak Detection', 'What-If Simulator', 'Up to 3 accounts', 'Pre-trade checklist'],
    missing: [],
  },
  {
    name: 'Elite',
    price: '$24',
    period: '/mo',
    sub: 'For professionals who trade full-time.',
    cta: 'Start Elite',
    featured: false,
    features: ['Everything in Pro', 'Unlimited accounts', 'CSV export', 'Priority support', 'Early feature access'],
    missing: [],
  },
];

/* ══════════════════════════════════
   FAQ
   ══════════════════════════════════ */
const FAQ_DATA = [
  { q: 'How is this different from a spreadsheet?', a: "A spreadsheet stores data. EdgeFlow analyzes it. Leak detection, expectancy breakdowns by every variable you track, behavioral pattern detection, a what-if simulator — none of that happens in a spreadsheet." },
  { q: 'Is EdgeFlow free?', a: 'The free plan lets you log up to 50 trades and see your equity curve and win/loss breakdown. Upgrade to Pro for the full analytics suite.' },
  { q: 'What markets does EdgeFlow support?', a: 'Forex, crypto, futures, stocks, indices, commodities. If you can trade it, you can analyze it.' },
  { q: 'Is my trading data secure?', a: 'All data is encrypted and stored in Supabase. Your data is never shared, sold, or used for any purpose other than showing it back to you.' },
  { q: 'How much data do I need before it becomes useful?', a: "EdgeFlow starts showing patterns from around 20–30 trades. The more data you add, the more precise the analysis gets. Most traders see their first clear insight within the first week." },
];

/* ══════════════════════════════════
   MAIN
   ══════════════════════════════════ */
export default function Landing() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/dashboard', { replace: true });
    });
  }, [navigate]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <div className="min-h-screen text-white overflow-x-hidden"
      style={{ background: '#000', fontFamily: "'Geist', system-ui, sans-serif" }}>

      {/* ── NAVBAR ── */}
      <nav className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
        scrolled ? 'bg-black/90 backdrop-blur-2xl border-b border-white/[0.07]' : 'bg-transparent'
      )}>
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <a href="/" className="flex items-center gap-2.5 text-white">
            <span className="text-[#10b981]"><EdgeFlowMark size={17}/></span>
            <span className="text-[13px] font-bold tracking-[-0.02em]">EDGEFLOW</span>
          </a>
          <div className="hidden md:flex items-center gap-8">
            {[['Analytics','#analytics'],['Pricing','#pricing'],['FAQ','#faq']].map(([l,h]) => (
              <a key={l} href={h} className="text-[13px] text-white/35 hover:text-white transition-colors">{l}</a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => navigate('/auth')} className="text-[13px] text-white/35 hover:text-white transition-colors px-3 py-2">Sign In</button>
            <button onClick={() => navigate('/auth')} className="px-5 py-2.5 rounded-full bg-white text-black text-[13px] font-bold hover:bg-white/90 active:scale-95 transition-all">
              Start Free
            </button>
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-white/50 p-2">
            {mobileOpen ? <X className="h-5 w-5" weight="regular"/> : <List className="h-5 w-5" weight="regular"/>}
          </button>
        </div>
        <AnimatePresence>
          {mobileOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/[0.06] bg-black/95 overflow-hidden">
              <div className="px-6 py-4 flex flex-col gap-1">
                {[['Analytics','#analytics'],['Pricing','#pricing'],['FAQ','#faq']].map(([l,h]) => (
                  <a key={l} href={h} onClick={() => setMobileOpen(false)} className="text-white/50 py-3 text-[14px] border-b border-white/[0.04]">{l}</a>
                ))}
                <div className="pt-3 flex flex-col gap-2">
                  <button onClick={() => navigate('/auth')} className="text-white/40 py-2 text-left text-[14px]">Sign In</button>
                  <button onClick={() => navigate('/auth')} className="w-full py-3 rounded-full bg-white text-black text-[14px] font-bold">Start Free</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── HERO ── */}
      <ContainerScroll
        titleComponent={
          <div className="px-6 pt-20 pb-4">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full mb-8"
              style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)' }}>
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-50"/>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#10b981]"/>
              </span>
              <span className="text-[11px] font-medium text-white/45 tracking-[0.05em]">Trading analytics platform</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="font-black leading-[1.04] tracking-[-3.5px] mb-6 text-white"
              style={{ fontSize: 'clamp(48px,7.5vw,88px)' }}>
              Your alpha<br/>is already<br/>in the data.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="text-white/40 text-[17px] max-w-xl mx-auto leading-relaxed mb-10">
              EdgeFlow breaks down every trade by session, setup, emotion, and strategy.
              It shows you exactly where your edge lives — and exactly what's draining it.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
              <button onClick={() => navigate('/auth')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white text-black text-[15px] font-bold hover:bg-white/90 active:scale-95 transition-all flex items-center justify-center gap-2">
                Start Free — No Card Needed <ArrowRight className="h-4 w-4" weight="bold"/>
              </button>
              <a href="#analytics" className="text-white/30 text-[14px] py-3 px-4 hover:text-white transition-colors">
                See what it finds ↓
              </a>
            </motion.div>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
              className="text-[12px] text-white/20">
              Free to start &nbsp;·&nbsp; No credit card &nbsp;·&nbsp; 30 seconds to set up
            </motion.p>
          </div>
        }
      >
        <MockDashboard />
      </ContainerScroll>

      {/* ── POSITIONING STATEMENT ── */}
      <section className="py-24 px-6 border-t border-white/[0.05]">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <p className="leading-[1.45] tracking-[-0.5px] text-white/50 font-medium"
              style={{ fontSize: 'clamp(20px,3vw,32px)' }}>
              Most traders lose the same trades on repeat.{' '}
              <span className="text-white">They just can't see the pattern.</span>{' '}
              EdgeFlow is the analytics layer between your trade history and the insights that
              actually change your performance.{' '}
              <span className="text-white">Not a journal. A performance platform.</span>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── SCROLL STORY ── */}
      <section id="analytics" className="border-t border-white/[0.05]">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <Reveal className="mb-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/25 mb-4">The Platform</p>
            <h2 className="text-white font-black tracking-[-2.5px] max-w-2xl"
              style={{ fontSize: 'clamp(30px,4.5vw,54px)' }}>
              Four tools that turn your trading history into a competitive advantage.
            </h2>
          </Reveal>
        </div>
        <ScrollStory />
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-28 px-6 border-t border-white/[0.05]">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/25 mb-4">Pricing</p>
            <h2 className="text-white font-black tracking-[-2px] mb-3"
              style={{ fontSize: 'clamp(32px,5vw,54px)' }}>
              Simple. No surprises.
            </h2>
            <p className="text-white/35 text-[15px] mb-16">Start free. Upgrade when the data shows you it's worth it.</p>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-4">
            {PLANS.map((plan, i) => (
              <Reveal key={plan.name} delay={0.08 * i}>
                <div className={cn(
                  'rounded-2xl border p-7 h-full flex flex-col relative',
                  plan.featured ? 'border-white/20 bg-white/[0.04]' : 'border-white/[0.07] bg-white/[0.02]'
                )}>
                  {plan.featured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 rounded-full bg-white text-black text-[10px] font-bold tracking-wider">MOST POPULAR</span>
                    </div>
                  )}
                  <div className="mb-6">
                    <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/30 mb-3">{plan.name}</p>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-[38px] font-black tracking-[-2px] text-white tabular-nums">{plan.price}</span>
                      {plan.period && <span className="text-[14px] text-white/35">{plan.period}</span>}
                    </div>
                    <p className="text-[13px] text-white/35">{plan.sub}</p>
                  </div>
                  <button onClick={() => navigate('/auth')}
                    className="w-full py-3 rounded-full text-[14px] font-bold mb-7 transition-all active:scale-95 bg-white text-black hover:bg-white/90">
                    {plan.cta}
                  </button>
                  <div className="flex-1 space-y-3">
                    {plan.features.map(f => (
                      <div key={f} className="flex items-center gap-2.5">
                        <CheckCircle className="h-4 w-4 shrink-0 text-[#10b981]" weight="fill"/>
                        <span className="text-[13px] text-white/65">{f}</span>
                      </div>
                    ))}
                    {plan.missing.map(f => (
                      <div key={f} className="flex items-center gap-2.5 opacity-25">
                        <X className="h-4 w-4 shrink-0" weight="bold"/>
                        <span className="text-[13px] line-through">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-28 px-6 border-t border-white/[0.05]">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/25 mb-4">FAQ</p>
            <h2 className="text-white font-black tracking-[-2px] mb-12"
              style={{ fontSize: 'clamp(32px,5vw,54px)' }}>
              Questions.
            </h2>
          </Reveal>
          {FAQ_DATA.map((item, i) => (
            <Reveal key={i} delay={0.04 * i}>
              <div className="border-b border-white/[0.06]">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between py-5 text-left gap-4 outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded">
                  <span className="text-[15px] font-medium text-white">{item.q}</span>
                  <CaretDown className={cn('h-4 w-4 text-white/25 shrink-0 transition-transform duration-300', openFaq === i && 'rotate-180')} weight="bold"/>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                      <p className="pb-5 text-white/40 text-[14px] leading-relaxed">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-32 px-6 border-t border-white/[0.05]">
        <Reveal>
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-white font-black tracking-[-3px] mb-6"
              style={{ fontSize: 'clamp(40px,6vw,72px)' }}>
              Your edge is in<br/>the data.
            </h2>
            <p className="text-white/35 text-[16px] mb-10 leading-relaxed">
              You already have the data from every trade you've taken.<br/>EdgeFlow shows you what it means.
            </p>
            <button onClick={() => navigate('/auth')}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-black text-[15px] font-bold hover:bg-white/90 active:scale-95 transition-all">
              Start Free — No Card Needed <ArrowRight className="h-4 w-4" weight="bold"/>
            </button>
          </div>
        </Reveal>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/[0.05] px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <span className="text-[#10b981]"><EdgeFlowMark size={15}/></span>
            <span className="text-[13px] font-bold text-white tracking-[-0.02em]">EDGEFLOW</span>
          </div>
          <div className="flex items-center gap-6">
            {[['Analytics','#analytics'],['Pricing','#pricing'],['FAQ','#faq']].map(([l,h]) => (
              <a key={l} href={h} className="text-[12px] text-white/25 hover:text-white transition-colors">{l}</a>
            ))}
            <button onClick={() => navigate('/auth')} className="text-[12px] text-white/25 hover:text-white transition-colors">Sign In</button>
          </div>
          <p className="text-[11px] text-white/20">© {new Date().getFullYear()} EdgeFlow. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}
