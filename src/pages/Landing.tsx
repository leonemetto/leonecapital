import { useNavigate } from 'react-router-dom';
import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, CheckCircle2, Menu, X, ChevronDown,
  Brain, Search, Activity, Target, PieChart,
  Twitter, Linkedin, Mail, MessageCircle,
} from 'lucide-react';
import logoImg from '@/assets/logo.svg';

/* ══════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════ */

function useCountUp(target: number, inView: boolean, duration = 2000) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const startTime = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, target, duration]);
  return value;
}

const FadeUp = ({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ══════════════════════════════════════════
   SVG CANDLESTICK CHART (Hero Background)
   ══════════════════════════════════════════ */
const CandlestickBG = () => (
  <svg
    viewBox="0 0 1200 500"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="absolute inset-0 w-full h-full object-cover"
    preserveAspectRatio="xMidYMid slice"
  >
    {/* Grid lines */}
    {[100, 200, 300, 400].map((y) => (
      <line key={y} x1="0" y1={y} x2="1200" y2={y} stroke="white" strokeOpacity="0.04" />
    ))}
    {/* Candlesticks */}
    {[
      { x: 60, o: 340, c: 290, h: 260, l: 360 },
      { x: 110, o: 290, c: 310, h: 270, l: 330 },
      { x: 160, o: 310, c: 260, h: 240, l: 330 },
      { x: 210, o: 260, c: 230, h: 210, l: 280 },
      { x: 260, o: 230, c: 270, h: 220, l: 290 },
      { x: 310, o: 270, c: 240, h: 220, l: 290 },
      { x: 360, o: 240, c: 200, h: 180, l: 260 },
      { x: 410, o: 200, c: 220, h: 190, l: 240 },
      { x: 460, o: 220, c: 180, h: 160, l: 240 },
      { x: 510, o: 180, c: 210, h: 170, l: 230 },
      { x: 560, o: 210, c: 170, h: 150, l: 230 },
      { x: 610, o: 170, c: 190, h: 150, l: 210 },
      { x: 660, o: 190, c: 160, h: 140, l: 210 },
      { x: 710, o: 160, c: 200, h: 150, l: 220 },
      { x: 760, o: 200, c: 170, h: 150, l: 220 },
      { x: 810, o: 170, c: 150, h: 130, l: 190 },
      { x: 860, o: 150, c: 190, h: 140, l: 200 },
      { x: 910, o: 190, c: 160, h: 140, l: 210 },
      { x: 960, o: 160, c: 130, h: 110, l: 180 },
      { x: 1010, o: 130, c: 160, h: 120, l: 180 },
      { x: 1060, o: 160, c: 140, h: 120, l: 180 },
      { x: 1110, o: 140, c: 120, h: 100, l: 160 },
    ].map((c, i) => {
      const bullish = c.c < c.o;
      const color = bullish ? '#22c55e' : '#ef4444';
      const top = Math.min(c.o, c.c);
      const bodyH = Math.abs(c.o - c.c);
      return (
        <g key={i}>
          <line x1={c.x} y1={c.h} x2={c.x} y2={c.l} stroke={color} strokeOpacity="0.5" strokeWidth="1" />
          <rect x={c.x - 12} y={top} width={24} height={Math.max(bodyH, 2)} fill={color} fillOpacity="0.4" rx="1" />
        </g>
      );
    })}
    {/* Equity line overlay */}
    <polyline
      points="60,340 110,290 160,260 210,230 260,270 310,240 360,200 410,220 460,180 510,210 560,170 610,190 660,160 710,200 760,170 810,150 860,190 910,160 960,130 1010,160 1060,140 1110,120"
      fill="none"
      stroke="white"
      strokeOpacity="0.12"
      strokeWidth="1.5"
    />
  </svg>
);

/* ══════════════════════════════════════════
   PRODUCT PREVIEW CARDS
   ══════════════════════════════════════════ */
const ProductCards = () => (
  <div className="relative max-w-6xl mx-auto px-6 -mt-8 md:-mt-4">
    <div className="grid md:grid-cols-3 gap-5 pb-0">
      {/* Equity Curve Card */}
      <FadeUp delay={0.1}>
        <div className="bg-[#0c0c0c] border border-white/[0.06] rounded-2xl p-5 h-[280px] overflow-hidden">
          <p className="text-[11px] uppercase tracking-[0.12em] text-white/[0.35] font-semibold mb-4">Equity Curve</p>
          <svg viewBox="0 0 300 160" fill="none" className="w-full">
            <defs>
              <linearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0 140 L30 120 L60 125 L90 100 L120 90 L150 95 L180 70 L210 60 L240 45 L270 50 L300 30" stroke="#22c55e" strokeWidth="1.5" fill="none" />
            <path d="M0 140 L30 120 L60 125 L90 100 L120 90 L150 95 L180 70 L210 60 L240 45 L270 50 L300 30 L300 160 L0 160Z" fill="url(#eqFill)" />
          </svg>
          <div className="flex gap-4 mt-4">
            <div>
              <p className="text-white font-bold text-sm">+$14,230</p>
              <p className="text-white/[0.3] text-[10px]">Total P&L</p>
            </div>
            <div>
              <p className="text-white font-bold text-sm">68%</p>
              <p className="text-white/[0.3] text-[10px]">Win Rate</p>
            </div>
            <div>
              <p className="text-white font-bold text-sm">2.4R</p>
              <p className="text-white/[0.3] text-[10px]">Avg R</p>
            </div>
          </div>
        </div>
      </FadeUp>

      {/* Trade Log Card */}
      <FadeUp delay={0.2}>
        <div className="bg-[#0c0c0c] border border-white/[0.06] rounded-2xl p-5 h-[280px] overflow-hidden">
          <p className="text-[11px] uppercase tracking-[0.12em] text-white/[0.35] font-semibold mb-4">Recent Trades</p>
          <div className="space-y-3">
            {[
              { pair: 'EUR/USD', dir: 'Long', pnl: '+$340', session: 'London' },
              { pair: 'NQ', dir: 'Short', pnl: '-$120', session: 'NY' },
              { pair: 'BTC', dir: 'Long', pnl: '+$890', session: 'Asia' },
              { pair: 'GBP/JPY', dir: 'Long', pnl: '+$210', session: 'London' },
            ].map((t) => (
              <div key={t.pair} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-white text-sm font-medium">{t.pair}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    t.dir === 'Long' ? 'bg-white/10 text-white/80' : 'bg-red-500/10 text-red-400'
                  }`}>{t.dir}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-mono font-bold ${t.pnl.startsWith('+') ? 'text-[#22c55e]' : 'text-red-400'}`}>{t.pnl}</span>
                  <span className="text-[10px] text-white/[0.25]">{t.session}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </FadeUp>

      {/* AI Insight Card */}
      <FadeUp delay={0.3}>
        <div className="bg-[#0c0c0c] border border-white/[0.06] rounded-2xl p-5 h-[280px] overflow-hidden">
          <p className="text-[11px] uppercase tracking-[0.12em] text-white/[0.35] font-semibold mb-4">AI Insight</p>
          <div className="border-l-2 border-white/20 pl-4 mb-4">
            <p className="text-white/[0.65] text-[13px] leading-relaxed">
              Your London session win rate <span className="text-white font-semibold">(74%)</span> is 2.3x better than NY. Consider reducing NY exposure by 40%.
            </p>
          </div>
          <div className="mt-4 space-y-2.5">
            <div className="flex justify-between">
              <span className="text-white/[0.3] text-xs">London</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className="w-[74%] h-full bg-[#22c55e]/50 rounded-full" />
                </div>
                <span className="text-[#22c55e] text-xs font-mono">74%</span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-white/[0.3] text-xs">New York</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className="w-[32%] h-full bg-red-400/50 rounded-full" />
                </div>
                <span className="text-red-400 text-xs font-mono">32%</span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-white/[0.3] text-xs">Asia</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className="w-[58%] h-full bg-white/20 rounded-full" />
                </div>
                <span className="text-white/[0.45] text-xs font-mono">58%</span>
              </div>
            </div>
          </div>
        </div>
      </FadeUp>
    </div>
    {/* Fade-out gradient at bottom to create "bleeding" effect */}
    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#080808] to-transparent pointer-events-none" />
  </div>
);

/* ══════════════════════════════════════════
   FAQ
   ══════════════════════════════════════════ */
const faqData = [
  { q: "Do I need trading experience to use EdgeFlow?", a: "Not at all. Whether you've been trading 2 weeks or 10 years, EdgeFlow adapts to your data and gives you insights relevant to your exact level." },
  { q: "Is EdgeFlow free to use?", a: "You get a full 14-day free trial — no credit card required on the Starter plan. After that, paid plans start at an accessible rate with a free tier always available." },
  { q: "What markets does EdgeFlow support?", a: "Forex, crypto, futures, stocks, indices, and commodities. If you can trade it, you can journal and analyze it." },
  { q: "How is this different from a spreadsheet?", a: "A spreadsheet shows you numbers. EdgeFlow shows you WHY. The AI layer does what no spreadsheet can — pattern detection, leak surfacing, and personalized weekly recommendations based on your data." },
  { q: "Is my trading data secure?", a: "Completely. All data is encrypted end-to-end and never shared, sold, or used to train models. Your edge stays yours, always." },
];

const FaqItem = ({ q, a, isOpen, toggle }: { q: string; a: string; isOpen: boolean; toggle: () => void }) => (
  <div className="border-b border-white/[0.06]">
    <button onClick={toggle} className="w-full flex items-center justify-between py-5 text-left group">
      <span className="text-white text-[15px] font-medium pr-4">{q}</span>
      <ChevronDown className={`w-4 h-4 text-white/[0.25] shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
    </button>
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
          <p className="pb-5 text-white/[0.45] text-[15px] leading-relaxed">{a}</p>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

/* ══════════════════════════════════════════
   PRICING
   ══════════════════════════════════════════ */
const pricingPlans = {
  monthly: [
    { name: 'Starter', price: '$0', period: 'forever', subtitle: 'For traders just getting started.', featured: false, cta: 'Get Started Free', finePrint: 'No credit card required', features: [
      { t: 'Up to 50 trades/month', ok: true }, { t: 'Basic equity curve', ok: true }, { t: 'Win/loss breakdown', ok: true }, { t: '1 trading account', ok: true }, { t: 'AI Trade Advisor', ok: false }, { t: 'Leak Detection', ok: false }, { t: 'What-If Simulations', ok: false },
    ]},
    { name: 'Pro', price: '$29', period: '/mo', subtitle: 'For serious traders ready to find their edge.', featured: true, cta: 'Start 14-Day Free Trial', finePrint: 'Credit card required · Cancel before trial ends', features: [
      { t: 'Unlimited trades', ok: true }, { t: 'Advanced analytics', ok: true }, { t: 'AI Trade Advisor', ok: true }, { t: 'Leak Detection', ok: true }, { t: 'What-If Simulations', ok: true }, { t: 'Pre-Trade Checklist', ok: true }, { t: 'Up to 3 accounts', ok: true }, { t: 'Weekly AI report', ok: true },
    ]},
    { name: 'Elite', price: '$79', period: '/mo', subtitle: 'For prop traders and professionals.', featured: false, cta: 'Start 14-Day Free Trial', finePrint: 'Credit card required · Cancel before trial ends', features: [
      { t: 'Everything in Pro', ok: true }, { t: 'Unlimited accounts', ok: true }, { t: 'Prop firm tracking', ok: true }, { t: 'Multi-currency', ok: true }, { t: 'Priority support', ok: true }, { t: 'Early access features', ok: true }, { t: 'Export PDF & CSV', ok: true },
    ]},
  ],
  annual: [
    { name: 'Starter', price: '$0', period: 'forever', subtitle: 'For traders just getting started.', featured: false, cta: 'Get Started Free', finePrint: 'No credit card required', features: [
      { t: 'Up to 50 trades/month', ok: true }, { t: 'Basic equity curve', ok: true }, { t: 'Win/loss breakdown', ok: true }, { t: '1 trading account', ok: true }, { t: 'AI Trade Advisor', ok: false }, { t: 'Leak Detection', ok: false }, { t: 'What-If Simulations', ok: false },
    ]},
    { name: 'Pro', price: '$19', period: '/mo', subtitle: 'For serious traders ready to find their edge.', featured: true, cta: 'Start 14-Day Free Trial', finePrint: 'Credit card required · Cancel before trial ends', features: [
      { t: 'Unlimited trades', ok: true }, { t: 'Advanced analytics', ok: true }, { t: 'AI Trade Advisor', ok: true }, { t: 'Leak Detection', ok: true }, { t: 'What-If Simulations', ok: true }, { t: 'Pre-Trade Checklist', ok: true }, { t: 'Up to 3 accounts', ok: true }, { t: 'Weekly AI report', ok: true },
    ]},
    { name: 'Elite', price: '$54', period: '/mo', subtitle: 'For prop traders and professionals.', featured: false, cta: 'Start 14-Day Free Trial', finePrint: 'Credit card required · Cancel before trial ends', features: [
      { t: 'Everything in Pro', ok: true }, { t: 'Unlimited accounts', ok: true }, { t: 'Prop firm tracking', ok: true }, { t: 'Multi-currency', ok: true }, { t: 'Priority support', ok: true }, { t: 'Early access features', ok: true }, { t: 'Export PDF & CSV', ok: true },
    ]},
  ],
};

/* ══════════════════════════════════════════
   MAIN LANDING PAGE
   ══════════════════════════════════════════ */
export default function Landing() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [billingAnnual, setBillingAnnual] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/dashboard', { replace: true });
    });
  }, [navigate]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const plans = billingAnnual ? pricingPlans.annual : pricingPlans.monthly;

  return (
    <div className="min-h-screen bg-[#080808] text-white overflow-x-hidden" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ─── NAVBAR ─── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'bg-[#080808]/80 backdrop-blur-xl border-b border-white/[0.06]' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-2">
            <img src={logoImg} alt="EdgeFlow" className="w-6 h-6" />
            <span className="text-white font-medium text-[15px] tracking-tight">EdgeFlow</span>
          </a>

          <div className="hidden md:flex items-center gap-8">
            {['Features', 'How It Works', 'Pricing', 'FAQ'].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                className="text-[13px] text-white/[0.5] hover:text-white/[0.8] transition-colors">
                {item}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => navigate('/auth')} className="text-[13px] text-white/[0.4] hover:text-white/[0.7] transition-colors">
              Sign In
            </button>
            <button onClick={() => navigate('/auth')}
              className="px-5 py-2 rounded-full bg-white text-black text-[13px] font-bold hover:bg-white/90 transition-colors">
              Start Free Trial
            </button>
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-white/[0.6]">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-[#080808]/95 backdrop-blur-xl border-t border-white/[0.06] overflow-hidden">
              <div className="px-6 py-4 flex flex-col gap-3">
                {['Features', 'How It Works', 'Pricing', 'FAQ'].map((item) => (
                  <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => setMobileMenuOpen(false)} className="text-white/[0.5] py-2 text-sm">{item}</a>
                ))}
                <hr className="border-white/[0.06]" />
                <button onClick={() => navigate('/auth')} className="text-white/[0.4] py-2 text-left text-sm">Sign In</button>
                <button onClick={() => navigate('/auth')}
                  className="w-full px-5 py-2.5 rounded-full bg-white text-black text-sm font-bold">Start Free Trial</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative pt-28 md:pt-40 pb-10 px-6 overflow-hidden min-h-[70vh] flex items-end">
        {/* Candlestick chart background */}
        <div className="absolute inset-0 opacity-[0.15]">
          <CandlestickBG />
        </div>
        {/* Grain */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '128px',
        }} />
        {/* Subtle top fade */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#080808] to-transparent" />

        <div className="max-w-7xl mx-auto w-full relative z-10 pb-8">
          <FadeUp>
            <p className="text-[11px] uppercase tracking-[0.12em] text-white/[0.35] font-semibold mb-5">
              AI-Powered Trading Journal
            </p>
          </FadeUp>

          <FadeUp delay={0.1}>
            <h1 className="text-white font-black leading-[1.05] mb-6 max-w-3xl"
              style={{ fontSize: 'clamp(42px, 6vw, 72px)', letterSpacing: '-2px' }}>
              Most traders lose because they don't know why they win.
            </h1>
          </FadeUp>

          <FadeUp delay={0.2}>
            <p className="text-white/[0.45] text-[15px] md:text-[17px] max-w-xl leading-relaxed mb-10">
              EdgeFlow analyzes every trade you make — spotting the patterns, leaks, and emotional triggers
              that are costing you money. Stop guessing. Start compounding.
            </p>
          </FadeUp>

          <FadeUp delay={0.3}>
            <div className="flex flex-col sm:flex-row items-start gap-4 mb-6">
              <button onClick={() => navigate('/auth')}
                className="px-7 py-3 rounded-full bg-white text-black text-[14px] font-bold hover:bg-white/90 transition-colors">
                Start Free — No Card Needed
                <ArrowRight className="inline ml-2 w-4 h-4" />
              </button>
              <button onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }} className="text-white/[0.4] text-[14px] py-3 hover:text-white/[0.6] transition-colors">
                See how it works
              </button>
            </div>
          </FadeUp>

          <FadeUp delay={0.4}>
            <div className="flex items-center gap-6 text-[12px] text-white/[0.25]">
              <span>✓ 14-day free trial</span>
              <span>✓ No credit card</span>
              <span>✓ Cancel anytime</span>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ─── PRODUCT CARDS (bleeding off bottom) ─── */}
      <ProductCards />

      {/* ─── STATS BAR ─── */}
      <StatsBar />

      {/* ─── FEATURES ─── */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <FadeUp>
            <p className="text-[11px] uppercase tracking-[0.12em] text-white/[0.35] font-semibold mb-3">Everything You Need</p>
            <h2 className="text-white font-black text-3xl md:text-[42px] leading-[1.1] mb-16 max-w-lg" style={{ letterSpacing: '-1.5px' }}>
              Stop trading blind.
            </h2>
          </FadeUp>

          <div className="grid lg:grid-cols-2 gap-5">
            {/* Large left card */}
            <FadeUp delay={0.1}>
              <div className="h-full rounded-2xl border border-white/[0.06] bg-[#0c0c0c] p-8 md:p-10 hover:border-white/[0.1] transition-colors duration-500">
                <Brain className="w-6 h-6 text-white/[0.25] mb-6" />
                <h3 className="text-white text-xl font-bold mb-3">AI Trade Advisor</h3>
                <p className="text-white/[0.45] text-[15px] leading-relaxed">
                  Most traders repeat the same mistakes for years. EdgeFlow's AI studies your full trading history,
                  identifies your exact leaks in real time, and tells you precisely what to fix — like having a
                  professional analyst on call 24/7.
                </p>
              </div>
            </FadeUp>

            {/* 2x2 grid right */}
            <div className="grid sm:grid-cols-2 gap-5">
              {[
                { icon: <Search className="w-5 h-5" />, title: 'Leak Detection', desc: 'Surfaces your worst setups, sessions, and emotional patterns before they drain your account.' },
                { icon: <Activity className="w-5 h-5" />, title: 'What-If Simulations', desc: "Filter out your worst trades and instantly see how your equity curve changes." },
                { icon: <Target className="w-5 h-5" />, title: 'Pre-Trade Checklist', desc: 'A customizable discipline gate. Every trade must earn its entry before you pull the trigger.' },
                { icon: <PieChart className="w-5 h-5" />, title: 'Multi-Account', desc: 'Track live, demo, and prop firm accounts separately with independent analytics.' },
              ].map((f, i) => (
                <FadeUp key={f.title} delay={0.1 * (i + 1)}>
                  <div className="rounded-2xl border border-white/[0.06] bg-[#0c0c0c] p-6 hover:border-white/[0.1] transition-colors duration-500 h-full">
                    <div className="text-white/[0.25] mb-4">{f.icon}</div>
                    <h3 className="text-white text-[15px] font-bold mb-2">{f.title}</h3>
                    <p className="text-white/[0.45] text-[13px] leading-relaxed">{f.desc}</p>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <FadeUp>
            <p className="text-[11px] uppercase tracking-[0.12em] text-white/[0.35] font-semibold mb-3">Simple Process</p>
            <h2 className="text-white font-black text-3xl md:text-[42px] leading-[1.1] mb-16 max-w-lg" style={{ letterSpacing: '-1.5px' }}>
              From trade to insight in seconds.
            </h2>
          </FadeUp>

          <div className="grid md:grid-cols-3 gap-12 md:gap-16">
            {[
              { n: '01', title: 'Log Your Trade', desc: 'Add your instrument, direction, R-size, session, strategy tag, and emotional state. Takes 30 seconds.' },
              { n: '02', title: 'See Your Patterns', desc: 'Instant equity curves, session breakdowns, win rates by setup — everything visualized.' },
              { n: '03', title: 'Get Your Edge', desc: 'Your AI advisor delivers personalized recommendations based on YOUR actual data. Not generic advice.' },
            ].map((s, i) => (
              <FadeUp key={s.n} delay={0.15 * i}>
                <div>
                  <span className="text-white/[0.08] text-[72px] font-black leading-none block mb-2" style={{ letterSpacing: '-3px' }}>{s.n}</span>
                  <h3 className="text-white text-lg font-bold mb-2">{s.title}</h3>
                  <p className="text-white/[0.45] text-[15px] leading-relaxed">{s.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section id="testimonials" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <FadeUp>
            <p className="text-[11px] uppercase tracking-[0.12em] text-white/[0.35] font-semibold mb-3">Trusted By Traders</p>
            <h2 className="text-white font-black text-3xl md:text-[42px] leading-[1.1] mb-16 max-w-md" style={{ letterSpacing: '-1.5px' }}>
              Real traders. Real results.
            </h2>
          </FadeUp>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { name: 'Alex M.', type: 'Forex', initials: 'AM', quote: 'I was hemorrhaging money every Friday. EdgeFlow flagged it in under 5 minutes. I cut Fridays — win rate jumped 14% that month.' },
              { name: 'Sarah K.', type: 'Crypto', initials: 'SK', quote: "It's like having a coach who has watched every single trade I've ever taken. The AI pattern detection is frighteningly accurate." },
              { name: 'James R.', type: 'Futures', initials: 'JR', quote: "The What-If tool showed me I was giving back 40% of my profits on revenge trades. That one insight paid for years of subscription." },
            ].map((t, i) => (
              <FadeUp key={t.name} delay={0.1 * i}>
                <div className="rounded-2xl border border-white/[0.06] bg-[#0c0c0c] p-7 hover:border-white/[0.1] hover:-translate-y-1 transition-all duration-300">
                  <p className="text-white/[0.55] text-[14px] leading-relaxed mb-6">"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-white/[0.35] font-bold text-[11px]">
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-white text-[13px] font-medium">{t.name}</p>
                      <p className="text-white/[0.25] text-[11px]">{t.type}</p>
                    </div>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
          <p className="text-white/[0.15] text-[11px] mt-6">Testimonials are illustrative examples. Individual results vary.</p>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <FadeUp>
            <p className="text-[11px] uppercase tracking-[0.12em] text-white/[0.35] font-semibold mb-3">Simple Pricing</p>
            <h2 className="text-white font-black text-3xl md:text-[42px] leading-[1.1] mb-4 max-w-md" style={{ letterSpacing: '-1.5px' }}>
              Invest in your edge.
            </h2>
            <p className="text-white/[0.45] text-[15px] mb-12">Start free. Upgrade when you're ready.</p>
          </FadeUp>

          {/* Billing toggle */}
          <div className="flex items-center gap-4 mb-12">
            <span className={`text-[13px] ${!billingAnnual ? 'text-white' : 'text-white/[0.35]'}`}>Monthly</span>
            <button onClick={() => setBillingAnnual(!billingAnnual)}
              className="relative w-12 h-6 rounded-full bg-white/[0.08] transition-colors">
              <motion.div className="absolute top-1 w-4 h-4 rounded-full bg-white"
                animate={{ left: billingAnnual ? '1.75rem' : '0.25rem' }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
            </button>
            <span className={`text-[13px] ${billingAnnual ? 'text-white' : 'text-white/[0.35]'}`}>Annual</span>
            <AnimatePresence>
              {billingAnnual && (
                <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                  className="text-[11px] text-white font-medium">Save up to 34%</motion.span>
              )}
            </AnimatePresence>
          </div>

          <div className="grid md:grid-cols-3 gap-5 max-w-5xl">
            {plans.map((plan, i) => (
              <FadeUp key={plan.name} delay={0.1 * i}>
                <div className={`relative rounded-2xl p-7 h-full flex flex-col ${
                  plan.featured
                    ? 'border border-white/[0.12] bg-[#0c0c0c]'
                    : 'border border-white/[0.06] bg-[#0c0c0c]'
                }`}>
                  {plan.featured && (
                    <span className="absolute -top-3 right-6 bg-white text-black text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      Popular
                    </span>
                  )}
                  <h3 className="text-white text-lg font-bold mb-0.5">{plan.name}</h3>
                  <p className="text-white/[0.35] text-[13px] mb-4">{plan.subtitle}</p>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-3xl font-black text-white">{plan.price}</span>
                    <span className="text-white/[0.35] text-[13px]">{plan.period}</span>
                  </div>
                  <div className="space-y-2.5 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <div key={f.t} className="flex items-start gap-2">
                        {f.ok ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-white/[0.25] mt-0.5 shrink-0" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-white/[0.12] mt-0.5 shrink-0" />
                        )}
                        <span className={`text-[13px] ${f.ok ? 'text-white/[0.55]' : 'text-white/[0.2]'}`}>{f.t}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => navigate('/auth')}
                    className={`w-full py-2.5 rounded-full text-[13px] font-bold transition-all ${
                      plan.featured
                        ? 'bg-white text-black hover:bg-white/90'
                        : 'border border-white/[0.1] text-white/[0.6] hover:border-white/[0.2]'
                    }`}>
                    {plan.cta}
                  </button>
                  <p className="text-center text-white/[0.2] text-[11px] mt-3">{plan.finePrint}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="py-32 px-6">
        <div className="max-w-2xl mx-auto">
          <FadeUp>
            <h2 className="text-white font-black text-3xl md:text-[42px] leading-[1.1] mb-12" style={{ letterSpacing: '-1.5px' }}>
              Frequently asked questions
            </h2>
          </FadeUp>
          {faqData.map((faq, i) => (
            <FaqItem key={i} q={faq.q} a={faq.a} isOpen={openFaq === i} toggle={() => setOpenFaq(openFaq === i ? null : i)} />
          ))}
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-32 px-6">
        <div className="max-w-2xl">
          <FadeUp>
            <div className="px-6">
              <h2 className="text-white font-black text-3xl md:text-[48px] leading-[1.1] mb-6" style={{ letterSpacing: '-2px' }}>
                Your next losing streak is preventable.
              </h2>
              <p className="text-white/[0.45] text-[15px] mb-10 max-w-lg leading-relaxed">
                Most traders keep repeating the same mistakes because they never look back systematically.
                EdgeFlow makes sure you do.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-4 mb-4">
                <button onClick={() => navigate('/auth')}
                  className="px-7 py-3 rounded-full bg-white text-black text-[14px] font-bold hover:bg-white/90 transition-colors">
                  Start Free Trial
                  <ArrowRight className="inline ml-2 w-4 h-4" />
                </button>
                <button className="text-white/[0.4] text-[14px] py-3 hover:text-white/[0.6] transition-colors">
                  Schedule a Demo
                </button>
              </div>
              <p className="text-white/[0.2] text-[12px]">No credit card · 14-day free trial · Cancel anytime</p>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/[0.06] py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-5 gap-10 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <img src={logoImg} alt="EdgeFlow" className="w-5 h-5" />
                <span className="text-white font-medium text-[14px]">EdgeFlow</span>
              </div>
              <p className="text-white/[0.35] text-[13px] leading-relaxed mb-4">
                The trading journal that works as hard as you do.
              </p>
              <div className="flex gap-2">
                {[Twitter, Linkedin, MessageCircle, Mail].map((Icon, i) => (
                  <a key={i} href="#" className="w-8 h-8 rounded-full border border-white/[0.06] flex items-center justify-center text-white/[0.25] hover:text-white/[0.5] hover:border-white/[0.12] transition-colors">
                    <Icon className="w-3.5 h-3.5" />
                  </a>
                ))}
              </div>
            </div>
            {[
              { title: 'Product', links: ['Features', 'Pricing', 'Security', 'Updates'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
              { title: 'Resources', links: ['Documentation', 'Help Center', 'Community', 'API'] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-white/[0.5] font-medium text-[12px] uppercase tracking-[0.1em] mb-4">{col.title}</h4>
                <div className="space-y-2">
                  {col.links.map((link) => (
                    <a key={link} href="#" className="block text-white/[0.3] text-[13px] hover:text-white/[0.5] transition-colors">{link}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-white/[0.06] pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/[0.2] text-[11px]">© 2026 EdgeFlow. All rights reserved.</p>
            <div className="flex gap-6 text-[11px] text-white/[0.2]">
              <a href="#" className="hover:text-white/[0.4]">Privacy</a>
              <a href="#" className="hover:text-white/[0.4]">Terms</a>
              <a href="#" className="hover:text-white/[0.4]">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ══════════════════════════════════════════
   STATS BAR
   ══════════════════════════════════════════ */
function StatsBar() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <div ref={ref} className="py-20 px-6">
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        {[
          { label: 'Trades analyzed daily', value: 'Thousands' },
          { label: 'AI advisor availability', value: '24/7' },
          { label: 'Loved by traders', value: 'Worldwide' },
          { label: 'Free trial', value: '14 days' },
        ].map((s, i) => (
          <motion.div key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 * i }}>
            <p className="text-white font-bold text-xl md:text-2xl mb-1">{s.value}</p>
            <p className="text-white/[0.25] text-[12px]">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
