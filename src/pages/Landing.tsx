import { useNavigate } from 'react-router-dom';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion, useInView, useReducedMotion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ContainerScroll } from '@/components/ui/container-scroll-animation';
import {
  ArrowRight, Brain, Lightning,
  CheckCircle, X, List, CaretDown,
  TrendUp, ShieldCheck, ArrowLeft, ChartBar,
} from '@phosphor-icons/react';

/* ─── Animated word (opacity crossfade, no layout shift) ─── */
function AnimatedWord({ words, color = '#10b981' }: { words: string[]; color?: string }) {
  const [index, setIndex] = useState(0);
  const longest = words.reduce((a, b) => (a.length >= b.length ? a : b));
  useEffect(() => {
    const t = setInterval(() => setIndex(i => (i + 1) % words.length), 2500);
    return () => clearInterval(t);
  }, [words.length]);
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      {/* hidden spacer — fixes width to longest word, never clips */}
      <span style={{ visibility: 'hidden', fontWeight: 900 }}>{longest}</span>
      <AnimatePresence mode="wait">
        <motion.span key={index}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, whiteSpace: 'nowrap', color }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}>
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/* ─── Logo ─── */
function EdgeFlowMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden>
      {/* Vertical spine */}
      <line x1="3" y1="3" x2="3" y2="17" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square"/>
      {/* Top bar */}
      <line x1="3" y1="3" x2="16" y2="3" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square"/>
      {/* Middle bar — shorter, ends in upward tick */}
      <line x1="3" y1="10" x2="12" y2="10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square"/>
      <line x1="12" y1="10" x2="16" y2="6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square"/>
      {/* Bottom bar */}
      <line x1="3" y1="17" x2="16" y2="17" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square"/>
    </svg>
  );
}

/* ─── Reveal ─── */
function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const prefersReducedMotion = useReducedMotion();
  if (prefersReducedMotion) {
    return <div ref={ref} className={className}>{children}</div>;
  }
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y: 28, filter: 'blur(8px)' }}
      animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
      transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}


/* ══════════════════════════════════════
   APP SCREEN MOCKUPS — full-size
   ══════════════════════════════════════ */

