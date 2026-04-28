import { useNavigate } from 'react-router-dom';
import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion, useInView, useReducedMotion } from 'framer-motion';

/* ─── DESIGN TOKENS (exact Clario) ──────────────────────────── */
const G = '#a3ff3e';          // Clario lime-green
const BG = '#000';
const CARD = '#141414';       // dark card bg
const CARD2 = '#1a1a1a';      // slightly lighter card
const MUTED = 'rgba(255,255,255,0.45)';

/* ─── LOGO ─────────────────────────────────────────────────── */
function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <path d="M16 4C9.373 4 4 9.373 4 16s5.373 12 12 12 12-5.373 12-12S22.627 4 16 4z" stroke="white" strokeWidth="2" fill="none"/>
      <path d="M16 8c-4.418 0-8 3.582-8 8s3.582 8 8 8 8-3.582 8-8-3.582-8-8-8z" stroke="white" strokeWidth="1.5" fill="none" strokeDasharray="4 4"/>
      <circle cx="16" cy="16" r="3" fill="white"/>
    </svg>
  );
}

/* ─── REVEAL ────────────────────────────────────────────────── */
function Reveal({ children, delay = 0, className = '' }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  const reduced = useReducedMotion();
  if (reduced) return <div ref={ref} className={className}>{children}</div>;
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

/* ─── SECTION LABEL ─────────────────────────────────────────── */
function SectionLabel({ children, center }: { children: string; center?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, justifyContent: center ? 'center' : 'flex-start' }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: G, display: 'inline-block', flexShrink: 0 }}/>
      <span style={{ fontSize: 14, color: G, fontWeight: 500 }}>{children}</span>
    </div>
  );
}

/* ─── UI MOCKUPS ─────────────────────────────────────────────── */
function MockDashboardCard() {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 20, height: '100%', display: 'flex', flexDirection: 'column', gap: 12, color: '#000' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 11, color: '#999', margin: 0 }}>Balance Amount</p>
          <p style={{ fontSize: 22, fontWeight: 800, margin: '2px 0 0', letterSpacing: '-0.5px' }}>$562,000</p>
        </div>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>EF</span>
        </div>
      </div>
      <div style={{ background: '#f5f5f5', borderRadius: 10, padding: '10px 14px' }}>
        <p style={{ fontSize: 10, color: '#999', margin: '0 0 2px' }}>Daily Limit</p>
        <p style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>$2,500.00</p>
        <div style={{ marginTop: 6, height: 6, background: '#e0e0e0', borderRadius: 99 }}>
          <div style={{ width: '12.5%', height: '100%', background: G, borderRadius: 99 }}/>
        </div>
        <p style={{ fontSize: 10, color: '#999', margin: '4px 0 0' }}>12.5%</p>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {['Top Up', 'Transfer', 'Request', 'History'].map(a => (
          <div key={a} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#f0f0f0', margin: '0 auto 4px' }}/>
            <p style={{ fontSize: 9, color: '#666', margin: 0 }}>{a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockChartCard() {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 20, height: '100%', display: 'flex', flexDirection: 'column', gap: 10, color: '#000' }}>
      <p style={{ fontSize: 12, fontWeight: 700, margin: 0 }}>Performance</p>
      <svg viewBox="0 0 200 80" style={{ width: '100%', flex: 1 }}>
        <polyline points="0,70 30,60 60,50 90,30 120,40 150,20 180,10 200,5"
          fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="90" cy="30" r="4" fill="#000"/>
        <rect x="70" y="12" width="60" height="22" rx="4" fill="#1a1a1a"/>
        <text x="100" y="27" textAnchor="middle" fill="white" fontSize="9" fontWeight="700">Jun 2024</text>
        <line x1="90" y1="30" x2="90" y2="70" stroke="#ddd" strokeWidth="1" strokeDasharray="3,3"/>
      </svg>
    </div>
  );
}

function MockGoalCard() {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 20, height: '100%', display: 'flex', flexDirection: 'column', gap: 12, color: '#000' }}>
      <p style={{ fontSize: 11, color: '#999', margin: 0 }}>Win Rate Goal</p>
      <p style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>68%</p>
      <div style={{ height: 8, background: '#f0f0f0', borderRadius: 99 }}>
        <div style={{ width: '68%', height: '100%', background: G, borderRadius: 99 }}/>
      </div>
      <p style={{ fontSize: 11, color: '#999', margin: 0 }}>On track — 34 trades this month</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LANDING PAGE — Exact Clario clone
