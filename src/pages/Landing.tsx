import { useNavigate, Navigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  BarChart3,
  BookOpen,
  Target,
  LineChart,
  PieChart,
  ArrowRight,
  CheckCircle2,
  Zap,
  Shield,
  Users,
  Menu,
  X,
  Twitter,
  Linkedin,
  Github,
  Mail,
  Brain,
  Wallet,
  Activity,
  Sparkles,
} from 'lucide-react';
import logoImg from '@/assets/logo.svg';

/* ── Sub-components ── */

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, delay = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm p-6 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10">
        <div className="mb-4 inline-flex items-center justify-center rounded-xl bg-primary/10 p-2.5 group-hover:bg-primary/20 transition-colors">
          {icon}
        </div>
        <h3 className="mb-2 text-lg font-semibold">{title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </motion.div>
  );
};

interface StatCardProps {
  value: string;
  label: string;
  delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({ value, label, delay = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, delay }}
      className="text-center"
    >
      <p className="text-3xl font-bold sm:text-4xl">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </motion.div>
  );
};

const Navbar: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setIsOpen(false);
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'border-b border-border/40 bg-background/80 backdrop-blur-xl shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={logoImg} alt="EdgeFlow Logo" className="h-8 w-8 rounded-xl" />
            <span className="text-lg font-bold tracking-tight">EdgeFlow</span>
          </div>

          <div className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <button onClick={() => scrollTo('features')} className="hover:text-foreground transition-colors">Features</button>
            <button onClick={() => scrollTo('how-it-works')} className="hover:text-foreground transition-colors">How It Works</button>
            <button onClick={() => scrollTo('testimonials')} className="hover:text-foreground transition-colors">Testimonials</button>
            <button onClick={() => scrollTo('faq')} className="hover:text-foreground transition-colors">FAQ</button>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Button variant="ghost" onClick={() => onNavigate('/auth')}>Sign In</Button>
            <Button onClick={() => onNavigate('/auth')}>
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-foreground">
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="border-t border-border/40 py-4 md:hidden"
          >
            <div className="flex flex-col gap-3">
              <button onClick={() => scrollTo('features')} className="text-sm text-muted-foreground hover:text-foreground text-left">Features</button>
              <button onClick={() => scrollTo('how-it-works')} className="text-sm text-muted-foreground hover:text-foreground text-left">How It Works</button>
              <button onClick={() => scrollTo('testimonials')} className="text-sm text-muted-foreground hover:text-foreground text-left">Testimonials</button>
              <button onClick={() => scrollTo('faq')} className="text-sm text-muted-foreground hover:text-foreground text-left">FAQ</button>
              <div className="flex gap-2 pt-2">
                <Button variant="ghost" className="flex-1" onClick={() => onNavigate('/auth')}>Sign In</Button>
                <Button className="flex-1" onClick={() => onNavigate('/auth')}>Get Started</Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
};

