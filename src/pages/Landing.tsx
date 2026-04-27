import { useNavigate } from 'react-router-dom';
import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  motion, useInView, useScroll, useReducedMotion, AnimatePresence,
} from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  ArrowRight, Brain, CheckCircle, X, List, CaretDown,
  ChartLine, MagnifyingGlass, Robot, Clipboard, Sliders, FileArrowDown,
  Lightning, ArrowsClockwise,
} from '@phosphor-icons/react';

/* ─────────────────────────────────────────
   LOGO MARK
───────────────────────────────────────── */
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

/* ─────────────────────────────────────────
   SCROLL REVEAL
───────────────────────────────────────── */
function Reveal({ children, delay = 0, className = '' }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const reduced = useReducedMotion();
  if (reduced) return <div ref={ref} className={className}>{children}</div>;
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

/* ─────────────────────────────────────────
   SECTION LABEL  (• Label)
───────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"/>
      <span className="text-[13px] text-[#10b981] font-medium tracking-[0.04em]">{children}</span>
    </div>
  );
}

/* ─────────────────────────────────────────
   MOCK SCREENS
───────────────────────────────────────── */
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
          { sev:'warning',  title:'Emotional state below 3/5',       detail:'23% win rate when low vs 71% when confident.', avg:'−$340 / trade avg' },
          { sev:'warning',  title:'Friday afternoon — all pairs',     detail:'31% win rate. 9 consecutive losses in 3 weeks.', avg:'−$89 / trade avg' },
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
            Your <span className="text-white font-semibold">London session</span> is carrying your account. 74% win rate, +0.82R expectancy. New York is the opposite — 48% at +0.11R. That's structural.
          </p>
        </div>
        <div className="bg-[#f87171]/[0.04] border border-[#f87171]/20 rounded-xl p-3.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-1 h-1 rounded-full bg-[#f87171]"/>
            <p className="text-[9px] font-bold text-[#f87171] uppercase tracking-widest">Pattern Detected</p>
          </div>
          <p className="text-[11px] text-white/60 leading-relaxed">
            You lose <span className="text-[#f87171] font-semibold">$340 on average</span> when emotional state is below 3/5. That's 11 trades of data — not variance.
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
            <div className="w-4 h-0.5 bg-white/20 rounded-full"/>
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

/* ─────────────────────────────────────────
   STICKY SCROLL STORY
───────────────────────────────────────── */
const FEATURES = [
  { id:'leaks',     tag:'Leak Detection',       Screen: MockLeaks,
    title:'Find what\'s quietly\ndraining your account.',
    body:'EdgeFlow scans every combination — session, setup, emotion, direction. It surfaces patterns with negative expectancy. Not hunches. Numbers from your own data.' },
  { id:'analytics', tag:'Performance Analytics', Screen: MockAnalyst,
    title:'Your edge by the\nnumbers. Not by feel.',
    body:'Expectancy, win rate, R-multiple, profit factor — broken down by instrument, session, strategy, HTF bias, and emotional state. Every variable becomes a data dimension you can act on.' },
  { id:'ai',        tag:'AI Advisor',             Screen: MockAI,
    title:'An analyst who\'s read\nevery trade you\'ve taken.',
    body:'Ask it anything. It answers with your actual data — not generic advice. "Which session should I cut?" It knows because it\'s analyzed every entry.' },
  { id:'optimizer', tag:'What-If Simulator',     Screen: MockOptimizer,
    title:'Before you change\nanything — see the\nnumbers first.',
    body:'What if you only traded London? What if you skipped every low-confidence day? Run the simulation. See the exact P&L difference. Then decide.' },
];

function ScrollStory() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] });
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
              <p className="text-[11px] font-medium text-[#10b981] tracking-[0.08em] mb-4">{f.tag}</p>
              <h3 className="text-[32px] font-black tracking-[-1.5px] text-white leading-[1.1] mb-5 whitespace-pre-line">{f.title}</h3>
              <p className="text-white/40 text-[15px] leading-relaxed">{f.body}</p>
            </div>
            <div className="rounded-2xl border border-white/[0.09] overflow-hidden bg-[#050505]" style={{ height: 380 }}>
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
            <div className="relative" style={{ height: 340 }}>
              <AnimatePresence mode="wait">
                {FEATURES.map((f, i) => i === active && (
                  <motion.div key={f.id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0 flex flex-col justify-center">
                    <p className="text-[11px] font-medium text-[#10b981] tracking-[0.08em] mb-5">{f.tag}</p>
                    <h3 className="font-black tracking-[-2px] text-white leading-[1.08] mb-6 whitespace-pre-line"
                      style={{ fontSize: 'clamp(26px,3.2vw,42px)' }}>
                      {f.title}
                    </h3>
                    <p className="text-white/40 text-[15px] leading-relaxed max-w-md">{f.body}</p>
                    <div className="flex gap-2 mt-8">
                      {FEATURES.map((_, j) => (
                        <div key={j} className={cn(
                          'h-0.5 rounded-full transition-all duration-500',
                          j === active ? 'w-8 bg-[#10b981]' : 'w-2 bg-white/10'
                        )}/>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <div className="relative hidden md:block">
              <div className="absolute -inset-10 rounded-3xl blur-3xl opacity-10 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse, rgba(16,185,129,0.8) 0%, transparent 65%)' }}/>
              <div className="relative rounded-2xl border border-white/[0.08] overflow-hidden shadow-2xl bg-[#050505]">
                <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/[0.05]">
                  {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-white/10"/>)}
                  <AnimatePresence mode="wait">
                    {FEATURES.map((f, i) => i === active && (
                      <motion.span key={f.id}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="ml-2 text-[10px] text-white/18">
                        edgeflow / {f.tag.toLowerCase().replace(/\s/g, '-')}
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
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
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

/* ─────────────────────────────────────────
   DATA
───────────────────────────────────────── */
const STEPS = [
  {
    n: '01',
    title: 'Log your trades',
    body: 'Takes 30 seconds. Pair, direction, P&L, session, emotional state, checklist — all in one form.',
    Screen: MockDashboard,
  },
  {
    n: '02',
    title: 'Discover your patterns',
    body: 'EdgeFlow breaks down every trade by 8+ variables. Win rate, expectancy, and R-multiple by session, strategy, emotion, and bias.',
    Screen: MockAnalyst,
  },
  {
    n: '03',
    title: 'Cut your leaks',
    body: 'See the exact patterns draining your P&L — with real numbers. Stop the losers. Double down on what actually works.',
    Screen: MockLeaks,
  },
];

const FEATURE_GRID = [
  { Icon: Robot,         label: 'AI Advisor',          body: 'Ask your data anything. Get answers backed by your actual trades — not generic advice.' },
  { Icon: MagnifyingGlass, label: 'Leak Detection',    body: 'Automated scan of every variable combination to find exactly what\'s costing you money.' },
  { Icon: ChartLine,     label: 'Performance Analytics', body: 'Expectancy, win rate, and R-multiple broken down by every dimension you track.' },
  { Icon: Clipboard,     label: 'Entry Checklist',     body: 'Custom pre-trade criteria. Track compliance and see how it affects your win rate.' },
  { Icon: Sliders,       label: 'What-If Simulator',   body: 'Model any filter change against your real history. See the P&L impact before committing.' },
  { Icon: FileArrowDown, label: 'PDF Export',          body: 'Full performance reports as polished PDFs. Weekly, monthly, or on demand.' },
];

const COMPARISON = {
  them: [
    'Manual tracking in spreadsheets',
    'Basic win/loss stats only',
    'No pattern or leak detection',
    'No AI coaching or insights',
    'No emotional or session data',
    'Journal. Not analytics.',
  ],
  us: [
    'Automated analytics on every log',
    'Expectancy across 8+ dimensions',
    'Leak detection with exact P&L impact',
    'AI Advisor built on your real data',
    'Session, emotion, HTF bias tracking',
    'Performance platform, not a journal.',
  ],
};

const TESTIMONIALS = [
  {
    quote: "I'd been losing money on Friday afternoons for 6 months and had no idea. EdgeFlow showed me in 10 seconds. Cut that session, immediately improved.",
    name: 'James R.',
    role: 'Forex trader, 4 years',
  },
  {
    quote: 'The AI Advisor told me my shorts had a 0% win rate across 16 trades. I thought I was balanced. The data said otherwise. Changed how I trade entirely.',
    name: 'Amara T.',
    role: 'Prop firm trader',
  },
  {
    quote: 'Other journals just store data. EdgeFlow actually analyzes it. The what-if simulator alone is worth the subscription.',
    name: 'Daniel K.',
    role: 'Indices trader',
  },
];

const PLANS = [
  {
    name: 'Free',
    monthly: '$0', yearly: '$0',
    sub: 'Start logging. See what the data says.',
    cta: 'Get Started Free',
    featured: false,
    features: ['Up to 50 trades', 'Equity curve & calendar', 'Win/loss breakdown', '1 trading account', 'Session journal'],
    missing: ['AI Advisor', 'Leak Detection', 'What-If Simulator'],
  },
  {
    name: 'Pro',
    monthly: '$12', yearly: '$9',
    sub: 'For traders serious about their performance.',
    cta: 'Start Pro',
    featured: true,
    features: ['Unlimited trades', 'Full analytics suite', 'AI Advisor', 'Leak Detection', 'What-If Simulator', 'Up to 3 accounts', 'Entry checklist + compliance'],
    missing: [],
  },
];

const FAQ_DATA = [
  { q: 'How is this different from a spreadsheet?', a: 'A spreadsheet stores data. EdgeFlow analyzes it. Leak detection, expectancy breakdowns by every variable you track, behavioral pattern detection, a what-if simulator — none of that happens in a spreadsheet.' },
  { q: 'Is EdgeFlow free to use?', a: 'Yes. The free plan lets you log up to 50 trades and see your equity curve and win/loss breakdown. Upgrade to Pro for the full analytics suite, AI Advisor, and leak detection.' },
  { q: 'What markets does EdgeFlow support?', a: 'Forex, crypto, futures, stocks, indices, commodities. If you can trade it, you can analyze it.' },
  { q: 'Is my trading data secure?', a: 'All data is encrypted and stored in Supabase. Your data is never shared, sold, or used for any purpose other than showing it back to you.' },
  { q: 'How much data do I need before it becomes useful?', a: 'EdgeFlow starts showing patterns from around 20-30 trades. Most traders see their first clear insight within the first week.' },
  { q: 'Can I import my existing trade history?', a: 'Yes — EdgeFlow supports CSV import from MT4/MT5 and most major brokers, plus a generic CSV format for any broker.' },
];

/* ─────────────────────────────────────────
   MAIN EXPORT
───────────────────────────────────────── */
export default function Landing() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [yearly, setYearly] = useState(false);

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

      {/* ══════════════════════════════════════
          NAV
      ══════════════════════════════════════ */}
      <nav className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
        scrolled ? 'bg-black/90 backdrop-blur-2xl border-b border-white/[0.07]' : 'bg-transparent'
      )}>
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <a href="/" className="flex items-center gap-2.5 text-white">
            <span className="text-[#10b981]"><EdgeFlowMark size={17}/></span>
            <span className="text-[13px] font-bold tracking-[-0.02em]">EdgeFlow</span>
          </a>
          <div className="hidden md:flex items-center gap-8">
            {[['How it works','#how'],['Features','#features'],['Pricing','#pricing'],['FAQ','#faq']].map(([l,h]) => (
              <a key={l} href={h} className="text-[13px] text-white/40 hover:text-white transition-colors">{l}</a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => navigate('/auth')}
              className="text-[13px] text-white/40 hover:text-white transition-colors px-4 py-2 rounded-full border border-white/[0.08] hover:border-white/20">
              Sign In
            </button>
            <button onClick={() => navigate('/auth')}
              className="px-5 py-2.5 rounded-full bg-[#10b981] text-black text-[13px] font-bold hover:bg-[#0d9468] active:scale-95 transition-all flex items-center gap-1.5">
              Get Started <ArrowRight className="h-3.5 w-3.5" weight="bold"/>
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
                {[['How it works','#how'],['Features','#features'],['Pricing','#pricing'],['FAQ','#faq']].map(([l,h]) => (
                  <a key={l} href={h} onClick={() => setMobileOpen(false)} className="text-white/50 py-3 text-[14px] border-b border-white/[0.04]">{l}</a>
                ))}
                <div className="pt-3 flex flex-col gap-2">
                  <button onClick={() => navigate('/auth')} className="text-white/40 py-2 text-left text-[14px]">Sign In</button>
                  <button onClick={() => navigate('/auth')}
                    className="w-full py-3 rounded-full bg-[#10b981] text-black text-[14px] font-bold">
                    Get Started Free
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ══════════════════════════════════════
          HERO
      ══════════════════════════════════════ */}
      <section className="pt-36 pb-0 px-6 text-center relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.12) 0%, transparent 65%)' }}/>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 relative"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"/>
          <span className="text-[12px] text-[#10b981] font-medium tracking-[0.04em]">AI-Powered Trading Journal</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="font-black leading-[1.04] tracking-[-3.5px] mb-6 text-white mx-auto"
          style={{ fontSize: 'clamp(48px,7vw,86px)', maxWidth: 820 }}>
          Know your edge.<br/>Trade with precision.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="text-white/45 text-[17px] max-w-lg mx-auto leading-relaxed mb-10">
          EdgeFlow turns your trade history into a competitive edge — win rate patterns, leak detection, and an AI advisor built on your actual data.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-5">
          <button onClick={() => navigate('/auth')}
            className="px-8 py-3.5 rounded-full bg-[#10b981] text-black text-[15px] font-bold hover:bg-[#0d9468] active:scale-95 transition-all flex items-center gap-2">
            Start Free — No Card Needed <ArrowRight className="h-4 w-4" weight="bold"/>
          </button>
          <a href="#how"
            className="text-white/30 text-[14px] py-3 px-4 hover:text-white transition-colors">
            See how it works ↓
          </a>
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="text-[12px] text-white/20 mb-16">
          Free to start &nbsp;·&nbsp; No credit card &nbsp;·&nbsp; Set up in 2 minutes
        </motion.p>

        {/* Dashboard preview */}
        <motion.div
          initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-5xl mx-auto relative">
          <div className="absolute -inset-4 rounded-3xl pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 80%, rgba(16,185,129,0.08) 0%, transparent 60%)' }}/>
          <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl"
            style={{ height: 520, background: '#050505' }}>
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/[0.05]">
              {[0,1,2].map(i => <div key={i} className="w-2.5 h-2.5 rounded-full bg-white/10"/>)}
              <span className="ml-3 text-[11px] text-white/15">edgeflow.app / dashboard</span>
            </div>
            <div style={{ height: 'calc(100% - 44px)' }}>
              <MockDashboard />
            </div>
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════ */}
      <section id="how" className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <SectionLabel>How EdgeFlow works</SectionLabel>
            <h2 className="font-black tracking-[-2.5px] text-white mb-16"
              style={{ fontSize: 'clamp(32px,4.5vw,54px)' }}>
              From raw trades to<br/>actionable intelligence.
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-5">
            {STEPS.map((step, i) => (
              <Reveal key={step.n} delay={0.1 * i}>
                <div className="rounded-2xl border border-white/[0.08] overflow-hidden"
                  style={{ background: '#0a0a0a' }}>
                  {/* Mini screen preview */}
                  <div className="relative overflow-hidden" style={{ height: 240 }}>
                    <step.Screen />
                    <div className="absolute inset-0 pointer-events-none"
                      style={{ background: 'linear-gradient(to bottom, transparent 50%, #0a0a0a 100%)' }}/>
                  </div>
                  {/* Text */}
                  <div className="px-6 pb-6">
                    <span className="text-[11px] font-bold text-[#10b981] tracking-[0.08em] block mb-2">{step.n}</span>
                    <h3 className="text-[20px] font-bold text-white tracking-[-0.5px] mb-2">{step.title}</h3>
                    <p className="text-[14px] text-white/40 leading-relaxed">{step.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FEATURE SPOTLIGHT (split)
      ══════════════════════════════════════ */}
      <section className="py-12 px-6 border-t border-white/[0.05]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6 items-start mb-6">
            <Reveal>
              <h2 className="font-black tracking-[-2.5px] text-white"
                style={{ fontSize: 'clamp(30px,4vw,50px)' }}>
                See your performance<br/>in real time, clearly.
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="text-white/40 text-[16px] leading-relaxed md:pt-3">
                EdgeFlow shows your P&L, win rate, and behavioural patterns in visuals you can actually act on — not raw tables. Every chart links back to the trades behind it.
              </p>
            </Reveal>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {[
              { label: 'Smart Dashboard', Screen: MockDashboard },
              { label: 'AI Advisor',      Screen: MockAI },
            ].map(({ label, Screen }, i) => (
              <Reveal key={label} delay={0.08 * i}>
                <div className="rounded-2xl border border-white/[0.08] overflow-hidden" style={{ background: '#0a0a0a' }}>
                  <div style={{ height: 340 }}><Screen /></div>
                  <div className="px-5 py-4 border-t border-white/[0.05]">
                    <span className="text-[13px] font-semibold text-white/60">{label}</span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          SCROLL STORY (features deep dive)
      ══════════════════════════════════════ */}
      <section id="features" className="border-t border-white/[0.05]">
        <div className="max-w-6xl mx-auto px-6 pt-28 pb-12">
          <Reveal>
            <SectionLabel>Features</SectionLabel>
            <h2 className="font-black tracking-[-2.5px] text-white max-w-2xl"
              style={{ fontSize: 'clamp(30px,4.5vw,54px)' }}>
              Built for traders who want data, not guesses.
            </h2>
          </Reveal>
        </div>
        <ScrollStory />
      </section>

      {/* ══════════════════════════════════════
          FEATURE GRID (6 cards)
      ══════════════════════════════════════ */}
      <section className="py-20 px-6 border-t border-white/[0.05]">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURE_GRID.map(({ Icon, label, body }, i) => (
              <Reveal key={label} delay={0.06 * i}>
                <div className="rounded-2xl border border-white/[0.08] p-6 group hover:border-white/[0.14] transition-all duration-300"
                  style={{ background: '#0a0a0a' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                    style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <Icon className="h-5 w-5 text-[#10b981]" weight="regular"/>
                  </div>
                  <h3 className="text-[16px] font-bold text-white mb-2 tracking-[-0.3px]">{label}</h3>
                  <p className="text-[14px] text-white/40 leading-relaxed">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-10 text-center">
            <button onClick={() => navigate('/auth')}
              className="inline-flex items-center gap-2 text-[14px] text-[#10b981] hover:text-white transition-colors font-medium">
              Get started free <ArrowRight className="h-4 w-4" weight="bold"/>
            </button>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════
          COMPARISON
      ══════════════════════════════════════ */}
      <section className="py-28 px-6 border-t border-white/[0.05]">
        <div className="max-w-4xl mx-auto">
          <Reveal className="text-center mb-16">
            <SectionLabel>Why EdgeFlow?</SectionLabel>
            <h2 className="font-black tracking-[-2.5px] text-white"
              style={{ fontSize: 'clamp(32px,5vw,56px)' }}>
              There's a smarter way<br/>to review your trades.
            </h2>
          </Reveal>

          <Reveal>
            <div className="grid md:grid-cols-2 gap-4">
              {/* Other tools */}
              <div className="rounded-2xl border border-white/[0.07] p-7" style={{ background: '#080808' }}>
                <p className="text-[13px] font-semibold text-white/30 mb-6">Other Journals</p>
                <div className="space-y-4">
                  {COMPARISON.them.map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: 'rgba(248,113,113,0.12)' }}>
                        <X className="h-3 w-3 text-[#f87171]" weight="bold"/>
                      </div>
                      <span className="text-[14px] text-white/40 leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* EdgeFlow */}
              <div className="rounded-2xl border border-[#10b981]/30 p-7 relative overflow-hidden"
                style={{ background: 'rgba(16,185,129,0.04)' }}>
                <div className="absolute top-0 left-0 right-0 h-px"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.5), transparent)' }}/>
                <div className="flex items-center gap-2.5 mb-6">
                  <span className="text-[#10b981]"><EdgeFlowMark size={14}/></span>
                  <p className="text-[13px] font-semibold text-white">EdgeFlow</p>
                </div>
                <div className="space-y-4">
                  {COMPARISON.us.map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: 'rgba(16,185,129,0.15)' }}>
                        <CheckCircle className="h-3.5 w-3.5 text-[#10b981]" weight="fill"/>
                      </div>
                      <span className="text-[14px] text-white/75 leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════ */}
      <section className="py-16 px-6 border-t border-white/[0.05]">
        <div className="max-w-6xl mx-auto">
          <Reveal className="mb-12">
            <SectionLabel>From traders</SectionLabel>
            <h2 className="font-black tracking-[-2.5px] text-white"
              style={{ fontSize: 'clamp(30px,4vw,50px)' }}>
              Loved by serious traders.
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={i} delay={0.08 * i}>
                <div className="rounded-2xl border border-white/[0.08] p-6 h-full flex flex-col"
                  style={{ background: '#0a0a0a' }}>
                  <div className="flex gap-0.5 mb-5">
                    {[0,1,2,3,4].map(s => (
                      <svg key={s} className="w-3.5 h-3.5 text-[#10b981]" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                    ))}
                  </div>
                  <p className="text-[14px] text-white/60 leading-relaxed flex-1 mb-5">"{t.quote}"</p>
                  <div>
                    <p className="text-[13px] font-semibold text-white">{t.name}</p>
                    <p className="text-[12px] text-white/30">{t.role}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          PRICING
      ══════════════════════════════════════ */}
      <section id="pricing" className="py-28 px-6 border-t border-white/[0.05]">
        <div className="max-w-4xl mx-auto">
          <Reveal className="text-center mb-14">
            <SectionLabel>Pricing</SectionLabel>
            <h2 className="font-black tracking-[-2.5px] text-white mb-3"
              style={{ fontSize: 'clamp(32px,5vw,56px)' }}>
              Simple plans.
            </h2>
            <p className="text-white/40 text-[15px]">Start free. Upgrade when the data shows it's worth it.</p>

            {/* Toggle */}
            <div className="flex items-center justify-center gap-3 mt-8">
              <span className={cn('text-[14px] font-medium transition-colors', !yearly ? 'text-white' : 'text-white/30')}>Monthly</span>
              <button
                onClick={() => setYearly(!yearly)}
                className="relative w-11 h-6 rounded-full transition-colors"
                style={{ background: yearly ? '#10b981' : 'rgba(255,255,255,0.12)' }}>
                <div className={cn(
                  'absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300',
                  yearly ? 'left-6' : 'left-1'
                )}/>
              </button>
              <span className={cn('text-[14px] font-medium transition-colors', yearly ? 'text-white' : 'text-white/30')}>
                Yearly
                <span className="ml-1.5 text-[11px] font-bold text-[#10b981] px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(16,185,129,0.1)' }}>
                  Save 25%
                </span>
              </span>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-5">
            {PLANS.map((plan, i) => (
              <Reveal key={plan.name} delay={0.08 * i}>
                <div className={cn(
                  'rounded-2xl border p-7 h-full flex flex-col relative overflow-hidden',
                  plan.featured
                    ? 'border-[#10b981]/30'
                    : 'border-white/[0.08]'
                )} style={{ background: plan.featured ? 'rgba(16,185,129,0.04)' : '#0a0a0a' }}>
                  {plan.featured && (
                    <>
                      <div className="absolute top-0 left-0 right-0 h-px"
                        style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.5), transparent)' }}/>
                      <span className="absolute top-4 right-4 text-[10px] font-bold tracking-widest px-2.5 py-1 rounded-full"
                        style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                        POPULAR
                      </span>
                    </>
                  )}

                  <div className="mb-6">
                    <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-white/30 mb-3">{plan.name}</p>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-[42px] font-black tracking-[-2px] text-white tabular-nums">
                        {yearly ? plan.yearly : plan.monthly}
                      </span>
                      {plan.monthly !== '$0' && (
                        <span className="text-[14px] text-white/35">/mo</span>
                      )}
                    </div>
                    {plan.monthly !== '$0' && yearly && (
                      <p className="text-[12px] text-[#10b981] mb-2">billed annually</p>
                    )}
                    <p className="text-[13px] text-white/35">{plan.sub}</p>
                  </div>

                  <button onClick={() => navigate('/auth')}
                    className={cn(
                      'w-full py-3.5 rounded-full text-[14px] font-bold mb-7 transition-all active:scale-95 flex items-center justify-center gap-2',
                      plan.featured
                        ? 'bg-[#10b981] text-black hover:bg-[#0d9468]'
                        : 'border border-white/[0.12] text-white hover:border-white/25 hover:bg-white/[0.03]'
                    )}>
                    {plan.cta} {plan.featured && <ArrowRight className="h-4 w-4" weight="bold"/>}
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

      {/* ══════════════════════════════════════
          FAQ
      ══════════════════════════════════════ */}
      <section id="faq" className="py-28 px-6 border-t border-white/[0.05]">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <div className="grid md:grid-cols-2 gap-8 mb-14">
              <div>
                <SectionLabel>FAQ</SectionLabel>
                <h2 className="font-black tracking-[-2.5px] text-white"
                  style={{ fontSize: 'clamp(32px,5vw,52px)' }}>
                  Got questions?<br/>We've got answers.
                </h2>
              </div>
              <div className="md:pt-14">
                <p className="text-white/40 text-[15px] leading-relaxed">
                  Here's everything you need to know before getting started.
                </p>
                <button onClick={() => navigate('/auth')}
                  className="mt-4 inline-flex items-center gap-1.5 text-[#10b981] text-[14px] font-medium hover:text-white transition-colors">
                  Start free now <ArrowRight className="h-4 w-4" weight="bold"/>
                </button>
              </div>
            </div>
          </Reveal>

          <div className="space-y-0">
            {FAQ_DATA.map((item, i) => (
              <Reveal key={i} delay={0.04 * i}>
                <div className="border-b border-white/[0.07]">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between py-5 text-left gap-4 outline-none">
                    <div className="flex items-center gap-4">
                      <span className="text-[12px] font-bold text-[#10b981] w-6 shrink-0">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="text-[15px] font-medium text-white">{item.q}</span>
                    </div>
                    <div className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-300',
                      openFaq === i
                        ? 'bg-white/10'
                        : 'border border-white/[0.12]'
                    )}>
                      <span className="text-white/60 text-[16px] leading-none">{openFaq === i ? '−' : '+'}</span>
                    </div>
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                        <p className="pb-5 pl-10 text-white/40 text-[14px] leading-relaxed">{item.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FINAL CTA BANNER
      ══════════════════════════════════════ */}
      <section className="py-16 px-6 border-t border-white/[0.05]">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="rounded-2xl border border-white/[0.08] overflow-hidden relative"
              style={{ background: '#0a0a0a' }}>
              {/* Glow */}
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(16,185,129,0.07) 0%, transparent 60%)' }}/>
              <div className="relative px-12 py-16 md:flex items-center justify-between gap-12">
                <div className="mb-8 md:mb-0">
                  <h2 className="font-black tracking-[-2.5px] text-white mb-3"
                    style={{ fontSize: 'clamp(28px,3.5vw,46px)' }}>
                    Ready to trade smarter?
                  </h2>
                  <p className="text-white/40 text-[15px] leading-relaxed max-w-lg">
                    You already have the data from every trade you've taken. EdgeFlow shows you what it means — and exactly what to change.
                  </p>
                </div>
                <div className="shrink-0">
                  <button onClick={() => navigate('/auth')}
                    className="px-8 py-4 rounded-full bg-[#10b981] text-black text-[15px] font-bold hover:bg-[#0d9468] active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap">
                    Start Free <ArrowRight className="h-4 w-4" weight="bold"/>
                  </button>
                  <p className="text-[12px] text-white/20 mt-2 text-center">No credit card required</p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FOOTER
      ══════════════════════════════════════ */}
      <footer className="border-t border-white/[0.05] px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-10 mb-10">
            <div className="max-w-xs">
              <a href="/" className="flex items-center gap-2.5 text-white mb-3">
                <span className="text-[#10b981]"><EdgeFlowMark size={15}/></span>
                <span className="text-[13px] font-bold tracking-[-0.02em]">EdgeFlow</span>
              </a>
              <p className="text-[13px] text-white/25 leading-relaxed">
                The trading journal that turns your data into a competitive edge.
              </p>
            </div>
            <div className="flex gap-16">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-white/20 mb-4">Product</p>
                <div className="space-y-3">
                  {[['How it works','#how'],['Features','#features'],['Pricing','#pricing']].map(([l,h]) => (
                    <a key={l} href={h} className="block text-[13px] text-white/35 hover:text-white transition-colors">{l}</a>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-white/20 mb-4">Account</p>
                <div className="space-y-3">
                  {[['Sign In','/auth'],['Sign Up','/auth']].map(([l,h]) => (
                    <button key={l} onClick={() => navigate(h)} className="block text-[13px] text-white/35 hover:text-white transition-colors">{l}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-white/[0.05] pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[12px] text-white/20">© {new Date().getFullYear()} EdgeFlow. All rights reserved.</p>
            <div className="flex items-center gap-6">
              {['Privacy Policy','Terms of Service'].map(l => (
                <a key={l} href="#" className="text-[12px] text-white/20 hover:text-white/50 transition-colors">{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