═══════════════════════════════════════════════════════════════ */
export default function Landing() {
  const navigate = useNavigate();
  const [yearly, setYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/dashboard');
    });
  }, [navigate]);

  const H = { fontFamily: 'system-ui,-apple-system,sans-serif' };
  const btn = (green?: boolean, outline?: boolean) => ({
    padding: '10px 22px', borderRadius: 99, fontSize: 14, fontWeight: 600,
    background: green ? G : outline ? 'transparent' : 'rgba(255,255,255,0.08)',
    border: green ? 'none' : outline ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.12)',
    color: green ? '#000' : '#fff',
    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
    transition: 'opacity 0.15s',
  } as React.CSSProperties);

  return (
    <div style={{ background: BG, color: '#fff', ...H, minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ══ NAV ══════════════════════════════════════════════════ */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(16px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/')}>
            <Logo size={28}/>
            <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px' }}>EdgeFlow</span>
          </div>

          {/* Nav links */}
          <div style={{ display: 'flex', gap: 36 }} className="hidden md:flex">
            {['How it works', 'Features', 'Pricing', 'Blog'].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, '-')}`}
                style={{ fontSize: 15, color: '#fff', textDecoration: 'none', fontWeight: 400, opacity: 0.85 }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.85')}>
                {l}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => navigate('/auth')} style={btn(false, true)}>
              Waitlist ↗
            </button>
            <button onClick={() => navigate('/auth')} style={btn(true)}>
              Get Started ↗
            </button>
          </div>
        </div>
      </nav>

      {/* ══ HERO ═════════════════════════════════════════════════ */}
      <section style={{ paddingTop: 140, paddingBottom: 0, textAlign: 'center' }}>
        <div style={{ maxWidth: 820, margin: '0 auto', padding: '0 32px' }}>
          <Reveal>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 32,
              padding: '5px 16px', borderRadius: 99, border: `1px solid ${G}50`, background: `${G}10` }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: G, display: 'inline-block' }}/>
              <span style={{ fontSize: 13, color: G, fontWeight: 500 }}>All-in-One Trading Journal</span>
            </div>
          </Reveal>

          <Reveal delay={0.06}>
            <h1 style={{ fontSize: 'clamp(52px, 7vw, 88px)', fontWeight: 800, letterSpacing: '-3px', lineHeight: 1.0, margin: '0 0 24px' }}>
              Take control of your<br/>trades — with clarity
            </h1>
          </Reveal>

          <Reveal delay={0.12}>
            <p style={{ fontSize: 17, color: MUTED, lineHeight: 1.7, maxWidth: 480, margin: '0 auto 36px' }}>
              All your trade insights, finally in one place — track performance, surface leaks, and reach your goals with ease.
            </p>
          </Reveal>

          <Reveal delay={0.18}>
            <button onClick={() => navigate('/auth')} style={{ ...btn(true), padding: '13px 28px', fontSize: 15 }}>
              Get Started Free ↗
            </button>
          </Reveal>
        </div>

        {/* Dashboard mockup */}
        <Reveal delay={0.24}>
          <div style={{ maxWidth: 1100, margin: '64px auto 0', padding: '0 32px', position: 'relative' }}>
            {/* Green glow */}
            <div style={{ position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)',
              width: 600, height: 200, background: `radial-gradient(ellipse, ${G}25 0%, transparent 70%)`,
              pointerEvents: 'none', zIndex: 0 }}/>
            <div style={{
              borderRadius: '20px 20px 0 0', border: '1px solid rgba(255,255,255,0.1)', borderBottom: 'none',
              overflow: 'hidden', background: '#f5f5f5', position: 'relative', zIndex: 1,
            }}>
              {/* Browser chrome */}
              <div style={{ background: '#e8e8e8', height: 36, display: 'flex', alignItems: 'center', padding: '0 14px', gap: 6, borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                {['#ff5f57','#ffbd2e','#28ca41'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }}/>)}
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                  <div style={{ background: '#fff', borderRadius: 6, height: 20, width: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0,0,0,0.08)' }}>
                    <span style={{ fontSize: 10, color: '#666' }}>leone.capital/dashboard</span>
                  </div>
                </div>
              </div>
              {/* App UI */}
              <div style={{ display: 'flex', height: 440, background: '#fff' }}>
                {/* Sidebar */}
                <div style={{ width: 56, background: '#1a1a1a', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: G, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                    <Logo size={16}/>
                  </div>
                  {[true,false,false,false,false,false].map((a,i) => (
                    <div key={i} style={{ width: 32, height: 32, borderRadius: 8, background: a ? '#fff' : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 14, height: 2, borderRadius: 1, background: a ? '#000' : 'rgba(255,255,255,0.3)' }}/>
                    </div>
                  ))}
                </div>
                {/* Main content */}
                <div style={{ flex: 1, padding: '24px', background: '#f9f9f7', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                    <div>
                      <p style={{ fontSize: 10, color: '#999', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>DASHBOARD</p>
                      <p style={{ fontSize: 18, fontWeight: 800, color: '#000', margin: 0, letterSpacing: '-0.5px' }}>Good morning, Alex 👋</p>
                    </div>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#ddd' }}/>
                  </div>
                  {/* Stats row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
                    {[{ l: 'Win Rate', v: '68%', up: true }, { l: 'Net P&L', v: '+$4,820', up: true }, { l: 'Profit Factor', v: '2.4', up: true }, { l: 'Avg R', v: '2.1R', up: true }].map(s => (
                      <div key={s.l} style={{ background: '#fff', borderRadius: 12, padding: '12px', border: '1px solid rgba(0,0,0,0.06)' }}>
                        <p style={{ fontSize: 9, color: '#999', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.l}</p>
                        <p style={{ fontSize: 15, fontWeight: 800, color: '#000', margin: 0 }}>{s.v}</p>
                      </div>
                    ))}
                  </div>
                  {/* Chart + trades */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={{ background: '#fff', borderRadius: 12, padding: 14, border: '1px solid rgba(0,0,0,0.06)' }}>
                      <p style={{ fontSize: 9, color: '#999', margin: '0 0 8px', textTransform: 'uppercase' }}>Equity Curve</p>
                      <svg viewBox="0 0 180 60" style={{ width: '100%', height: 56 }}>
                        <defs>
                          <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={G} stopOpacity="0.3"/>
                            <stop offset="100%" stopColor={G} stopOpacity="0"/>
                          </linearGradient>
                        </defs>
                        <path d="M0,50 C20,46 40,42 60,32 C80,22 100,26 120,16 C140,8 160,10 180,4 L180,60 L0,60Z" fill="url(#hg)"/>
                        <path d="M0,50 C20,46 40,42 60,32 C80,22 100,26 120,16 C140,8 160,10 180,4" fill="none" stroke={G} strokeWidth="1.5"/>
                      </svg>
                    </div>
                    <div style={{ background: '#fff', borderRadius: 12, padding: 14, border: '1px solid rgba(0,0,0,0.06)' }}>
                      <p style={{ fontSize: 9, color: '#999', margin: '0 0 8px', textTransform: 'uppercase' }}>Recent Trades</p>
                      {[{ p: 'XAUUSD', v: '+$420', w: true }, { p: 'GBP/USD', v: '-$120', w: false }, { p: 'US30', v: '+$680', w: true }].map(t => (
                        <div key={t.p} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f0f0f0' }}>
                          <span style={{ fontSize: 10, fontWeight: 600, color: '#000' }}>{t.p}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: t.w ? '#16a34a' : '#ef4444' }}>{t.v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ══ HOW IT WORKS ═════════════════════════════════════════ */}
      <section id="how-it-works" style={{ padding: '160px 32px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal>
            <SectionLabel>How EdgeFlow works</SectionLabel>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {[
              {
                step: 'Step 1', title: 'Log your trades',
                desc: 'Import from MT4/MT5 or log manually. Every trade captured with full context — session, emotion, strategy.',
                mock: <MockDashboardCard/>,
              },
              {
                step: 'Step 2', title: 'AI finds the leaks',
                desc: 'Ask plain English questions. EdgeFlow scans your data and tells you exactly what\'s costing you.',
                mock: <MockChartCard/>,
              },
              {
                step: 'Step 3', title: 'Fix your edge',
                desc: 'See exactly which instruments, sessions, and behaviours to cut — and which to double down on.',
                mock: <MockGoalCard/>,
              },
            ].map(({ step, title, desc, mock }, i) => (
              <Reveal key={step} delay={i * 0.08}>
                <div style={{ background: CARD, borderRadius: 20, overflow: 'hidden', height: 480 }}>
                  {/* Visual */}
                  <div style={{ height: 260, padding: 20, background: CARD }}>
                    {mock}
                  </div>
                  {/* Content */}
                  <div style={{ padding: '20px 24px 28px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 14,
                      padding: '5px 14px', borderRadius: 99, background: `${G}15`, border: `1px solid ${G}30` }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: G }}/>
                      <span style={{ fontSize: 13, color: G, fontWeight: 500 }}>{step}</span>
                    </div>
                    <p style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px', margin: '0 0 10px' }}>{title}</p>
                    <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.7, margin: 0 }}>{desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SEE IT IN REAL TIME ══════════════════════════════════ */}
      <section style={{ padding: '160px 32px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'end', marginBottom: 48 }}>
              <h2 style={{ fontSize: 'clamp(36px, 4.5vw, 64px)', fontWeight: 800, letterSpacing: '-2.5px', lineHeight: 1.05, margin: 0 }}>
                See your trades in real time, clearly.
              </h2>
              <p style={{ fontSize: 16, color: MUTED, lineHeight: 1.75, margin: 0 }}>
                EdgeFlow shows your win rate, P&L, and behavioural patterns in simple visuals you can act on — right away.
              </p>
            </div>
          </Reveal>

          {/* Bento grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: 'auto auto', gap: 16 }}>
            {/* Smart Dashboard - spans 2 rows */}
            <Reveal style={{ gridColumn: '1', gridRow: '1 / 3' }}>
              <div style={{ background: CARD, borderRadius: 20, overflow: 'hidden', height: '100%', minHeight: 420 }}>
                <div style={{ height: '60%', background: '#0d0d0d', display: 'flex', flexDirection: 'column', gap: 8, padding: 20 }}>
                  <div style={{ background: CARD2, borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Win Rate</p>
                    <p style={{ fontSize: 20, fontWeight: 800, color: G, margin: 0 }}>68%</p>
                  </div>
                  <div style={{ background: CARD2, borderRadius: 12, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Equity Curve</p>
                    <svg viewBox="0 0 160 40" style={{ width: '100%', height: 36 }}>
                      <path d="M0,36 C20,32 40,28 60,20 C80,12 100,16 120,8 C140,2 150,4 160,2 L160,40 L0,40Z" fill={`${G}20`}/>
                      <path d="M0,36 C20,32 40,28 60,20 C80,12 100,16 120,8 C140,2 150,4 160,2" fill="none" stroke={G} strokeWidth="1.5"/>
                    </svg>
                  </div>
                </div>
                <div style={{ padding: '20px 22px 24px' }}>
                  <p style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px', margin: '0 0 6px' }}>Smart Dashboard</p>
                  <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6, margin: 0 }}>See all your stats in one view — balances, performance, and goals.</p>
                </div>
              </div>
            </Reveal>

            {/* Cash Flow / AI Advisor */}
            <Reveal delay={0.07} style={{ gridColumn: '2', gridRow: '1' }}>
              <div style={{ background: CARD, borderRadius: 20, overflow: 'hidden' }}>
                <div style={{ height: 200, background: '#0d0d0d', padding: 18 }}>
                  <div style={{ background: CARD2, borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: 8 }}>
                    <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Net P&L</p>
                    <p style={{ fontSize: 18, fontWeight: 800, color: G, margin: 0 }}>+$4,820</p>
                  </div>
                  <svg viewBox="0 0 220 60" style={{ width: '100%', height: 56 }}>
                    <path d="M0,50 C30,44 60,36 90,24 C120,14 150,18 180,10 L220,4 L220,60 L0,60Z" fill={`${G}15`}/>
                    <path d="M0,50 C30,44 60,36 90,24 C120,14 150,18 180,10 L220,4" fill="none" stroke={G} strokeWidth="1.5"/>
                  </svg>
                </div>
                <div style={{ padding: '18px 22px 22px' }}>
                  <p style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.3px', margin: '0 0 4px' }}>Cash Flow Overview</p>
                  <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6, margin: 0 }}>Track your daily income and losses to understand your flow.</p>
                </div>
              </div>
            </Reveal>

            {/* Social proof */}
            <Reveal delay={0.1} style={{ gridColumn: '3', gridRow: '1 / 3' }}>
              <div style={{ background: CARD, borderRadius: 20, overflow: 'hidden', height: '100%', minHeight: 420, display: 'flex', flexDirection: 'column' }}>
                {/* Stacked fanned cards */}
                <div style={{ flex: 1, background: '#0d0d0d', position: 'relative', overflow: 'hidden', minHeight: 240 }}>
                  {[
                    { rotate: '-6deg', translateY: '10px', translateX: '-8px', z: 1 },
                    { rotate: '-2deg', translateY: '4px', translateX: '-2px', z: 2 },
                    { rotate: '2deg', translateY: '0px', translateX: '2px', z: 3 },
                  ].map((s, i) => (
                    <div key={i} style={{
                      position: 'absolute', top: '50%', left: '50%',
                      transform: `translate(-50%, -50%) translateX(${s.translateX}) translateY(${s.translateY}) rotate(${s.rotate})`,
                      width: '75%', height: 140, background: i === 2 ? '#fff' : i === 1 ? '#f0f0f0' : '#e0e0e0',
                      borderRadius: 14, zIndex: s.z, boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                      display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 14,
                    }}>
                      {i === 2 && (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <p style={{ fontSize: 9, color: '#999', margin: 0 }}>Spending Breakdown</p>
                            <div style={{ width: 20, height: 20, borderRadius: '50%', background: G, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ fontSize: 8, fontWeight: 800, color: '#000' }}>↗</span>
                            </div>
                          </div>
                          <div>
                            <p style={{ fontSize: 16, fontWeight: 800, color: '#000', margin: '0 0 6px' }}>$3,500</p>
                            <div style={{ height: 4, background: '#f0f0f0', borderRadius: 99 }}>
                              <div style={{ width: '65%', height: '100%', background: G, borderRadius: 99 }}/>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                {/* Social proof text */}
                <div style={{ padding: '22px 22px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  {/* Stacked avatars */}
                  <div style={{ display: 'flex', marginBottom: 12 }}>
                    {['#a78bfa','#60a5fa','#f472b6'].map((c, i) => (
                      <div key={c} style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: '2px solid #141414', marginLeft: i > 0 ? -8 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#000' }}>
                        {['A','J','S'][i]}
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px' }}>Trusted by 3k+<br/>Traders</p>
                  <p style={{ fontSize: 22, fontWeight: 800, color: G, margin: '10px 0 4px', letterSpacing: '-0.5px' }}>$1.2M+ Saved</p>
                  <p style={{ fontSize: 13, color: MUTED, margin: '0 0 16px', lineHeight: 1.5 }}>EdgeFlow helps traders save more — and trade smarter.</p>
                  <button onClick={() => navigate('/auth')} style={{ background: 'none', border: 'none', color: G, fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    Get Started ↗
                  </button>
                </div>
              </div>
            </Reveal>

            {/* Savings Goal */}
            <Reveal delay={0.12} style={{ gridColumn: '2', gridRow: '2' }}>
              <div style={{ background: CARD, borderRadius: 20, overflow: 'hidden' }}>
                <div style={{ height: 180, background: '#0d0d0d', padding: 18 }}>
                  <div style={{ background: CARD2, borderRadius: 12, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#fff', margin: 0 }}>Monthly Target</p>
                      <span style={{ fontSize: 11, color: G, fontWeight: 600 }}>60%</span>
                    </div>
                    <p style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 10px', letterSpacing: '-0.5px' }}>$3,000</p>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 99 }}>
                      <div style={{ width: '60%', height: '100%', background: G, borderRadius: 99 }}/>
                    </div>
                    <p style={{ fontSize: 10, color: MUTED, margin: '6px 0 0' }}>In progress · 3 trades left</p>
                  </div>
                </div>
                <div style={{ padding: '18px 22px 22px' }}>
                  <p style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.3px', margin: '0 0 4px' }}>Savings Goal</p>
                  <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6, margin: 0 }}>Stay focused on your targets and follow your progress.</p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══ FEATURES GRID ════════════════════════════════════════ */}
      <section id="features" style={{ padding: '160px 32px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal>
            <SectionLabel center>Features</SectionLabel>
            <h2 style={{ fontSize: 'clamp(36px, 4.5vw, 64px)', fontWeight: 800, letterSpacing: '-2.5px', lineHeight: 1.05, textAlign: 'center', marginBottom: 64 }}>
              Designed for clarity,<br/>built for better trading
            </h2>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {[
              { emoji: '🤖', title: 'AI Advisor', desc: 'Ask plain English questions. Get direct answers backed by your actual trade data.' },
              { emoji: '🔍', title: 'Leak Detection', desc: 'Identifies negative-expectancy patterns — by pair, session, and behaviour — instantly.' },
              { emoji: '📈', title: 'Deep Analytics', desc: 'Win rate, expectancy, profit factor, and drawdown broken down by every dimension.' },
              { emoji: '📋', title: 'Entry Checklist', desc: 'Pre-trade criteria that auto-track compliance so you know exactly when discipline slips.' },
              { emoji: '⚡', title: 'Strategy Optimizer', desc: 'Simulate removing any filter and see what your equity curve looks like without those trades.' },
              { emoji: '🔒', title: 'Secure & Private', desc: 'Your data is encrypted and never shared — row-level security on every database query.' },
            ].map(({ emoji, title, desc }, i) => (
              <Reveal key={title} delay={(i % 3) * 0.07}>
                <div style={{ background: CARD, borderRadius: 20, padding: '28px 28px 32px' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: `${G}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 22 }}>
                    {emoji}
                  </div>
                  <p style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px', margin: '0 0 10px' }}>{title}</p>
                  <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.7, margin: 0 }}>{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <div style={{ textAlign: 'center', marginTop: 48 }}>
              <button onClick={() => navigate('/auth')} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, padding: 0 }}>
                Get Started ↗
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ WHY EDGEFLOW ═════════════════════════════════════════ */}
      <section style={{ padding: '160px 32px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal>
            <SectionLabel center>Why EdgeFlow?</SectionLabel>
            <h2 style={{ fontSize: 'clamp(36px, 5vw, 72px)', fontWeight: 800, letterSpacing: '-2.5px', lineHeight: 1.0, textAlign: 'center', marginBottom: 56 }}>
              There's a smarter way to<br/>manage trading
            </h2>
          </Reveal>

          <Reveal delay={0.08}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden', maxWidth: 800, margin: '0 auto' }}>
              {/* Other Tools */}
              <div style={{ background: CARD, padding: '36px 32px' }}>
                <p style={{ fontSize: 16, fontWeight: 600, color: MUTED, margin: '0 0 28px' }}>Other Tools</p>
                {[
                  'Messy spreadsheets, manual tracking',
                  'Complicated pricing, hidden fees',
                  'No AI or pattern detection',
                  'No team or community features',
                  'Generic support, slow replies',
                ].map(item => (
                  <div key={item} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 18 }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', border: '1.5px solid rgba(239,68,68,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 700, lineHeight: 1 }}>✕</span>
                    </div>
                    <p style={{ fontSize: 14, color: MUTED, margin: 0, lineHeight: 1.5 }}>{item}</p>
                  </div>
                ))}
              </div>

              {/* EdgeFlow */}
              <div style={{ background: CARD, padding: '36px 32px', border: `1px solid ${G}`, borderRadius: '0 20px 20px 0', margin: '-1px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
                  <Logo size={20}/>
                  <p style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>EdgeFlow</p>
                </div>
                {[
                  'Smart dashboard, real-time updates',
                  'Simple, transparent pricing',
                  'AI analysis & smart alerts',
                  'Behavioural memory learns your patterns',
                  'Priority support, fast response',
                ].map(item => (
                  <div key={item} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 18 }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', border: `1.5px solid ${G}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <span style={{ fontSize: 10, color: G, fontWeight: 700, lineHeight: 1 }}>✓</span>
                    </div>
                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.88)', margin: 0, lineHeight: 1.5 }}>{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ TESTIMONIALS ═════════════════════════════════════════ */}
      <section style={{ padding: '160px 32px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'end', marginBottom: 56 }}>
              <h2 style={{ fontSize: 'clamp(36px, 4.5vw, 64px)', fontWeight: 800, letterSpacing: '-2.5px', lineHeight: 1.05, margin: 0 }}>
                Loved by individuals and<br/>small teams
              </h2>
              <p style={{ fontSize: 16, color: MUTED, lineHeight: 1.75, margin: 0 }}>
                People across industries trust EdgeFlow to manage trades, reduce drawdown, and make smarter decisions — all in one simple dashboard.
              </p>
            </div>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {[
              { name: 'Danielle M.', role: 'Freelance Trader', color: '#c4a882', initials: 'DM',
                quote: 'Big effort — high quality. Best trading tool out there. Passed my FTMO in week three.' },
              { name: 'Alex T.', role: 'Product Manager', color: '#8b9e7a', initials: 'AT',
                quote: 'EdgeFlow made my trades feel simple. Everything\'s in one place and the AI is spot on.' },
              { name: 'Reema K.', role: 'Marketing Consultant', color: '#9e8b7a', initials: 'RK',
                quote: 'I finally set a proper risk process and actually stuck to it. The checklist changed everything.' },
              { name: 'Jonas W.', role: 'Startup Founder', color: '#7a8b9e', initials: 'JW',
                quote: 'No more spreadsheet chaos. Just clean insights. Leak detection alone paid for itself.' },
              { name: 'Samira L.', role: 'E-commerce Seller', color: '#9e7a8b', initials: 'SL',
                quote: 'It feels like EdgeFlow understands how I think about trading. Scary accurate.' },
              { name: 'Marco B.', role: 'Freelance Developer', color: '#7a9e8b', initials: 'MB',
                quote: 'It\'s the first tool that opened my eyes to my own patterns. Win rate up 22%.' },
            ].map(({ name, role, color, initials, quote }, i) => (
              <Reveal key={name} delay={(i % 3) * 0.07}>
                <div style={{ background: CARD, borderRadius: 20, padding: 28 }}>
                  {/* Large quote mark */}
                  <div style={{ fontSize: 40, color: 'rgba(255,255,255,0.15)', lineHeight: 1, marginBottom: 16, fontFamily: 'Georgia, serif' }}>❝❝</div>
                  <p style={{ fontSize: 16, fontWeight: 600, color: '#fff', lineHeight: 1.55, margin: '0 0 24px', letterSpacing: '-0.2px' }}>
                    {quote}
                  </p>
                  {/* Avatar + name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#000', flexShrink: 0 }}>
                      {initials}
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, margin: '0 0 2px' }}>{name}</p>
                      <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>{role}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRICING ══════════════════════════════════════════════ */}
      <section id="pricing" style={{ padding: '160px 32px 0', textAlign: 'center' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <Reveal>
            <SectionLabel center>Pricing</SectionLabel>
            <h2 style={{ fontSize: 'clamp(40px, 5vw, 72px)', fontWeight: 800, letterSpacing: '-2.5px', lineHeight: 1.0, marginBottom: 16 }}>
              Simple plans.
            </h2>
            <p style={{ fontSize: 16, color: MUTED, marginBottom: 44, lineHeight: 1.6 }}>
              Straightforward pricing with no hidden costs. Everything<br/>you need to manage your trading better.
            </p>

            {/* Toggle — exact Clario pill toggle */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 56 }}>
              <span style={{ fontSize: 15, fontWeight: 500, color: !yearly ? G : MUTED }}>Monthly</span>
              <div
                onClick={() => setYearly(!yearly)}
                style={{ width: 44, height: 24, borderRadius: 99, background: `${G}30`, border: `1px solid ${G}50`, cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', padding: '0 3px' }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: G, transition: 'transform 0.2s', transform: yearly ? 'translateX(20px)' : 'translateX(0)' }}/>
              </div>
              <span style={{ fontSize: 15, fontWeight: 500, color: yearly ? G : MUTED }}>Yearly</span>
            </div>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, textAlign: 'left' }}>
            {/* Starter */}
            <Reveal>
              <div style={{ background: CARD, borderRadius: 20, padding: '32px 32px' }}>
                <p style={{ fontSize: 20, fontWeight: 700, margin: '0 0 20px' }}>Starter</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 12 }}>
                  <span style={{ fontSize: 52, fontWeight: 800, letterSpacing: '-2px', lineHeight: 1 }}>$0</span>
                  <span style={{ fontSize: 16, color: MUTED }}>/month</span>
                </div>
                <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6, marginBottom: 28 }}>Perfect for traders who want to start understanding their data.</p>
                <button onClick={() => navigate('/auth')} style={{ ...btn(false), width: '100%', justifyContent: 'center', padding: '12px 24px', fontSize: 15 }}>
                  Get Started ↗
                </button>
                <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {['Track income & expenses', 'Connect up to 1 account', 'Basic analytics dashboard', 'Entry checklist'].map(f => (
                    <div key={f} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', border: `1.5px solid ${G}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 10, color: G, fontWeight: 700 }}>✓</span>
                      </div>
                      <span style={{ fontSize: 14, color: MUTED }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* Pro */}
            <Reveal delay={0.08}>
              <div style={{ background: CARD, borderRadius: 20, padding: '32px 32px', position: 'relative', border: `1px solid rgba(255,255,255,0.1)` }}>
                <div style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: 99, letterSpacing: '0.1em' }}>POPULAR</div>
                <p style={{ fontSize: 20, fontWeight: 700, margin: '0 0 20px' }}>Pro</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 12 }}>
                  <span style={{ fontSize: 52, fontWeight: 800, letterSpacing: '-2px', lineHeight: 1 }}>${yearly ? '9' : '12'}</span>
                  <span style={{ fontSize: 16, color: MUTED }}>/month</span>
                </div>
                <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6, marginBottom: 28 }}>Advanced tools to manage your trading smarter and unlock powerful insights.</p>
                <button onClick={() => navigate('/auth')} style={{ ...btn(true), width: '100%', justifyContent: 'center', padding: '12px 24px', fontSize: 15 }}>
                  Get Started ↗
                </button>
                <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {['Unlimited accounts', 'AI spending insights', 'Leak detection', 'Behavioural memory', 'Strategy Optimizer', 'PDF export'].map(f => (
                    <div key={f} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', border: `1.5px solid ${G}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 10, color: G, fontWeight: 700 }}>✓</span>
                      </div>
                      <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>

          {/* Trusted */}
          <Reveal delay={0.1}>
            <div style={{ marginTop: 40, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex' }}>
                {['#c4a882','#7a8b9e','#9e7a8b'].map((c, i) => (
                  <div key={c} style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: '2px solid #000', marginLeft: i > 0 ? -8 : 0 }}/>
                ))}
              </div>
              <p style={{ fontSize: 14, color: MUTED, margin: 0 }}>
                Trusted by teams worldwide — <span style={{ color: '#fff', fontWeight: 600 }}>join 3,000+ traders</span> who use EdgeFlow.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ FAQ ══════════════════════════════════════════════════ */}
      <section id="faq" style={{ padding: '160px 32px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'start', marginBottom: 64 }}>
            <Reveal>
              <h2 style={{ fontSize: 'clamp(36px, 4.5vw, 64px)', fontWeight: 800, letterSpacing: '-2.5px', lineHeight: 1.0, margin: 0 }}>
                Got questions?<br/>We've got answers.
              </h2>
            </Reveal>
            <Reveal delay={0.06}>
              <div style={{ paddingTop: 8 }}>
                <p style={{ fontSize: 16, color: MUTED, lineHeight: 1.75, marginBottom: 20 }}>
                  Here's everything you need to know before getting started.
                </p>
                <button onClick={() => navigate('/auth')} style={{ background: 'none', border: 'none', color: G, fontSize: 15, fontWeight: 600, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  Contact us ↗
                </button>
              </div>
            </Reveal>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { q: 'What kind of traders is EdgeFlow built for?', a: 'EdgeFlow is designed for serious retail traders, prop firm traders, and funded account holders — anyone who already knows discipline is a problem and wants data to fix it. It\'s fully customisable to fit forex, futures, crypto, and more.' },
              { q: 'Is EdgeFlow mobile-friendly and responsive?', a: 'Yes. EdgeFlow works across all screen sizes. The dashboard is optimised for desktop (where most analysis happens) but fully accessible on mobile.' },
              { q: 'How does the AI analysis work?', a: 'You ask a question. EdgeFlow sends your last 50 trades, your trader profile, and your question to Gemini 2.0 Flash. It reads the data and gives you a direct, data-backed answer — no generic advice, no hallucinations.' },
              { q: 'Will I get access to future updates?', a: 'Yes. All updates are included in your subscription. New features ship regularly — you\'ll never pay extra for improvements.' },
              { q: 'Can I import trades from my broker?', a: 'Yes. EdgeFlow supports MT4/MT5 CSV exports and a generic CSV importer that handles most brokers. Manual logging is also fully supported with all fields.' },
              { q: 'Can I cancel my subscription anytime?', a: 'Yes. Monthly plans cancel at the end of the billing period. Yearly plans get a prorated refund in the first 30 days. No lock-in, no hassle.' },
            ].map(({ q, a }, i) => (
              <Reveal key={i} delay={i * 0.04}>
                <div style={{ background: CARD, borderRadius: 16, overflow: 'hidden' }}>
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{
                    width: '100%', padding: '22px 28px',
                    display: 'flex', alignItems: 'center', gap: 20,
                    background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                  }}>
                    {/* Number box */}
                    <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      border: `1.5px solid ${openFaq === i ? G : 'rgba(255,255,255,0.15)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 0.2s' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: openFaq === i ? G : MUTED }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <span style={{ flex: 1, fontSize: 16, fontWeight: 600, color: '#fff', letterSpacing: '-0.2px' }}>{q}</span>
                    <span style={{ fontSize: 22, color: MUTED, flexShrink: 0, fontWeight: 300, lineHeight: 1 }}>
                      {openFaq === i ? '−' : '+'}
                    </span>
                  </button>
                  {openFaq === i && (
                    <div style={{ padding: '0 28px 24px', paddingLeft: 84 }}>
                      <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.75, margin: 0 }}>{a}</p>
                    </div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ BLOG ═════════════════════════════════════════════════ */}
      <section id="blog" style={{ padding: '160px 32px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          {/* Featured post */}
          <Reveal>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: CARD, borderRadius: 20, overflow: 'hidden', marginBottom: 16 }}>
              {/* Photo */}
              <div style={{ background: 'linear-gradient(135deg, #1a1f1a 0%, #0d0d0d 100%)', position: 'relative', minHeight: 340, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 40% 60%, ${G}15 0%, transparent 60%)` }}/>
                {/* Person silhouette placeholder */}
                <div style={{ position: 'relative', textAlign: 'center' }}>
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #2a2a2a, #1a1a1a)', border: '2px solid rgba(255,255,255,0.1)', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>👨‍💻</div>
                  <div style={{ width: 120, height: 60, borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}/>
                </div>
              </div>
              {/* Content */}
              <div style={{ padding: '48px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <p style={{ fontSize: 13, color: G, fontWeight: 600, margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Trading Psychology</p>
                <h3 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.8px', lineHeight: 1.2, margin: '0 0 16px' }}>
                  How to Launch Your SaaS<br/>Product With Confidence
                </h3>
                <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.7, margin: '0 0 28px' }}>
                  Learn how to go from idea to launch — fast. We cover positioning, landing pages, early user feedback, and building trust using the EdgeFlow template for Framer.
                </p>
                <button style={{ background: 'none', border: 'none', color: G, fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  Read more ↗
                </button>
              </div>
            </div>
          </Reveal>

          {/* 3 posts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {[
              { title: 'Designing a Landing Page That Converts', photo: '🎨', color: '#1a1520' },
              { title: 'Collecting Feedback From Your First Users', photo: '💬', color: '#0f1520' },
              { title: 'Building Trust as an Early-Stage SaaS Brand', photo: '🏗️', color: '#151a10' },
            ].map(({ title, photo, color }, i) => (
              <Reveal key={title} delay={i * 0.07}>
                <div style={{ background: CARD, borderRadius: 18, overflow: 'hidden', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = CARD2)}
                  onMouseLeave={e => (e.currentTarget.style.background = CARD)}>
                  <div style={{ height: 180, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 80%, ${G}0a 0%, transparent 70%)` }}/>
                    <span style={{ position: 'relative' }}>{photo}</span>
                  </div>
                  <div style={{ padding: '20px 22px 24px' }}>
                    <p style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.3px', lineHeight: 1.3, margin: '0 0 12px' }}>{title}</p>
                    <button style={{ background: 'none', border: 'none', color: G, fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                      Read more ↗
                    </button>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA BANNER ═══════════════════════════════════════════ */}
      <section style={{ padding: '80px 32px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal>
            <div style={{ background: CARD, borderRadius: 24, overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'stretch', minHeight: 260 }}>
              {/* Text left */}
              <div style={{ padding: '56px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 48px)', fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1.1, margin: '0 0 16px' }}>
                  Ready to manage<br/>your money smarter?
                </h2>
                <p style={{ fontSize: 15, color: MUTED, margin: '0 0 28px', lineHeight: 1.6 }}>
                  Start your journey to smarter spending and better<br/>saving — it only takes 2 minutes.
                </p>
                <div>
                  <button onClick={() => navigate('/auth')} style={{ ...btn(true), padding: '12px 28px', fontSize: 15 }}>
                    Get Started Free ↗
                  </button>
                </div>
              </div>
              {/* Person photo right */}
              <div style={{ width: 340, position: 'relative', overflow: 'hidden', background: 'linear-gradient(to left, #1a1a1a, transparent)' }}>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 0 }}>
                  <div style={{ width: 260, height: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
                    {/* Person */}
                    <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'linear-gradient(135deg, #8fc47a, #5a9e44)', border: '3px solid rgba(163,255,62,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, marginBottom: -10 }}>
                      😊
                    </div>
                    <div style={{ width: 200, height: 140, borderRadius: '40px 40px 0 0', background: 'linear-gradient(180deg, #2a2a2a, #1a1a1a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ padding: '8px 16px', borderRadius: 99, background: `${G}20`, border: `1px solid ${G}40` }}>
                        <span style={{ fontSize: 12, color: G, fontWeight: 700 }}>+68% win rate</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ FOOTER ═══════════════════════════════════════════════ */}
      <footer style={{ padding: '80px 32px 40px', marginTop: 120 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 80, marginBottom: 48 }}>
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <Logo size={24}/>
                <span style={{ fontSize: 17, fontWeight: 700 }}>EdgeFlow</span>
              </div>
              <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.75, maxWidth: 280, margin: '0 0 16px' }}>
                Your all-in-one trading journal. Track your performance, set goals, and stay on top of your edge — effortlessly.
              </p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', margin: 0 }}>
                ♥ Built for traders · ©2026
              </p>
            </div>

            {/* Columns */}
            <div style={{ display: 'flex', gap: 80 }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>Quick Menu</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    { l: 'How it works', h: '#how-it-works' },
                    { l: 'Features', h: '#features' },
                    { l: 'Testimonials', h: '#testimonials' },
                    { l: 'Pricing', h: '#pricing' },
                    { l: 'Waitlist', h: '/auth' },
                  ].map(({ l, h }) => (
                    <a key={l} href={h} style={{ fontSize: 15, color: MUTED, textDecoration: 'none', transition: 'color 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.color='#fff')}
                      onMouseLeave={e => (e.currentTarget.style.color=MUTED)}>
                      {l}
                    </a>
                  ))}
                </div>
              </div>

              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>Information</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    { l: 'Contact', h: '/auth' },
                    { l: 'Privacy Policy', h: '/privacy' },
                    { l: 'Terms', h: '/terms' },
                    { l: 'Blog', h: '#blog' },
                    { l: 'Get Started', h: '/auth' },
                  ].map(({ l, h }) => (
                    <a key={l} href={h} style={{ fontSize: 15, color: MUTED, textDecoration: 'none', transition: 'color 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.color='#fff')}
                      onMouseLeave={e => (e.currentTarget.style.color=MUTED)}>
                      {l}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