const Footer: React.FC = () => (
  <footer className="border-t border-border/40 bg-card/30">
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-8">
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="mb-4 flex items-center gap-2.5">
            <img src={logoImg} alt="EdgeFlow" className="h-8 w-8 rounded-xl" />
            <span className="text-lg font-bold">EdgeFlow</span>
          </div>
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
            The ultimate AI-powered trading journal to track, analyze, and improve your trading performance.
          </p>
          <div className="flex gap-3">
            {[Twitter, Linkedin, Github, Mail].map((Icon, i) => (
              <a key={i} href="#" className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                <Icon className="h-4 w-4" />
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
            <h4 className="mb-3 text-sm font-semibold">{col.title}</h4>
            <ul className="space-y-2">
              {col.links.map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{link}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border/40 pt-8 sm:flex-row">
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} EdgeFlow. All rights reserved.</p>
        <div className="flex gap-6 text-xs text-muted-foreground">
          <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
        </div>
      </div>
    </div>
  </footer>
);

/* ── Data ── */

const features = [
  { icon: <BarChart3 className="h-5 w-5 text-primary" />, title: 'Advanced Analytics Dashboard', description: 'Equity curves, win/loss breakdowns, R-multiple tracking, and session-by-session performance — all in real time.' },
  { icon: <Brain className="h-5 w-5 text-primary" />, title: 'AI-Powered Trade Advisor', description: 'Get personalized insights from an AI that learns your trading patterns, detects leaks, and suggests improvements.' },
  { icon: <Target className="h-5 w-5 text-primary" />, title: 'Leak Detection Engine', description: 'Automatically surfaces your worst-performing setups, sessions, and emotional states so you can eliminate them.' },
  { icon: <TrendingUp className="h-5 w-5 text-primary" />, title: 'What-If Simulations', description: 'Model scenarios like "What if I only traded London session?" to quantify the impact before making changes.' },
  { icon: <Shield className="h-5 w-5 text-primary" />, title: 'Pre-Trade Checklist', description: 'Customizable entry criteria checklist to enforce discipline and ensure every trade meets your plan.' },
  { icon: <Wallet className="h-5 w-5 text-primary" />, title: 'Multi-Account Management', description: 'Track live and demo accounts separately with independent balances, currencies, and performance metrics.' },
];

const benefits = [
  'Improve trading discipline',
  'Identify winning patterns',
  'Track emotional states',
  'Analyze risk management',
  'Review past mistakes',
  'Celebrate successes',
];

const faqs = [
  { q: 'What is the best trading journal?', a: 'EdgeFlow is a top-rated professional trading journal combining AI analytics, leak detection, strategy optimization, and multi-account management for traders of all levels.' },
  { q: 'Is EdgeFlow free to use?', a: 'Yes — EdgeFlow offers a free demo account pre-loaded with 25 sample trades so you can explore every feature before logging your own trades.' },
  { q: 'What markets does EdgeFlow support?', a: 'EdgeFlow supports forex, stocks, crypto, futures, options, and commodities. Track trades across multiple accounts and asset classes in one place.' },
  { q: 'How does the AI trading advisor work?', a: 'The AI analyzes your complete trade history to identify patterns, detect performance leaks, and deliver personalized recommendations to improve win rate and risk management.' },
];

const screenshots = [
  { title: 'Dashboard Overview', description: 'Track your performance at a glance', gradient: 'from-primary/60 to-primary/20' },
  { title: 'Trade Journal', description: 'Document every trade with detailed notes', gradient: 'from-primary/40 to-accent/60' },
  { title: 'Analytics & Reports', description: 'Deep insights into your trading patterns', gradient: 'from-accent/60 to-primary/30' },
  { title: 'Performance Metrics', description: 'Monitor your progress over time', gradient: 'from-primary/50 to-primary/10' },
];

/* ── Main Component ── */

export default function Landing() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const imageRef = useRef<HTMLDivElement>(null);
  const imageInView = useInView(imageRef, { margin: '-200px' });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
  }, []);

  useEffect(() => {
    if (imageInView) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % screenshots.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [imageInView]);

  if (isLoggedIn === null) return null;
  if (isLoggedIn) return <Navigate to="/dashboard" replace />;

  return (
    <div ref={containerRef} className="min-h-screen bg-background text-foreground overflow-x-hidden font-sans">
      <Navbar onNavigate={navigate} />

      {/* Subtle background grid */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]" style={{
        backgroundImage: 'radial-gradient(hsl(var(--primary)) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }} />

      {/* ── Hero ── */}
      <motion.section style={{ opacity: heroOpacity, scale: heroScale }} className="relative z-10 pt-28 pb-20 sm:pt-36 sm:pb-28">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/5 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary"
            >
              <Sparkles className="h-3.5 w-3.5" />
              AI-Powered Trading Intelligence
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
            >
              This Isn't a Journal.{' '}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                It's Your Personal Analyst.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground"
            >
              Stop trading on emotion. Your AI analyst builds systematic confidence in every decision you make.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap items-center justify-center gap-4"
            >
              <Button size="lg" onClick={() => navigate('/auth')} className="px-8 shadow-lg shadow-primary/20">
                Start Free Trial <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate('/auth')}>
                <Zap className="h-4 w-4" /> Guide Tour
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground"
            >
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> No credit card required</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> 14-day free trial</span>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* ── Stats ── */}
      <section className="relative z-10 border-y border-border/40 bg-card/30 py-16">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 px-4 sm:grid-cols-4 sm:px-8">
          <StatCard value="10,000+" label="Trades Logged" delay={0} />
          <StatCard value="4.9★" label="User Rating" delay={0.1} />
          <StatCard value="24/7" label="AI Advisor" delay={0.2} />
          <StatCard value="100%" label="Free Demo" delay={0.3} />
        </div>
      </section>

      {/* ── Screenshot Carousel ── */}
      <section className="relative z-10 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="mb-12 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">Platform Preview</p>
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">Powerful Interface, Simple Experience</h2>
            <p className="mx-auto max-w-xl text-muted-foreground">Explore our intuitive platform designed for traders of all levels</p>
          </div>

          <div ref={imageRef} className="relative">
            <div className="flex gap-6 overflow-hidden">
              {screenshots.map((screenshot, index) => (
                <motion.div
                  key={index}
                  animate={{
                    scale: currentImageIndex === index ? 1 : 0.9,
                    opacity: currentImageIndex === index ? 1 : 0.4,
                  }}
                  transition={{ duration: 0.5 }}
                  className={`min-w-full rounded-2xl border border-border/60 bg-gradient-to-br ${screenshot.gradient} p-8 ${
                    currentImageIndex === index ? '' : 'hidden'
                  }`}
                >
                  <div className="mb-6 rounded-xl bg-background/60 backdrop-blur-sm p-4">
                    <h3 className="text-lg font-semibold">{screenshot.title}</h3>
                    <p className="text-sm text-muted-foreground">{screenshot.description}</p>
                  </div>
                  {/* Mock UI */}
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="h-3 w-1/3 rounded-full bg-foreground/10" />
                      <div className="h-3 w-1/4 rounded-full bg-foreground/10" />
                      <div className="h-3 w-1/5 rounded-full bg-foreground/10" />
                    </div>
                    <div className="h-32 rounded-xl bg-foreground/5" />
                    <div className="flex gap-3">
                      <div className="h-20 flex-1 rounded-xl bg-foreground/5" />
                      <div className="h-20 flex-1 rounded-xl bg-foreground/5" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-6 flex justify-center gap-2">
              {screenshots.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    currentImageIndex === index ? 'w-8 bg-primary' : 'w-2 bg-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="relative z-10 border-t border-border/40 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="mb-16 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">Everything You Need</p>
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">Professional-Grade Trading Analytics</h2>
            <p className="mx-auto max-w-xl text-muted-foreground">
              Built for traders who are serious about finding their edge and eliminating costly mistakes.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <FeatureCard key={feature.title} {...feature} delay={index * 0.08} />
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="relative z-10 border-t border-border/40 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="mb-16 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">Simple Process</p>
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">How EdgeFlow Works</h2>
          </div>
          <div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-3">
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
                <div className="mb-3 text-5xl font-bold text-primary/15">{s.step}</div>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <s.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-base font-bold">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits ── */}
      <section className="relative z-10 border-t border-border/40 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">Why Traders Love Us</p>
              <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">Why Traders Love Our Platform</h2>
              <p className="mb-8 max-w-lg text-muted-foreground">
                Join thousands of successful traders who have transformed their trading journey with our comprehensive journaling solution.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.08 }}
                    className="flex items-center gap-3"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-sm">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm p-8">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: TrendingUp, label: 'Win Rate', value: '68%' },
                    { icon: BarChart3, label: 'Avg R', value: '2.4R' },
                    { icon: PieChart, label: 'Best Session', value: 'London' },
                    { icon: Users, label: 'Active Users', value: '5K+' },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="rounded-xl bg-background/60 p-4 text-center">
                      <Icon className="mx-auto mb-2 h-5 w-5 text-primary" />
                      <p className="text-lg font-bold">{value}</p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="relative z-10 border-t border-border/40 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="mb-16 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">Trusted by Traders</p>
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">What Traders Are Saying</h2>
          </div>
          <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-3">
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
                <p className="mb-4 text-sm italic text-muted-foreground">"{t.quote}"</p>
                <p className="text-sm font-bold">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="relative z-10 border-t border-border/40 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-8">
          <div className="mb-12 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">FAQ</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <details key={faq.q} className="group rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between p-5 text-sm font-semibold">
                  {faq.q}
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" />
                </summary>
                <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-10 border-t border-border/40 py-20 sm:py-28">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-8">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">Ready to Transform Your Trading?</h2>
          <p className="mx-auto mb-8 max-w-xl text-muted-foreground">
            Start your free trial today and join thousands of successful traders.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" onClick={() => navigate('/auth')} className="px-8 shadow-lg shadow-primary/20">
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/auth')}>Schedule a Demo</Button>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
