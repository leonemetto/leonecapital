import { useNavigate } from 'react-router-dom';
import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  ArrowUpRight, Brain, Check, X as XIcon, ChartLine,
  MagnifyingGlass, Robot, Clipboard, Sliders, FileArrowDown,
  Lightning, Plus, Minus,
} from '@phosphor-icons/react';

/* ─── LOGO ─────────────────────────────────────────────────── */
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

/* ─── REVEAL ────────────────────────────────────────────────── */
function Reveal({ children, delay = 0, className = '' }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const reduced = useReducedMotion();
  if (reduced) return <div ref={ref} className={className}>{children}</div>;
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

/* ─── SECTION LABEL ─────────────────────────────────────────── */
function Label({ children, center = false }: { children: React.ReactNode; center?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2 mb-6', center && 'justify-center')}>
      <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] shrink-0" />
      <span className="text-[13px] text-[#10b981] font-medium tracking-wide">{children}</span>
    </div>
  );
}

/* ─── MOCK SCREENS ──────────────────────────────────────────── */
function MockDashboard({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn('w-full bg-[#080808] flex overflow-hidden text-white', compact ? 'h-full' : 'rounded-2xl')}>
      <div className="w-[44px] bg-[#0a0a0a] border-r border-white/[0.05] flex flex-col items-center py-3 gap-2.5 shrink-0">
        <div className="mb-2 text-[#10b981]"><EdgeFlowMark size={13}/></div>
        {[true,false,false,false,false].map((a,i) => (
          <div key={i} className={cn('w-6 h-6 rounded-md flex items-center justify-center', a ? 'bg-white' : '')}>
            <div className={cn('w-2.5 h-0.5 rounded-full', a ? 'bg-black' : 'bg-white/15')}/>
          </div>
        ))}
      </div>
      <div className="flex-1 p-4 overflow-hidden flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white text-[11px] font-semibold">Good morning, Alex</p>
            <p className="text-white/30 text-[9px]">Your edge summary</p>
          </div>
          <div className="flex items-center gap-1.5">
            {['W','M','Y'].map((l,i) => (
              <div key={i} className={cn('text-[9px] px-2 py-0.5 rounded-full', i===1?'bg-white text-black font-semibold':'text-white/40')}>{l}</div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { l: 'Win Rate', v: '68%', c: '#10b981' },
            { l: 'Net P&L', v: '+$4,820', c: '#10b981' },
            { l: 'Avg R', v: '2.1R', c: '#fff' },
          ].map((s) => (
            <div key={s.l} className="bg-[#111] rounded-xl p-2.5 border border-white/[0.05]">
              <p className="text-white/40 text-[8px] mb-1 uppercase tracking-wider">{s.l}</p>
              <p className="font-bold text-[13px]" style={{ color: s.c }}>{s.v}</p>
            </div>
          ))}
        </div>
        <div className="bg-[#111] rounded-xl p-3 border border-white/[0.05] flex-1">
          <p className="text-white/40 text-[8px] uppercase tracking-wider mb-2">Equity Curve</p>
          <svg viewBox="0 0 200 60" className="w-full" style={{ height: 48 }}>
            <defs>
              <linearGradient id="eg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.3"/>
                <stop offset="100%" stopColor="#10b981" stopOpacity="0"/>
              </linearGradient>
            </defs>
            <path d="M0,50 C20,48 35,44 50,40 C65,36 75,32 90,22 C105,14 120,18 135,12 C150,6 165,8 180,4 L200,2 L200,60 L0,60Z" fill="url(#eg)"/>
            <path d="M0,50 C20,48 35,44 50,40 C65,36 75,32 90,22 C105,14 120,18 135,12 C150,6 165,8 180,4 L200,2" fill="none" stroke="#10b981" strokeWidth="1.5"/>
          </svg>
        </div>
        <div className="space-y-1.5">
          {[
            { pair: 'XAUUSD', dir: 'Long', pnl: '+$420', w: true },
            { pair: 'GBP/USD', dir: 'Short', pnl: '-$120', w: false },
            { pair: 'US30', dir: 'Long', pnl: '+$680', w: true },
          ].map((t) => (
            <div key={t.pair} className="flex items-center justify-between bg-[#111] rounded-lg px-2.5 py-1.5 border border-white/[0.04]">
              <span className="text-white text-[10px] font-medium">{t.pair}</span>
              <span className="text-white/40 text-[9px]">{t.dir}</span>
              <span className={cn('text-[10px] font-semibold', t.w ? 'text-[#10b981]' : 'text-[#ef4444]')}>{t.pnl}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MockAI() {
  return (
    <div className="w-full h-full bg-[#080808] flex flex-col overflow-hidden text-white p-4 gap-3">
      <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
        <div className="w-2 h-2 rounded-full bg-[#10b981]"/>
        <span className="text-[11px] text-white/60 uppercase tracking-widest">AI Advisor</span>
      </div>
      <div className="flex justify-end">
        <div className="bg-[#f2f0ea] rounded-2xl rounded-br-sm px-3 py-2 max-w-[80%]">
          <p className="text-[10px] text-black">What pair is draining my performance?</p>
        </div>
      </div>
      <div className="bg-[#111] border border-[#10b981]/30 rounded-2xl rounded-bl-sm px-3 py-2.5 max-w-[90%]">
        <p className="text-[9.5px] text-white/80 leading-relaxed">
          <span className="text-white font-semibold">Your short positions are draining you.</span><br/>
          0% win rate on shorts: GBP/USD (0/4), US30 (0/4).<br/><br/>
          Your longs? <span className="text-white font-semibold">100% win rate — 34/34 trades, $6,870 P&L.</span><br/><br/>
          Stop shorting until you can show 3 consecutive winning entries with HTF bias aligned bearish.
        </p>
      </div>
      <div className="flex items-center gap-2 mt-auto bg-[#111] rounded-xl px-3 py-2 border border-white/[0.06]">
        <span className="text-white/30 text-[10px] flex-1">Ask anything about your trades...</span>
        <div className="w-5 h-5 rounded-md bg-[#10b981] flex items-center justify-center">
          <ArrowUpRight size={10} className="text-black"/>
        </div>
      </div>
    </div>
  );
}

function MockLeaks() {
  return (
    <div className="w-full h-full bg-[#080808] flex flex-col overflow-hidden text-white p-4 gap-3">
      <div>
        <p className="text-[10px] text-[#ef4444] uppercase tracking-widest mb-1">Leak Detection</p>
        <p className="text-white text-[12px] font-bold">Finds what's costing you.</p>
      </div>
      {[
        { label: 'GBP/USD Shorts', cost: '-$820', sev: 'critical' },
        { label: 'Asian Session', cost: '-$340', sev: 'moderate' },
        { label: 'Revenge trades', cost: '-$210', sev: 'low' },
      ].map((l) => (
        <div key={l.label} className="flex items-center justify-between bg-[#111] rounded-xl px-3 py-2.5 border border-white/[0.05]">
          <div>
            <p className="text-white text-[10px] font-semibold">{l.label}</p>
            <p className={cn('text-[8px] uppercase tracking-wider', l.sev === 'critical' ? 'text-[#ef4444]' : l.sev === 'moderate' ? 'text-amber-400' : 'text-white/40')}>{l.sev}</p>
          </div>
          <span className="text-[#ef4444] text-[11px] font-bold">{l.cost}</span>
        </div>
      ))}
      <div className="mt-auto bg-[#10b981]/10 border border-[#10b981]/30 rounded-xl px-3 py-2">
        <p className="text-[#10b981] text-[9px] font-semibold">Edge found: XAUUSD Longs</p>
        <p className="text-white/50 text-[9px]">+$2,700 P&L · 84% win rate</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LANDING PAGE
═══════════════════════════════════════════════════════════════ */
export default function Landing() {
  const navigate = useNavigate();
  const [yearly, setYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/dashboard');
    });
  }, [navigate]);

  const G = '#10b981';

  /* ── NAV ── */
  return (
    <div style={{ background: '#000', color: '#fff', fontFamily: 'system-ui,-apple-system,sans-serif', minHeight: '100vh' }}>

      {/* ══ NAV ══════════════════════════════════════════════════ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => navigate('/')}>
            <div style={{ color: G }}><EdgeFlowMark size={20}/></div>
            <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.5px' }}>EdgeFlow</span>
          </div>

          {/* Links */}
          <div style={{ display: 'flex', gap: 36 }} className="hidden md:flex">
            {['How it works', 'Features', 'Pricing', 'FAQ'].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g,'-')}`} style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color='#fff')}
                onMouseLeave={e => (e.currentTarget.style.color='rgba(255,255,255,0.7)')}>
                {l}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button onClick={() => navigate('/auth')} style={{
              padding: '8px 20px', borderRadius: 99, fontSize: 14, fontWeight: 500,
              background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              Log in <ArrowUpRight size={13}/>
            </button>
            <button onClick={() => navigate('/auth')} style={{
              padding: '8px 20px', borderRadius: 99, fontSize: 14, fontWeight: 600,
              background: G, color: '#000', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              Get started <ArrowUpRight size={13}/>
            </button>
          </div>
        </div>
      </nav>

      {/* ══ HERO ═════════════════════════════════════════════════ */}
      <section style={{ paddingTop: 160, paddingBottom: 0, textAlign: 'center' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 32px' }}>
          <Reveal>
            {/* Badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 32,
              padding: '6px 16px', borderRadius: 99, border: `1px solid ${G}40`,
              background: `${G}10` }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: G, display: 'inline-block' }}/>
              <span style={{ fontSize: 13, color: G, fontWeight: 500 }}>AI-Powered Trading Journal</span>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <h1 style={{
              fontSize: 'clamp(52px, 6vw, 80px)',
              fontWeight: 700,
              letterSpacing: '-2.5px',
              lineHeight: 1.05,
              margin: '0 0 24px',
            }}>
              Know your edge.<br/>Stop losing trades.
            </h1>
          </Reveal>

          <Reveal delay={0.14}>
            <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, marginBottom: 40, maxWidth: 520, margin: '0 auto 40px' }}>
              Log trades, surface hidden patterns, and let AI tell you exactly what's costing you — in plain English.
            </p>
          </Reveal>

          <Reveal delay={0.2}>
            <button onClick={() => navigate('/auth')} style={{
              padding: '14px 32px', borderRadius: 99, fontSize: 16, fontWeight: 600,
              background: G, color: '#000', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}>
              Get started free <ArrowUpRight size={16}/>
            </button>
          </Reveal>
        </div>

        {/* App mockup */}
        <Reveal delay={0.28}>
          <div style={{ maxWidth: 1100, margin: '64px auto 0', padding: '0 32px' }}>
            <div style={{
              borderRadius: '20px 20px 0 0',
              border: '1px solid rgba(255,255,255,0.08)',
              borderBottom: 'none',
              overflow: 'hidden',
              height: 480,
              background: '#0a0a0a',
            }}>
              <div style={{ height: 36, background: '#111', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 6 }}>
                {['#ef4444','#f59e0b','#10b981'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }}/>)}
                <div style={{ flex: 1, marginLeft: 8 }}>
                  <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 6, height: 20, width: 220, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>leone.capital/dashboard</span>
                  </div>
                </div>
              </div>
              <div style={{ height: 'calc(100% - 36px)' }}>
                <MockDashboard compact/>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ══ HOW IT WORKS ═════════════════════════════════════════ */}
      <section id="how-it-works" style={{ padding: '140px 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal>
            <div style={{ marginBottom: 8 }}>
              <Label>How it works</Label>
            </div>
            <h2 style={{ fontSize: 'clamp(36px, 4vw, 56px)', fontWeight: 700, letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 60 }}>
              How EdgeFlow works
            </h2>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[
              {
                step: 'Step 1', title: 'Log your trades',
                desc: 'Import from MT4/MT5 or log manually. Every trade captured with full context — session, emotion, strategy.',
                Screen: () => (
                  <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column', gap: 8, padding: 16 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#000', margin: 0 }}>Log Trade</p>
                    {[
                      { l: 'Instrument', v: 'XAUUSD' }, { l: 'Direction', v: 'Long' },
                      { l: 'P&L', v: '+$420' }, { l: 'Session', v: 'London' },
                    ].map(r => (
                      <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', paddingBottom: 6 }}>
                        <span style={{ fontSize: 9, color: '#999' }}>{r.l}</span>
                        <span style={{ fontSize: 9, fontWeight: 600, color: '#000' }}>{r.v}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: 'auto', background: '#000', borderRadius: 8, padding: '6px 0', textAlign: 'center' }}>
                      <span style={{ fontSize: 9, color: '#fff', fontWeight: 600 }}>Save Trade</span>
                    </div>
                  </div>
                ),
              },
              {
                step: 'Step 2', title: 'AI finds the leaks',
                desc: 'Ask plain English questions. EdgeFlow scans your data and tells you exactly what\'s costing you.',
                Screen: () => (
                  <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column', padding: 14, gap: 8 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#000', margin: 0 }}>AI Advisor</p>
                    <div style={{ background: '#f5f5f5', borderRadius: 10, padding: '8px 10px' }}>
                      <p style={{ fontSize: 9, color: '#000', margin: 0 }}>What's draining my P&L?</p>
                    </div>
                    <div style={{ background: '#000', borderRadius: 10, padding: '8px 10px' }}>
                      <p style={{ fontSize: 9, color: '#fff', lineHeight: 1.5, margin: 0 }}>Your GBP/USD shorts: 0% win rate across 4 trades. Your longs are 100%. Stop shorting.</p>
                    </div>
                  </div>
                ),
              },
              {
                step: 'Step 3', title: 'Fix your edge',
                desc: 'See exactly which instruments, sessions, and behaviours to cut — and which to double down on.',
                Screen: () => (
                  <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column', padding: 14, gap: 8 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#000', margin: 0 }}>Your Edge</p>
                    {[
                      { l: 'XAUUSD Longs', v: '+84%', pos: true },
                      { l: 'London Session', v: '+71%', pos: true },
                      { l: 'GBP/USD Shorts', v: '0%', pos: false },
                    ].map(r => (
                      <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: r.pos ? '#f0fdf4' : '#fef2f2', borderRadius: 8, padding: '6px 10px' }}>
                        <span style={{ fontSize: 9, color: '#000' }}>{r.l}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: r.pos ? '#10b981' : '#ef4444' }}>{r.v}</span>
                      </div>
                    ))}
                  </div>
                ),
              },
            ].map(({ step, title, desc, Screen }, i) => (
              <Reveal key={step} delay={i * 0.1}>
                <div style={{
                  background: '#0a0a0a', borderRadius: 20,
                  border: '1px solid rgba(255,255,255,0.07)',
                  overflow: 'hidden',
                  display: 'flex', flexDirection: 'column',
                }}>
                  <div style={{ height: 240, padding: 20, paddingBottom: 0 }}>
                    <Screen/>
                  </div>
                  <div style={{ padding: '20px 24px 28px' }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: `${G}15`, border: `1px solid ${G}40`,
                      borderRadius: 99, padding: '3px 12px', marginBottom: 12,
                    }}>
                      <span style={{ fontSize: 12, color: G, fontWeight: 600 }}>{step}</span>
                    </div>
                    <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.3px' }}>{title}</p>
                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: 0 }}>{desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURE SPOTLIGHT ════════════════════════════════════ */}
      <section style={{ padding: '0 32px 140px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'end', marginBottom: 48 }}>
              <h2 style={{ fontSize: 'clamp(36px, 4vw, 54px)', fontWeight: 700, letterSpacing: '-1.5px', lineHeight: 1.1, margin: 0 }}>
                See your trades in real time, clearly.
              </h2>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, margin: 0 }}>
                EdgeFlow shows your win rate, P&L, and behavioural patterns in clear visuals you can act on — right away.
              </p>
            </div>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {[
              { title: 'Smart Dashboard', Screen: MockDashboard },
              { title: 'AI Advisor', Screen: MockAI },
            ].map(({ title, Screen }, i) => (
              <Reveal key={title} delay={i * 0.1}>
                <div style={{
                  background: '#0a0a0a', borderRadius: 20,
                  border: '1px solid rgba(255,255,255,0.07)',
                  overflow: 'hidden',
                }}>
                  <div style={{ height: 320 }}>
                    <Screen/>
                  </div>
                  <div style={{ padding: '16px 24px 24px' }}>
                    <p style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{title}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURE GRID ═════════════════════════════════════════ */}
      <section id="features" style={{ padding: '0 32px 140px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal>
            <Label center>Features</Label>
            <h2 style={{ fontSize: 'clamp(36px, 4vw, 60px)', fontWeight: 700, letterSpacing: '-1.5px', lineHeight: 1.1, textAlign: 'center', marginBottom: 60 }}>
              Built for discipline,<br/>built for better trading
            </h2>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { icon: Robot, title: 'AI Advisor', desc: 'Ask plain English questions. Get direct answers backed by your actual trade data.' },
              { icon: MagnifyingGlass, title: 'Leak Detection', desc: 'Identifies negative-expectancy patterns — by pair, session, and behaviour — and tells you to stop.' },
              { icon: ChartLine, title: 'Deep Analytics', desc: 'Win rate, expectancy, profit factor, and drawdown broken down by every dimension you trade.' },
              { icon: Clipboard, title: 'Entry Checklist', desc: 'Pre-trade criteria that auto-track compliance so you know when discipline slips.' },
              { icon: Sliders, title: 'Strategy Optimizer', desc: 'Simulate removing any filter and see what your equity curve looks like without those trades.' },
              { icon: FileArrowDown, title: 'PDF Export', desc: 'Dark-themed performance reports you can share with prop firm reviewers or coaches.' },
            ].map(({ icon: Icon, title, desc }, i) => (
              <Reveal key={title} delay={(i % 3) * 0.08}>
                <div style={{
                  background: '#0a0a0a', borderRadius: 20,
                  border: '1px solid rgba(255,255,255,0.07)',
                  padding: 28,
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: '#0d1f14', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 20,
                  }}>
                    <Icon size={22} color={G} weight="fill"/>
                  </div>
                  <p style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px', marginBottom: 8 }}>{title}</p>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, margin: 0 }}>{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <div style={{ textAlign: 'center', marginTop: 48 }}>
              <button onClick={() => navigate('/auth')} style={{
                padding: '12px 28px', borderRadius: 99, fontSize: 15, fontWeight: 600,
                background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
                Get started <ArrowUpRight size={14}/>
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ COMPARISON ═══════════════════════════════════════════ */}
      <section style={{ padding: '0 32px 140px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Other journals */}
            <Reveal>
              <div style={{
                background: '#0a0a0a', borderRadius: 20,
                border: '1px solid rgba(255,255,255,0.07)',
                padding: 32,
              }}>
                <p style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 28 }}>Other Journals</p>
                {[
                  'Manual spreadsheets, no automation',
                  'Basic stats, no AI analysis',
                  'No pattern or leak detection',
                  'No behavioural feedback loop',
                  'Generic support, slow replies',
                ].map(item => (
                  <div key={item} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 18 }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', border: '1.5px solid #ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', shrink: 0, flexShrink: 0, marginTop: 1 }}>
                      <XIcon size={10} color="#ef4444" weight="bold"/>
                    </div>
                    <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', margin: 0, lineHeight: 1.5 }}>{item}</p>
                  </div>
                ))}
              </div>
            </Reveal>

            {/* EdgeFlow */}
            <Reveal delay={0.1}>
              <div style={{
                background: '#0a0a0a', borderRadius: 20,
                border: `1px solid ${G}`,
                boxShadow: `0 0 40px rgba(16,185,129,0.12)`,
                padding: 32,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
                  <div style={{ color: G }}><EdgeFlowMark size={16}/></div>
                  <p style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>EdgeFlow</p>
                </div>
                {[
                  'AI that reads your actual trade data',
                  'Plain-English answers, no dashboards to learn',
                  'Leak detection across pair, session, behaviour',
                  'Behavioural memory — learns your mistakes',
                  'Direct answers, zero fluff',
                ].map(item => (
                  <div key={item} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 18 }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', border: `1.5px solid ${G}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <Check size={10} color={G} weight="bold"/>
                    </div>
                    <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', margin: 0, lineHeight: 1.5 }}>{item}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ═════════════════════════════════════════ */}
      <section style={{ padding: '0 32px 140px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'end', marginBottom: 60 }}>
              <h2 style={{ fontSize: 'clamp(36px, 4vw, 54px)', fontWeight: 700, letterSpacing: '-1.5px', lineHeight: 1.1, margin: 0 }}>
                Loved by traders who take it seriously
              </h2>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, margin: 0 }}>
                Serious retail traders and prop firm traders who already know discipline is a problem — and want data to fix it.
              </p>
            </div>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { name: 'Alex K.', role: 'Prop firm trader', quote: 'I finally understood why I kept blowing challenges. EdgeFlow showed me I was revenge trading on Tuesdays. Dead simple.' },
              { name: 'Maria S.', role: 'Forex trader, 3 years', quote: 'The AI told me to stop shorting GBP/USD in one message. My win rate went from 41% to 68% in 3 weeks.' },
              { name: 'James O.', role: 'Day trader', quote: 'No more spreadsheets. No more guessing. Just a clear answer every morning about what to change.' },
            ].map(({ name, role, quote }, i) => (
              <Reveal key={name} delay={i * 0.1}>
                <div style={{
                  background: '#0a0a0a', borderRadius: 20,
                  border: '1px solid rgba(255,255,255,0.07)',
                  padding: 28,
                }}>
                  <div style={{ fontSize: 40, color: G, lineHeight: 1, marginBottom: 16, fontFamily: 'Georgia, serif' }}>"</div>
                  <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, marginBottom: 24 }}>{quote}</p>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 2px' }}>{name}</p>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{role}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRICING ══════════════════════════════════════════════ */}
      <section id="pricing" style={{ padding: '0 32px 140px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <Reveal>
            <Label center>Pricing</Label>
            <h2 style={{ fontSize: 'clamp(40px, 4.5vw, 64px)', fontWeight: 700, letterSpacing: '-2px', lineHeight: 1.05, marginBottom: 16 }}>
              Simple plans.
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', marginBottom: 40 }}>
              No hidden fees. Everything you need to build a real trading edge.
            </p>

            {/* Toggle */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 56, background: '#111', borderRadius: 99, padding: '4px 8px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <button onClick={() => setYearly(false)} style={{
                padding: '6px 18px', borderRadius: 99, fontSize: 14, fontWeight: 500,
                background: !yearly ? G : 'transparent', color: !yearly ? '#000' : 'rgba(255,255,255,0.5)',
                border: 'none', cursor: 'pointer', transition: 'all 0.2s',
              }}>Monthly</button>
              <button onClick={() => setYearly(true)} style={{
                padding: '6px 18px', borderRadius: 99, fontSize: 14, fontWeight: 500,
                background: yearly ? G : 'transparent', color: yearly ? '#000' : 'rgba(255,255,255,0.5)',
                border: 'none', cursor: 'pointer', transition: 'all 0.2s',
              }}>Yearly</button>
            </div>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, textAlign: 'left' }}>
            {/* Free */}
            <Reveal>
              <div style={{
                background: '#0a0a0a', borderRadius: 20,
                border: '1px solid rgba(255,255,255,0.08)',
                padding: 32,
              }}>
                <p style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Free</p>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 48, fontWeight: 700, letterSpacing: '-2px' }}>$0</span>
                  <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', marginLeft: 4 }}>/month</span>
                </div>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 28, lineHeight: 1.5 }}>For traders who want to start understanding their data.</p>
                <button onClick={() => navigate('/auth')} style={{
                  width: '100%', padding: '12px', borderRadius: 12, fontSize: 15, fontWeight: 600,
                  background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                  Get started <ArrowUpRight size={14}/>
                </button>
                <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {['Up to 50 trades', 'Core analytics dashboard', 'Entry checklist', 'CSV export'].map(f => (
                    <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <Check size={14} color={G}/><span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* Pro */}
            <Reveal delay={0.1}>
              <div style={{
                background: '#0a0a0a', borderRadius: 20,
                border: `1px solid ${G}`,
                boxShadow: `0 0 40px rgba(16,185,129,0.12)`,
                padding: 32, position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', top: 16, right: 16,
                  background: G, color: '#000', fontSize: 10, fontWeight: 700,
                  padding: '3px 10px', borderRadius: 99, letterSpacing: '0.08em',
                }}>POPULAR</div>
                <p style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Pro</p>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 48, fontWeight: 700, letterSpacing: '-2px' }}>${yearly ? '9' : '12'}</span>
                  <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', marginLeft: 4 }}>/month</span>
                  {yearly && <span style={{ fontSize: 12, color: G, marginLeft: 8 }}>billed yearly</span>}
                </div>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 28, lineHeight: 1.5 }}>For serious traders who want a real quantitative edge.</p>
                <button onClick={() => navigate('/auth')} style={{
                  width: '100%', padding: '12px', borderRadius: 12, fontSize: 15, fontWeight: 600,
                  background: G, color: '#000', border: 'none',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                  Get started <ArrowUpRight size={14}/>
                </button>
                <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {['Unlimited trades', 'AI Advisor (Gemini 2.0)', 'Leak Detection', 'Behavioural memory', 'Strategy Optimizer', 'PDF export'].map(f => (
                    <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <Check size={14} color={G}/><span style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══ FAQ ══════════════════════════════════════════════════ */}
      <section id="faq" style={{ padding: '0 32px 140px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'start', marginBottom: 60 }}>
              <div>
                <h2 style={{ fontSize: 'clamp(36px, 4vw, 56px)', fontWeight: 700, letterSpacing: '-1.5px', lineHeight: 1.1, margin: 0 }}>
                  Got questions?<br/>We've got answers.
                </h2>
              </div>
              <div style={{ paddingTop: 8 }}>
                <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 20 }}>
                  Everything you need to know before you start.
                </p>
                <button onClick={() => navigate('/auth')} style={{
                  background: 'none', border: 'none', color: G, fontSize: 15, fontWeight: 600,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0,
                }}>
                  Get started <ArrowUpRight size={14}/>
                </button>
              </div>
            </div>
          </Reveal>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { q: 'How does the AI analysis work?', a: 'You send your trades (up to 50 at a time) along with your trader profile and ask a question. EdgeFlow sends this to Gemini 2.0 Flash, which reads the data and gives you a direct, data-backed answer — no generic advice.' },
              { q: 'Do I need to pay to try it?', a: 'No. The free plan includes up to 50 trades and core analytics. You only need Pro for AI Advisor, Leak Detection, and unlimited trades.' },
              { q: 'What brokers does it support?', a: 'You can import from MT4/MT5 CSV exports, or log trades manually. A generic CSV importer handles most other brokers. More direct integrations are coming.' },
              { q: 'Is my trade data secure?', a: 'Yes. Your data is stored in Supabase with row-level security — only you can access your trades. We never share or sell your data.' },
              { q: 'Can I cancel anytime?', a: 'Yes. Monthly plans cancel at the end of the billing period. Yearly plans get a prorated refund in the first 30 days.' },
            ].map(({ q, a }, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <div style={{
                  background: '#0a0a0a', borderRadius: 16,
                  border: '1px solid rgba(255,255,255,0.07)',
                  overflow: 'hidden',
                }}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    style={{
                      width: '100%', padding: '24px 28px',
                      display: 'flex', alignItems: 'center', gap: 20,
                      background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                    }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      border: `1.5px solid ${openFaq === i ? G : 'rgba(255,255,255,0.15)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'border-color 0.2s',
                    }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: openFaq === i ? G : 'rgba(255,255,255,0.5)', fontVariantNumeric: 'tabular-nums' }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <span style={{ flex: 1, fontSize: 16, fontWeight: 600, color: '#fff' }}>{q}</span>
                    <div style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>
                      {openFaq === i ? <Minus size={18}/> : <Plus size={18}/>}
                    </div>
                  </button>
                  {openFaq === i && (
                    <div style={{ padding: '0 28px 24px', paddingLeft: 84 }}>
                      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, margin: 0 }}>{a}</p>
                    </div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA BANNER ═══════════════════════════════════════════ */}
      <section style={{ padding: '0 32px 140px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal>
            <div style={{
              background: '#0a0a0a', borderRadius: 24,
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '80px 60px', textAlign: 'center',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 600, height: 300,
                background: `radial-gradient(ellipse at 50% 50%, ${G}18 0%, transparent 70%)`,
                pointerEvents: 'none',
              }}/>
              <p style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 700, letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 20, position: 'relative' }}>
                Ready to manage your<br/>money smarter?
              </p>
              <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.5)', marginBottom: 40, position: 'relative' }}>
                Join traders who stopped guessing and started knowing.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', position: 'relative' }}>
                <button onClick={() => navigate('/auth')} style={{
                  padding: '14px 32px', borderRadius: 99, fontSize: 16, fontWeight: 600,
                  background: G, color: '#000', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  Get started free <ArrowUpRight size={16}/>
                </button>
                <button onClick={() => navigate('/auth')} style={{
                  padding: '14px 32px', borderRadius: 99, fontSize: 16, fontWeight: 500,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                  color: '#fff', cursor: 'pointer',
                }}>
                  Log in
                </button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ FOOTER ═══════════════════════════════════════════════ */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '60px 32px 40px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 60 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, color: G }}>
                <EdgeFlowMark size={18}/>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>EdgeFlow</span>
              </div>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, maxWidth: 240 }}>
                The trading journal that reads your data and tells you what to change.
              </p>
            </div>
            {[
              { heading: 'Product', links: ['Dashboard', 'AI Advisor', 'Leak Detection', 'Optimizer'] },
              { heading: 'Account', links: ['Sign up', 'Log in', 'Pricing', 'FAQ'] },
              { heading: 'Legal', links: ['Privacy', 'Terms', 'Security'] },
            ].map(col => (
              <div key={col.heading}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>{col.heading}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {col.links.map(l => (
                    <a key={l} href="#" style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', textDecoration: 'none', transition: 'color 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.color='#fff')}
                      onMouseLeave={e => (e.currentTarget.style.color='rgba(255,255,255,0.55)')}>
                      {l}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', margin: 0 }}>© 2025 EdgeFlow. All rights reserved.</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', margin: 0 }}>leone.capital</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
