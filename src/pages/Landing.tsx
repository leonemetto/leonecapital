import { useNavigate } from 'react-router-dom';
import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  ArrowRight, Brain, ChartLine, Target, Lightning,
  CheckCircle, X, List, CaretDown, ChartBar,
  TrendUp, ShieldCheck, Pulse,
} from '@phosphor-icons/react';

/* ─── Helpers ─── */

const FadeUp = ({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 24 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }} className={className}>
      {children}
    </motion.div>
  );
};

function useCountUp(target: number, inView: boolean, duration = 1800) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setValue(Math.floor((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, target, duration]);
  return value;
}

/* ─── Logo mark ─── */
function EdgeFlowMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden>
      <polyline points="2,18 2,11 7,11 7,6 12,6 12,2 18,2"
        stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Equity Curve SVG ─── */
function EquityCurveSVG() {
  return (
    <svg viewBox="0 0 400 140" fill="none" className="w-full">
      <defs>
        <linearGradient id="lp-eq" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[35, 70, 105].map(y => (
        <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      ))}
      <path d="M0 120 C40 115 60 108 90 98 S130 82 160 72 S200 58 230 50 S270 38 300 30 S350 22 400 14"
        stroke="#10b981" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M0 120 C40 115 60 108 90 98 S130 82 160 72 S200 58 230 50 S270 38 300 30 S350 22 400 14 L400 140 L0 140Z"
        fill="url(#lp-eq)" />
      {/* Dots */}
      {[[90,98],[160,72],[230,50],[300,30]].map(([x,y], i) => (
        <circle key={i} cx={x} cy={y} r="2.5" fill="#10b981" opacity="0.7" />
      ))}
    </svg>
  );
}

