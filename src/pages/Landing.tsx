import { useNavigate } from 'react-router-dom';
import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  motion, useInView, AnimatePresence,
  useScroll, useTransform, useSpring, useMotionValue,
} from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  ArrowRight, Brain, ChartLine, Target, Lightning,
  CheckCircle, X, List, CaretDown, ChartBar,
  TrendUp, ShieldCheck, Pulse, ArrowLeft,
} from '@phosphor-icons/react';

/* ─── EdgeFlow mark ─── */
function EdgeFlowMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden>
      <polyline points="2,18 2,11 7,11 7,6 12,6 12,2 18,2"
        stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Scroll-reveal wrapper ─── */
function Reveal({ children, delay = 0, y = 32, className = '' }: { children: React.ReactNode; delay?: number; y?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y, filter: 'blur(6px)' }}
      animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
      transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

/* ─── Counter ─── */
function useCountUp(target: number, inView: boolean) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - t0) / 1600, 1);
      setV(Math.floor((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, target]);
  return v;
}

/* ════════════════════════════
   APP SCREEN MOCKUPS
   ════════════════════════════ */

function ScreenDashboard() {
  return (
    <div className="w-full h-full bg-black rounded-xl overflow-hidden border border-[rgba(255,255,255,0.08)] flex">
      {/* Mini sidebar */}
      <div className="w-12 bg-black border-r border-[rgba(255,255,255,0.06)] flex flex-col items-center py-4 gap-3 shrink-0">
        <div className="w-5 h-5 text-white opacity-80"><EdgeFlowMark size={14} /></div>
        {['▪','▪','▪','▪','▪'].map((_, i) => (
          <div key={i} className={cn('w-6 h-1.5 rounded-full', i === 0 ? 'bg-white' : 'bg-[rgba(255,255,255,0.12)]')} />
        ))}
      </div>
      {/* Main */}
      <div className="flex-1 p-5 overflow-hidden">
        <p className="text-white text-[11px] font-bold mb-4 opacity-80">Good morning, Trader</p>
        {/* Stat bar */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[['$14,230','Total P&L','text-[#10b981]'],['68%','Win Rate','text-[#10b981]'],['2.4R','Avg R','text-white'],['$1,200','Best Day','text-white']].map(([v,l,c]) => (
            <div key={l} className="rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] p-2">
              <p className="text-[7px] text-[rgba(255,255,255,0.3)] mb-1">{l}</p>
              <p className={cn('text-[11px] font-bold font-mono', c)}>{v}</p>
            </div>
          ))}
        </div>
        {/* Equity curve */}
        <div className="rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] p-3 mb-3">
          <p className="text-[7px] text-[rgba(255,255,255,0.3)] mb-2">Equity Curve</p>
          <svg viewBox="0 0 300 60" fill="none" className="w-full h-12">
            <defs><linearGradient id="sc-eq" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity="0.3"/><stop offset="100%" stopColor="#10b981" stopOpacity="0"/></linearGradient></defs>
            <path d="M0 55 C40 50 60 45 90 38 S140 28 170 22 S220 14 260 10 S280 8 300 5" stroke="#10b981" strokeWidth="1.5" fill="none"/>
            <path d="M0 55 C40 50 60 45 90 38 S140 28 170 22 S220 14 260 10 S280 8 300 5 L300 60 L0 60Z" fill="url(#sc-eq)"/>
          </svg>
        </div>
        {/* Two col */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] p-2">
            <p className="text-[7px] text-[rgba(255,255,255,0.3)] mb-1.5">Recent Trades</p>
            {[['XAUUSD','+$340',true],['NQ','-$120',false],['BTC','+$890',true]].map(([p,v,w]) => (
              <div key={String(p)} className="flex justify-between py-0.5">
                <span className="text-[8px] text-[rgba(255,255,255,0.6)]">{p}</span>
                <span className={cn('text-[8px] font-mono font-bold', w ? 'text-[#10b981]' : 'text-[#f87171]')}>{v}</span>
              </div>
            ))}
          </div>
          <div className="rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] p-2">
            <p className="text-[7px] text-[rgba(255,255,255,0.3)] mb-1.5">By Session</p>
            {[['London','74%',74],['New York','48%',48],['Asia','61%',61]].map(([s,v,w]) => (
              <div key={String(s)} className="flex items-center gap-1.5 py-0.5">
                <span className="text-[7px] text-[rgba(255,255,255,0.4)] w-12 shrink-0">{s}</span>
                <div className="flex-1 h-1 bg-[rgba(255,255,255,0.05)] rounded-full"><div className={cn('h-full rounded-full', Number(w)>=50?'bg-[#10b981]':'bg-[#f87171]')} style={{width:`${w}%`}}/></div>
                <span className="text-[7px] font-mono text-[rgba(255,255,255,0.4)]">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ScreenAnalyst() {
  return (
    <div className="w-full h-full bg-black rounded-xl overflow-hidden border border-[rgba(255,255,255,0.08)] p-5">
      <p className="text-white text-[11px] font-bold mb-1 opacity-80">Performance Analyst</p>
      <p className="text-[rgba(255,255,255,0.3)] text-[8px] mb-4">Identify leaks, find your edge</p>
      {/* Stat row */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[['+0.42R','R-Expectancy','text-[#10b981]'],['+2.1R','Avg Win','text-[#10b981]'],['-0.9R','Avg Loss','text-[#f87171]'],['$420','Max DD','text-[#f87171]']].map(([v,l,c]) => (
          <div key={l} className="rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] p-2.5">
            <p className="text-[6px] text-[rgba(255,255,255,0.3)] mb-1.5">{l}</p>
            <p className={cn('text-[12px] font-bold font-mono', c)}>{v}</p>
          </div>
        ))}
      </div>
      {/* Table: By Instrument */}
      <div className="rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] overflow-hidden mb-3">
        <div className="px-3 py-2 border-b border-[rgba(255,255,255,0.05)]">
          <p className="text-[7px] font-semibold uppercase tracking-wider text-[rgba(255,255,255,0.3)]">By Instrument</p>
        </div>
        {[['XAUUSD','18','72%','+0.68R','text-[#10b981]'],['NQ','12','50%','+0.12R','text-white'],['EURUSD','8','38%','-0.34R','text-[#f87171]']].map(([p,t,w,e,c]) => (
          <div key={String(p)} className="flex items-center px-3 py-1.5 border-b border-[rgba(255,255,255,0.03)] last:border-0">
            <div className="flex items-center gap-1.5 flex-1">
              <div className={cn('w-0.5 h-3 rounded-full', c === 'text-[#10b981]' ? 'bg-[#10b981]' : c === 'text-[#f87171]' ? 'bg-[#f87171]' : 'bg-[rgba(255,255,255,0.2)]')} />
              <span className="text-[8px] text-[rgba(255,255,255,0.8)]">{p}</span>
            </div>
            <span className="text-[7px] text-[rgba(255,255,255,0.3)] w-6 text-right">{t}</span>
            <span className="text-[7px] text-[#10b981] w-8 text-right">{w}</span>
            <span className={cn('text-[7px] font-mono w-10 text-right', c)}>{e}</span>
          </div>
        ))}
      </div>
      {/* Behavioral alert */}
      <div className="rounded-lg border border-[rgba(251,191,36,0.2)] bg-[rgba(251,191,36,0.04)] px-3 py-2">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
          <p className="text-[8px] text-[rgba(255,255,255,0.7)]">Your Friday trades lose 2.3× more than other days</p>
        </div>
      </div>
    </div>
  );
}

function ScreenJournal() {
  return (
    <div className="w-full h-full bg-black rounded-xl overflow-hidden border border-[rgba(255,255,255,0.08)] p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-white text-[11px] font-bold opacity-80">Trades DB</p>
          <p className="text-[rgba(255,255,255,0.3)] text-[8px]">Your complete trade history</p>
        </div>
        <div className="px-2.5 py-1 rounded-full bg-white text-black text-[8px] font-bold">+ Log Trade</div>
      </div>
      {/* Stats */}
      <div className="flex items-stretch rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] mb-3">
        {[['38','Trades','text-white'],['68%','Win Rate','text-[#10b981]'],['$14,230','Net P&L','text-[#10b981]'],['+2.4R','Avg R','text-white']].map((s,i,a) => (
          <div key={s[0]} className={cn('flex-1 py-2 px-2 flex flex-col items-center', i<a.length-1 && 'border-r border-[rgba(255,255,255,0.06)]')}>
            <p className="text-[6px] text-[rgba(255,255,255,0.3)]">{s[1]}</p>
            <p className={cn('text-[11px] font-bold font-mono', s[2])}>{s[0]}</p>
          </div>
        ))}
      </div>
      {/* Table header */}
      <div className="grid grid-cols-5 px-2 py-1 mb-1">
        {['Instrument','Date','Session','P&L','Outcome'].map(h => (
          <p key={h} className="text-[6px] font-semibold uppercase tracking-wider text-[rgba(255,255,255,0.2)]">{h}</p>
        ))}
      </div>
      {/* Rows */}
      {[
        ['XAUUSD','Apr 09','London','+$340','win'],
        ['NQ','Apr 09','NY','-$120','loss'],
        ['BTC','Apr 08','Asia','+$890','win'],
        ['EURUSD','Apr 08','London','+$210','win'],
        ['GBP/JPY','Apr 07','London','-$80','loss'],
      ].map((row, i) => (
        <div key={i} className={cn('grid grid-cols-5 px-2 py-1.5 rounded items-center', i%2===0 ? 'bg-[rgba(255,255,255,0.01)]' : '')}>
          <span className="text-[8px] font-medium text-[rgba(255,255,255,0.8)]">{row[0]}</span>
          <span className="text-[7px] text-[rgba(255,255,255,0.3)]">{row[1]}</span>
          <span className="text-[7px] text-[rgba(255,255,255,0.3)]">{row[2]}</span>
          <span className={cn('text-[8px] font-mono font-bold', row[4]==='win'?'text-[#10b981]':'text-[#f87171]')}>{row[3]}</span>
          <span className={cn('text-[7px] px-1.5 py-0.5 rounded-full text-center w-fit', row[4]==='win'?'bg-[rgba(16,185,129,0.1)] text-[#10b981]':'bg-[rgba(248,113,113,0.1)] text-[#f87171]')}>{row[4]}</span>
        </div>
      ))}
    </div>
  );
}

function ScreenAI() {
  return (
    <div className="w-full h-full bg-black rounded-xl overflow-hidden border border-[rgba(255,255,255,0.08)] p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-7 h-7 rounded-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] flex items-center justify-center">
          <Brain className="h-3.5 w-3.5 text-[rgba(255,255,255,0.5)]" weight="regular" />
        </div>
        <div>
          <p className="text-white text-[10px] font-bold">AI Trade Advisor</p>
          <p className="text-[rgba(255,255,255,0.3)] text-[7px]">Based on your last 38 trades</p>
        </div>
      </div>
      <div className="flex-1 space-y-3 overflow-hidden">
        {/* AI bubble */}
        <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] rounded-xl p-3">
          <p className="text-[9px] text-[rgba(255,255,255,0.7)] leading-relaxed">
            Your <span className="text-white font-semibold">London session win rate (74%)</span> is 2.3× higher than New York (32%). Your edge lives in London — consider reducing NY exposure by 40%.
          </p>
        </div>
        <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] rounded-xl p-3">
          <p className="text-[9px] text-[rgba(255,255,255,0.7)] leading-relaxed">
            You lose <span className="text-[#f87171] font-semibold">$340 on average</span> when your emotional state is below 3/5. Consider skipping trades on low-confidence days.
          </p>
        </div>
        {/* Session bars */}
        <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-xl p-3">
          <p className="text-[7px] text-[rgba(255,255,255,0.3)] mb-2.5">Win Rate by Session</p>
          {[['London','74%',74,'#10b981'],['Asia','61%',61,'#10b981'],['New York','32%',32,'#f87171']].map(([s,v,w,c]) => (
            <div key={String(s)} className="flex items-center gap-2 mb-1.5">
              <span className="text-[7px] text-[rgba(255,255,255,0.4)] w-14 shrink-0">{s}</span>
              <div className="flex-1 h-1 bg-[rgba(255,255,255,0.05)] rounded-full">
                <div className="h-full rounded-full" style={{width:`${w}%`,background:String(c)}} />
              </div>
              <span className="text-[7px] font-mono" style={{color:String(c)}}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const SCREENS = [
  { id: 'dashboard', label: 'Analytics Dashboard', sub: 'Full equity curve, session breakdown, and live stat bar.', Screen: ScreenDashboard },
  { id: 'analyst',   label: 'Performance Analyst', sub: 'Find leaks by instrument, session, emotion, and more.', Screen: ScreenAnalyst },
  { id: 'journal',   label: 'Trades Database',     sub: 'Every trade logged, filterable, with instant stats.', Screen: ScreenJournal },
  { id: 'ai',        label: 'AI Trade Advisor',    sub: 'Personalized insights based on YOUR actual data.', Screen: ScreenAI },
];

/* ─── App Carousel ─── */
function AppCarousel() {
  const [active, setActive] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragX = useMotionValue(0);
  const total = SCREENS.length;

  const prev = () => setActive(a => (a - 1 + total) % total);
  const next = () => setActive(a => (a + 1) % total);

  const onDragEnd = (_: any, info: any) => {
    if (info.offset.x < -60) next();
    else if (info.offset.x > 60) prev();
    setDragging(false);
  };

  const { Screen, label, sub } = SCREENS[active];

  return (
    <div className="relative">
      {/* Tab pills */}
      <div className="flex flex-wrap gap-2 justify-center mb-10">
        {SCREENS.map((s, i) => (
          <button key={s.id} onClick={() => setActive(i)}
            className={cn(
              'px-4 py-1.5 rounded-full text-[12px] font-medium transition-all border',
              active === i
                ? 'bg-white text-black border-white'
                : 'text-[rgba(255,255,255,0.4)] border-[rgba(255,255,255,0.1)] hover:text-white hover:border-[rgba(255,255,255,0.25)]'
            )}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Screen */}
      <div className="relative max-w-3xl mx-auto">
        {/* Glow behind screen */}
        <div className="absolute inset-0 rounded-2xl opacity-20 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.15) 0%, transparent 70%)' }} />

        {/* Window chrome */}
        <div className="relative rounded-2xl border border-[rgba(255,255,255,0.1)] overflow-hidden"
          style={{ background: 'rgba(10,10,10,0.9)', backdropFilter: 'blur(20px)' }}>
          <div className="flex items-center gap-2 px-5 py-3 border-b border-[rgba(255,255,255,0.06)]">
            <div className="w-2.5 h-2.5 rounded-full bg-[rgba(255,255,255,0.12)]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[rgba(255,255,255,0.12)]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[rgba(255,255,255,0.12)]" />
            <span className="ml-3 text-[11px] text-[rgba(255,255,255,0.2)]">leone.capital — {label}</span>
          </div>

          <motion.div
            key={active}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.1}
            onDragStart={() => setDragging(true)}
            onDragEnd={onDragEnd}
            style={{ x: dragX }}
            initial={{ opacity: 0, scale: 0.97, filter: 'blur(4px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="p-4 cursor-grab active:cursor-grabbing select-none"
            style={{ height: 380 } as any}
          >
            <Screen />
          </motion.div>
        </div>

        {/* Arrows */}
        <button onClick={prev}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-14 w-10 h-10 rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] flex items-center justify-center text-[rgba(255,255,255,0.4)] hover:text-white hover:border-[rgba(255,255,255,0.25)] transition-all outline-none hidden md:flex">
          <ArrowLeft className="h-4 w-4" weight="bold" />
        </button>
        <button onClick={next}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-14 w-10 h-10 rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] flex items-center justify-center text-[rgba(255,255,255,0.4)] hover:text-white hover:border-[rgba(255,255,255,0.25)] transition-all outline-none hidden md:flex">
          <ArrowRight className="h-4 w-4" weight="bold" />
        </button>
      </div>

      {/* Caption + dots */}
      <div className="text-center mt-6">
        <motion.p key={`label-${active}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="text-[15px] font-semibold text-white mb-1">{label}</motion.p>
        <motion.p key={`sub-${active}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="text-[13px] text-[rgba(255,255,255,0.4)]">{sub}</motion.p>
        <div className="flex gap-2 justify-center mt-4">
          {SCREENS.map((_, i) => (
            <button key={i} onClick={() => setActive(i)}
              className={cn('rounded-full transition-all', i === active ? 'w-6 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.4)]')} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Sticky scroll feature showcase ─── */
function FeatureShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] });

  const features = [
    {
      title: 'Every trade, fully analyzed.',
      desc: 'Log in seconds. EdgeFlow breaks down every trade by instrument, session, emotion, and strategy — so you can see exactly where you win and where you leak.',
      stat: '38 trades analyzed',
      Icon: ChartBar,
    },
    {
      title: 'Your edge lives in the data.',
      desc: 'The Performance Analyst surfaces your best setups, worst habits, and the exact combinations that are costing you. No spreadsheet does this.',
      stat: '+0.42R expectancy',
      Icon: Lightning,
    },
    {
      title: 'AI that knows your trading.',
      desc: 'Not generic trading advice — AI trained on YOUR data. Your patterns. Your leaks. Your strengths. What to stop doing and what to do more of.',
      stat: '74% London win rate',
      Icon: Brain,
    },
    {
      title: 'Simulate before you change.',
      desc: 'The What-If simulator lets you apply filters — "only London, only followed plan, only confidence ≥4" — and instantly see how your equity curve would have changed.',
      stat: '+38% simulated gain',
      Icon: TrendUp,
    },
  ];

  const activeIndex = useTransform(scrollYProgress, [0, 0.25, 0.5, 0.75, 1], [0, 1, 2, 3, 3]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    return activeIndex.on('change', v => setCurrent(Math.round(v)));
  }, [activeIndex]);

  // Progress bar transforms
  const bar0 = useTransform(scrollYProgress, [0, 0.25], [0, 1]);
  const bar1 = useTransform(scrollYProgress, [0.25, 0.5], [0, 1]);
  const bar2 = useTransform(scrollYProgress, [0.5, 0.75], [0, 1]);
  const bar3 = useTransform(scrollYProgress, [0.75, 1], [0, 1]);
  const bars = [bar0, bar1, bar2, bar3];

  return (
    <div ref={containerRef} className="relative" style={{ height: `${features.length * 100}vh` }}>
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 w-full grid md:grid-cols-2 gap-16 items-center">

          {/* Left: feature text */}
          <div className="space-y-8">
            {features.map((f, i) => {
              const isActive = current === i;
              return (
                <motion.div key={i} animate={{ opacity: isActive ? 1 : 0.25 }} transition={{ duration: 0.4 }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn('w-8 h-8 rounded-lg border flex items-center justify-center transition-colors duration-300',
                      isActive ? 'bg-white border-white' : 'bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]')}>
                      <f.Icon className={cn('h-4 w-4', isActive ? 'text-black' : 'text-[rgba(255,255,255,0.4)]')} weight="regular" />
                    </div>
                    {/* Progress bar */}
                    <div className="flex-1 h-[1px] bg-[rgba(255,255,255,0.06)] overflow-hidden rounded-full">
                      <motion.div className="h-full bg-white rounded-full" style={{ scaleX: bars[i], transformOrigin: 'left' }} />
                    </div>
                  </div>
                  <h3 className={cn('text-[22px] font-bold tracking-[-0.5px] mb-2 transition-colors duration-300', isActive ? 'text-white' : 'text-[rgba(255,255,255,0.3)]')}>
                    {f.title}
                  </h3>
                  {isActive && (
                    <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                      className="text-[rgba(255,255,255,0.5)] text-[14px] leading-relaxed">
                      {f.desc}
                    </motion.p>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Right: screen that changes */}
          <div className="relative hidden md:block">
            <div className="absolute inset-0 rounded-2xl opacity-15 blur-3xl pointer-events-none"
              style={{ background: 'radial-gradient(ellipse, rgba(255,255,255,0.2) 0%, transparent 70%)' }} />
            <div className="relative rounded-2xl border border-[rgba(255,255,255,0.1)] overflow-hidden bg-[rgba(8,8,8,0.9)]">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[rgba(255,255,255,0.06)]">
                <div className="w-2 h-2 rounded-full bg-[rgba(255,255,255,0.1)]" />
                <div className="w-2 h-2 rounded-full bg-[rgba(255,255,255,0.1)]" />
                <div className="w-2 h-2 rounded-full bg-[rgba(255,255,255,0.1)]" />
                <span className="ml-2 text-[10px] text-[rgba(255,255,255,0.2)]">leone.capital</span>
              </div>
              <AnimatePresence mode="wait">
                <motion.div key={current}
                  initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -12, filter: 'blur(6px)' }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="p-4" style={{ height: 340 }}>
                  {current === 0 && <ScreenDashboard />}
                  {current === 1 && <ScreenAnalyst />}
                  {current === 2 && <ScreenJournal />}
                  {current === 3 && <ScreenAI />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Hero parallax ─── */
function HeroSection({ onCTA }: { onCTA: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center pt-16 pb-24 px-6 overflow-hidden">
      {/* Radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(255,255,255,0.05) 0%, transparent 60%)' }} />

      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '80px 80px' }} />

      <motion.div style={{ y, opacity }} className="relative z-10 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] mb-8">
          <Pulse className="h-3 w-3 text-[#10b981]" weight="fill" />
          <span className="text-[11px] font-medium text-[rgba(255,255,255,0.5)] tracking-wide">AI-Powered Trading Journal</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="font-black leading-[1.02] tracking-[-3px] mb-7 text-white"
          style={{ fontSize: 'clamp(44px, 7vw, 80px)' }}>
          Most traders lose<br />
          <span className="text-[rgba(255,255,255,0.35)]">because they don't know</span><br />
          why they win.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="text-[rgba(255,255,255,0.45)] text-[17px] md:text-[19px] max-w-xl mx-auto leading-relaxed mb-10">
          EdgeFlow surfaces the patterns, leaks, and emotional triggers costing you money.
          Stop guessing. Start compounding.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
          <button onClick={onCTA}
            className="w-full sm:w-auto px-8 py-4 rounded-[24px] bg-white text-black text-[15px] font-bold hover:bg-white/90 active:scale-95 transition-all flex items-center justify-center gap-2">
            Start Free — No Card Needed
            <ArrowRight className="h-4 w-4" weight="bold" />
          </button>
          <a href="#see-the-app"
            className="text-[rgba(255,255,255,0.4)] text-[14px] py-3 px-4 hover:text-white transition-colors flex items-center gap-1.5">
            See the app <ArrowRight className="h-3.5 w-3.5" weight="regular" />
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-6 text-[12px] text-[rgba(255,255,255,0.2)]">
          <span>✓ Free plan available</span>
          <span>✓ No credit card</span>
          <span>✓ Cancel anytime</span>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
          className="w-5 h-8 rounded-full border border-[rgba(255,255,255,0.15)] flex items-start justify-center pt-1.5">
          <div className="w-1 h-1.5 bg-[rgba(255,255,255,0.4)] rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ─── Stats ─── */
function StatsBar() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const t = useCountUp(2400, inView);
  const tr = useCountUp(186000, inView);

  return (
    <div ref={ref} className="border-y border-[rgba(255,255,255,0.06)] py-12 px-6 overflow-hidden">
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        {[
          { value: `${t.toLocaleString()}+`, label: 'Active traders' },
          { value: `${tr.toLocaleString()}+`, label: 'Trades analyzed' },
          { value: '$4.2M+', label: 'P&L tracked' },
          { value: '68%', label: 'Avg win rate improvement' },
        ].map(s => (
          <div key={s.label} className="text-center">
            <p className="text-[30px] font-black font-mono text-white tracking-[-0.04em]">{s.value}</p>
            <p className="text-[12px] text-[rgba(255,255,255,0.3)] mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Pricing ─── */
const plans = [
  { name: 'Free', price: '$0', period: '', sub: 'Get started with no commitment.', cta: 'Start for Free', featured: false,
    features: ['Up to 50 trades/month','Equity curve & calendar','Win/loss breakdown','1 trading account','Session journal'],
    missing: ['AI Trade Advisor','Leak Detection','What-If Simulator'] },
  { name: 'Pro', price: '$12', period: '/mo', sub: 'For serious traders building an edge.', cta: 'Start Pro', featured: true,
    features: ['Unlimited trades','Full analytics suite','AI Trade Advisor','Leak Detection','What-If Simulator','Up to 3 accounts','Weekly AI digest','Pre-trade checklist'],
    missing: [] },
  { name: 'Elite', price: '$24', period: '/mo', sub: 'For prop traders and professionals.', cta: 'Start Elite', featured: false,
    features: ['Everything in Pro','Unlimited accounts','Prop firm tracking','CSV & PDF exports','Priority support','Early access features'],
    missing: [] },
];

/* ─── FAQ ─── */
const faqData = [
  { q: 'Do I need trading experience to use EdgeFlow?', a: 'Not at all. Whether you\'ve been trading 2 weeks or 10 years, EdgeFlow adapts to your data and gives you insights relevant to your exact level.' },
  { q: 'Is EdgeFlow free to use?', a: 'Yes. The free plan gives you full access to core features with up to 50 trades per month — no credit card required. Upgrade when you\'re ready to scale.' },
  { q: 'What markets does EdgeFlow support?', a: 'Forex, crypto, futures, stocks, indices, and commodities. If you can trade it, you can journal and analyze it.' },
  { q: 'How is this different from a spreadsheet?', a: 'A spreadsheet shows you numbers. EdgeFlow shows you WHY. The AI layer does what no spreadsheet can — pattern detection, leak surfacing, and personalized recommendations based on your actual data.' },
  { q: 'Is my trading data secure?', a: 'Completely. All data is encrypted and stored securely. Your data is never shared, sold, or used for any other purpose.' },
];

/* ════════════════════════════════════
   MAIN
   ════════════════════════════════════ */
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
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <div className="min-h-screen text-white overflow-x-hidden" style={{ background: '#000', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── NAVBAR ── */}
      <nav className={cn('fixed top-0 left-0 right-0 z-50 transition-all duration-500',
        scrolled ? 'bg-black/85 backdrop-blur-2xl border-b border-[rgba(255,255,255,0.06)]' : 'bg-transparent')}>
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <a href="/" className="flex items-center gap-2.5 text-white">
            <EdgeFlowMark size={18} />
            <span className="text-[14px] font-bold tracking-[-0.02em]">EDGEFLOW</span>
          </a>
          <div className="hidden md:flex items-center gap-8">
            {[['Features','#features'],['See the App','#see-the-app'],['Pricing','#pricing'],['FAQ','#faq']].map(([l,h]) => (
              <a key={l} href={h} className="text-[13px] text-[rgba(255,255,255,0.4)] hover:text-white transition-colors">{l}</a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => navigate('/auth')} className="text-[13px] text-[rgba(255,255,255,0.4)] hover:text-white transition-colors px-3 py-2">Sign In</button>
            <button onClick={() => navigate('/auth')} className="px-5 py-2 rounded-[24px] bg-white text-black text-[13px] font-semibold hover:bg-white/90 transition-all active:scale-95">Get Started Free</button>
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-[rgba(255,255,255,0.6)] outline-none">
            {mobileOpen ? <X className="h-5 w-5" weight="regular" /> : <List className="h-5 w-5" weight="regular" />}
          </button>
        </div>
        <AnimatePresence>
          {mobileOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-[rgba(255,255,255,0.06)] bg-black/95 overflow-hidden">
              <div className="px-6 py-4 flex flex-col gap-1">
                {[['Features','#features'],['See the App','#see-the-app'],['Pricing','#pricing'],['FAQ','#faq']].map(([l,h]) => (
                  <a key={l} href={h} onClick={() => setMobileOpen(false)} className="text-[rgba(255,255,255,0.5)] py-3 text-[14px] border-b border-[rgba(255,255,255,0.04)]">{l}</a>
                ))}
                <div className="pt-3 flex flex-col gap-2">
                  <button onClick={() => navigate('/auth')} className="text-[rgba(255,255,255,0.4)] py-2 text-left text-[14px]">Sign In</button>
                  <button onClick={() => navigate('/auth')} className="w-full py-3 rounded-[24px] bg-white text-black text-[14px] font-semibold">Get Started Free</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── HERO ── */}
      <HeroSection onCTA={() => navigate('/auth')} />

      {/* ── STATS ── */}
      <StatsBar />

      {/* ── APP CAROUSEL ── */}
      <section id="see-the-app" className="py-32 px-6 border-t border-[rgba(255,255,255,0.06)]">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-16">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgba(255,255,255,0.3)] mb-4">The App</p>
            <h2 className="text-white font-black tracking-[-2px] mb-4" style={{ fontSize: 'clamp(32px, 5vw, 52px)' }}>
              See exactly what you're getting.
            </h2>
            <p className="text-[rgba(255,255,255,0.4)] text-[15px] max-w-lg mx-auto">
              Swipe through the actual pages of EdgeFlow — built for serious traders.
            </p>
          </Reveal>
          <AppCarousel />
        </div>
      </section>

      {/* ── STICKY FEATURE SHOWCASE ── */}
      <section id="features" className="border-t border-[rgba(255,255,255,0.06)]">
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-8">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgba(255,255,255,0.3)] mb-4">How It Works</p>
            <h2 className="text-white font-black tracking-[-2px] mb-4" style={{ fontSize: 'clamp(32px, 5vw, 52px)' }}>
              Stop trading blind.
            </h2>
            <p className="text-[rgba(255,255,255,0.4)] text-[15px] mb-2">Scroll to see how EdgeFlow works.</p>
          </Reveal>
        </div>
        <FeatureShowcase />
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-32 px-6 border-t border-[rgba(255,255,255,0.06)]">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgba(255,255,255,0.3)] mb-4">Trusted By Traders</p>
            <h2 className="text-white font-black tracking-[-2px] mb-16" style={{ fontSize: 'clamp(32px, 5vw, 52px)' }}>
              Real traders. Real results.
            </h2>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { name: 'Alex M.',  type: 'Forex Trader',   initials: 'AM', quote: 'I was hemorrhaging money every Friday. EdgeFlow flagged it in under 5 minutes. I cut Fridays — win rate jumped 14% that month.' },
              { name: 'Sarah K.', type: 'Crypto Trader',  initials: 'SK', quote: "It's like having a coach who has watched every single trade I've ever taken. The AI pattern detection is frighteningly accurate." },
              { name: 'James R.', type: 'Futures Trader', initials: 'JR', quote: "The What-If tool showed me I was giving back 40% of my profits on revenge trades. That one insight paid for years of subscription." },
            ].map((t, i) => (
              <Reveal key={t.name} delay={0.1 * i}>
                <div className="rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.02)] p-7 h-full flex flex-col hover:border-[rgba(255,255,255,0.14)] transition-colors duration-500">
                  <div className="flex gap-1 mb-5">{[...Array(5)].map((_,i) => <span key={i} className="text-amber-400 text-sm">★</span>)}</div>
                  <p className="text-[rgba(255,255,255,0.55)] text-[14px] leading-relaxed flex-1 mb-6">"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[rgba(255,255,255,0.4)] font-bold text-[11px]">{t.initials}</div>
                    <div>
                      <p className="text-white text-[13px] font-semibold">{t.name}</p>
                      <p className="text-[rgba(255,255,255,0.3)] text-[11px]">{t.type}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="text-[rgba(255,255,255,0.15)] text-[11px] mt-6 text-center">Testimonials are illustrative examples. Individual results vary.</p>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-32 px-6 border-t border-[rgba(255,255,255,0.06)]">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgba(255,255,255,0.3)] mb-4">Simple Pricing</p>
            <h2 className="text-white font-black tracking-[-2px] mb-4" style={{ fontSize: 'clamp(32px, 5vw, 52px)' }}>Invest in your edge.</h2>
            <p className="text-[rgba(255,255,255,0.4)] text-[15px] mb-16">Start free. Upgrade when you're ready.</p>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-4">
            {plans.map((plan, i) => (
              <Reveal key={plan.name} delay={0.1 * i}>
                <div className={cn('rounded-2xl border p-7 h-full flex flex-col relative',
                  plan.featured ? 'border-white bg-white text-black' : 'border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.02)] text-white')}>
                  {plan.featured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 rounded-full bg-black text-white text-[10px] font-bold tracking-wider">MOST POPULAR</span>
                    </div>
                  )}
                  <div className="mb-6">
                    <p className={cn('text-[11px] font-bold uppercase tracking-[0.1em] mb-3', plan.featured ? 'text-black/50' : 'text-[rgba(255,255,255,0.35)]')}>{plan.name}</p>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-[36px] font-black tracking-[-2px]">{plan.price}</span>
                      {plan.period && <span className={cn('text-[14px]', plan.featured ? 'text-black/50' : 'text-[rgba(255,255,255,0.4)]')}>{plan.period}</span>}
                    </div>
                    <p className={cn('text-[13px]', plan.featured ? 'text-black/60' : 'text-[rgba(255,255,255,0.4)]')}>{plan.sub}</p>
                  </div>
                  <button onClick={() => navigate('/auth')}
                    className={cn('w-full py-3 rounded-[24px] text-[14px] font-semibold mb-6 transition-all active:scale-95',
                      plan.featured ? 'bg-black text-white hover:bg-black/80' : 'bg-white text-black hover:bg-white/90')}>
                    {plan.cta}
                  </button>
                  <div className="flex-1 space-y-3">
                    {plan.features.map(f => (
                      <div key={f} className="flex items-center gap-2.5">
                        <CheckCircle className={cn('h-4 w-4 shrink-0', plan.featured ? 'text-black' : 'text-[#10b981]')} weight="fill" />
                        <span className={cn('text-[13px]', plan.featured ? 'text-black/80' : 'text-[rgba(255,255,255,0.7)]')}>{f}</span>
                      </div>
                    ))}
                    {plan.missing.map(f => (
                      <div key={f} className="flex items-center gap-2.5 opacity-35">
                        <X className="h-4 w-4 shrink-0 text-[rgba(255,255,255,0.4)]" weight="bold" />
                        <span className="text-[13px] text-[rgba(255,255,255,0.4)] line-through">{f}</span>
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
      <section id="faq" className="py-32 px-6 border-t border-[rgba(255,255,255,0.06)]">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgba(255,255,255,0.3)] mb-4">FAQ</p>
            <h2 className="text-white font-black tracking-[-2px] mb-12" style={{ fontSize: 'clamp(32px, 5vw, 52px)' }}>Common questions.</h2>
          </Reveal>
          {faqData.map((item, i) => (
            <Reveal key={i} delay={0.05 * i}>
              <div className="border-b border-[rgba(255,255,255,0.06)]">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between py-5 text-left gap-4 outline-none">
                  <span className="text-[15px] font-medium text-white">{item.q}</span>
                  <CaretDown className={cn('h-4 w-4 text-[rgba(255,255,255,0.3)] shrink-0 transition-transform duration-300', openFaq === i && 'rotate-180')} weight="bold" />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                      <p className="pb-5 text-[rgba(255,255,255,0.45)] text-[14px] leading-relaxed">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-32 px-6 border-t border-[rgba(255,255,255,0.06)]">
        <Reveal>
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-14 h-14 rounded-2xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center mx-auto mb-8">
              <ShieldCheck className="h-7 w-7 text-[rgba(255,255,255,0.4)]" weight="regular" />
            </div>
            <h2 className="text-white font-black tracking-[-2.5px] mb-6" style={{ fontSize: 'clamp(36px, 5vw, 60px)' }}>
              Your edge is in the data.<br />Go find it.
            </h2>
            <p className="text-[rgba(255,255,255,0.4)] text-[16px] mb-10 leading-relaxed">
              Join traders using EdgeFlow to finally understand their performance and fix what's costing them.
            </p>
            <button onClick={() => navigate('/auth')}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-[24px] bg-white text-black text-[15px] font-bold hover:bg-white/90 active:scale-95 transition-all">
              Start Free — No Card Needed
              <ArrowRight className="h-4 w-4" weight="bold" />
            </button>
          </div>
        </Reveal>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[rgba(255,255,255,0.06)] px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5 text-white">
            <EdgeFlowMark size={16} />
            <span className="text-[13px] font-bold tracking-[-0.02em]">EDGEFLOW</span>
          </div>
          <div className="flex items-center gap-6">
            {[['Features','#features'],['Pricing','#pricing'],['FAQ','#faq']].map(([l,h]) => (
              <a key={l} href={h} className="text-[12px] text-[rgba(255,255,255,0.3)] hover:text-white transition-colors">{l}</a>
            ))}
            <button onClick={() => navigate('/auth')} className="text-[12px] text-[rgba(255,255,255,0.3)] hover:text-white transition-colors">Sign In</button>
          </div>
          <p className="text-[11px] text-[rgba(255,255,255,0.2)]">© {new Date().getFullYear()} EdgeFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
