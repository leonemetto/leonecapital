import { useNavigate, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { FlickeringGrid } from '@/components/ui/flickering-grid';
import logoImg from '@/assets/logo.svg';
import {
  BarChart3, Brain, ShieldCheck, Target, TrendingUp, Zap,
  ArrowRight, CheckCircle2, ChevronDown, Sparkles, LineChart,
  Wallet, BookOpen, Activity,
} from 'lucide-react';

const features = [
  {
    icon: BarChart3,
    title: 'Advanced Analytics Dashboard',
    desc: 'Equity curves, win/loss breakdowns, R-multiple tracking, and session-by-session performance — all in real time.',
  },
  {
    icon: Brain,
    title: 'AI-Powered Trade Advisor',
    desc: 'Get personalized insights from an AI that learns your trading patterns, detects leaks, and suggests improvements.',
  },
  {
    icon: Target,
    title: 'Leak Detection Engine',
    desc: 'Automatically surfaces your worst-performing setups, sessions, and emotional states so you can eliminate them.',
  },
  {
    icon: TrendingUp,
    title: 'What-If Simulations',
    desc: 'Model scenarios like "What if I only traded London session?" to quantify the impact before making changes.',
  },
  {
    icon: ShieldCheck,
    title: 'Pre-Trade Checklist',
    desc: 'Customizable entry criteria checklist to enforce discipline and ensure every trade meets your plan.',
  },
  {
    icon: Wallet,
    title: 'Multi-Account Management',
    desc: 'Track live and demo accounts separately with independent balances, currencies, and performance metrics.',
  },
];

const stats = [
  { value: '10,000+', label: 'Trades Logged' },
  { value: '4.9★', label: 'User Rating' },
  { value: '24/7', label: 'AI Advisor' },
  { value: '100%', label: 'Free Demo' },
];

const faqs = [
  {
    q: 'What is the best trading journal?',
    a: 'EdgeFlow is a top-rated professional trading journal combining AI analytics, leak detection, strategy optimization, and multi-account management for traders of all levels.',
  },
  {
    q: 'Is EdgeFlow free to use?',
    a: 'Yes — EdgeFlow offers a free demo account pre-loaded with 25 sample trades so you can explore every feature before logging your own trades.',
  },
  {
    q: 'What markets does EdgeFlow support?',
    a: 'EdgeFlow supports forex, stocks, crypto, futures, options, and commodities. Track trades across multiple accounts and asset classes in one place.',
  },
  {
    q: 'How does the AI trading advisor work?',
    a: 'The AI analyzes your complete trade history to identify patterns, detect performance leaks, and deliver personalized recommendations to improve win rate and risk management.',
  },
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
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Background */}
      <FlickeringGrid
        className="pointer-events-none fixed inset-0 z-0 [mask-image:radial-gradient(ellipse_at_center,transparent_10%,black)]"
        squareSize={4}
        gridGap={6}
        color="hsl(142, 69%, 55%)"
        maxOpacity={0.15}
        flickerChance={0.3}
      />

      {/* Nav */}
      <header className="relative z-20 w-full border-b border-border/40 backdrop-blur-md bg-background/60 sticky top-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="EdgeFlow Logo" className="h-8 w-8 rounded-xl" />
            <span className="text-lg font-black tracking-tight">EDGEFLOW</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
              Sign In
            </Button>
            <Button size="sm" onClick={() => navigate('/auth')} className="gap-1.5">
              Get Started <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 pt-20 pb-24 sm:pt-28 sm:pb-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Trading Intelligence
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] mb-6 max-w-4xl mx-auto">
            The <span className="text-primary">Trading Journal</span> That Actually{' '}
            <span className="text-primary">Improves</span> Your Performance
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Log trades, detect leaks, and get AI-powered insights that turn your data into a winning edge. 
            Trusted by forex, stock, crypto, and futures traders worldwide.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button size="lg" onClick={() => navigate('/auth')} className="gap-2 text-base px-8 h-12">
              Start Free — No Card Required <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => {
              document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
            }} className="gap-2 text-base px-8 h-12">
              See Features <ChevronDown className="h-4 w-4" />
            </Button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl mx-auto">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-black text-primary">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section id="features" className="relative z-10 py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase mb-3">Everything You Need</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
              Professional-Grade Trading Analytics
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Built for traders who are serious about finding their edge and eliminating costly mistakes.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <article
                key={f.title}
                className="group rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm p-6 hover:border-primary/30 hover:bg-card/80 transition-all duration-300"
              >
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 py-20 sm:py-28 border-t border-border/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase mb-3">Simple Process</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
              How EdgeFlow Works
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '01', icon: BookOpen, title: 'Log Your Trades', desc: 'Enter trade details including instrument, direction, P&L, strategy, session, and emotional state.' },
              { step: '02', icon: LineChart, title: 'Analyze Performance', desc: 'Instantly see equity curves, win rates, R-multiples, and leak detection across all your accounts.' },
              { step: '03', icon: Activity, title: 'Get AI Insights', desc: 'Your AI advisor identifies patterns and delivers actionable recommendations to improve your edge.' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="text-5xl font-black text-primary/15 mb-3">{s.step}</div>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <s.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-base font-bold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="relative z-10 py-20 sm:py-28 border-t border-border/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase mb-3">Trusted by Traders</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
              What Traders Are Saying
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { quote: 'EdgeFlow helped me identify that my Friday trades were bleeding my account. Cut them and my win rate jumped 12%.', name: 'Alex M.', role: 'Forex Trader' },
              { quote: 'The AI advisor is like having a mentor who actually knows my trading data. Game-changer for accountability.', name: 'Sarah K.', role: 'Crypto Trader' },
              { quote: 'Best trading journal I\'ve used. The What-If simulations alone saved me thousands in potential losses.', name: 'James R.', role: 'Futures Trader' },
            ].map((t) => (
              <div key={t.name} className="rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm p-6">
                <p className="text-sm text-muted-foreground italic mb-4">"{t.quote}"</p>
                <div>
                  <p className="text-sm font-bold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative z-10 py-20 sm:py-28 border-t border-border/40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase mb-3">FAQ</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Frequently Asked Questions
            </h2>
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

      {/* CTA */}
      <section className="relative z-10 py-20 sm:py-28 border-t border-border/40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
            Ready to Find Your Edge?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join traders who use EdgeFlow to track, analyze, and improve their performance every single day.
          </p>
          <Button size="lg" onClick={() => navigate('/auth')} className="gap-2 text-base px-10 h-12">
            Start Trading Smarter <ArrowRight className="h-4 w-4" />
          </Button>
          <p className="text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            Free demo account included — no credit card required
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/40 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
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