/* ─── Stats Counter ─── */
function StatsBar() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const traders = useCountUp(2400, inView);
  const trades  = useCountUp(186000, inView);
  const pnl     = useCountUp(4200000, inView);

  const stats = [
    { value: `${traders.toLocaleString()}+`, label: 'Active traders' },
    { value: `${trades.toLocaleString()}+`, label: 'Trades analyzed' },
    { value: `$${(pnl / 1000000).toFixed(1)}M+`, label: 'P&L tracked' },
    { value: '68%', label: 'Avg win rate improvement' },
  ];

  return (
    <div ref={ref} className="border-y border-[rgba(255,255,255,0.06)] py-10 px-6">
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map(s => (
          <div key={s.label} className="text-center">
            <p className="text-[28px] font-bold font-mono text-white tracking-[-0.03em]">{s.value}</p>
            <p className="text-[12px] text-[rgba(255,255,255,0.35)] mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── FAQ ─── */
const faqData = [
  { q: 'Do I need trading experience to use EdgeFlow?', a: 'Not at all. Whether you\'ve been trading 2 weeks or 10 years, EdgeFlow adapts to your data and gives you insights relevant to your exact level.' },
  { q: 'Is EdgeFlow free to use?', a: 'Yes. The free plan gives you full access to core features with up to 50 trades per month — no credit card required. Upgrade when you\'re ready to scale.' },
  { q: 'What markets does EdgeFlow support?', a: 'Forex, crypto, futures, stocks, indices, and commodities. If you can trade it, you can journal and analyze it.' },
  { q: 'How is this different from a spreadsheet?', a: 'A spreadsheet shows you numbers. EdgeFlow shows you WHY. The AI layer does what no spreadsheet can — pattern detection, leak surfacing, and personalized recommendations based on your actual data.' },
  { q: 'Is my trading data secure?', a: 'Completely. All data is encrypted and stored securely via Supabase. Your data is never shared, sold, or used for any other purpose.' },
];

function FaqItem({ q, a, isOpen, toggle }: { q: string; a: string; isOpen: boolean; toggle: () => void }) {
  return (
    <div className="border-b border-[rgba(255,255,255,0.06)]">
      <button onClick={toggle} className="w-full flex items-center justify-between py-5 text-left gap-4 outline-none">
        <span className="text-[15px] font-medium text-white">{q}</span>
        <CaretDown className={cn('h-4 w-4 text-[rgba(255,255,255,0.3)] shrink-0 transition-transform duration-300', isOpen && 'rotate-180')} weight="bold" />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <p className="pb-5 text-[rgba(255,255,255,0.45)] text-[14px] leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Pricing ─── */
const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '',
    sub: 'Get started with no commitment.',
    cta: 'Start for Free',
    featured: false,
    features: [
      'Up to 50 trades/month',
      'Equity curve & calendar',
      'Win/loss breakdown',
      '1 trading account',
      'Session journal',
    ],
    missing: ['AI Trade Advisor', 'Leak Detection', 'What-If Simulator'],
  },
  {
    name: 'Pro',
    price: '$12',
    period: '/mo',
    sub: 'For serious traders building an edge.',
    cta: 'Start Pro',
    featured: true,
    features: [
      'Unlimited trades',
      'Full analytics suite',
      'AI Trade Advisor',
      'Leak Detection',
      'What-If Simulator',
      'Up to 3 accounts',
      'Weekly AI digest',
      'Pre-trade checklist',
    ],
    missing: [],
  },
  {
    name: 'Elite',
    price: '$24',
    period: '/mo',
    sub: 'For prop traders and professionals.',
    cta: 'Start Elite',
    featured: false,
    features: [
      'Everything in Pro',
      'Unlimited accounts',
      'Prop firm tracking',
      'CSV & PDF exports',
      'Priority support',
      'Early access features',
    ],
    missing: [],
  },
];

/* ════════════════════════════════════════════════
   MAIN
   ════════════════════════════════════════════════ */
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
    <div className="min-h-screen text-white overflow-x-hidden" style={{ background: '#000000', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ══ NAVBAR ══ */}
      <nav className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled ? 'bg-black/80 backdrop-blur-xl border-b border-[rgba(255,255,255,0.06)]' : 'bg-transparent'
      )}>
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <a href="/" className="flex items-center gap-2.5 text-white">
            <EdgeFlowMark size={18} />
            <span className="text-[14px] font-bold tracking-[-0.02em]">EDGEFLOW</span>
          </a>

          <div className="hidden md:flex items-center gap-8">
            {[['Features', '#features'], ['How It Works', '#how-it-works'], ['Pricing', '#pricing'], ['FAQ', '#faq']].map(([label, href]) => (
              <a key={label} href={href} className="text-[13px] text-[rgba(255,255,255,0.45)] hover:text-white transition-colors">{label}</a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => navigate('/auth')} className="text-[13px] text-[rgba(255,255,255,0.4)] hover:text-white transition-colors px-3 py-2">
              Sign In
            </button>
            <button onClick={() => navigate('/auth')}
              className="px-5 py-2 rounded-[24px] bg-white text-black text-[13px] font-semibold hover:bg-white/90 transition-colors">
              Get Started Free
            </button>
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-[rgba(255,255,255,0.6)] outline-none">
            {mobileOpen ? <X className="h-5 w-5" weight="regular" /> : <List className="h-5 w-5" weight="regular" />}
          </button>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }} className="md:hidden border-t border-[rgba(255,255,255,0.06)] bg-black/95 backdrop-blur-xl overflow-hidden">
              <div className="px-6 py-4 flex flex-col gap-1">
                {[['Features', '#features'], ['How It Works', '#how-it-works'], ['Pricing', '#pricing'], ['FAQ', '#faq']].map(([label, href]) => (
                  <a key={label} href={href} onClick={() => setMobileOpen(false)}
                    className="text-[rgba(255,255,255,0.5)] py-3 text-[14px] border-b border-[rgba(255,255,255,0.04)]">{label}</a>
                ))}
                <div className="pt-3 flex flex-col gap-2">
                  <button onClick={() => navigate('/auth')} className="text-[rgba(255,255,255,0.4)] py-2 text-left text-[14px]">Sign In</button>
                  <button onClick={() => navigate('/auth')}
                    className="w-full py-3 rounded-[24px] bg-white text-black text-[14px] font-semibold">Get Started Free</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ══ HERO ══ */}
      <section className="relative pt-36 pb-24 px-6 text-center overflow-hidden">
        {/* Subtle radial glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-[0.07] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, #ffffff 0%, transparent 70%)' }} />

        <div className="max-w-4xl mx-auto relative z-10">
          <FadeUp>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] mb-8">
              <Pulse className="h-3 w-3 text-[#10b981]" weight="fill" />
              <span className="text-[11px] font-medium text-[rgba(255,255,255,0.5)] tracking-wide">AI-Powered Trading Journal</span>
            </div>
          </FadeUp>

          <FadeUp delay={0.08}>
            <h1 className="text-white font-black leading-[1.04] mb-6 tracking-[-2.5px]"
              style={{ fontSize: 'clamp(40px, 6vw, 72px)' }}>
              Most traders lose because<br />they don't know why they win.
            </h1>
          </FadeUp>

          <FadeUp delay={0.16}>
            <p className="text-[rgba(255,255,255,0.45)] text-[16px] md:text-[18px] max-w-2xl mx-auto leading-relaxed mb-10">
              EdgeFlow analyzes every trade you make — surfacing the patterns, leaks, and emotional
              triggers costing you money. Stop guessing. Start compounding.
            </p>
          </FadeUp>

          <FadeUp delay={0.22}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
              <button onClick={() => navigate('/auth')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-[24px] bg-white text-black text-[14px] font-bold hover:bg-white/90 transition-colors flex items-center justify-center gap-2">
                Start Free — No Card Needed
                <ArrowRight className="h-4 w-4" weight="bold" />
              </button>
              <a href="#how-it-works"
                className="text-[rgba(255,255,255,0.4)] text-[14px] py-3 px-4 hover:text-white transition-colors">
                See how it works
              </a>
            </div>
          </FadeUp>

          <FadeUp delay={0.28}>
            <div className="flex items-center justify-center gap-6 text-[12px] text-[rgba(255,255,255,0.25)]">
              <span>✓ Free plan available</span>
              <span>✓ No credit card</span>
              <span>✓ Cancel anytime</span>
            </div>
          </FadeUp>
        </div>

        {/* Product preview */}
        <FadeUp delay={0.35} className="mt-20 max-w-5xl mx-auto relative z-10">
          <div className="rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.02)] overflow-hidden">
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[rgba(255,255,255,0.06)]">
              <div className="w-2.5 h-2.5 rounded-full bg-[rgba(255,255,255,0.1)]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[rgba(255,255,255,0.1)]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[rgba(255,255,255,0.1)]" />
              <span className="ml-3 text-[11px] text-[rgba(255,255,255,0.2)]">leone.capital — Analytics Dashboard</span>
            </div>

            <div className="p-6 grid md:grid-cols-3 gap-4">
              {/* Equity Curve */}
              <div className="md:col-span-2 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[rgba(255,255,255,0.3)]">Equity Curve</p>
                  <div className="flex gap-1">
                    {['Daily','Weekly','Monthly'].map((p, i) => (
                      <span key={p} className={cn('text-[9px] px-2 py-0.5 rounded',
                        i === 0 ? 'bg-white text-black font-bold' : 'text-[rgba(255,255,255,0.3)]')}>{p}</span>
                    ))}
                  </div>
                </div>
                <EquityCurveSVG />
                <div className="flex gap-5 mt-4">
                  {[['$14,230', 'Total P&L', 'text-[#10b981]'], ['68%', 'Win Rate', 'text-[#10b981]'], ['2.4R', 'Avg R', 'text-white']].map(([v, l, c]) => (
                    <div key={l}>
                      <p className={cn('text-[16px] font-bold font-mono', c)}>{v}</p>
                      <p className="text-[10px] text-[rgba(255,255,255,0.3)]">{l}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Trades */}
              <div className="rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[rgba(255,255,255,0.3)] mb-4">Recent Trades</p>
                <div className="space-y-3">
                  {[
                    { pair: 'XAUUSD', dir: 'Long',  pnl: '+$340', win: true },
                    { pair: 'NQ',     dir: 'Short', pnl: '-$120', win: false },
                    { pair: 'BTC',    dir: 'Long',  pnl: '+$890', win: true },
                    { pair: 'EURUSD', dir: 'Long',  pnl: '+$210', win: true },
                  ].map(t => (
                    <div key={t.pair} className="flex items-center justify-between py-1.5 border-b border-[rgba(255,255,255,0.04)] last:border-0">
                      <div className="flex items-center gap-2">
                        <div className={cn('w-1 h-5 rounded-full', t.win ? 'bg-[#10b981]' : 'bg-[#f87171]')} />
                        <span className="text-[13px] font-medium text-white">{t.pair}</span>
                        <span className="text-[10px] text-[rgba(255,255,255,0.3)]">{t.dir}</span>
                      </div>
                      <span className={cn('text-[13px] font-mono font-bold', t.win ? 'text-[#10b981]' : 'text-[#f87171]')}>{t.pnl}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </FadeUp>
      </section>

      {/* ══ STATS ══ */}
      <StatsBar />

      {/* ══ FEATURES ══ */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeUp>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgba(255,255,255,0.3)] mb-4">Everything You Need</p>
            <h2 className="text-white font-black text-[36px] md:text-[48px] leading-[1.05] tracking-[-2px] mb-16 max-w-lg">
              Stop trading blind.
            </h2>
          </FadeUp>

          <div className="grid lg:grid-cols-2 gap-4">
            {/* Hero feature */}
            <FadeUp delay={0.1}>
              <div className="h-full rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.02)] p-8 md:p-10 hover:border-[rgba(255,255,255,0.12)] transition-colors duration-500">
                <div className="w-10 h-10 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.07)] flex items-center justify-center mb-6">
                  <Brain className="h-5 w-5 text-[rgba(255,255,255,0.5)]" weight="regular" />
                </div>
                <h3 className="text-white text-[20px] font-bold mb-3 tracking-[-0.5px]">AI Trade Advisor</h3>
                <p className="text-[rgba(255,255,255,0.45)] text-[15px] leading-relaxed">
                  Most traders repeat the same mistakes for years. EdgeFlow's AI studies your full trading
                  history, identifies your exact leaks in real time, and tells you precisely what to fix —
                  like having a professional analyst on call 24/7.
                </p>
              </div>
            </FadeUp>

            {/* 2×2 grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { Icon: Lightning,   title: 'Leak Detection',     desc: 'Surfaces your worst setups, sessions, and emotional patterns before they drain your account.' },
                { Icon: ChartLine,   title: 'What-If Simulator',  desc: 'Filter out your worst trades and instantly see how your equity curve would have changed.' },
                { Icon: Target,      title: 'Pre-Trade Checklist',desc: 'A customizable discipline gate. Every trade must earn its entry before you pull the trigger.' },
                { Icon: ChartBar,    title: 'Multi-Account',      desc: 'Track live, demo, and prop firm accounts separately with independent analytics for each.' },
              ].map((f, i) => (
                <FadeUp key={f.title} delay={0.1 * (i + 1)}>
                  <div className="rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.02)] p-6 hover:border-[rgba(255,255,255,0.12)] transition-colors duration-500 h-full">
                    <div className="w-9 h-9 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.07)] flex items-center justify-center mb-4">
                      <f.Icon className="h-4 w-4 text-[rgba(255,255,255,0.45)]" weight="regular" />
                    </div>
                    <h3 className="text-white text-[15px] font-bold mb-2">{f.title}</h3>
                    <p className="text-[rgba(255,255,255,0.4)] text-[13px] leading-relaxed">{f.desc}</p>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section id="how-it-works" className="py-32 px-6 border-t border-[rgba(255,255,255,0.06)]">
        <div className="max-w-6xl mx-auto">
          <FadeUp>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgba(255,255,255,0.3)] mb-4">Simple Process</p>
            <h2 className="text-white font-black text-[36px] md:text-[48px] leading-[1.05] tracking-[-2px] mb-16 max-w-lg">
              From trade to insight in seconds.
            </h2>
          </FadeUp>

          <div className="grid md:grid-cols-3 gap-12 md:gap-16">
            {[
              { n: '01', Icon: TrendUp,    title: 'Log Your Trade',    desc: 'Add your instrument, direction, R-size, session, strategy tag, and emotional state. Takes under 30 seconds.' },
              { n: '02', Icon: ChartLine,  title: 'See Your Patterns', desc: 'Instant equity curves, session breakdowns, win rates by setup — every angle of your performance visualized.' },
              { n: '03', Icon: Brain,      title: 'Get Your Edge',     desc: 'Your AI advisor delivers personalized recommendations based on YOUR actual data. Not generic advice — yours.' },
            ].map((s, i) => (
              <FadeUp key={s.n} delay={0.12 * i}>
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <span className="text-[11px] font-bold text-[rgba(255,255,255,0.2)] tracking-widest font-mono">{s.n}</span>
                    <div className="flex-1 h-px bg-[rgba(255,255,255,0.06)]" />
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] flex items-center justify-center mb-5">
                    <s.Icon className="h-5 w-5 text-[rgba(255,255,255,0.4)]" weight="regular" />
                  </div>
                  <h3 className="text-white text-[18px] font-bold mb-3 tracking-[-0.3px]">{s.title}</h3>
                  <p className="text-[rgba(255,255,255,0.45)] text-[14px] leading-relaxed">{s.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ══ */}
      <section className="py-32 px-6 border-t border-[rgba(255,255,255,0.06)]">
        <div className="max-w-6xl mx-auto">
          <FadeUp>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgba(255,255,255,0.3)] mb-4">Trusted By Traders</p>
            <h2 className="text-white font-black text-[36px] md:text-[48px] leading-[1.05] tracking-[-2px] mb-16 max-w-md">
              Real traders.<br />Real results.
            </h2>
          </FadeUp>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { name: 'Alex M.',  type: 'Forex Trader',   initials: 'AM', quote: 'I was hemorrhaging money every Friday. EdgeFlow flagged it in under 5 minutes. I cut Fridays — win rate jumped 14% that month.' },
              { name: 'Sarah K.', type: 'Crypto Trader',  initials: 'SK', quote: "It's like having a coach who has watched every single trade I've ever taken. The AI pattern detection is frighteningly accurate." },
              { name: 'James R.', type: 'Futures Trader', initials: 'JR', quote: "The What-If tool showed me I was giving back 40% of my profits on revenge trades. That one insight paid for years of subscription." },
            ].map((t, i) => (
              <FadeUp key={t.name} delay={0.1 * i}>
                <div className="rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.02)] p-7 h-full flex flex-col hover:border-[rgba(255,255,255,0.12)] transition-colors duration-300">
                  <div className="flex gap-1 mb-5">
                    {[...Array(5)].map((_, i) => <span key={i} className="text-amber-400 text-sm">★</span>)}
                  </div>
                  <p className="text-[rgba(255,255,255,0.55)] text-[14px] leading-relaxed flex-1 mb-6">"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[rgba(255,255,255,0.4)] font-bold text-[11px]">
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-white text-[13px] font-semibold">{t.name}</p>
                      <p className="text-[rgba(255,255,255,0.3)] text-[11px]">{t.type}</p>
                    </div>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
          <p className="text-[rgba(255,255,255,0.15)] text-[11px] mt-6 text-center">Testimonials are illustrative examples. Individual results vary.</p>
        </div>
      </section>

      {/* ══ PRICING ══ */}
      <section id="pricing" className="py-32 px-6 border-t border-[rgba(255,255,255,0.06)]">
        <div className="max-w-6xl mx-auto">
          <FadeUp>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgba(255,255,255,0.3)] mb-4">Simple Pricing</p>
            <h2 className="text-white font-black text-[36px] md:text-[48px] leading-[1.05] tracking-[-2px] mb-4 max-w-md">
              Invest in your edge.
            </h2>
            <p className="text-[rgba(255,255,255,0.4)] text-[15px] mb-16">Start free. Upgrade when you're ready.</p>
          </FadeUp>

          <div className="grid md:grid-cols-3 gap-4">
            {plans.map((plan, i) => (
              <FadeUp key={plan.name} delay={0.1 * i}>
                <div className={cn(
                  'rounded-2xl border p-7 h-full flex flex-col relative',
                  plan.featured
                    ? 'border-white bg-white text-black'
                    : 'border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.02)] text-white'
                )}>
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

                  <button
                    onClick={() => navigate('/auth')}
                    className={cn(
                      'w-full py-3 rounded-[24px] text-[14px] font-semibold mb-6 transition-colors',
                      plan.featured
                        ? 'bg-black text-white hover:bg-black/80'
                        : 'bg-white text-black hover:bg-white/90'
                    )}
                  >
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
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FAQ ══ */}
      <section id="faq" className="py-32 px-6 border-t border-[rgba(255,255,255,0.06)]">
        <div className="max-w-3xl mx-auto">
          <FadeUp>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgba(255,255,255,0.3)] mb-4">FAQ</p>
            <h2 className="text-white font-black text-[36px] md:text-[48px] leading-[1.05] tracking-[-2px] mb-12">
              Common questions.
            </h2>
          </FadeUp>

          <div>
            {faqData.map((item, i) => (
              <FadeUp key={i} delay={0.05 * i}>
                <FaqItem q={item.q} a={item.a} isOpen={openFaq === i} toggle={() => setOpenFaq(openFaq === i ? null : i)} />
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA ══ */}
      <section className="py-32 px-6 border-t border-[rgba(255,255,255,0.06)]">
        <FadeUp>
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-12 h-12 rounded-2xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center mx-auto mb-8">
              <ShieldCheck className="h-6 w-6 text-[rgba(255,255,255,0.4)]" weight="regular" />
            </div>
            <h2 className="text-white font-black text-[36px] md:text-[52px] leading-[1.04] tracking-[-2px] mb-6">
              Your edge is in the data.<br />Go find it.
            </h2>
            <p className="text-[rgba(255,255,255,0.4)] text-[16px] mb-10 leading-relaxed">
              Join traders using EdgeFlow to finally understand their performance —
              and fix what's costing them.
            </p>
            <button onClick={() => navigate('/auth')}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-[24px] bg-white text-black text-[15px] font-bold hover:bg-white/90 transition-colors">
              Start Free — No Card Needed
              <ArrowRight className="h-4 w-4" weight="bold" />
            </button>
          </div>
        </FadeUp>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="border-t border-[rgba(255,255,255,0.06)] px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5 text-white">
            <EdgeFlowMark size={16} />
            <span className="text-[13px] font-bold tracking-[-0.02em]">EDGEFLOW</span>
          </div>
          <div className="flex items-center gap-6">
            {[['Features', '#features'], ['Pricing', '#pricing'], ['FAQ', '#faq']].map(([l, h]) => (
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
