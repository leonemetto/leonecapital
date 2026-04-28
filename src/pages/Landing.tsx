import { useNavigate } from 'react-router-dom';
import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  ArrowUpRight, Brain, Check, X as XIcon, ChartLine,
  MagnifyingGlass, Robot, Clipboard, Sliders, FileArrowDown,
  Lightning, Plus, Minus, ArrowRight,
} from '@phosphor-icons/react';

/* ─── CONSTANTS ───────────────────────────────────────────── */
const G = '#adff2f';      // Clario lime green
const BG = '#000';
const CARD = '#0d0d0d';
const CARD2 = '#111111';
const BORDER = 'rgba(255,255,255,0.08)';

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
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

/* ─── AVATAR ────────────────────────────────────────────────── */
function Avatar({ initials, color }: { initials: string; color: string }) {
  return (
    <div style={{
      width: 44, height: 44, borderRadius: '50%',
      background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 14, fontWeight: 700, color: '#000', flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

/* ─── MOCK SCREENS ──────────────────────────────────────────── */
function MockDashboard({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn('w-full bg-[#080808] flex overflow-hidden text-white', compact ? 'h-full' : 'rounded-2xl')}>
      <div className="w-[44px] bg-[#0a0a0a] border-r border-white/[0.05] flex flex-col items-center py-3 gap-2.5 shrink-0">
        <div className="mb-2" style={{ color: G }}><EdgeFlowMark size={13}/></div>
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
            { l: 'Win Rate', v: '68%', c: G },
            { l: 'Net P&L', v: '+$4,820', c: G },
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
                <stop offset="0%" stopColor={G} stopOpacity="0.3"/>
                <stop offset="100%" stopColor={G} stopOpacity="0"/>
              </linearGradient>
            </defs>
            <path d="M0,50 C20,48 35,44 50,40 C65,36 75,32 90,22 C105,14 120,18 135,12 C150,6 165,8 180,4 L200,2 L200,60 L0,60Z" fill="url(#eg)"/>
            <path d="M0,50 C20,48 35,44 50,40 C65,36 75,32 90,22 C105,14 120,18 135,12 C150,6 165,8 180,4 L200,2" fill="none" stroke={G} strokeWidth="1.5"/>
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
              <span className={cn('text-[10px] font-semibold')} style={{ color: t.w ? G : '#ef4444' }}>{t.pnl}</span>
            </div>
          ))}
        </div>
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
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/dashboard');
    });
  }, [navigate]);

  return (
    <div style={{ background: BG, color: '#fff', fontFamily: 'system-ui,-apple-system,sans-serif', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ══ NAV ══════════════════════════════════════════════════ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => navigate('/')}>
            <div style={{ color: G }}><EdgeFlowMark size={20}/></div>
            <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.5px' }}>EdgeFlow</span>
          </div>

          <div style={{ display: 'flex', gap: 40 }} className="hidden md:flex">
            {[
              { label: 'Features', href: '#features' },
              { label: 'How it works', href: '#how-it-works' },
              { label: 'Pricing', href: '#pricing' },
              { label: 'Blog', href: '#blog' },
            ].map(({ label, href }) => (
              <a key={label} href={href} style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color='#fff')}
                onMouseLeave={e => (e.currentTarget.style.color='rgba(255,255,255,0.65)')}>
                {label}
              </a>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button onClick={() => navigate('/auth')} style={{
              padding: '9px 22px', borderRadius: 99, fontSize: 14, fontWeight: 600,
              background: 'transparent', border: '1px solid rgba(255,255,255,0.18)',
              color: '#fff', cursor: 'pointer',
            }}>
              Log in
            </button>
            <button onClick={() => navigate('/auth')} style={{
              padding: '9px 22px', borderRadius: 99, fontSize: 14, fontWeight: 700,
              background: G, color: '#000', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              Get started <ArrowUpRight size={14} weight="bold"/>
            </button>
          </div>
        </div>
      </nav>

      {/* ══ HERO ═════════════════════════════════════════════════ */}
      <section style={{ paddingTop: 160, paddingBottom: 0, textAlign: 'center' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 40px' }}>

          <Reveal>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 36,
              padding: '6px 18px', borderRadius: 99,
              border: `1px solid ${G}50`, background: `${G}12`,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: G, display: 'inline-block' }}/>
              <span style={{ fontSize: 13, color: G, fontWeight: 600, letterSpacing: '0.02em' }}>AI-Powered Trading Journal</span>
            </div>
          </Reveal>

          <Reveal delay={0.07}>
            <h1 style={{
              fontSize: 'clamp(56px, 7vw, 96px)',
              fontWeight: 800,
              letterSpacing: '-3px',
              lineHeight: 1.0,
              margin: '0 0 28px',
            }}>
              Know your edge.<br/>
              <span style={{ color: G }}>Stop losing</span> trades.
            </h1>
          </Reveal>

          <Reveal delay={0.13}>
            <p style={{ fontSize: 19, color: 'rgba(255,255,255,0.48)', lineHeight: 1.65, maxWidth: 520, margin: '0 auto 44px' }}>
              Log trades, surface hidden patterns, and let AI tell you exactly what's costing you — in plain English.
            </p>
          </Reveal>

          <Reveal delay={0.19}>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/auth')} style={{
                padding: '14px 34px', borderRadius: 99, fontSize: 16, fontWeight: 700,
                background: G, color: '#000', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 8,
              }}>
                Get started free <ArrowUpRight size={16} weight="bold"/>
              </button>
              <button onClick={() => navigate('/auth')} style={{
                padding: '14px 34px', borderRadius: 99, fontSize: 16, fontWeight: 600,
                background: 'transparent', border: '1px solid rgba(255,255,255,0.18)',
                color: '#fff', cursor: 'pointer',
              }}>
                Log in
              </button>
            </div>
          </Reveal>
        </div>

        {/* Full-width dashboard mockup */}
        <Reveal delay={0.26}>
          <div style={{ maxWidth: 1160, margin: '72px auto 0', padding: '0 40px' }}>
            <div style={{
              borderRadius: '22px 22px 0 0',
              border: '1px solid rgba(255,255,255,0.1)',
              borderBottom: 'none',
              overflow: 'hidden',
              background: '#0a0a0a',
              boxShadow: `0 -20px 80px ${G}10`,
            }}>
              {/* Browser chrome */}
              <div style={{ height: 40, background: '#111', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 6 }}>
                {['#ef4444','#f59e0b','#22c55e'].map(c => <div key={c} style={{ width: 11, height: 11, borderRadius: '50%', background: c, opacity: 0.7 }}/>)}
                <div style={{ flex: 1, marginLeft: 8 }}>
                  <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 8, height: 22, width: 240, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>leone.capital/dashboard</span>
                  </div>
                </div>
              </div>
              <div style={{ height: 500 }}>
                <MockDashboard compact/>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ══ HOW IT WORKS ═════════════════════════════════════════ */}
      <section id="how-it-works" style={{ padding: '160px 40px 0' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>

          <Reveal>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: G }}/>
              <span style={{ fontSize: 13, color: G, fontWeight: 600 }}>How it works</span>
            </div>
            <h2 style={{ fontSize: 'clamp(40px, 5vw, 72px)', fontWeight: 800, letterSpacing: '-2.5px', lineHeight: 1.0, marginBottom: 72 }}>
              Three steps to your edge
            </h2>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[
              {
                step: '01',
                title: 'Log your trades',
                desc: 'Import from MT4/MT5 or log manually. Every trade captured with full context — session, emotion, strategy.',
                visual: (
                  <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {/* Back card */}
                    <div style={{
                      position: 'absolute',
                      width: '75%', height: '70%',
                      background: '#f5f5f5',
                      borderRadius: 16,
                      transform: 'perspective(600px) rotateX(6deg) rotateY(8deg) translateX(14px) translateY(-10px)',
                      boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
                      opacity: 0.5,
                    }}/>
                    {/* Middle card */}
                    <div style={{
                      position: 'absolute',
                      width: '75%', height: '70%',
                      background: '#fafafa',
                      borderRadius: 16,
                      transform: 'perspective(600px) rotateX(4deg) rotateY(4deg) translateX(6px) translateY(-4px)',
                      boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
                      opacity: 0.7,
                    }}/>
                    {/* Front card */}
                    <div style={{
                      position: 'relative',
                      width: '75%', height: '70%',
                      background: '#fff',
                      borderRadius: 16,
                      transform: 'perspective(600px) rotateX(2deg) rotateY(0deg)',
                      boxShadow: '0 20px 48px rgba(0,0,0,0.5)',
                      padding: 18,
                      display: 'flex', flexDirection: 'column', gap: 10,
                    }}>
                      <p style={{ fontSize: 12, fontWeight: 800, color: '#000', margin: 0, letterSpacing: '-0.3px' }}>Log Trade</p>
                      {[
                        { l: 'Instrument', v: 'XAUUSD' },
                        { l: 'Direction', v: 'Long' },
                        { l: 'P&L', v: '+$420' },
                        { l: 'Session', v: 'London' },
                      ].map(r => (
                        <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', paddingBottom: 7 }}>
                          <span style={{ fontSize: 10, color: '#999' }}>{r.l}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#000' }}>{r.v}</span>
                        </div>
                      ))}
                      <div style={{ marginTop: 'auto', background: '#000', borderRadius: 8, padding: '7px 0', textAlign: 'center' }}>
                        <span style={{ fontSize: 10, color: '#fff', fontWeight: 700 }}>Save Trade</span>
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                step: '02',
                title: 'AI finds your leaks',
                desc: 'Ask plain English questions. EdgeFlow scans your data and tells you exactly what\'s costing you.',
                visual: (
                  <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{
                      position: 'absolute',
                      width: '75%', height: '70%',
                      background: '#f5f5f5',
                      borderRadius: 16,
                      transform: 'perspective(600px) rotateX(6deg) rotateY(8deg) translateX(14px) translateY(-10px)',
                      boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
                      opacity: 0.5,
                    }}/>
                    <div style={{
                      position: 'relative',
                      width: '75%', height: '70%',
                      background: '#fff',
                      borderRadius: 16,
                      transform: 'perspective(600px) rotateX(2deg) rotateY(0deg)',
                      boxShadow: '0 20px 48px rgba(0,0,0,0.5)',
                      padding: 18,
                      display: 'flex', flexDirection: 'column', gap: 10,
                    }}>
                      <p style={{ fontSize: 12, fontWeight: 800, color: '#000', margin: 0 }}>AI Advisor</p>
                      <div style={{ background: '#f4f4f4', borderRadius: 10, padding: '8px 12px' }}>
                        <p style={{ fontSize: 9.5, color: '#333', margin: 0 }}>What's draining my P&L?</p>
                      </div>
                      <div style={{ background: '#000', borderRadius: 10, padding: '10px 12px', flex: 1 }}>
                        <p style={{ fontSize: 9, color: '#fff', lineHeight: 1.55, margin: 0 }}>
                          <span style={{ fontWeight: 700 }}>GBP/USD shorts: 0% win rate</span> across 4 trades.<br/><br/>
                          Your longs are 100% — 34 trades, $6,870.<br/>
                          Stop shorting until HTF bias is bearish.
                        </p>
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                step: '03',
                title: 'Fix your edge',
                desc: 'See exactly which instruments, sessions, and behaviours to cut — and which to double down on.',
                visual: (
                  <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{
                      position: 'absolute',
                      width: '75%', height: '70%',
                      background: '#f5f5f5',
                      borderRadius: 16,
                      transform: 'perspective(600px) rotateX(6deg) rotateY(8deg) translateX(14px) translateY(-10px)',
                      boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
                      opacity: 0.5,
                    }}/>
                    <div style={{
                      position: 'relative',
                      width: '75%', height: '70%',
                      background: '#fff',
                      borderRadius: 16,
                      transform: 'perspective(600px) rotateX(2deg) rotateY(0deg)',
                      boxShadow: '0 20px 48px rgba(0,0,0,0.5)',
                      padding: 18,
                      display: 'flex', flexDirection: 'column', gap: 10,
                    }}>
                      <p style={{ fontSize: 12, fontWeight: 800, color: '#000', margin: 0 }}>Your Edge</p>
                      {[
                        { l: 'XAUUSD Longs', v: '84%', pos: true },
                        { l: 'London Session', v: '71%', pos: true },
                        { l: 'GBP/USD Shorts', v: '0%', pos: false },
                        { l: 'Asian Session', v: '38%', pos: false },
                      ].map(r => (
                        <div key={r.l} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          background: r.pos ? '#f0fdf4' : '#fff8f8',
                          borderRadius: 8, padding: '7px 10px',
                        }}>
                          <span style={{ fontSize: 9.5, color: '#000' }}>{r.l}</span>
                          <span style={{ fontSize: 10.5, fontWeight: 800, color: r.pos ? '#16a34a' : '#ef4444' }}>{r.v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ),
              },
            ].map(({ step, title, desc, visual }, i) => (
              <Reveal key={step} delay={i * 0.09}>
                <div style={{
                  background: CARD, borderRadius: 24,
                  border: `1px solid ${BORDER}`,
                  overflow: 'hidden',
                  display: 'flex', flexDirection: 'column',
                  height: 480,
                }}>
                  <div style={{ flex: 1, position: 'relative', padding: 24, paddingBottom: 0 }}>
                    {visual}
                  </div>
                  <div style={{ padding: '28px 28px 32px' }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: `${G}18`, border: `1px solid ${G}40`,
                      borderRadius: 99, padding: '4px 14px', marginBottom: 14,
                    }}>
                      <span style={{ fontSize: 12, color: G, fontWeight: 700, letterSpacing: '0.06em' }}>Step {step}</span>
                    </div>
                    <p style={{ fontSize: 20, fontWeight: 800, marginBottom: 10, letterSpacing: '-0.5px' }}>{title}</p>
                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.48)', lineHeight: 1.65, margin: 0 }}>{desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURE SPOTLIGHT ════════════════════════════════════ */}
      <section style={{ padding: '160px 40px 0' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <Reveal>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'end', marginBottom: 56 }}>
              <h2 style={{ fontSize: 'clamp(36px, 4.5vw, 64px)', fontWeight: 800, letterSpacing: '-2.5px', lineHeight: 1.0, margin: 0 }}>
                See your trades in real time, clearly.
              </h2>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.48)', lineHeight: 1.75, margin: 0 }}>
                EdgeFlow shows your win rate, P&L, and behavioural patterns in clear visuals you can act on — right away.
              </p>
            </div>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {[
              {
                title: 'Smart Dashboard',
                sub: 'Every metric that matters, in one view',
                screen: (
                  <div style={{ height: 340, overflow: 'hidden' }}>
                    <MockDashboard/>
                  </div>
                ),
              },
              {
                title: 'AI Advisor',
                sub: 'Plain English answers from your data',
                screen: (
                  <div style={{ height: 340, background: '#080808', display: 'flex', flexDirection: 'column', padding: 20, gap: 12, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 12 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: G }}/>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>AI Advisor</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <div style={{ background: '#f2f0ea', borderRadius: '18px 18px 4px 18px', padding: '10px 14px', maxWidth: '80%' }}>
                        <p style={{ fontSize: 11, color: '#000', margin: 0 }}>What pair is draining my performance?</p>
                      </div>
                    </div>
                    <div style={{ background: '#161616', border: `1px solid ${G}25`, borderRadius: '18px 18px 18px 4px', padding: '12px 16px', maxWidth: '90%' }}>
                      <p style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.82)', lineHeight: 1.65, margin: 0 }}>
                        <span style={{ color: '#fff', fontWeight: 700 }}>Your short positions are draining you.</span><br/>
                        0% win rate on shorts: GBP/USD (0/4), US30 (0/4).<br/><br/>
                        Your longs? <span style={{ color: '#fff', fontWeight: 700 }}>100% win rate — 34/34 trades, $6,870 P&L.</span><br/><br/>
                        Stop shorting until HTF bias is bearish.
                      </p>
                    </div>
                    <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 8, background: '#161616', borderRadius: 12, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, flex: 1 }}>Ask anything about your trades...</span>
                      <div style={{ width: 26, height: 26, borderRadius: 8, background: G, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ArrowUpRight size={12} color="#000" weight="bold"/>
                      </div>
                    </div>
                  </div>
                ),
              },
            ].map(({ title, sub, screen }, i) => (
              <Reveal key={title} delay={i * 0.08}>
                <div style={{
                  background: CARD, borderRadius: 24,
                  border: `1px solid ${BORDER}`,
                  overflow: 'hidden',
                }}>
                  {screen}
                  <div style={{ padding: '20px 28px 28px', borderTop: `1px solid ${BORDER}` }}>
                    <p style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.5px', margin: '0 0 4px' }}>{title}</p>
                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', margin: 0 }}>{sub}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURE GRID ═════════════════════════════════════════ */}
      <section id="features" style={{ padding: '160px 40px 0' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <Reveal>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, justifyContent: 'center' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: G }}/>
              <span style={{ fontSize: 13, color: G, fontWeight: 600 }}>Features</span>
            </div>
            <h2 style={{ fontSize: 'clamp(40px, 5vw, 72px)', fontWeight: 800, letterSpacing: '-2.5px', lineHeight: 1.0, textAlign: 'center', marginBottom: 72 }}>
              Built for discipline,<br/>built for better trading
            </h2>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { icon: Robot, title: 'AI Advisor', desc: 'Ask plain English questions. Get direct answers backed by your actual trade data — not generic advice.' },
              { icon: MagnifyingGlass, title: 'Leak Detection', desc: 'Identifies negative-expectancy patterns — by pair, session, and behaviour — and tells you to stop.' },
              { icon: ChartLine, title: 'Deep Analytics', desc: 'Win rate, expectancy, profit factor, and drawdown broken down by every dimension you trade.' },
              { icon: Clipboard, title: 'Entry Checklist', desc: 'Pre-trade criteria that auto-track compliance so you know exactly when discipline slips.' },
              { icon: Sliders, title: 'Strategy Optimizer', desc: 'Simulate removing any filter and see what your equity curve looks like without those trades.' },
              { icon: FileArrowDown, title: 'PDF Export', desc: 'Dark-themed performance reports you can share with prop firm reviewers or coaches.' },
            ].map(({ icon: Icon, title, desc }, i) => (
              <Reveal key={title} delay={(i % 3) * 0.07}>
                <div style={{
                  background: CARD, borderRadius: 22,
                  border: `1px solid ${BORDER}`,
                  padding: 32,
                  height: '100%',
                }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: `${G}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 24,
                  }}>
                    <Icon size={24} color={G} weight="fill"/>
                  </div>
                  <p style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.4px', marginBottom: 10 }}>{title}</p>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.48)', lineHeight: 1.7, margin: 0 }}>{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <div style={{ textAlign: 'center', marginTop: 56 }}>
              <button onClick={() => navigate('/auth')} style={{
                padding: '13px 32px', borderRadius: 99, fontSize: 15, fontWeight: 700,
                background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
              }}>
                Explore all features <ArrowUpRight size={15} weight="bold"/>
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ COMPARISON ═══════════════════════════════════════════ */}
      <section style={{ padding: '160px 40px 0' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <Reveal>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: G }}/>
              <span style={{ fontSize: 13, color: G, fontWeight: 600 }}>Why EdgeFlow?</span>
            </div>
            <h2 style={{ fontSize: 'clamp(40px, 5vw, 68px)', fontWeight: 800, letterSpacing: '-2.5px', lineHeight: 1.0, marginBottom: 56 }}>
              Not just a journal.<br/>A performance engine.
            </h2>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Reveal>
              <div style={{
                background: CARD, borderRadius: 24,
                border: `1px solid ${BORDER}`,
                padding: '36px 36px',
              }}>
                <p style={{ fontSize: 17, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 32 }}>Other Journals</p>
                {[
                  'Manual spreadsheets, no automation',
                  'Basic stats, no AI analysis',
                  'No pattern or leak detection',
                  'No behavioural feedback loop',
                  'Generic support, slow replies',
                ].map(item => (
                  <div key={item} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 20 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', border: '1.5px solid rgba(239,68,68,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <XIcon size={11} color="#ef4444" weight="bold"/>
                    </div>
                    <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', margin: 0, lineHeight: 1.5 }}>{item}</p>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div style={{
                background: CARD, borderRadius: 24,
                border: `1px solid ${G}`,
                boxShadow: `0 0 60px ${G}12`,
                padding: '36px 36px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
                  <div style={{ color: G }}><EdgeFlowMark size={18}/></div>
                  <p style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>EdgeFlow</p>
                </div>
                {[
                  'AI reads your actual trade data',
                  'Plain-English answers, no learning curve',
                  'Leak detection across pair, session, behaviour',
                  'Behavioural memory — learns your mistakes',
                  'Direct answers, zero fluff',
                ].map(item => (
                  <div key={item} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 20 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', border: `1.5px solid ${G}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <Check size={11} color={G} weight="bold"/>
                    </div>
                    <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.88)', margin: 0, lineHeight: 1.5 }}>{item}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ═════════════════════════════════════════ */}
      <section style={{ padding: '160px 40px 0' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>

          <Reveal>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: G }}/>
              <span style={{ fontSize: 13, color: G, fontWeight: 600 }}>Testimonials</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'end', marginBottom: 64 }}>
              <h2 style={{ fontSize: 'clamp(36px, 4.5vw, 64px)', fontWeight: 800, letterSpacing: '-2.5px', lineHeight: 1.0, margin: 0 }}>
                Loved by traders who take it seriously
              </h2>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.48)', lineHeight: 1.75, margin: 0 }}>
                Serious retail traders and prop firm traders who know discipline is a problem — and want data to fix it.
              </p>
            </div>
          </Reveal>

          {/* 3×2 grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
            {[
              { name: 'Alex K.', role: 'Prop firm trader', color: '#a78bfa', initials: 'AK',
                quote: 'I finally understood why I kept blowing challenges. EdgeFlow showed me I was revenge trading on Tuesdays. Dead simple.' },
              { name: 'Maria S.', role: 'Forex trader, 3 years', color: '#f472b6', initials: 'MS',
                quote: 'The AI told me to stop shorting GBP/USD in one message. My win rate went from 41% to 68% in 3 weeks.' },
              { name: 'James O.', role: 'Day trader', color: '#60a5fa', initials: 'JO',
                quote: 'No more spreadsheets. No more guessing. Just a clear answer every morning about what to change.' },
              { name: 'Priya N.', role: 'Swing trader', color: G, initials: 'PN',
                quote: 'The leak detection alone is worth 10x the price. Found out my Asian session trades were destroying my P&L.' },
              { name: 'Daniel M.', role: 'Futures trader', color: '#fb923c', initials: 'DM',
                quote: 'I used to think I had a strategy problem. Turns out I had a discipline problem. EdgeFlow showed me the exact trades.' },
              { name: 'Sophie R.', role: 'FX prop trader', color: '#34d399', initials: 'SR',
                quote: 'Passed my FTMO challenge on the second attempt after 3 months of using EdgeFlow. The data doesn\'t lie.' },
            ].map(({ name, role, color, initials, quote }, i) => (
              <Reveal key={name} delay={(i % 3) * 0.07}>
                <div style={{
                  background: CARD, borderRadius: 22,
                  border: `1px solid ${BORDER}`,
                  padding: 28,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <Avatar initials={initials} color={color}/>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 700, margin: '0 0 2px' }}>{name}</p>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{role}</p>
                    </div>
                  </div>
                  <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.72)', lineHeight: 1.7, margin: 0 }}>"{quote}"</p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Featured testimonial */}
          <Reveal delay={0.1}>
            <div style={{
              background: CARD, borderRadius: 24,
              border: `1px solid ${BORDER}`,
              overflow: 'hidden',
              display: 'grid', gridTemplateColumns: '1fr 1fr',
            }}>
              {/* Photo side */}
              <div style={{
                background: 'linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                minHeight: 280, position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  width: 140, height: 140, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${G}40, ${G}20)`,
                  border: `3px solid ${G}60`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 48, fontWeight: 800, color: G,
                }}>
                  TK
                </div>
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
                  background: 'linear-gradient(to top, #0d0d0d, transparent)',
                }}/>
              </div>
              {/* Quote side */}
              <div style={{ padding: '48px 48px' }}>
                <div style={{ fontSize: 56, color: G, lineHeight: 1, marginBottom: 20, fontFamily: 'Georgia, serif' }}>"</div>
                <p style={{ fontSize: 18, color: '#fff', lineHeight: 1.65, marginBottom: 32, fontStyle: 'italic' }}>
                  EdgeFlow didn't just improve my win rate. It changed how I think about trading. I stopped treating the market as random and started treating it as data. Three months in, I'm up 22% net.
                </p>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 800, margin: '0 0 4px' }}>Thomas K.</p>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', margin: 0 }}>Funded forex trader · 4 years experience</p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ PRICING ══════════════════════════════════════════════ */}
      <section id="pricing" style={{ padding: '160px 40px 0' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center' }}>
          <Reveal>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, justifyContent: 'center' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: G }}/>
              <span style={{ fontSize: 13, color: G, fontWeight: 600 }}>Pricing</span>
            </div>
            <h2 style={{ fontSize: 'clamp(40px, 5vw, 72px)', fontWeight: 800, letterSpacing: '-2.5px', lineHeight: 1.0, marginBottom: 16 }}>
              Simple, honest pricing
            </h2>
            <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.48)', marginBottom: 44 }}>
              No hidden fees. Everything you need to build a real trading edge.
            </p>

            {/* Toggle */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 0, marginBottom: 64, background: CARD, borderRadius: 99, padding: '4px', border: `1px solid ${BORDER}` }}>
              <button onClick={() => setYearly(false)} style={{
                padding: '8px 24px', borderRadius: 99, fontSize: 14, fontWeight: 600,
                background: !yearly ? G : 'transparent', color: !yearly ? '#000' : 'rgba(255,255,255,0.5)',
                border: 'none', cursor: 'pointer', transition: 'all 0.2s',
              }}>Monthly</button>
              <button onClick={() => setYearly(true)} style={{
                padding: '8px 24px', borderRadius: 99, fontSize: 14, fontWeight: 600,
                background: yearly ? G : 'transparent', color: yearly ? '#000' : 'rgba(255,255,255,0.5)',
                border: 'none', cursor: 'pointer', transition: 'all 0.2s',
              }}>Yearly <span style={{ fontSize: 11, opacity: 0.7 }}>–25%</span></button>
            </div>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, textAlign: 'left' }}>
            {/* Free */}
            <Reveal>
              <div style={{
                background: CARD, borderRadius: 24,
                border: `1px solid ${BORDER}`,
                padding: '36px 36px',
              }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Free</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
                  <span style={{ fontSize: 56, fontWeight: 800, letterSpacing: '-2.5px', lineHeight: 1 }}>$0</span>
                  <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }}>/month</span>
                </div>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 28, lineHeight: 1.5 }}>For traders who want to start understanding their data.</p>
                <button onClick={() => navigate('/auth')} style={{
                  width: '100%', padding: '13px', borderRadius: 14, fontSize: 15, fontWeight: 700,
                  background: 'rgba(255,255,255,0.08)', color: '#fff', border: `1px solid ${BORDER}`,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                  Get started free <ArrowUpRight size={15} weight="bold"/>
                </button>
                <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {['Up to 50 trades', 'Core analytics dashboard', 'Entry checklist', 'CSV export', 'Manual trade logging'].map(f => (
                    <div key={f} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <Check size={14} color="rgba(255,255,255,0.4)"/>
                      <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* Pro */}
            <Reveal delay={0.08}>
              <div style={{
                background: CARD, borderRadius: 24,
                border: `1px solid ${G}`,
                boxShadow: `0 0 60px ${G}14`,
                padding: '36px 36px',
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', top: 20, right: 20,
                  background: G, color: '#000', fontSize: 10, fontWeight: 800,
                  padding: '4px 12px', borderRadius: 99, letterSpacing: '0.1em',
                }}>POPULAR</div>
                <p style={{ fontSize: 12, fontWeight: 700, color: G, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Pro</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
                  <span style={{ fontSize: 56, fontWeight: 800, letterSpacing: '-2.5px', lineHeight: 1 }}>${yearly ? '9' : '12'}</span>
                  <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }}>/month</span>
                  {yearly && <span style={{ fontSize: 12, color: G, marginLeft: 8 }}>billed yearly</span>}
                </div>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 28, lineHeight: 1.5 }}>For serious traders who want a real quantitative edge.</p>
                <button onClick={() => navigate('/auth')} style={{
                  width: '100%', padding: '13px', borderRadius: 14, fontSize: 15, fontWeight: 700,
                  background: G, color: '#000', border: 'none',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                  Get started <ArrowUpRight size={15} weight="bold"/>
                </button>
                <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {['Unlimited trades', 'AI Advisor (Gemini 2.0)', 'Leak Detection', 'Behavioural memory', 'Strategy Optimizer', 'PDF export', 'MT4/MT5 CSV import', 'Priority support'].map(f => (
                    <div key={f} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <Check size={14} color={G}/>
                      <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.88)' }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══ FAQ ══════════════════════════════════════════════════ */}
      <section id="faq" style={{ padding: '160px 40px 0' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <Reveal>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'start', marginBottom: 72 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: G }}/>
                  <span style={{ fontSize: 13, color: G, fontWeight: 600 }}>FAQ</span>
                </div>
                <h2 style={{ fontSize: 'clamp(36px, 4.5vw, 64px)', fontWeight: 800, letterSpacing: '-2.5px', lineHeight: 1.0, margin: 0 }}>
                  Got questions?<br/>We've got<br/>answers.
                </h2>
              </div>
              <div style={{ paddingTop: 64 }}>
                <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.48)', lineHeight: 1.75, marginBottom: 28 }}>
                  Everything you need to know before you start building your edge.
                </p>
                <button onClick={() => navigate('/auth')} style={{
                  background: 'none', border: 'none', color: G, fontSize: 15, fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: 0,
                }}>
                  Get started now <ArrowUpRight size={15} weight="bold"/>
                </button>
              </div>
            </div>
          </Reveal>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { q: 'How does the AI analysis work?', a: 'You send your trades along with your trader profile and ask a question. EdgeFlow sends this to Gemini 2.0 Flash, which reads the data and gives you a direct, data-backed answer — no generic advice, no hallucinations.' },
              { q: 'Do I need to pay to try it?', a: 'No. The free plan includes up to 50 trades and core analytics. You only need Pro for AI Advisor, Leak Detection, and unlimited trades.' },
              { q: 'What brokers does it support?', a: 'You can import from MT4/MT5 CSV exports, or log trades manually. A generic CSV importer handles most other brokers. More direct integrations are on the roadmap.' },
              { q: 'Is my trade data secure?', a: 'Yes. Your data is stored in Supabase with row-level security — only you can access your trades. We never share or sell your data. All API calls are JWT-authenticated.' },
              { q: 'Can I cancel anytime?', a: 'Yes. Monthly plans cancel at the end of the billing period. Yearly plans get a prorated refund in the first 30 days.' },
              { q: 'Does it work for futures, crypto, and forex?', a: 'Yes. EdgeFlow works with any instrument you can log — forex pairs, indices, crypto, futures, stocks. The analytics are instrument-agnostic.' },
            ].map(({ q, a }, i) => (
              <Reveal key={i} delay={i * 0.04}>
                <div style={{
                  background: CARD, borderRadius: 18,
                  border: `1px solid ${BORDER}`,
                  overflow: 'hidden',
                }}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    style={{
                      width: '100%', padding: '24px 32px',
                      display: 'flex', alignItems: 'center', gap: 20,
                      background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                    }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                      border: `1.5px solid ${openFaq === i ? G : 'rgba(255,255,255,0.14)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'border-color 0.2s',
                    }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: openFaq === i ? G : 'rgba(255,255,255,0.4)', fontVariantNumeric: 'tabular-nums' }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <span style={{ flex: 1, fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '-0.2px' }}>{q}</span>
                    <div style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0 }}>
                      {openFaq === i ? <Minus size={20}/> : <Plus size={20}/>}
                    </div>
                  </button>
                  {openFaq === i && (
                    <div style={{ padding: '0 32px 28px', paddingLeft: 92 }}>
                      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.52)', lineHeight: 1.75, margin: 0 }}>{a}</p>
                    </div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ BLOG ═════════════════════════════════════════════════ */}
      <section id="blog" style={{ padding: '160px 40px 0' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>

          <Reveal>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 56 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: G }}/>
                  <span style={{ fontSize: 13, color: G, fontWeight: 600 }}>Blog</span>
                </div>
                <h2 style={{ fontSize: 'clamp(36px, 4vw, 60px)', fontWeight: 800, letterSpacing: '-2px', lineHeight: 1.0, margin: 0 }}>
                  Trading insights from<br/>the data
                </h2>
              </div>
              <button style={{
                padding: '10px 24px', borderRadius: 99, fontSize: 14, fontWeight: 600,
                background: 'transparent', border: `1px solid ${BORDER}`,
                color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              }}>
                All articles <ArrowRight size={14}/>
              </button>
            </div>
          </Reveal>

          {/* Featured post */}
          <Reveal>
            <div style={{
              background: CARD, borderRadius: 24, border: `1px solid ${BORDER}`,
              overflow: 'hidden', marginBottom: 16,
              display: 'grid', gridTemplateColumns: '1fr 1fr',
            }}>
              {/* Image */}
              <div style={{
                background: 'linear-gradient(135deg, #0f2518 0%, #0a1a10 100%)',
                minHeight: 340, position: 'relative', overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  background: `radial-gradient(ellipse at 40% 50%, ${G}18 0%, transparent 70%)`,
                }}/>
                {/* Mini chart visual */}
                <svg viewBox="0 0 240 120" style={{ width: 200, position: 'relative' }}>
                  <defs>
                    <linearGradient id="blogChart" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={G} stopOpacity="0.4"/>
                      <stop offset="100%" stopColor={G} stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  <path d="M0,100 C20,95 35,90 50,80 C70,65 85,70 100,55 C115,40 125,30 140,20 C155,10 170,14 190,8 L240,2 L240,120 L0,120Z" fill="url(#blogChart)"/>
                  <path d="M0,100 C20,95 35,90 50,80 C70,65 85,70 100,55 C115,40 125,30 140,20 C155,10 170,14 190,8 L240,2" fill="none" stroke={G} strokeWidth="2"/>
                </svg>
              </div>
              {/* Content */}
              <div style={{ padding: '48px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                  <span style={{ fontSize: 11, color: G, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Analytics</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>·</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>5 min read</span>
                </div>
                <h3 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.8px', lineHeight: 1.2, marginBottom: 16 }}>
                  Why 90% of retail traders lose money — and what the data actually shows
                </h3>
                <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.48)', lineHeight: 1.7, marginBottom: 32 }}>
                  We analysed 50,000 trades across EdgeFlow users and found a single pattern that accounts for most of the losses. It's not strategy. It's not risk management. It's timing.
                </p>
                <button style={{
                  background: 'none', border: 'none', color: G, fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: 0,
                }}>
                  Read article <ArrowUpRight size={15} weight="bold"/>
                </button>
              </div>
            </div>
          </Reveal>

          {/* 3-column posts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              {
                tag: 'Psychology', time: '4 min', color: '#a78bfa',
                title: 'The revenge trade loop — how to break it with data',
                excerpt: 'Revenge trading costs the average funded trader $800/month. Here\'s how to identify and stop the pattern.',
              },
              {
                tag: 'Strategy', time: '6 min', color: '#60a5fa',
                title: 'Expectancy is the only stat that matters. Here\'s why.',
                excerpt: 'Win rate is a vanity metric. This guide shows you how to calculate and improve your true statistical edge.',
              },
              {
                tag: 'Prop Firms', time: '3 min', color: '#fb923c',
                title: 'How to pass FTMO in 30 days using your own trade data',
                excerpt: 'The traders who pass challenges aren\'t better at entries. They\'re better at position sizing and discipline.',
              },
            ].map(({ tag, time, color, title, excerpt }, i) => (
              <Reveal key={title} delay={i * 0.07}>
                <div style={{
                  background: CARD, borderRadius: 22, border: `1px solid ${BORDER}`,
                  overflow: 'hidden', cursor: 'pointer',
                }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}>
                  {/* Image placeholder */}
                  <div style={{
                    height: 180,
                    background: `linear-gradient(135deg, ${color}18 0%, transparent 100%)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderBottom: `1px solid ${BORDER}`,
                  }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: `${color}25`, border: `1.5px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ChartLine size={26} color={color}/>
                    </div>
                  </div>
                  <div style={{ padding: '24px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <span style={{ fontSize: 11, color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{tag}</span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>·</span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{time} read</span>
                    </div>
                    <p style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.4px', lineHeight: 1.3, marginBottom: 10 }}>{title}</p>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65, margin: 0 }}>{excerpt}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA BANNER ═══════════════════════════════════════════ */}
      <section style={{ padding: '160px 40px 0' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <Reveal>
            <div style={{
              background: CARD, borderRadius: 28,
              border: `1px solid ${BORDER}`,
              overflow: 'hidden',
              display: 'grid', gridTemplateColumns: '1fr auto',
              alignItems: 'center',
              position: 'relative',
            }}>
              {/* Glow */}
              <div style={{
                position: 'absolute', top: '50%', left: '30%',
                transform: 'translate(-50%, -50%)',
                width: 500, height: 300,
                background: `radial-gradient(ellipse, ${G}14 0%, transparent 70%)`,
                pointerEvents: 'none',
              }}/>

              {/* Text + buttons */}
              <div style={{ padding: '64px 64px', position: 'relative' }}>
                <p style={{ fontSize: 'clamp(32px, 4vw, 56px)', fontWeight: 800, letterSpacing: '-2px', lineHeight: 1.0, marginBottom: 20 }}>
                  Ready to manage<br/>your money smarter?
                </p>
                <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.48)', marginBottom: 40 }}>
                  Join traders who stopped guessing and started knowing.
                </p>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button onClick={() => navigate('/auth')} style={{
                    padding: '14px 34px', borderRadius: 99, fontSize: 16, fontWeight: 700,
                    background: G, color: '#000', cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                  }}>
                    Get started free <ArrowUpRight size={16} weight="bold"/>
                  </button>
                  <button onClick={() => navigate('/auth')} style={{
                    padding: '14px 34px', borderRadius: 99, fontSize: 16, fontWeight: 600,
                    background: 'rgba(255,255,255,0.07)', border: `1px solid ${BORDER}`,
                    color: '#fff', cursor: 'pointer',
                  }}>
                    Log in
                  </button>
                </div>
              </div>

              {/* Person visual */}
              <div style={{
                width: 360, height: 380, position: 'relative', overflow: 'hidden',
                display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
              }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  background: `radial-gradient(ellipse at 50% 70%, ${G}20 0%, transparent 60%)`,
                }}/>
                {/* Stylized person silhouette */}
                <div style={{
                  width: 200, height: 280, position: 'relative',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 0,
                }}>
                  {/* Head */}
                  <div style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: `linear-gradient(135deg, ${G}40, ${G}20)`,
                    border: `2px solid ${G}60`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 24, fontWeight: 800, color: G,
                    marginBottom: -4, position: 'relative', zIndex: 1,
                  }}>
                    EF
                  </div>
                  {/* Body/shirt */}
                  <div style={{
                    width: 140, height: 160, borderRadius: '60px 60px 20px 20px',
                    background: 'linear-gradient(180deg, #1a1a1a 0%, #111 100%)',
                    border: `1px solid rgba(255,255,255,0.08)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{
                      padding: '6px 14px', borderRadius: 99,
                      background: `${G}20`, border: `1px solid ${G}40`,
                    }}>
                      <span style={{ fontSize: 11, color: G, fontWeight: 700 }}>+68% win rate</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ FOOTER ═══════════════════════════════════════════════ */}
      <footer style={{ borderTop: `1px solid ${BORDER}`, padding: '80px 40px 48px', marginTop: 160 }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 64, marginBottom: 72 }}>
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, color: G }}>
                <EdgeFlowMark size={20}/>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>EdgeFlow</span>
              </div>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.38)', lineHeight: 1.75, maxWidth: 280, marginBottom: 28 }}>
                The trading journal that reads your data and tells you exactly what to change.
              </p>
              <button onClick={() => navigate('/auth')} style={{
                padding: '10px 24px', borderRadius: 99, fontSize: 14, fontWeight: 700,
                background: G, color: '#000', cursor: 'pointer', border: 'none',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
                Get started <ArrowUpRight size={13} weight="bold"/>
              </button>
            </div>

            {/* Quick Menu */}
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 24 }}>Quick Menu</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'How it works', href: '#how-it-works' },
                  { label: 'Features', href: '#features' },
                  { label: 'Blog', href: '#blog' },
                  { label: 'Pricing', href: '#pricing' },
                  { label: 'FAQ', href: '#faq' },
                ].map(({ label, href }) => (
                  <a key={label} href={href} style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.color='#fff')}
                    onMouseLeave={e => (e.currentTarget.style.color='rgba(255,255,255,0.5)')}>
                    {label}
                  </a>
                ))}
              </div>
            </div>

            {/* Information */}
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 24 }}>Information</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Privacy Policy', href: '/privacy' },
                  { label: 'Terms & Conditions', href: '/terms' },
                  { label: 'Security', href: '#' },
                  { label: 'Log in', href: '/auth' },
                  { label: 'Sign up', href: '/auth' },
                ].map(({ label, href }) => (
                  <a key={label} href={href} style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.color='#fff')}
                    onMouseLeave={e => (e.currentTarget.style.color='rgba(255,255,255,0.5)')}>
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.25)', margin: 0 }}>© 2025 EdgeFlow. All rights reserved.</p>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.25)', margin: 0 }}>leone.capital</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
