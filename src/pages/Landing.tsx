/*
  ╔══════════════════════════════════════════╗
  ║        HOW TO ADD YOUR SCREENSHOTS       ║
  ╠══════════════════════════════════════════╣
  ║ 1. Export your app screenshots as PNG    ║
  ║    Recommended: 1280x800px               ║
  ║ 2. Drop them into /public/screenshots/   ║
  ║ 3. Update the image paths in slides[]    ║
  ║    array below                           ║
  ║ 4. To add more slides: copy any object   ║
  ║    in the array and update id/label/path ║
  ║ 5. To remove slides: delete the object   ║
  ╚══════════════════════════════════════════╝
*/

import { useNavigate } from 'react-router-dom';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  TrendingUp, BarChart3, BookOpen, Target, LineChart, PieChart,
  ArrowRight, ArrowLeft, CheckCircle2, Zap, Shield, Users, Menu, X,
  Twitter, Linkedin, Mail, Brain, Activity, Sparkles, ChevronDown,
  ImagePlus, Lock, Smartphone, MessageCircle, Eye, Search, FileText,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import logoImg from '@/assets/logo.svg';

/* ══════════════════════════════════════════
   CAROUSEL SLIDES CONFIG
   ══════════════════════════════════════════ */
const slides = [
  {
    id: 1,
    label: "Dashboard Overview",
    image: "/screenshots/slide-1.png",
    description: "Track your performance at a glance",
  },
  {
    id: 2,
    label: "Trade Log",
    image: "/screenshots/slide-2.png",
    description: "Every trade, perfectly organized",
  },
  {
    id: 3,
    label: "AI Insights",
    image: "/screenshots/slide-3.png",
    description: "Your personal AI trading analyst",
  },
  {
    id: 4,
    label: "Leak Detection",
    image: "/screenshots/slide-4.png",
    description: "Find what's costing you money",
  },
  {
    id: 5,
    label: "Performance Analytics",
    image: "/screenshots/slide-5.png",
    description: "Deep-dive into your edge",
  },
];

/* ══════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════ */

// Animated counter hook
function useCountUp(target: number, inView: boolean, duration = 2000) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
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

// Section wrapper with scroll animation
const Section = ({ children, className = '', id = '' }: { children: React.ReactNode; className?: string; id?: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.section
      ref={ref}
      id={id}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.section>
  );
};

// Stagger child wrapper
const StaggerChild = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
};

/* ══════════════════════════════════════════
   FAQ ACCORDION
   ══════════════════════════════════════════ */
const faqData = [
  {
    q: "Do I need trading experience to use EdgeFlow?",
    a: "Not at all. Whether you've been trading 2 weeks or 10 years, EdgeFlow adapts to your data and gives you insights relevant to your exact level.",
  },
  {
    q: "Is EdgeFlow free to use?",
    a: "You get a full 14-day free trial — no credit card required on the Starter plan. After that, paid plans start at an accessible rate with a free tier always available.",
  },
  {
    q: "What markets does EdgeFlow support?",
    a: "Forex, crypto, futures, stocks, indices, and commodities. If you can trade it, you can journal and analyze it.",
  },
  {
    q: "How is this different from a spreadsheet?",
    a: "A spreadsheet shows you numbers. EdgeFlow shows you WHY. The AI layer does what no spreadsheet can — pattern detection, leak surfacing, and personalized weekly recommendations based on your data.",
  },
  {
    q: "Is my trading data secure?",
    a: "Completely. All data is encrypted end-to-end and never shared, sold, or used to train models. Your edge stays yours, always.",
  },
];