function MockDashboard() {
  return (
    <div className="w-full h-full bg-black flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-14 bg-black border-r border-[rgba(255,255,255,0.06)] flex flex-col items-center py-5 gap-4 shrink-0">
        <div className="text-white mb-2"><EdgeFlowMark size={16} /></div>
        {[true,false,false,false,false].map((a,i) => (
          <div key={i} className={cn('w-8 h-1.5 rounded-full', a ? 'bg-white' : 'bg-[rgba(255,255,255,0.1)]')} />
        ))}
      </div>
      {/* Content */}
      <div className="flex-1 p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-white font-bold text-sm">Good morning, Trader</p>
            <p className="text-[rgba(255,255,255,0.3)] text-[11px]">Here's your trading overview</p>
          </div>
          <div className="flex gap-2">
            <div className="px-3 py-1.5 rounded-full border border-[rgba(255,255,255,0.1)] text-[10px] text-[rgba(255,255,255,0.4)]">Checklist</div>
            <div className="px-3 py-1.5 rounded-full bg-white text-black text-[10px] font-bold">+ Log Trade</div>
          </div>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { l:'Total P&L',  v:'+$14,230', c:'text-[#10b981]' },
            { l:'Win Rate',   v:'68%',       c:'text-[#10b981]' },
            { l:'Avg R',      v:'2.4R',      c:'text-white'     },
            { l:'Max DD',     v:'$420',      c:'text-[#f87171]' },
          ].map(s => (
            <div key={s.l} className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.07)] px-4 py-3">
              <p className="text-[9px] text-[rgba(255,255,255,0.3)] uppercase tracking-wider mb-1.5">{s.l}</p>
              <p className={cn('text-[18px] font-bold font-mono', s.c)}>{s.v}</p>
            </div>
          ))}
        </div>
        {/* Equity curve */}
        <div className="rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.07)] p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] text-[rgba(255,255,255,0.4)] uppercase tracking-wider font-semibold">Equity Curve</p>
            <div className="flex gap-1">
              {['Daily','Weekly','Monthly'].map((p,i)=>(
                <span key={p} className={cn('text-[9px] px-2 py-0.5 rounded-md', i===0?'bg-white text-black font-bold':'text-[rgba(255,255,255,0.3)]')}>{p}</span>
              ))}
            </div>
          </div>
          <svg viewBox="0 0 600 100" fill="none" className="w-full">
            <defs><linearGradient id="m-eq" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity="0.25"/><stop offset="100%" stopColor="#10b981" stopOpacity="0"/></linearGradient></defs>
            {[20,40,60,80].map(y=><line key={y} x1="0" y1={y} x2="600" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>)}
            <path d="M0 88 C60 82 100 75 150 64 S220 48 270 40 S340 28 390 22 S450 14 510 10 S560 8 600 5" stroke="#10b981" strokeWidth="2" fill="none" strokeLinecap="round"/>
            <path d="M0 88 C60 82 100 75 150 64 S220 48 270 40 S340 28 390 22 S450 14 510 10 S560 8 600 5 L600 100 L0 100Z" fill="url(#m-eq)"/>
            {[[150,64],[270,40],[390,22],[510,10]].map(([x,y],i)=>(
              <circle key={i} cx={x} cy={y} r="3" fill="#10b981"/>
            ))}
          </svg>
        </div>
        {/* Bottom 2 col */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.07)] p-4">
            <p className="text-[9px] text-[rgba(255,255,255,0.3)] uppercase tracking-wider mb-3">Recent Trades</p>
            {[['XAUUSD','Long','+$340',true],['NQ','Short','-$120',false],['BTC/USD','Long','+$890',true],['EUR/USD','Long','+$210',true]].map(([p,d,v,w])=>(
              <div key={String(p)} className="flex items-center justify-between py-1.5 border-b border-[rgba(255,255,255,0.04)] last:border-0">
                <div className="flex items-center gap-2">
                  <div className={cn('w-1 h-4 rounded-full', w?'bg-[#10b981]':'bg-[#f87171]')}/>
                  <span className="text-[11px] font-medium text-white">{p}</span>
                  <span className="text-[9px] text-[rgba(255,255,255,0.3)]">{d}</span>
                </div>
                <span className={cn('text-[11px] font-mono font-bold', w?'text-[#10b981]':'text-[#f87171]')}>{v}</span>
              </div>
            ))}
          </div>
          <div className="rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.07)] p-4">
            <p className="text-[9px] text-[rgba(255,255,255,0.3)] uppercase tracking-wider mb-3">Session Performance</p>
            {[['London','74%',74],['New York','48%',48],['Asia','61%',61],['Overlap','82%',82]].map(([s,v,w])=>(
              <div key={String(s)} className="flex items-center gap-3 py-1.5">
                <span className="text-[10px] text-[rgba(255,255,255,0.5)] w-16 shrink-0">{s}</span>
                <div className="flex-1 h-1 bg-[rgba(255,255,255,0.05)] rounded-full">
                  <div className={cn('h-full rounded-full', Number(w)>=50?'bg-[#10b981]':'bg-[#f87171]')} style={{width:`${w}%`}}/>
                </div>
                <span className={cn('text-[10px] font-mono', Number(w)>=50?'text-[#10b981]':'text-[#f87171]')}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MockAnalyst() {
  return (
    <div className="w-full h-full bg-black p-6 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-white font-bold text-sm">Performance Analyst</p>
          <p className="text-[rgba(255,255,255,0.35)] text-[11px]">Identify leaks, find your edge, simulate improvements</p>
        </div>
      </div>
      {/* Risk bar */}
      <div className="rounded-xl border border-[rgba(16,185,129,0.2)] bg-[rgba(16,185,129,0.04)] px-5 py-3 flex items-center gap-4 mb-5">
        <ShieldCheck className="h-5 w-5 text-[#10b981]" weight="regular"/>
        <div>
          <p className="text-[10px] font-bold text-[#10b981] uppercase tracking-wider">All Clear</p>
          <p className="text-[11px] text-[rgba(255,255,255,0.5)]">No major drawdown detected. Trading within normal parameters.</p>
        </div>
      </div>
      {/* Key metrics */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[['+0.42R','R-Expectancy','text-[#10b981]'],['+2.1R','Avg Win','text-[#10b981]'],['-0.9R','Avg Loss','text-[#f87171]'],['$420','Max Drawdown','text-[#f87171]']].map(([v,l,c])=>(
          <div key={l} className="rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.07)] px-4 py-3">
            <p className="text-[9px] text-[rgba(255,255,255,0.3)] uppercase tracking-wider mb-1.5">{l}</p>
            <p className={cn('text-[20px] font-bold font-mono', c)}>{v}</p>
          </div>
        ))}
      </div>
      {/* Tables */}
      <div className="grid grid-cols-2 gap-3 flex-1">
        {[['By Instrument',[['XAUUSD','18','72%','+0.68R',true],['NQ','12','50%','+0.12R',true],['EUR/USD','8','38%','-0.34R',false]]],
          ['By Session',[['London','14','74%','+0.82R',true],['New York','10','48%','+0.11R',true],['Asia','6','33%','-0.41R',false]]]
        ].map(([title, rows])=>(
          <div key={String(title)} className="rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.07)] overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[rgba(255,255,255,0.06)]">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-[rgba(255,255,255,0.35)]">{String(title)}</p>
            </div>
            {(rows as any[]).map((r: any[])=>(
              <div key={r[0]} className="flex items-center px-4 py-2 border-b border-[rgba(255,255,255,0.04)] last:border-0">
                <div className="flex items-center gap-2 flex-1">
                  <div className={cn('w-0.5 h-4 rounded-full', r[4]?'bg-[#10b981]':'bg-[#f87171]')}/>
                  <span className="text-[11px] text-[rgba(255,255,255,0.8)]">{r[0]}</span>
                </div>
                <span className="text-[10px] text-[rgba(255,255,255,0.3)] w-8 text-right">{r[1]}</span>
                <span className="text-[10px] text-[#10b981] w-10 text-right">{r[2]}</span>
                <span className={cn('text-[10px] font-mono font-semibold w-14 text-right', r[4]?'text-[#10b981]':'text-[#f87171]')}>{r[3]}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function MockTrades() {
  return (
    <div className="w-full h-full bg-black p-6 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-white font-bold text-sm">Trades DB</p>
          <p className="text-[rgba(255,255,255,0.35)] text-[11px]">Your complete trade history</p>
        </div>
        <div className="px-4 py-1.5 rounded-full bg-white text-black text-[11px] font-bold">+ Log Trade</div>
      </div>
      {/* Stats bar */}
      <div className="flex rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.07)] mb-4">
        {[['38','Total Trades','text-white'],['68%','Win Rate','text-[#10b981]'],['$14,230','Net P&L','text-[#10b981]'],['+2.4R','Avg R','text-white']].map((s,i,a)=>(
          <div key={s[0]} className={cn('flex-1 py-3 px-4 flex flex-col items-center',i<a.length-1&&'border-r border-[rgba(255,255,255,0.06)]')}>
            <span className="text-[9px] text-[rgba(255,255,255,0.3)] uppercase tracking-wider">{s[1]}</span>
            <span className={cn('text-[18px] font-bold font-mono', s[2])}>{s[0]}</span>
          </div>
        ))}
      </div>
      {/* Column headers */}
      <div className="grid grid-cols-6 px-4 py-2 mb-1">
        {['Instrument','Date','Direction','Session','P&L','Outcome'].map(h=>(
          <p key={h} className="text-[9px] font-semibold uppercase tracking-wider text-[rgba(255,255,255,0.2)]">{h}</p>
        ))}
      </div>
      {/* Rows */}
      <div className="flex-1 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.07)] overflow-hidden">
        {[
          ['XAUUSD','Apr 09','Long','London','+$340','win'],
          ['NQ','Apr 09','Short','New York','-$120','loss'],
          ['BTC/USD','Apr 08','Long','Asia','+$890','win'],
          ['EUR/USD','Apr 08','Long','London','+$210','win'],
          ['GBP/JPY','Apr 07','Short','London','-$80','loss'],
          ['US30','Apr 07','Long','New York','+$460','win'],
        ].map((row,i)=>(
          <div key={i} className="grid grid-cols-6 px-4 py-3 border-b border-[rgba(255,255,255,0.04)] last:border-0 hover:bg-[rgba(255,255,255,0.02)] transition-colors items-center">
            <span className="text-[12px] font-semibold text-white">{row[0]}</span>
            <span className="text-[11px] text-[rgba(255,255,255,0.3)]">{row[1]}</span>
            <span className="text-[11px] text-[rgba(255,255,255,0.5)]">{row[2]}</span>
            <span className="text-[11px] text-[rgba(255,255,255,0.3)]">{row[3]}</span>
            <span className={cn('text-[12px] font-mono font-bold', row[5]==='win'?'text-[#10b981]':'text-[#f87171]')}>{row[4]}</span>
            <span className={cn('text-[9px] px-2 py-1 rounded-full text-center w-fit font-semibold', row[5]==='win'?'bg-[rgba(16,185,129,0.12)] text-[#10b981]':'bg-[rgba(248,113,113,0.12)] text-[#f87171]')}>{row[5]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockAI() {
  return (
    <div className="w-full h-full bg-black p-6 flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-full bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.2)] flex items-center justify-center">
          <Brain className="h-4 w-4 text-[#10b981]" weight="regular"/>
        </div>
        <div>
          <p className="text-white font-bold text-sm">AI Trade Advisor</p>
          <p className="text-[rgba(255,255,255,0.35)] text-[11px]">Based on your last 38 trades</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse"/>
          <span className="text-[10px] text-[#10b981]">Live analysis</span>
        </div>
      </div>
      <div className="flex-1 space-y-3 overflow-hidden">
        <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl p-4">
          <p className="text-[12px] text-[rgba(255,255,255,0.75)] leading-relaxed">
            Your <span className="text-white font-semibold">London session win rate (74%)</span> is 2.3× higher than New York (32%). Your edge lives in London — consider reducing NY exposure by 40% or cutting it entirely.
          </p>
        </div>
        <div className="bg-[rgba(248,113,113,0.04)] border border-[rgba(248,113,113,0.15)] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#f87171]"/>
            <p className="text-[10px] font-semibold text-[#f87171] uppercase tracking-wider">Leak Detected</p>
          </div>
          <p className="text-[12px] text-[rgba(255,255,255,0.7)] leading-relaxed">
            You lose <span className="text-[#f87171] font-semibold">$340 on average</span> when emotional state is below 3/5. Skip trades on your low-confidence days — your data shows a clear pattern.
          </p>
        </div>
        <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.07)] rounded-xl p-4">
          <p className="text-[10px] text-[rgba(255,255,255,0.35)] uppercase tracking-wider mb-3">Win Rate by Session</p>
          {[['London','74%',74,'#10b981'],['Asia','61%',61,'#10b981'],['Overlap','82%',82,'#10b981'],['New York','32%',32,'#f87171']].map(([s,v,w,c])=>(
            <div key={String(s)} className="flex items-center gap-3 mb-2">
              <span className="text-[11px] text-[rgba(255,255,255,0.5)] w-16">{s}</span>
              <div className="flex-1 h-1.5 bg-[rgba(255,255,255,0.05)] rounded-full"><div className="h-full rounded-full" style={{width:`${w}%`,background:String(c)}}/></div>
              <span className="text-[11px] font-mono font-bold" style={{color:String(c)}}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Carousel Screens ─── */
const SCREENS = [
  { id: 'dashboard', label: 'Analytics Dashboard', sub: 'Equity curve, stat bar, session performance and recent trades — all in one view.', Screen: MockDashboard },
  { id: 'analyst',   label: 'Performance Analyst', sub: 'Expectancy breakdown by instrument, session, emotion — find your exact leaks.', Screen: MockAnalyst },
  { id: 'trades',    label: 'Trades Database',     sub: 'Every trade logged, searchable, and filterable with summary stats at the top.', Screen: MockTrades },
  { id: 'ai',        label: 'AI Trade Advisor',    sub: 'Personalized insights based on YOUR trading data — not generic advice.', Screen: MockAI },
];

/* ─── Auto-scrolling Carousel ─── */
function AppCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const carouselRef = useRef(null);
  const inView = useInView(carouselRef, { margin: '-10%' });
  const total = SCREENS.length;

  const go = useCallback((i: number) => setActive(((i % total) + total) % total), [total]);

  useEffect(() => {
    if (paused || !inView) return;
    intervalRef.current = setInterval(() => go(active + 1), 4000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [active, paused, inView, go]);

  const { Screen, label, sub } = SCREENS[active];

  return (
    <div ref={carouselRef} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {/* Tab pills */}
      <div className="flex flex-wrap gap-2 justify-center mb-10">
        {SCREENS.map((s, i) => (
          <button key={s.id} onClick={() => { go(i); setPaused(true); }}
            className={cn('px-5 py-2 rounded-full text-[13px] font-medium transition-all border',
              active === i
                ? 'bg-white text-black border-white'
                : 'text-[rgba(255,255,255,0.4)] border-[rgba(255,255,255,0.1)] hover:text-white hover:border-[rgba(255,255,255,0.3)]'
            )}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Screen window */}
      <div className="relative max-w-5xl mx-auto">
        {/* Glow */}
        <div className="absolute -inset-8 rounded-3xl opacity-20 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, rgba(16,185,129,0.4) 0%, transparent 65%)' }} />

        <div className="relative rounded-2xl border border-[rgba(255,255,255,0.1)] overflow-hidden shadow-2xl"
          style={{ background: '#050505' }}>
          {/* Chrome bar */}
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[rgba(255,255,255,0.07)]">
            <div className="w-3 h-3 rounded-full bg-[rgba(255,255,255,0.1)]" />
            <div className="w-3 h-3 rounded-full bg-[rgba(255,255,255,0.1)]" />
            <div className="w-3 h-3 rounded-full bg-[rgba(255,255,255,0.1)]" />
            <div className="mx-4 flex-1 h-6 rounded-md bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] flex items-center px-3">
              <span className="text-[10px] text-[rgba(255,255,255,0.2)]">leone.capital — {label}</span>
            </div>
            {/* Auto-scroll progress bar */}
            <div className="w-16 h-1 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
              {!paused && (
                <motion.div key={active} className="h-full bg-[#10b981] rounded-full"
                  initial={{ width: '0%' }} animate={{ width: '100%' }}
                  transition={{ duration: 4, ease: 'linear' }} />
              )}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={active}
              initial={{ opacity: 0, x: 30, filter: 'blur(6px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: -30, filter: 'blur(6px)' }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              style={{ height: 480 }}>
              <Screen />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Arrows */}
        {[{dir:'left',fn:()=>go(active-1),Icon:ArrowLeft},{dir:'right',fn:()=>go(active+1),Icon:ArrowRight}].map(({dir,fn,Icon})=>(
          <button key={dir} onClick={()=>{fn();setPaused(true);}}
            className={cn(
              'absolute top-1/2 -translate-y-1/2 w-11 h-11 rounded-full border border-[rgba(255,255,255,0.12)] bg-black/80 backdrop-blur flex items-center justify-center text-[rgba(255,255,255,0.5)] hover:text-white hover:border-[rgba(255,255,255,0.3)] transition-all outline-none focus-visible:ring-2 focus-visible:ring-white/40 hidden md:flex',
              dir==='left'?'-translate-x-14 left-0':'translate-x-14 right-0'
            )}>
            <Icon className="h-4 w-4" weight="bold"/>
          </button>
        ))}
      </div>

      {/* Caption + dots */}
      <div className="text-center mt-8">
        <motion.p key={`l-${active}`} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
          className="text-[17px] font-semibold text-white mb-1.5">{label}</motion.p>
        <motion.p key={`s-${active}`} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:0.06}}
          className="text-[13px] text-[rgba(255,255,255,0.4)] max-w-md mx-auto">{sub}</motion.p>
        <div className="flex gap-2 justify-center mt-5">
          {SCREENS.map((_,i)=>(
            <button key={i} onClick={()=>{go(i);setPaused(true);}}
              aria-label={`Go to slide ${i+1}`}
              className="flex items-center justify-center w-11 h-11 outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-full">
              <span className={cn('rounded-full transition-all duration-300', i===active?'w-8 h-2 bg-[#10b981]':'w-2 h-2 bg-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.4)]')}/>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Feature row ─── */
function FeatureRow({
  title, desc, tag, Icon, Screen, flip, index,
}: {
  title: string; desc: string; tag: string;
  Icon: React.ElementType; Screen: React.ElementType;
  flip?: boolean; index: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 48 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.75, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'grid md:grid-cols-2 gap-12 lg:gap-20 items-center py-20 border-b border-[rgba(255,255,255,0.05)]',
        flip ? 'md:[&>*:first-child]:order-2' : ''
      )}>
      {/* Text */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[rgba(255,255,255,0.35)] mb-6">{tag}</p>
        <h3 className="text-[28px] md:text-[34px] font-black tracking-[-1.5px] text-white leading-[1.1] mb-5">
          {title}
        </h3>
        <p className="text-[rgba(255,255,255,0.45)] text-[15px] leading-relaxed mb-8 max-w-md">
          {desc}
        </p>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={cn('h-1 rounded-full transition-all', i === index ? 'w-6 bg-[rgba(255,255,255,0.9)]' : 'w-2 bg-[rgba(255,255,255,0.2)]')} />
            ))}
          </div>
        </div>
      </div>
      {/* Mockup */}
      <div className="relative hidden md:block">
        <div className="absolute -inset-8 rounded-3xl blur-3xl opacity-15 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(16,185,129,0.6) 0%, transparent 70%)' }} />
        <div className="relative rounded-2xl border border-[rgba(255,255,255,0.09)] overflow-hidden shadow-2xl" style={{ background: '#050505' }}>
          <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-[rgba(255,255,255,0.06)]">
            {[0,1,2].map(i=><div key={i} className="w-2 h-2 rounded-full bg-[rgba(255,255,255,0.1)]"/>)}
            <span className="ml-2 text-[10px] text-[rgba(255,255,255,0.18)]">leone.capital</span>
          </div>
          <div style={{ height: 340 }}>
            <Screen />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Feature Showcase ─── */
function FeatureShowcase() {
  const rows = [
    { title: 'Log in 30 seconds. Understand in seconds more.', tag: 'Trade Log', desc: 'Most traders have a gut feeling about what\'s working. EdgeFlow gives you the actual numbers — broken down by instrument, session, emotion, and strategy. Gut feeling vs data. Data wins.', Icon: ChartBar, Screen: MockDashboard, flip: false },
    { title: 'Find the exact leaks costing you money.', tag: 'Performance Analyst', desc: 'EdgeFlow segments every trade by session, setup, emotion, and direction — then flags which combinations are draining your account. One insight from this page pays for years of subscription.', Icon: Lightning, Screen: MockAnalyst, flip: true },
    { title: 'An analyst who has read every trade you\'ve ever taken.', tag: 'AI Advisor', desc: 'Ask it anything. It answers using your actual trade history — not generic advice. "Which session should I cut?" "Why do I keep losing on Fridays?" "What does my best trade look like?" It knows because it\'s read every entry.', Icon: Brain, Screen: MockAI, flip: false },
    { title: 'Before you change anything — see the numbers.', tag: 'What-If Simulator', desc: 'What if you only traded London session? What if you skipped every low-confidence day? What if you cut your worst instrument entirely? Run the simulation. See the P&L difference. Then decide.', Icon: TrendUp, Screen: MockTrades, flip: true },
  ];
  return (
    <div className="max-w-6xl mx-auto px-6">
      {rows.map((r, i) => <FeatureRow key={i} index={i} {...r} />)}
    </div>
  );
}

/* ─── Feature strip (replaces fake stats bar) ─── */
function FeatureStrip() {
  const items = [
    '15+ data points per trade',
    'Session & emotion tracking',
    'Leak detection engine',
    'What-If simulator',
    'AI trade advisor',
  ];
  return (
    <div className="py-8 px-6">
      <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
        {items.map((item, i) => (
          <React.Fragment key={item}>
            <span className="text-[13px] text-[rgba(255,255,255,0.35)]">{item}</span>
            {i < items.length - 1 && <span className="text-[rgba(255,255,255,0.15)]">·</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/* ─── Pricing ─── */
const plans = [
  { name:'Free',  price:'$0',  period:'',    sub:'Start logging. See what the data shows.',       cta:'Start for Free', featured:false,
    features:['Unlimited trades','Equity curve & calendar','Win/loss breakdown','1 trading account','Session journal'],
    missing:['AI Trade Advisor','Leak Detection','What-If Simulator'] },
  { name:'Pro',   price:'$12', period:'/mo', sub:'For traders ready to stop guessing.',           cta:'Start Pro',      featured:true,
    features:['Unlimited trades','Full analytics suite','AI Trade Advisor','Leak Detection','What-If Simulator','Up to 3 accounts','Pre-trade checklist'],
    missing:[] },
  { name:'Elite', price:'$24', period:'/mo', sub:'For professionals who trade for a living.',     cta:'Start Elite',    featured:false,
    features:['Everything in Pro','Unlimited accounts','CSV export','Priority support','Early access'],
    missing:[] },
];

/* ─── FAQ ─── */
const faqData = [
  { q:'Do I need trading experience?', a:"Not at all. Whether you've been trading 2 weeks or 10 years, EdgeFlow adapts to your data and gives you insights relevant to your exact level." },
  { q:'Is EdgeFlow free to use?', a:'Yes. The free plan gives full access to core features with no trade limit — no credit card required. Upgrade when ready.' },
  { q:'What markets does EdgeFlow support?', a:'Forex, crypto, futures, stocks, indices, and commodities. If you can trade it, you can journal and analyze it.' },
  { q:'How is this different from a spreadsheet?', a:'A spreadsheet shows you numbers. EdgeFlow shows you WHY. Pattern detection, leak surfacing, and personalized recommendations based on your actual data.' },
  { q:'Is my trading data secure?', a:'Completely. All data is encrypted via Supabase. Your data is never shared, sold, or used for any other purpose.' },
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
    <div className="min-h-screen text-white overflow-x-hidden" style={{ background: '#000', fontFamily:"'Inter',system-ui,sans-serif" }}>

      {/* ── NAVBAR ── */}
      <nav className={cn('fixed top-0 left-0 right-0 z-50 transition-all duration-500',
        scrolled ? 'bg-black/90 backdrop-blur-2xl border-b border-[rgba(255,255,255,0.07)]' : 'bg-transparent')}>
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <a href="/" className="flex items-center gap-2.5 text-white">
            <span className="text-[#10b981]"><EdgeFlowMark size={18}/></span>
            <span className="text-[14px] font-bold tracking-[-0.02em]">EDGEFLOW</span>
          </a>
          <div className="hidden md:flex items-center gap-8">
            {[['See the App','#see-the-app'],['Features','#features'],['Pricing','#pricing'],['FAQ','#faq']].map(([l,h])=>(
              <a key={l} href={h} className="text-[13px] text-[rgba(255,255,255,0.4)] hover:text-white transition-colors py-3 focus-visible:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded">{l}</a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <button onClick={()=>navigate('/auth')} className="text-[13px] text-[rgba(255,255,255,0.4)] hover:text-white transition-colors px-3 py-2">Sign In</button>
            <button onClick={()=>navigate('/auth')} className="px-5 py-2.5 rounded-full bg-white text-black text-[13px] font-bold hover:bg-white/90 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-white/40">Get Started Free</button>
          </div>
          <button onClick={()=>setMobileOpen(!mobileOpen)} className="md:hidden text-[rgba(255,255,255,0.6)] p-2 rounded-lg focus-visible:ring-2 focus-visible:ring-white/40 outline-none">
            {mobileOpen?<X className="h-5 w-5" weight="regular"/>:<List className="h-5 w-5" weight="regular"/>}
          </button>
        </div>
        <AnimatePresence>
          {mobileOpen&&(
            <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}
              className="md:hidden border-t border-[rgba(255,255,255,0.06)] bg-black/95 overflow-hidden">
              <div className="px-6 py-4 flex flex-col gap-1">
                {[['See the App','#see-the-app'],['Features','#features'],['Pricing','#pricing'],['FAQ','#faq']].map(([l,h])=>(
                  <a key={l} href={h} onClick={()=>setMobileOpen(false)} className="text-[rgba(255,255,255,0.5)] py-3 text-[14px] border-b border-[rgba(255,255,255,0.04)]">{l}</a>
                ))}
                <div className="pt-3 flex flex-col gap-2">
                  <button onClick={()=>navigate('/auth')} className="text-[rgba(255,255,255,0.4)] py-2 text-left text-[14px]">Sign In</button>
                  <button onClick={()=>navigate('/auth')} className="w-full py-3 rounded-full bg-white text-black text-[14px] font-bold hover:bg-white/90">Get Started Free</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── HERO with 3D scroll ── */}
      <ContainerScroll
        titleComponent={
          <div className="px-6 pt-20 pb-4">
            {/* Badge */}
            <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:0.6,ease:[0.22,1,0.36,1]}}
              className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full mb-8"
              style={{ background:'rgba(255,255,255,0.06)', border:'0.5px solid rgba(255,255,255,0.12)' }}>
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4ade80] opacity-60"/>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#4ade80]"/>
              </span>
              <span className="text-[11px] font-medium text-[rgba(255,255,255,0.55)] tracking-[0.06em]">AI-powered trading journal</span>
            </motion.div>
            {/* Headline */}
            <motion.h1 initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{duration:0.75,delay:0.08,ease:[0.22,1,0.36,1]}}
              className="font-black leading-[1.06] tracking-[-3px] mb-6 text-white"
              style={{fontSize:'clamp(44px,7vw,80px)'}}>
              Become a more<br/>
              <AnimatedWord words={['unstoppable','profitable','consistent','disciplined','data-driven']} color="#10b981"/>
              <span className="text-white"> trader.</span>
            </motion.h1>
            {/* Sub */}
            <motion.p initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.7,delay:0.18,ease:[0.22,1,0.36,1]}}
              className="text-[rgba(255,255,255,0.45)] text-[17px] max-w-xl mx-auto leading-relaxed mb-10">
              Most traders lose because they repeat the same mistakes without knowing it. EdgeFlow shows you exactly what's costing you — by session, setup, emotion, and pattern.
            </motion.p>
            {/* CTAs */}
            <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:0.6,delay:0.26,ease:[0.22,1,0.36,1]}}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
              <button onClick={()=>navigate('/auth')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white text-black text-[15px] font-bold hover:bg-white/90 active:scale-95 transition-all flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-white/40">
                Start Free — No Card Needed <ArrowRight className="h-4 w-4" weight="bold"/>
              </button>
              <a href="#see-the-app" className="text-[rgba(255,255,255,0.4)] text-[14px] py-3 px-4 hover:text-white transition-colors">
                See the app ↓
              </a>
            </motion.div>
            <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.5}}
              className="text-[12px] text-[rgba(255,255,255,0.2)]">
              Free to start &nbsp;·&nbsp; No credit card &nbsp;·&nbsp; Takes 30 seconds to set up
            </motion.p>
          </div>
        }
      >
        <MockDashboard />
      </ContainerScroll>

      {/* ── FEATURE STRIP ── */}
      <FeatureStrip />

      {/* ── APP CAROUSEL ── */}
      <section id="see-the-app" className="py-16 px-6 border-t border-[rgba(255,255,255,0.06)]">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-16">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#10b981] mb-4">The App</p>
            <h2 className="text-white font-black tracking-[-2px] mb-4" style={{fontSize:'clamp(32px,5vw,54px)'}}>
              See exactly what you're getting.
            </h2>
            <p className="text-[rgba(255,255,255,0.4)] text-[15px] max-w-lg mx-auto">
              Live previews of every major screen — auto-scrolling through the actual app.
            </p>
          </Reveal>
          <AppCarousel />
        </div>
      </section>

      {/* ── FEATURE SHOWCASE ── */}
      <section id="features" className="border-t border-[rgba(255,255,255,0.06)] py-10">
        <div className="max-w-6xl mx-auto px-6 pb-4">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#10b981] mb-4">How It Works</p>
            <h2 className="text-white font-black tracking-[-2px]" style={{fontSize:'clamp(32px,5vw,54px)'}}>
              Built for serious traders.
            </h2>
          </Reveal>
        </div>
        <FeatureShowcase />
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-28 px-6 border-t border-[rgba(255,255,255,0.06)]">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#10b981] mb-4">What Traders Discover</p>
            <h2 className="text-white font-black tracking-[-2px] mb-16" style={{fontSize:'clamp(32px,5vw,54px)'}}>
              The patterns traders find.
            </h2>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {name:'Alex M.',  type:'Forex Trader',  init:'AM', q:'I knew NY session felt off. EdgeFlow showed me I was 0% win rate on Fridays in NY — 23 straight losses. Cut it immediately. Next month was my best month in a year.'},
              {name:'Sarah K.', type:'Crypto Trader', init:'SK', q:'The emotional state breakdown broke me. I lose $340 on average when my mood is below 3/5. That\'s not a feeling anymore — that\'s data. I just don\'t trade those days.'},
              {name:'James R.', type:'Futures Trader',init:'JR', q:'I used the What-If tool to filter out every trade where I didn\'t follow my plan. My simulated P&L was 3x my actual P&L. That\'s how much discipline was costing me.'},
            ].map((t,i)=>(
              <Reveal key={t.name} delay={0.1*i}>
                <div className="rounded-2xl p-7 h-full flex flex-col"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex gap-1 mb-5">{[...Array(5)].map((_,j)=><span key={j} className="text-[#f59e0b] text-sm">★</span>)}</div>
                  <p className="text-[rgba(255,255,255,0.65)] text-[14px] leading-relaxed flex-1 mb-6">"{t.q}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] flex items-center justify-center text-white font-bold text-[11px]">{t.init}</div>
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
      <section id="pricing" className="py-28 px-6 border-t border-[rgba(255,255,255,0.06)]">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#10b981] mb-4">Simple Pricing</p>
            <h2 className="text-white font-black tracking-[-2px] mb-3" style={{fontSize:'clamp(32px,5vw,54px)'}}>Invest in your edge.</h2>
            <p className="text-[rgba(255,255,255,0.4)] text-[15px] mb-16">Start free. Upgrade when you're ready.</p>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-4">
            {plans.map((plan,i)=>(
              <Reveal key={plan.name} delay={0.1*i}>
                <div className={cn('rounded-2xl border p-7 h-full flex flex-col relative',
                  plan.featured
                    ? 'border-[#10b981] bg-[rgba(16,185,129,0.04)]'
                    : 'border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.02)]')}>
                  {plan.featured&&(
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 rounded-full bg-[#10b981] text-black text-[10px] font-bold tracking-wider">MOST POPULAR</span>
                    </div>
                  )}
                  <div className="mb-6">
                    <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[rgba(255,255,255,0.35)] mb-3">{plan.name}</p>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-[36px] font-black tracking-[-2px] text-white">{plan.price}</span>
                      {plan.period&&<span className="text-[14px] text-[rgba(255,255,255,0.4)]">{plan.period}</span>}
                    </div>
                    <p className="text-[13px] text-[rgba(255,255,255,0.4)]">{plan.sub}</p>
                  </div>
                  <button onClick={()=>navigate('/auth')}
                    className={cn('w-full py-3 rounded-full text-[14px] font-bold mb-6 transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-white/40',
                      'bg-white text-black hover:bg-white/90')}>
                    {plan.cta}
                  </button>
                  <div className="flex-1 space-y-3">
                    {plan.features.map(f=>(
                      <div key={f} className="flex items-center gap-2.5">
                        <CheckCircle className="h-4 w-4 shrink-0 text-[#10b981]" weight="fill"/>
                        <span className="text-[13px] text-[rgba(255,255,255,0.7)]">{f}</span>
                      </div>
                    ))}
                    {plan.missing.map(f=>(
                      <div key={f} className="flex items-center gap-2.5 opacity-30">
                        <X className="h-4 w-4 shrink-0 text-[rgba(255,255,255,0.4)]" weight="bold"/>
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
      <section id="faq" className="py-28 px-6 border-t border-[rgba(255,255,255,0.06)]">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#10b981] mb-4">FAQ</p>
            <h2 className="text-white font-black tracking-[-2px] mb-12" style={{fontSize:'clamp(32px,5vw,54px)'}}>Common questions.</h2>
          </Reveal>
          {faqData.map((item,i)=>(
            <Reveal key={i} delay={0.05*i}>
              <div className="border-b border-[rgba(255,255,255,0.06)]">
                <button onClick={()=>setOpenFaq(openFaq===i?null:i)} className="w-full flex items-center justify-between py-5 text-left gap-4 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/30 rounded-lg">
                  <span className="text-[15px] font-medium text-white">{item.q}</span>
                  <CaretDown className={cn('h-4 w-4 text-[rgba(255,255,255,0.3)] shrink-0 transition-transform duration-300',openFaq===i&&'rotate-180')} weight="bold"/>
                </button>
                <AnimatePresence>
                  {openFaq===i&&(
                    <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} transition={{duration:0.25}} className="overflow-hidden">
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
      <section className="py-28 px-6 border-t border-[rgba(255,255,255,0.06)]"
        style={{background:'linear-gradient(180deg, rgba(16,185,129,0.05) 0%, transparent 100%)'}}>
        <Reveal>
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-14 h-14 rounded-2xl bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.2)] flex items-center justify-center mx-auto mb-8">
              <ShieldCheck className="h-7 w-7 text-[#10b981]" weight="regular"/>
            </div>
            <h2 className="text-white font-black tracking-[-2.5px] mb-6" style={{fontSize:'clamp(36px,5vw,60px)'}}>
              Your edge is in the data.<br/>Go find it.
            </h2>
            <p className="text-[rgba(255,255,255,0.4)] text-[16px] mb-10 leading-relaxed">
              You already have the data from every trade you've taken. EdgeFlow just shows you what it means.
            </p>
            <button onClick={()=>navigate('/auth')}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-black text-[15px] font-bold hover:bg-white/90 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-white/40">
              Start Free — No Card Needed <ArrowRight className="h-4 w-4" weight="bold"/>
            </button>
          </div>
        </Reveal>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[rgba(255,255,255,0.06)] px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <span className="text-[#10b981]"><EdgeFlowMark size={16}/></span>
            <span className="text-[13px] font-bold text-white tracking-[-0.02em]">EDGEFLOW</span>
          </div>
          <div className="flex items-center gap-6">
            {[['See the App','#see-the-app'],['Pricing','#pricing'],['FAQ','#faq']].map(([l,h])=>(
              <a key={l} href={h} className="text-[12px] text-[rgba(255,255,255,0.3)] hover:text-white transition-colors">{l}</a>
            ))}
            <button onClick={()=>navigate('/auth')} className="text-[12px] text-[rgba(255,255,255,0.3)] hover:text-white transition-colors">Sign In</button>
          </div>
          <p className="text-[11px] text-[rgba(255,255,255,0.2)]">© {new Date().getFullYear()} EdgeFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
