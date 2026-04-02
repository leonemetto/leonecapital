import { useNavigate, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import {
  ShieldCheck, ArrowUpRight, ArrowRight, LogIn, UserPlus,
  BarChart3, Brain, Target, TrendingUp, Wallet, Zap,
  BookOpen, LineChart, Activity, CheckCircle2, ChevronDown, Sparkles,
} from 'lucide-react';
import logoImg from '@/assets/logo.svg';

/* ── tiny helpers ── */
const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="text-center">
    <p className="text-2xl sm:text-3xl font-bold text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground mt-1">{label}</p>
  </div>
);

const SoftButton = ({
  children,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }) => (
  <button
    className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all duration-200 ${className}`}
    {...props}
  >
    {children}
  </button>
);

function MiniBars() {
  return (
    <svg viewBox="0 0 120 100" className="w-full h-full">
      {[18, 48, 72, 96].map((h, i) => (
        <motion.rect
          key={i}
          x={i * 30 + 4}
          y={100 - h}
          width={20}
          rx={6}
          height={h}
          className="fill-primary/80"
          initial={{ height: 0, y: 100 }}
          animate={{ height: h, y: 100 - h }}
          transition={{ delay: 0.3 + i * 0.15, duration: 0.6, ease: 'easeOut' }}
        />
      ))}
    </svg>
  );
}

function Planet() {
  return (
    <motion.svg
      viewBox="0 0 200 200"
      className="w-full h-full"
      initial={{ rotate: -20 }}
      animate={{ rotate: 0 }}
      transition={{ duration: 1.4, ease: 'easeOut' }}
    >
      <defs>
        <linearGradient id="pg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.9} />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="70" fill="url(#pg)" />
      <ellipse cx="100" cy="100" rx="95" ry="22" fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity={0.35} />
      <ellipse cx="100" cy="100" rx="95" ry="22" fill="none" stroke="hsl(var(--primary))" strokeWidth="1" opacity={0.2} transform="rotate(30 100 100)" />
      <ellipse cx="100" cy="100" rx="95" ry="22" fill="none" stroke="hsl(var(--primary))" strokeWidth="1" opacity={0.15} transform="rotate(60 100 100)" />
      <circle cx="140" cy="65" r="5" fill="hsl(var(--primary))" opacity={0.6} />
    </motion.svg>
  );
}

const features = [
  { icon: BarChart3, title: 'Advanced Analytics Dashboard', desc: 'Equity curves, win/loss breakdowns, R-multiple tracking, and session-by-session performance — all in real time.' },
  { icon: Brain, title: 'AI-Powered Trade Advisor', desc: 'Get personalized insights from an AI that learns your trading patterns, detects leaks, and suggests improvements.' },
  { icon: Target, title: 'Leak Detection Engine', desc: 'Automatically surfaces your worst-performing setups, sessions, and emotional states so you can eliminate them.' },
  { icon: TrendingUp, title: 'What-If Simulations', desc: 'Model scenarios like "What if I only traded London session?" to quantify the impact before making changes.' },
  { icon: ShieldCheck, title: 'Pre-Trade Checklist', desc: 'Customizable entry criteria checklist to enforce discipline and ensure every trade meets your plan.' },
  { icon: Wallet, title: 'Multi-Account Management', desc: 'Track live and demo accounts separately with independent balances, currencies, and performance metrics.' },
];

const faqs = [
  { q: 'What is the best trading journal?', a: 'EdgeFlow is a top-rated professional trading journal combining AI analytics, leak detection, strategy optimization, and multi-account management for traders of all levels.' },
  { q: 'Is EdgeFlow free to use?', a: 'Yes — EdgeFlow offers a free demo account pre-loaded with 25 sample trades so you can explore every feature before logging your own trades.' },
  { q: 'What markets does EdgeFlow support?', a: 'EdgeFlow supports forex, stocks, crypto, futures, options, and commodities. Track trades across multiple accounts and asset classes in one place.' },
  { q: 'How does the AI trading advisor work?', a: 'The AI analyzes your complete trade history to identify patterns, detect performance leaks, and deliver personalized recommendations to improve win rate and risk management.' },
];

export default function Landing() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
  }, []);

  if (isLoggedIn === null) return null;
  if (isLoggedIn) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden font-sans">

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 border-b border-border/40 backdrop-blur-xl bg-background/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={logoImg} alt="EdgeFlow Logo" className="h-8 w-8 rounded-xl" />
            <span className="text-lg font-bold tracking-tight">edgeflow</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            {['Features', 'How It Works', 'FAQ'].map((item) => (
              <button
                key={item}
                onClick={() =>
                  document
                    .getElementById(item.toLowerCase().replace(/\s+/g, '-'))
                    ?.scrollIntoView({ behavior: 'smooth' })
                }
                className="hover:text-foreground transition-colors"
              >
                {item}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <SoftButton
              onClick={() => navigate('/auth')}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogIn className="h-4 w-4" /> Login
            </SoftButton>
            <SoftButton
              onClick={() => navigate('/auth')}
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
            >
              <UserPlus className="h-4 w-4" /> Sign Up
            </SoftButton>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative z-10 pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 grid lg:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              AI-Powered Trading Intelligence
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-bold tracking-tight leading-[1.1] mb-6">
              Track your trades{' '}
              <span className="text-primary">with precision.</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-lg mb-8 leading-relaxed">
              Join thousands of traders who use EdgeFlow to log trades, detect leaks, and get AI-powered insights that turn data into a winning edge.
            </p>

            <div className="flex flex-wrap items-center gap-4 mb-10">
              <SoftButton
                onClick={() => navigate('/auth')}
                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 px-8 py-3.5 text-base"
              >
                Open Account <ArrowUpRight className="h-4 w-4" />
              </SoftButton>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <Stat value="10,000+" label="Trades Logged" />
              <Stat value="4.9★" label="User Rating" />
              <Stat value="24/7" label="AI Advisor" />
              <Stat value="100%" label="Free Demo" />
            </div>

            <div className="mt-10">
              <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-3">
                Trusted by traders worldwide
              </p>
              <div className="flex items-center gap-6 text-muted-foreground/50 text-sm font-semibold">
                <span>Forex</span>
                <span>Crypto</span>
                <span>Futures</span>
                <span>Stocks</span>
              </div>
            </div>
          </motion.div>

          {/* Right — animated card grid */}
          <motion.div
            className="relative grid grid-cols-2 gap-4 lg:gap-5"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Secure card */}
            <motion.div
              className="col-span-1 rounded-3xl border border-border/60 bg-card/80 backdrop-blur-sm p-5 flex flex-col gap-3"
              whileHover={{ y: -4 }}
              transition={{ duration: 0.25 }}
            >
              <div className="w-full aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <ShieldCheck className="h-12 w-12 text-primary/60" />
                </div>
                <div className="absolute bottom-2 left-2 right-2 grid grid-cols-4 gap-1">
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="h-1.5 rounded-full bg-primary/20"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.5 + i * 0.05 }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <ShieldCheck className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-xs font-semibold">Extra Secure</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Your data is encrypted and protected end-to-end
                </p>
              </div>
            </motion.div>

            {/* Currencies / Markets card */}
            <motion.div
              className="col-span-1 rounded-3xl border border-border/60 bg-card/80 backdrop-blur-sm p-5 flex flex-col gap-3"
              whileHover={{ y: -4 }}
              transition={{ duration: 0.25 }}
            >
              <div className="w-full aspect-square rounded-2xl bg-gradient-to-br from-primary/10 to-transparent flex items-center justify-center">
                <Planet />
              </div>
              <h3 className="text-sm font-semibold">All Markets</h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Forex, crypto, stocks & futures in one journal
              </p>
            </motion.div>

            {/* Growth card */}
            <motion.div
              className="col-span-2 rounded-3xl border border-border/60 bg-card/80 backdrop-blur-sm p-5 flex items-center gap-6"
              whileHover={{ y: -4 }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Growth Revenue</p>
                <p className="text-xl font-bold">$50,240 <span className="text-xs font-normal text-muted-foreground">USD</span></p>
                <p className="text-xs text-primary font-medium mt-1">↑ 12.4%</p>
              </div>
              <div className="w-28 h-20">
                <MiniBars />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="relative z-10 py-20 sm:py-28 border-t border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase mb-3">Everything You Need</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Professional-Grade Trading Analytics
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Built for traders who are serious about finding their edge and eliminating costly mistakes.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.article
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="group rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm p-6 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
              >
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="relative z-10 py-20 sm:py-28 border-t border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase mb-3">Simple Process</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              How EdgeFlow Works
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '01', icon: BookOpen, title: 'Log Your Trades', desc: 'Enter trade details including instrument, direction, P&L, strategy, session, and emotional state.' },
              { step: '02', icon: LineChart, title: 'Analyze Performance', desc: 'Instantly see equity curves, win rates, R-multiples, and leak detection across all your accounts.' },
              { step: '03', icon: Activity, title: 'Get AI Insights', desc: 'Your AI advisor identifies patterns and delivers actionable recommendations to improve your edge.' },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
              >
                <div className="text-5xl font-bold text-primary/15 mb-3">{s.step}</div>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <s.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-base font-bold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="relative z-10 py-20 sm:py-28 border-t border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase mb-3">Trusted by Traders</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">What Traders Are Saying</h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { quote: 'EdgeFlow helped me identify that my Friday trades were bleeding my account. Cut them and my win rate jumped 12%.', name: 'Alex M.', role: 'Forex Trader' },
              { quote: 'The AI advisor is like having a mentor who actually knows my trading data. Game-changer for accountability.', name: 'Sarah K.', role: 'Crypto Trader' },
              { quote: "Best trading journal I've used. The What-If simulations alone saved me thousands in potential losses.", name: 'James R.', role: 'Futures Trader' },
            ].map((t, i) => (
              <motion.div
                key={t.name}
                className="rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm p-6"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <p className="text-sm text-muted-foreground italic mb-4">"{t.quote}"</p>
                <p className="text-sm font-bold">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="relative z-10 py-20 sm:py-28 border-t border-border/40">
        <div className="max-w-3xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase mb-3">FAQ</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <details key={faq.q} className="group rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm">
                <summary className="flex items-center justify-between cursor-pointer p-5 text-sm font-semibold list-none">
                  {faq.q}
                  <ChevronDown className="h-4 w-4 text-muted-foreground group-open:rotate-180 transition-transform" />
                </summary>
                <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-10 py-20 sm:py-28 border-t border-border/40">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Ready to Find Your Edge?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join traders who use EdgeFlow to track, analyze, and improve their performance every single day.
          </p>
          <SoftButton
            onClick={() => navigate('/auth')}
            className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 px-10 py-3.5 text-base"
          >
            Start Trading Smarter <ArrowRight className="h-4 w-4" />
          </SoftButton>
          <p className="text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            Free demo account included — no credit card required
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-border/40 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="EdgeFlow" className="h-6 w-6 rounded-lg" />
            <span className="text-sm font-bold">EdgeFlow</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} EdgeFlow. Professional trading journal & analytics platform.
          </p>
        </div>
      </footer>
    </div>
  );
}