const FaqItem = ({ q, a, isOpen, toggle }: { q: string; a: string; isOpen: boolean; toggle: () => void }) => (
  <div className="border-b border-[#1a3d2b]/40">
    <button
      onClick={toggle}
      className="w-full flex items-center justify-between py-5 text-left group"
    >
      <span className="text-[#f5f0eb] text-lg font-medium pr-4">{q}</span>
      <ChevronDown
        className={`w-5 h-5 text-[#16a34a] shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
      />
    </button>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <p className="pb-5 text-gray-400 leading-relaxed">{a}</p>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

/* ══════════════════════════════════════════
   CAROUSEL COMPONENT
   ══════════════════════════════════════════ */
const PlatformCarousel = () => {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrent((p) => (p + 1) % slides.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [isPaused]);

  const next = () => setCurrent((p) => (p + 1) % slides.length);
  const prev = () => setCurrent((p) => (p - 1 + slides.length) % slides.length);

  const handleImgError = (id: number) => {
    setImgErrors((p) => ({ ...p, [id]: true }));
  };

  return (
    <div
      className="relative max-w-5xl mx-auto"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Browser frame */}
      <div className="rounded-[20px] border border-[#1a3d2b] bg-[#0a0a0a] overflow-hidden shadow-2xl shadow-black/60">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-5 py-3 bg-[#0d0d0d] border-b border-[#1a3d2b]/60">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="bg-[#161616] rounded-md px-4 py-1.5 text-xs text-gray-500 font-mono">
              app.edgeflow.io
            </div>
          </div>
        </div>

        {/* Slide area */}
        <div className="relative aspect-[16/10] bg-[#0d1a12] overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 30, scale: 1.02 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className="absolute inset-0"
            >
              {imgErrors[slides[current].id] ? (
                /* Placeholder fallback */
                <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-[#16a34a]/30 rounded-lg">
                  <ImagePlus className="w-12 h-12 text-[#16a34a]/40 mb-3" />
                  <p className="text-[#f5f0eb] font-medium text-lg">{slides[current].label}</p>
                  <p className="text-gray-500 text-sm mt-1">Add your screenshot here</p>
                  {/* Replace image path in slides[] array above. Drop your .png/.jpg into /public/screenshots/. Recommended size: 1280x800px */}
                </div>
              ) : (
                <img
                  src={slides[current].image}
                  alt={slides[current].label}
                  className="w-full h-full object-contain"
                  onError={() => handleImgError(slides[current].id)}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Slide label overlay */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`label-${current}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6"
            >
              <p className="text-[#16a34a] text-sm font-medium uppercase tracking-wider">{slides[current].label}</p>
              <p className="text-[#f5f0eb] text-lg">{slides[current].description}</p>
            </motion.div>
          </AnimatePresence>

          {/* Arrow buttons */}
          <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm border border-[#1a3d2b] flex items-center justify-center text-[#f5f0eb] hover:bg-[#16a34a]/20 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm border border-[#1a3d2b] flex items-center justify-center text-[#f5f0eb] hover:bg-[#16a34a]/20 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-2 mt-5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              current === i ? 'w-7 bg-[#16a34a]' : 'w-2 bg-gray-600 hover:bg-gray-500'
            }`}
          />
        ))}
      </div>

      {/* Trust chips */}
      <div className="flex flex-wrap justify-center gap-4 md:gap-6 mt-6 text-sm text-gray-400">
        <span className="flex items-center gap-1.5"><Lock className="w-4 h-4 text-[#16a34a]" /> Bank-level encryption</span>
        <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-[#16a34a]" /> Real-time sync</span>
        <span className="flex items-center gap-1.5"><Smartphone className="w-4 h-4 text-[#16a34a]" /> Works on all devices</span>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════
   PRICING
   ══════════════════════════════════════════ */
const pricingPlans = {
  monthly: [
    {
      name: 'Starter',
      price: '$0',
      period: 'forever',
      subtitle: 'For traders just getting started.',
      featured: false,
      cta: 'Get Started Free',
      ctaVariant: 'outline' as const,
      finePrint: 'No credit card required',
      features: [
        { text: 'Up to 50 trades/month', included: true },
        { text: 'Basic equity curve', included: true },
        { text: 'Win/loss breakdown', included: true },
        { text: '1 trading account', included: true },
        { text: 'AI Trade Advisor', included: false },
        { text: 'Leak Detection Engine', included: false },
        { text: 'What-If Simulations', included: false },
      ],
    },
    {
      name: 'Pro',
      price: '$29',
      period: '/month',
      subtitle: 'For serious traders ready to find their edge.',
      featured: true,
      cta: 'Start 14-Day Free Trial →',
      ctaVariant: 'default' as const,
      finePrint: 'Credit card required · Cancel before trial ends and you won\'t be charged',
      features: [
        { text: 'Unlimited trades', included: true },
        { text: 'Advanced analytics dashboard', included: true },
        { text: 'AI Trade Advisor (full access)', included: true },
        { text: 'Leak Detection Engine', included: true },
        { text: 'What-If Simulations', included: true },
        { text: 'Pre-Trade Checklist', included: true },
        { text: 'Up to 3 trading accounts', included: true },
        { text: 'Weekly AI performance report', included: true },
        { text: 'Multi-account (unlimited)', included: false },
        { text: 'Priority support', included: false },
      ],
    },
    {
      name: 'Elite',
      price: '$79',
      period: '/month',
      subtitle: 'For prop traders and full-time professionals.',
      featured: false,
      cta: 'Start 14-Day Free Trial →',
      ctaVariant: 'outline' as const,
      finePrint: 'Credit card required · Cancel before trial ends and you won\'t be charged',
      features: [
        { text: 'Everything in Pro', included: true },
        { text: 'Unlimited trading accounts', included: true },
        { text: 'Prop firm account tracking', included: true },
        { text: 'Multi-currency support', included: true },
        { text: 'Priority 1-on-1 support', included: true },
        { text: 'Early access to new features', included: true },
        { text: 'Custom strategy tags & categories', included: true },
        { text: 'Export reports (PDF & CSV)', included: true },
      ],
    },
  ],
  annual: [
    {
      name: 'Starter',
      price: '$0',
      period: 'forever',
      subtitle: 'For traders just getting started.',
      featured: false,
      cta: 'Get Started Free',
      ctaVariant: 'outline' as const,
      finePrint: 'No credit card required',
      features: [
        { text: 'Up to 50 trades/month', included: true },
        { text: 'Basic equity curve', included: true },
        { text: 'Win/loss breakdown', included: true },
        { text: '1 trading account', included: true },
        { text: 'AI Trade Advisor', included: false },
        { text: 'Leak Detection Engine', included: false },
        { text: 'What-If Simulations', included: false },
      ],
    },
    {
      name: 'Pro',
      price: '$19',
      period: '/month',
      subtitle: 'For serious traders ready to find their edge.',
      featured: true,
      cta: 'Start 14-Day Free Trial →',
      ctaVariant: 'default' as const,
      finePrint: 'Credit card required · Cancel before trial ends and you won\'t be charged',
      features: [
        { text: 'Unlimited trades', included: true },
        { text: 'Advanced analytics dashboard', included: true },
        { text: 'AI Trade Advisor (full access)', included: true },
        { text: 'Leak Detection Engine', included: true },
        { text: 'What-If Simulations', included: true },
        { text: 'Pre-Trade Checklist', included: true },
        { text: 'Up to 3 trading accounts', included: true },
        { text: 'Weekly AI performance report', included: true },
        { text: 'Multi-account (unlimited)', included: false },
        { text: 'Priority support', included: false },
      ],
    },
    {
      name: 'Elite',
      price: '$54',
      period: '/month',
      subtitle: 'For prop traders and full-time professionals.',
      featured: false,
      cta: 'Start 14-Day Free Trial →',
      ctaVariant: 'outline' as const,
      finePrint: 'Credit card required · Cancel before trial ends and you won\'t be charged',
      features: [
        { text: 'Everything in Pro', included: true },
        { text: 'Unlimited trading accounts', included: true },
        { text: 'Prop firm account tracking', included: true },
        { text: 'Multi-currency support', included: true },
        { text: 'Priority 1-on-1 support', included: true },
        { text: 'Early access to new features', included: true },
        { text: 'Custom strategy tags & categories', included: true },
        { text: 'Export reports (PDF & CSV)', included: true },
      ],
    },
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

  // Auth redirect
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/dashboard', { replace: true });
    });
  }, [navigate]);

  // Scroll listener for navbar
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const plans = billingAnnual ? pricingPlans.annual : pricingPlans.monthly;

  return (
    <div className="min-h-screen bg-[#080808] text-[#f5f0eb] font-['DM_Sans',sans-serif] overflow-x-hidden">

      {/* ─── NAVBAR ─── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-[#080808]/80 backdrop-blur-xl border-b border-[#1a3d2b]/30'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-2">
            <img src={logoImg} alt="EdgeFlow" className="w-7 h-7" />
            <span className="text-[#f5f0eb] font-semibold text-lg tracking-tight">EdgeFlow</span>
          </a>

          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            {['Features', 'How It Works', 'Testimonials', 'Pricing', 'FAQ'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                className="hover:text-[#f5f0eb] transition-colors"
              >
                {item}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate('/auth')}
              className="text-gray-300 hover:text-[#f5f0eb] hover:bg-transparent"
            >
              Sign In
            </Button>
            <button
              onClick={() => navigate('/auth')}
              className="relative px-5 py-2.5 rounded-full bg-[#16a34a] text-white text-sm font-medium overflow-hidden group"
            >
              <span className="relative z-10">Start Free Trial →</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            </button>
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-[#f5f0eb]">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-[#1a3d2b]/30 overflow-hidden"
            >
              <div className="px-6 py-4 flex flex-col gap-3">
                {['Features', 'How It Works', 'Testimonials', 'Pricing', 'FAQ'].map((item) => (
                  <a
                    key={item}
                    href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-gray-300 py-2 hover:text-[#f5f0eb]"
                  >
                    {item}
                  </a>
                ))}
                <hr className="border-[#1a3d2b]/30" />
                <Button variant="ghost" onClick={() => navigate('/auth')} className="justify-start text-gray-300">Sign In</Button>
                <button onClick={() => navigate('/auth')} className="w-full px-5 py-2.5 rounded-full bg-[#16a34a] text-white text-sm font-medium">
                  Start Free Trial →
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative pt-32 md:pt-44 pb-20 px-6 overflow-hidden">
        {/* Grain overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: '128px 128px',
        }} />

        {/* Gradient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#16a34a]/8 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <StaggerChild delay={0}>
            <span className="inline-block text-[#16a34a] text-sm font-medium uppercase tracking-[0.2em] mb-6">
              The Trading Journal That Thinks With You
            </span>
          </StaggerChild>

          <StaggerChild delay={0.1}>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-['Cormorant_Garamond',serif] font-bold leading-[1.1] mb-6 text-[#f5f0eb]">
              Most Traders Lose Because They Don't Know Why They{' '}
              <span className="text-[#22c55e]">Win.</span>
            </h1>
          </StaggerChild>

          <StaggerChild delay={0.2}>
            <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              EdgeFlow analyzes every trade you make — spotting the patterns, leaks, and emotional triggers 
              that are costing you money. Stop guessing. Start compounding.
            </p>
          </StaggerChild>

          <StaggerChild delay={0.3}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <button
                onClick={() => navigate('/auth')}
                className="relative px-8 py-3.5 rounded-full bg-[#16a34a] text-white font-medium text-base overflow-hidden group"
              >
                <span className="relative z-10">Start Free — No Card Needed →</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              </button>
              <Button
                variant="ghost"
                onClick={() => {
                  const el = document.getElementById('platform-preview');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-gray-300 border border-[#1a3d2b] hover:border-[#16a34a]/40 hover:bg-transparent px-6 py-3 rounded-full"
              >
                See It In Action
              </Button>
            </div>
          </StaggerChild>

          <StaggerChild delay={0.4}>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#16a34a]" /> 14-day free trial</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#16a34a]" /> No credit card</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#16a34a]" /> Cancel anytime</span>
            </div>
          </StaggerChild>
        </div>
      </section>

      {/* ─── PLATFORM PREVIEW CAROUSEL ─── */}
      <Section id="platform-preview" className="py-20 px-6">
        <div className="text-center mb-12">
          <p className="text-[#16a34a] uppercase tracking-[0.2em] text-sm font-medium mb-3">Platform Preview</p>
          <h2 className="text-3xl md:text-5xl font-['Cormorant_Garamond',serif] font-bold text-[#f5f0eb] mb-4">
            Powerful Interface. <span className="text-[#16a34a]">Simple Experience.</span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto text-lg">
            Explore the tools built to give you a professional edge.
          </p>
        </div>
        <PlatformCarousel />
      </Section>

      {/* ─── SOCIAL PROOF BAR ─── */}
      <SocialProofBar />

      {/* ─── FEATURES ─── */}
      <Section id="features" className="py-24 px-6 relative">
        {/* Dot grid bg */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #16a34a 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="mb-14">
            <p className="text-[#16a34a] uppercase tracking-[0.2em] text-sm font-medium mb-3">Everything You Need</p>
            <h2 className="text-3xl md:text-5xl font-['Cormorant_Garamond',serif] font-bold text-[#f5f0eb]">Stop Trading Blind.</h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Large left card */}
            <StaggerChild delay={0}>
              <div className="group h-full rounded-2xl border border-[#1a3d2b]/60 bg-[#0d1a12]/50 p-8 md:p-10 hover:border-[#16a34a]/40 hover:shadow-lg hover:shadow-[#16a34a]/5 transition-all duration-500">
                <div className="w-14 h-14 rounded-xl bg-[#16a34a]/10 flex items-center justify-center mb-6">
                  <Brain className="w-7 h-7 text-[#16a34a]" />
                </div>
                <h3 className="text-2xl font-bold text-[#f5f0eb] mb-4">AI Trade Advisor</h3>
                <p className="text-gray-400 leading-relaxed text-base">
                  Most traders repeat the same mistakes for years. EdgeFlow's AI studies your full trading history, 
                  identifies your exact leaks in real time, and tells you precisely what to fix — like having a 
                  professional analyst on call 24/7, for a fraction of the cost.
                </p>
              </div>
            </StaggerChild>

            {/* 2x2 grid right */}
            <div className="grid sm:grid-cols-2 gap-6">
              {[
                { icon: <Search className="w-6 h-6 text-[#16a34a]" />, title: 'Leak Detection Engine', desc: 'Automatically surfaces your worst setups, sessions, and emotional patterns before they drain your account.' },
                { icon: <Activity className="w-6 h-6 text-[#16a34a]" />, title: 'What-If Simulations', desc: "Filter out your worst trades and instantly see how your equity curve changes. Know your edge precisely." },
                { icon: <Target className="w-6 h-6 text-[#16a34a]" />, title: 'Pre-Trade Checklist', desc: 'A customizable discipline gate. Every trade must earn its entry before you pull the trigger.' },
                { icon: <PieChart className="w-6 h-6 text-[#16a34a]" />, title: 'Multi-Account Management', desc: 'Track live, demo, and prop firm accounts separately, all under one roof with independent analytics.' },
              ].map((f, i) => (
                <StaggerChild key={f.title} delay={0.1 * (i + 1)}>
                  <div className="group rounded-2xl border border-[#1a3d2b]/60 bg-[#0d1a12]/50 p-6 hover:border-[#16a34a]/40 hover:shadow-lg hover:shadow-[#16a34a]/5 transition-all duration-500 h-full">
                    <div className="w-10 h-10 rounded-lg bg-[#16a34a]/10 flex items-center justify-center mb-4">
                      {f.icon}
                    </div>
                    <h3 className="text-lg font-bold text-[#f5f0eb] mb-2">{f.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </StaggerChild>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ─── HOW IT WORKS ─── */}
      <Section id="how-it-works" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[#16a34a] uppercase tracking-[0.2em] text-sm font-medium mb-3">Simple Process</p>
            <h2 className="text-3xl md:text-5xl font-['Cormorant_Garamond',serif] font-bold text-[#f5f0eb]">
              From Trade to Insight in Seconds.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Log Your Trade', desc: 'Add your instrument, direction, R-size, session, strategy tag, and emotional state. Takes 30 seconds.' },
              { step: '02', title: 'See Your Patterns', desc: 'Instant equity curves, session breakdowns, win rates by setup — everything visualized clearly.' },
              { step: '03', title: 'Get Your Edge', desc: 'Your AI advisor delivers personalized weekly recommendations based on YOUR actual data. Not generic advice. Your patterns. Your fixes.' },
            ].map((s, i) => (
              <StaggerChild key={s.step} delay={0.15 * i}>
                <div className="relative rounded-2xl border border-[#1a3d2b]/40 bg-[#0d1a12]/30 p-8 text-center">
                  <span className="text-[#16a34a]/30 text-6xl font-bold font-['Cormorant_Garamond',serif] absolute top-4 right-6">{s.step}</span>
                  <div className="relative z-10">
                    <h3 className="text-xl font-bold text-[#f5f0eb] mb-3 mt-8">{s.title}</h3>
                    <p className="text-gray-400 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </StaggerChild>
            ))}
          </div>
        </div>
      </Section>

      {/* ─── WHY TRADERS LOVE US ─── */}
      <Section className="py-24 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-[#16a34a] uppercase tracking-[0.2em] text-sm font-medium mb-3">Why Traders Love Us</p>
            <h2 className="text-3xl md:text-4xl font-['Cormorant_Garamond',serif] font-bold text-[#f5f0eb] mb-6">
              The Difference Between Breaking Even and Breakthrough.
            </h2>
            <p className="text-gray-400 leading-relaxed mb-8">
              Thousands of retail traders have used EdgeFlow to finally understand what separates their winning days 
              from their losing ones — and systematically close the gap.
            </p>
            <div className="space-y-3">
              {[
                'Identify and eliminate your most expensive habits',
                'Build unshakeable confidence through data, not hope',
                'Know exactly which setups, sessions, and markets to own',
              ].map((b) => (
                <div key={b} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#16a34a] mt-0.5 shrink-0" />
                  <span className="text-gray-300">{b}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats card */}
          <StaggerChild delay={0.2}>
            <div className="rounded-2xl border border-[#1a3d2b]/60 bg-[#0d1a12]/50 p-8 grid grid-cols-2 gap-6">
              {[
                { label: 'Win Rate', value: '68%' },
                { label: 'Average R', value: '2.4R' },
                { label: 'Drawdown Reduction', value: '-34%' },
                { label: 'Active Traders', value: '10K+' },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-3xl font-bold text-[#22c55e] mb-1">{s.value}</p>
                  <p className="text-gray-500 text-sm">{s.label}</p>
                </div>
              ))}
            </div>
          </StaggerChild>
        </div>
      </Section>

      {/* ─── TESTIMONIALS ─── */}
      <Section id="testimonials" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[#16a34a] uppercase tracking-[0.2em] text-sm font-medium mb-3">Trusted By Traders</p>
            <h2 className="text-3xl md:text-5xl font-['Cormorant_Garamond',serif] font-bold text-[#f5f0eb]">
              Real Traders. Real Results.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Alex M.', type: 'Forex Trader', initials: 'AM', quote: 'I was hemorrhaging money every Friday. EdgeFlow flagged it in under 5 minutes. I cut Fridays — win rate jumped 14% that month alone.' },
              { name: 'Sarah K.', type: 'Crypto Trader', initials: 'SK', quote: "It's like having a coach who has watched every single trade I've ever taken. The AI pattern detection is frighteningly accurate." },
              { name: 'James R.', type: 'Futures Trader', initials: 'JR', quote: "The What-If tool showed me I was giving back 40% of my profits on revenge trades. That one insight paid for years of subscription." },
            ].map((t, i) => (
              <StaggerChild key={t.name} delay={0.1 * i}>
                <div className="group rounded-2xl border border-[#1a3d2b]/60 bg-[#0d1a12]/50 p-7 hover:border-[#16a34a]/40 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#16a34a]/5 transition-all duration-300">
                  <p className="text-gray-300 leading-relaxed mb-6 italic">"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#16a34a]/20 flex items-center justify-center text-[#16a34a] font-bold text-sm">
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-[#f5f0eb] font-medium text-sm">{t.name}</p>
                      <p className="text-gray-500 text-xs">{t.type}</p>
                    </div>
                  </div>
                </div>
              </StaggerChild>
            ))}
          </div>
          <p className="text-center text-gray-600 text-xs mt-6">
            Testimonials are illustrative examples. Individual results vary.
          </p>
        </div>
      </Section>

      {/* ─── PRICING ─── */}
      <Section id="pricing" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[#16a34a] uppercase tracking-[0.2em] text-sm font-medium mb-3">Simple Pricing</p>
            <h2 className="text-3xl md:text-5xl font-['Cormorant_Garamond',serif] font-bold text-[#f5f0eb] mb-4">
              Invest in Your Edge.
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Start free. Upgrade when you're ready. No hidden fees, no surprises.
            </p>
          </div>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={`text-sm ${!billingAnnual ? 'text-[#f5f0eb]' : 'text-gray-500'}`}>Monthly</span>
            <button
              onClick={() => setBillingAnnual(!billingAnnual)}
              className="relative w-14 h-7 rounded-full bg-[#1a3d2b] transition-colors"
            >
              <motion.div
                className="absolute top-1 w-5 h-5 rounded-full bg-[#16a34a]"
                animate={{ left: billingAnnual ? '2rem' : '0.25rem' }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
            <span className={`text-sm ${billingAnnual ? 'text-[#f5f0eb]' : 'text-gray-500'}`}>Annual</span>
            <AnimatePresence>
              {billingAnnual && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-xs bg-[#16a34a]/20 text-[#22c55e] px-2.5 py-1 rounded-full font-medium"
                >
                  Save up to 34%
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Cards */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <StaggerChild key={plan.name} delay={0.1 * i}>
                <div
                  className={`relative rounded-2xl p-7 h-full flex flex-col ${
                    plan.featured
                      ? 'border-2 border-[#16a34a]/60 bg-[#0d1a12]/70 shadow-lg shadow-[#16a34a]/10 scale-[1.02]'
                      : 'border border-[#1a3d2b]/60 bg-[#0d1a12]/40'
                  }`}
                >
                  {plan.featured && (
                    <span className="absolute -top-3 right-6 bg-[#16a34a] text-white text-xs font-medium px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  )}
                  <h3 className="text-xl font-bold text-[#f5f0eb] mb-1">{plan.name}</h3>
                  <p className="text-gray-500 text-sm mb-4">{plan.subtitle}</p>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-bold text-[#f5f0eb]">{plan.price}</span>
                    <span className="text-gray-500 text-sm">{plan.period}</span>
                  </div>
                  <div className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <div key={f.text} className="flex items-start gap-2.5">
                        {f.included ? (
                          <CheckCircle2 className="w-4 h-4 text-[#16a34a] mt-0.5 shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-gray-600 mt-0.5 shrink-0" />
                        )}
                        <span className={`text-sm ${f.included ? 'text-gray-300' : 'text-gray-600'}`}>{f.text}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => navigate('/auth')}
                    className={`w-full py-3 rounded-full text-sm font-medium transition-all relative overflow-hidden group ${
                      plan.featured
                        ? 'bg-[#16a34a] text-white hover:bg-[#16a34a]/90'
                        : 'border border-[#1a3d2b] text-[#f5f0eb] hover:border-[#16a34a]/50'
                    }`}
                  >
                    <span className="relative z-10">{plan.cta}</span>
                    {plan.featured && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    )}
                  </button>
                  <p className="text-center text-gray-600 text-xs mt-3">{plan.finePrint}</p>
                </div>
              </StaggerChild>
            ))}
          </div>

          <p className="text-center text-gray-500 text-sm mt-10">
            All plans include: 14-day free trial on paid plans · SSL encryption · Cancel anytime · No setup fees
          </p>
          <p className="text-center text-gray-600 text-sm mt-2">
            Need a custom plan for a trading team or fund?{' '}
            <a href="mailto:support@edgeflow.io" className="text-[#16a34a] hover:underline">Contact us →</a>
          </p>
        </div>
      </Section>

      {/* ─── FAQ ─── */}
      <Section id="faq" className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-['Cormorant_Garamond',serif] font-bold text-[#f5f0eb] text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div>
            {faqData.map((faq, i) => (
              <FaqItem
                key={i}
                q={faq.q}
                a={faq.a}
                isOpen={openFaq === i}
                toggle={() => setOpenFaq(openFaq === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </Section>

      {/* ─── FINAL CTA ─── */}
      <Section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[#16a34a]/8 rounded-full blur-[100px] pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-['Cormorant_Garamond',serif] font-bold text-[#f5f0eb] mb-6">
              Your Next Losing Streak Is Preventable.
            </h2>
            <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
              Most traders keep repeating the same mistakes because they never look back systematically. 
              EdgeFlow makes sure you do — automatically, intelligently, effortlessly.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <button
                onClick={() => navigate('/auth')}
                className="relative px-8 py-3.5 rounded-full bg-[#16a34a] text-white font-medium overflow-hidden group"
              >
                <span className="relative z-10">Start Free Trial →</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              </button>
              <Button
                variant="ghost"
                className="text-gray-300 border border-[#1a3d2b] hover:border-[#16a34a]/40 hover:bg-transparent px-6 py-3 rounded-full"
              >
                Schedule a Demo
              </Button>
            </div>
            <p className="text-gray-600 text-sm">No credit card · 14-day free trial · Cancel anytime</p>
          </div>
        </div>
      </Section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-[#1a3d2b]/30 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-5 gap-10 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <img src={logoImg} alt="EdgeFlow" className="w-6 h-6" />
                <span className="text-[#f5f0eb] font-semibold">EdgeFlow</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed mb-4">
                The trading journal that works as hard as you do.
              </p>
              <div className="flex gap-3">
                {[Twitter, Linkedin, MessageCircle, Mail].map((Icon, i) => (
                  <a key={i} href="#" className="w-9 h-9 rounded-full border border-[#1a3d2b]/60 flex items-center justify-center text-gray-500 hover:text-[#16a34a] hover:border-[#16a34a]/40 transition-colors">
                    <Icon className="w-4 h-4" />
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
                <h4 className="text-[#f5f0eb] font-medium text-sm mb-4">{col.title}</h4>
                <div className="space-y-2.5">
                  {col.links.map((link) => (
                    <a key={link} href="#" className="block text-gray-500 text-sm hover:text-gray-300 transition-colors">{link}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-[#1a3d2b]/30 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-600 text-xs">© 2026 EdgeFlow. All rights reserved.</p>
            <div className="flex gap-6 text-xs text-gray-600">
              <a href="#" className="hover:text-gray-400">Privacy Policy</a>
              <a href="#" className="hover:text-gray-400">Terms of Service</a>
              <a href="#" className="hover:text-gray-400">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ══════════════════════════════════════════
   SOCIAL PROOF BAR
   ══════════════════════════════════════════ */
function SocialProofBar() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const stats = [
    { label: 'Trades Analyzed Daily', value: 'Thousands' },
    { label: 'Loved by traders worldwide', value: '⭐' },
    { label: 'AI Advisor', value: '24/7' },
    { label: 'Track and improve your win rate', value: '📈' },
  ];

  return (
    <div ref={ref} className="py-12 px-6 bg-[#0d1a12]/60 border-y border-[#1a3d2b]/30">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 * i }}
          >
            <p className="text-2xl md:text-3xl font-bold text-[#22c55e] mb-1">{s.value}</p>
            <p className="text-gray-500 text-sm">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
