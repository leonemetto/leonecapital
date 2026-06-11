import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Reveal, Stagger, item, SlidePair } from '@/components/ui/Reveal';
import './landing.css';

const featuredTestimonial = {
  quote: 'Before I started journaling my trades, I’d just keep running through accounts blowing them one by one. Since I started using EdgeFlow, Atlas instantly noticed that I was over trading and would more often than not revenge trade when I’d take a loss. Once I stopped doing that, I got my first payout the following week and my second payout the week after my first one. EdgeFlow helped me transform as a trader.',
  name: 'Mark Murachia',
  role: 'Founder, MMT Trading',
};

const brokers = [
  { name: 'Exness', cat: 'CFD / FX' }, { name: 'XM', cat: 'CFD / FX' },
  { name: 'Pepperstone', cat: 'CFD / FX' }, { name: 'IC Markets', cat: 'CFD / FX' },
  { name: 'HFM', cat: 'CFD / FX' }, { name: 'FBS', cat: 'CFD / FX' },
  { name: 'Admirals', cat: 'CFD / FX' }, { name: 'Vantage', cat: 'CFD / FX' },
  { name: 'Deriv', cat: 'CFD / FX' }, { name: 'OANDA', cat: 'FX' },
  { name: 'IG Markets', cat: 'CFD' }, { name: 'FxPro', cat: 'CFD / FX' },
  { name: 'TradingView', cat: 'Multi-asset' }, { name: 'cTrader', cat: 'Platform' },
  { name: 'Binance', cat: 'Crypto' }, { name: 'Bybit', cat: 'Crypto' },
  { name: 'Interactive Brokers', cat: 'Multi-asset' }, { name: 'Thinkorswim', cat: 'US Markets' },
  { name: 'TradeStation', cat: 'US Markets' }, { name: 'NinjaTrader', cat: 'Futures' },
];

// Star field — generated once at module load, confined to hero sides
const HERO_STARS = Array.from({ length: 90 }, (_, i) => {
  const isLeft = i < 45;
  // Left side: 0–20%, right side: 80–100%, with a few reaching slightly inward
  const xRange = i % 7 === 0 ? 8 : (i % 5 === 0 ? 14 : 20);
  const x = isLeft ? Math.random() * xRange : 100 - Math.random() * xRange;
  const isBright = Math.random() > 0.72;
  return {
    x,
    y: Math.random() * 98,
    r: isBright ? Math.random() * 0.6 + 0.55 : Math.random() * 0.4 + 0.2,
    op: isBright ? Math.random() * 0.38 + 0.18 : Math.random() * 0.18 + 0.04,
    delay: Math.random() * 7,
    dur: 2.5 + Math.random() * 4,
    // slight blue tint on ~20% of stars
    blue: Math.random() > 0.8,
  };
});

const navSections = [
  { key: 'how',      id: 'how',     label: 'How it works', href: '#how' },
  { key: 'features', id: 'preview', label: 'Features',     href: '#preview' },
  { key: 'brokers',  id: 'brokers', label: 'Brokers',      href: '#brokers' },
  { key: 'pricing',  id: 'pricing', label: 'Pricing',      href: '#pricing' },
  { key: 'faq',      id: 'faq',     label: 'FAQ',          href: '#faq' },
];

const tabScreenshots = [
  '/app-screenshot.webp',
  '/screenshot-analytic.webp',
  '/screenshot-ai.webp',
  '/screenshot-leaks.webp',
  '/screenshot-optimizer.webp',
];
const tabPaths = ['dashboard', 'analyst', 'ai', 'leak-detection', 'what-if'];
const tabLabels = ['Dashboard', 'Analytics', 'Atlas', 'Leak Detection', 'Optimizer'];

const faqs = [
  {
    q: 'How is this better than my Excel spreadsheet?',
    a: 'Excel shows you what happened. EdgeFlow shows you why, and what to do about it. It automatically segments your results by session, instrument, strategy, and direction — then flags the exact patterns draining your account. That analysis takes hours to build manually and has to be rebuilt every month. EdgeFlow does it in real time.',
  },
  {
    q: 'Does EdgeFlow work for prop firm challenges?',
    a: "Yes. EdgeFlow lets you track prop firm accounts, daily loss limits, maximum drawdown, profit targets, and account progress from the same journal you use for trade review.",
  },
  {
    q: 'Can I import my existing trade history?',
    a: 'Yes — EdgeFlow supports direct CSV import from MT4/MT5, TradingView, cTrader, Deriv, Binance, Bybit, OANDA, IG Markets, Interactive Brokers, TradeStation, Thinkorswim, NinjaTrader, and any generic CSV. Your historical data loads immediately and appears in all analytics from day one.',
  },
  {
    q: 'Is my trading data secure and private?',
    a: 'Your data is encrypted at rest and in transit, stored on SOC 2 compliant infrastructure (Supabase). Row-level security ensures no other user can ever access your trades. We never share, sell, or use your data for any purpose other than providing your analytics.',
  },
  {
    q: 'How does the Atlas AI work?',
    a: 'Atlas is powered by Claude (Anthropic) and has full context of your last 50 trades, win rates, P&L breakdown, session analytics, and behavioural patterns. Ask it anything about your trading — it gives direct, data-backed answers with no filler. Available on Pro after 10 logged trades.',
  },
  {
    q: 'Can I cancel my subscription at any time?',
    a: 'Yes — no contracts, no cancellation fees. Cancel anytime and retain Pro access until the end of your billing period. Your trade data is always yours to export as CSV at any time.',
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [previewImg, setPreviewImg] = useState(tabScreenshots[0]);
  const [previewUrl, setPreviewUrl] = useState('edgeflow.capital/dashboard');
  const [imgOpacity, setImgOpacity] = useState(1);
  const [openFaq, setOpenFaq] = useState<number>(0);
  const [annualBilling, setAnnualBilling] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('features');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navPillRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const firstMount = useRef(true);

  function switchTab(i: number) {
    setActiveTab(i);
    setImgOpacity(0);
    setTimeout(() => {
      setPreviewImg(tabScreenshots[i]);
      setPreviewUrl('edgeflow.capital/' + tabPaths[i]);
      setImgOpacity(1);
    }, 100);
  }

  function toggleFaq(i: number) {
    setOpenFaq(prev => (prev === i ? -1 : i));
  }

  // Cached link positions keyed by section key — measured once on mount and on resize.
  // Avoids getBoundingClientRect() during scroll, which forces layout and tanks Chrome scroll perf.
  const linkRectsRef = useRef<Record<string, { left: number; width: number }>>({});
  const sectionOffsetsRef = useRef<Array<{ key: string; top: number }>>([]);

  const measureLinks = () => {
    const pill = navPillRef.current;
    if (!pill) return;
    const pr = pill.getBoundingClientRect();
    const next: Record<string, { left: number; width: number }> = {};
    pill.querySelectorAll<HTMLAnchorElement>('a[data-key]').forEach(a => {
      const key = a.dataset.key!;
      const r = a.getBoundingClientRect();
      next[key] = { left: r.left - pr.left, width: r.width };
    });
    linkRectsRef.current = next;
  };

  const measureSections = () => {
    const scrollY = window.scrollY;
    sectionOffsetsRef.current = navSections
      .map(({ id, key }) => {
        const el = document.getElementById(id);
        return el ? { key, top: el.getBoundingClientRect().top + scrollY } : null;
      })
      .filter((x): x is { key: string; top: number } => x !== null);
  };

  const applyIndicator = (key: string, animated: boolean) => {
    const indicator = indicatorRef.current;
    const rect = linkRectsRef.current[key];
    if (!indicator || !rect) return;
    if (!animated) {
      indicator.style.transition = 'none';
      indicator.style.left = `${rect.left}px`;
      indicator.style.width = `${rect.width}px`;
      requestAnimationFrame(() => {
        if (indicatorRef.current) indicatorRef.current.style.transition = '';
      });
    } else {
      indicator.style.left = `${rect.left}px`;
      indicator.style.width = `${rect.width}px`;
    }
  };

  useLayoutEffect(() => {
    measureLinks();
    measureSections();
    applyIndicator(activeSection, false);
    firstMount.current = false;
    // Intentionally only run on mount; subsequent re-measures handled by resize listener.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    if (firstMount.current) return;
    applyIndicator(activeSection, true);
  }, [activeSection]);

  useEffect(() => {
    const onResize = () => {
      measureLinks();
      measureSections();
      applyIndicator(activeSection, false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [activeSection]);

  // Scroll spy — cheap scrollY comparison, rAF-throttled, zero layout reads per frame.
  useEffect(() => {
    let raf = 0;
    let pendingKey: string | null = null;
    const offset = window.innerHeight * 0.35; // active when section top crosses 35% of viewport

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const sections = sectionOffsetsRef.current;
        if (!sections.length) return;
        const y = window.scrollY + offset;
        let current = sections[0].key;
        for (const s of sections) {
          if (s.top <= y) current = s.key;
          else break;
        }
        if (current !== pendingKey) {
          pendingKey = current;
          setActiveSection(current);
        }
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const proPrice = annualBilling ? '$15.83' : '$19';
  const proLabel = annualBilling ? 'per month · $190 billed annually' : 'per month · cancel anytime';

  return (
    <>
      <Helmet>
        <title>EdgeFlow — Professional Trading Journal | Track, Analyze & Improve</title>
        <meta name="description" content="EdgeFlow is a professional trading journal for serious traders. Start a 14-day Pro trial, log trades, detect performance leaks, and get AI-powered insights." />
        <link rel="canonical" href="https://www.edgeflow.capital/" />
      </Helmet>
      {/* ============ AMBIENT + EDGE LAYER ============ */}
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none', overflow: 'hidden' }}>
        <div className="ambient-blob ambient-blob-1" />
        <div className="ambient-blob ambient-blob-2" />
        <div className="ambient-blob ambient-blob-3" />
        <div className="ambient-blob ambient-blob-4" />
        <div style={{ position: 'absolute', top: '12%', bottom: '12%', left: 0, width: 1, background: 'linear-gradient(180deg,transparent,rgba(30,211,134,0.28) 25%,rgba(58,255,157,0.36) 50%,rgba(30,211,134,0.28) 75%,transparent)', boxShadow: '0 0 12px rgba(30,211,134,0.15),3px 0 20px rgba(30,211,134,0.08)' }} />
        <div style={{ position: 'absolute', top: '12%', bottom: '12%', right: 0, width: 1, background: 'linear-gradient(180deg,transparent,rgba(30,211,134,0.28) 25%,rgba(58,255,157,0.36) 50%,rgba(30,211,134,0.28) 75%,transparent)', boxShadow: '0 0 12px rgba(30,211,134,0.15),-3px 0 20px rgba(30,211,134,0.08)' }} />
      </div>

      {/* ============ NAV ============ */}
      <nav className="nav">
        <div className="nav-inner">
          <div className="logo">
            <img src="/Adobe Express - file.png" alt="EdgeFlow" width={38} height={38} style={{ objectFit: 'contain', flexShrink: 0, mixBlendMode: 'screen' }} aria-hidden />
            EdgeFlow
          </div>
          <div className="lg nav-pill" ref={navPillRef}>
            {navSections.map(s => (
              <a key={s.key} href={s.href}
                 data-key={s.key}
                 className={activeSection === s.key ? 'active' : ''}
                 onClick={() => setActiveSection(s.key)}>
                {s.label}
              </a>
            ))}
            <span className="nav-pill-indicator" ref={indicatorRef} />
          </div>
          <div className="nav-cta-group" style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
            <a href="/blog" className="lg btn-ghost nav-cta-blog" style={{ textDecoration: 'none' }}>Blog</a>
            <button className="lg btn-ghost nav-cta-login" onClick={() => navigate('/auth')}>Log in</button>
            <button className="lg btn-primary nav-cta-start" onClick={() => navigate('/auth')}>Start trial →</button>
          </div>
          <button
            className="nav-burger"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(v => !v)}
          >
            <span className={`nav-burger-bar ${mobileMenuOpen ? 'is-open-1' : ''}`} />
            <span className={`nav-burger-bar ${mobileMenuOpen ? 'is-open-2' : ''}`} />
            <span className={`nav-burger-bar ${mobileMenuOpen ? 'is-open-3' : ''}`} />
          </button>
        </div>
        <div className={`nav-mobile ${mobileMenuOpen ? 'is-open' : ''}`} aria-hidden={!mobileMenuOpen}>
          {navSections.map(s => (
            <a key={s.key} href={s.href} onClick={() => setMobileMenuOpen(false)}>{s.label}</a>
          ))}
          <a href="/blog" onClick={() => setMobileMenuOpen(false)}>Blog</a>
          <div className="nav-mobile-actions">
            <button className="btn-ghost" onClick={() => { setMobileMenuOpen(false); navigate('/auth'); }}>Log in</button>
            <button className="btn-primary" onClick={() => { setMobileMenuOpen(false); navigate('/auth'); }}>Start trial →</button>
          </div>
        </div>
      </nav>

      {/* ============ HERO ============ */}
      <header className="hero">
        {/* Star field — subtle particles on the sides */}
        <div className="hero-stars" aria-hidden="true">
          {HERO_STARS.map((s, i) => (
            <span
              key={i}
              className="hero-star"
              style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                width: `${s.r * 2}px`,
                height: `${s.r * 2}px`,
                background: s.blue ? 'rgba(200,220,255,0.95)' : '#fff',
                '--star-op': s.op,
                animationDelay: `${s.delay}s`,
                animationDuration: `${s.dur}s`,
              } as React.CSSProperties}
            />
          ))}
        </div>
        <div className="hero-aurora">
          <svg viewBox="0 0 1920 1000" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="streakL" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#3aff9d" stopOpacity={0} />
                <stop offset="50%" stopColor="#3aff9d" stopOpacity={0.55} />
                <stop offset="100%" stopColor="#1ed386" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="streakR" x1="1" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#76dfa8" stopOpacity={0} />
                <stop offset="50%" stopColor="#76dfa8" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#1ed386" stopOpacity={0} />
              </linearGradient>
              <filter id="auroraBlur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6" /></filter>
              <filter id="auroraBlurSoft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="14" /></filter>
            </defs>
            <g filter="url(#auroraBlur)" opacity={0.9}>
              <path d="M -50 100 Q 200 250 120 500 T 280 950" stroke="url(#streakL)" strokeWidth="2" fill="none" />
              <path d="M -100 200 Q 250 380 180 620 T 380 1050" stroke="url(#streakL)" strokeWidth="1.5" fill="none" opacity={0.7} />
              <path d="M 0 50 Q 320 220 220 480 T 420 980" stroke="url(#streakL)" strokeWidth="1" fill="none" opacity={0.5} />
              <path d="M -80 350 Q 180 520 100 760 T 260 1100" stroke="url(#streakL)" strokeWidth="1.2" fill="none" opacity={0.6} />
            </g>
            <g filter="url(#auroraBlurSoft)" opacity={0.6}>
              <path d="M -120 150 Q 220 320 140 580 T 320 1000" stroke="url(#streakL)" strokeWidth="6" fill="none" />
            </g>
            <g filter="url(#auroraBlur)" opacity={0.9}>
              <path d="M 1970 80 Q 1700 240 1780 480 T 1620 940" stroke="url(#streakR)" strokeWidth="2" fill="none" />
              <path d="M 2020 220 Q 1680 400 1740 640 T 1540 1060" stroke="url(#streakR)" strokeWidth="1.5" fill="none" opacity={0.7} />
              <path d="M 1920 30 Q 1620 200 1700 460 T 1500 970" stroke="url(#streakR)" strokeWidth="1" fill="none" opacity={0.5} />
              <path d="M 2000 380 Q 1740 540 1820 780 T 1660 1110" stroke="url(#streakR)" strokeWidth="1.2" fill="none" opacity={0.6} />
            </g>
            <g filter="url(#auroraBlurSoft)" opacity={0.6}>
              <path d="M 2040 180 Q 1700 340 1780 600 T 1600 1020" stroke="url(#streakR)" strokeWidth="6" fill="none" />
            </g>
          </svg>
        </div>

        <div className="wrap hero-inner">
          <div className="hero-kicker">
            <span className="kicker-dot" />
            AI-Powered · Professional Trading Journal
          </div>
          <h1>The trading journal<br />that finds your edge.</h1>
          <p>EdgeFlow is the professional trading journal built for serious traders. Log trades, detect performance leaks, and get AI-powered analysis of every pattern — all in one place.</p>
          <div className="hero-cta">
            <button className="lg btn-outline" onClick={() => navigate('/auth')}>Get started</button>
            <button className="lg btn-white" onClick={() => navigate('/auth')}>Start for Free</button>
          </div>
          <div className="hero-trust">
            <span className="hero-trust-item">Easy setup</span>
            <span className="hero-trust-item">No credit card needed</span>
            <span className="hero-trust-item">Set up in 5 minutes</span>
            <span className="hero-trust-item">Works with MT4/MT5</span>
            <span className="hero-trust-item">Import in seconds</span>
          </div>

          <div className="hero-preview-wrap">
            <div className="hero-glow" />
            <div className="hero-preview-bezel">
              <div className="hero-preview-chrome">
                <div className="hero-preview-dots">
                  <div className="hero-preview-dot" style={{ background: '#ff5f57' }} />
                  <div className="hero-preview-dot" style={{ background: '#febc2e' }} />
                  <div className="hero-preview-dot" style={{ background: '#28c840' }} />
                </div>
                <div className="hero-preview-url">edgeflow.capital/dashboard</div>
              </div>
              <div className="hero-preview-body">
                <img src="/app-screenshot.webp" alt="EdgeFlow dashboard — equity curve, session performance, and trade log" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ============ STATS STRIP ============ */}
      <div className="stats-strip">
        <Stagger className="stats-strip-inner" stagger={0.1}>
          {[
            { num: '20+', label: 'Data points captured per trade' },
            { num: '8+', label: 'Performance breakdowns built in' },
            { num: 'AI', label: 'Powered by Claude (Anthropic)', green: true },
            { num: '$0', label: 'Free to start — no card needed' },
          ].map(({ num, label, green }) => (
            <motion.div key={num} className="stats-strip-item" variants={item}>
              <div className={`stats-strip-num${green ? ' green' : ''}`}>{num}</div>
              <div className="stats-strip-label">{label}</div>
            </motion.div>
          ))}
        </Stagger>
      </div>

      {/* ============ BENTO FEATURES ============ */}
      <section className="bento-section">
        <div className="wrap">
          <Reveal>
            <div className="section-head" style={{ textAlign: 'left', marginBottom: 0 }}>
              <span className="lg eyebrow">The full system</span>
              <h2 className="section-title">Everything you need<br />to find your edge.</h2>
            </div>
          </Reveal>
          <Stagger className="bento-grid">
            <motion.div className="bento-card bento-card--wide" variants={item}>
              <div className="bento-eyebrow">01 / Import</div>
              <h3>Works with your broker. Already.</h3>
              <p>Export from any broker, upload the file. Your full history loads in seconds — MT4/MT5, cTrader, Binance, IBKR, Thinkorswim, and more.</p>
              <div className="bento-broker-grid">
                {['MT4/MT5','cTrader','IBKR','Binance','Bybit','ThinkorSwim','TradeStation','NinjaTrader','OANDA','Exness','XM','Deriv'].map(b => (
                  <span key={b} className="bento-broker-tag">{b}</span>
                ))}
              </div>
            </motion.div>
            <motion.div className="bento-card bento-card--mid" variants={item}>
              <div className="bento-eyebrow">02 / AI</div>
              <h3>Atlas AI Analyst</h3>
              <p>Full context of every trade you've logged. Ask anything. Direct answers, no filler.</p>
              <div className="bento-stats">
                <div className="bento-stat-row">
                  <span className="bento-stat-label">Monday win rate</span>
                  <span className="bento-stat-value neg">31%</span>
                </div>
                <div className="bento-stat-row">
                  <span className="bento-stat-label">Rest of week</span>
                  <span className="bento-stat-value pos">58%</span>
                </div>
                <div className="bento-stat-row">
                  <span className="bento-stat-label">London open expectancy</span>
                  <span className="bento-stat-value pos">+1.3R</span>
                </div>
              </div>
            </motion.div>
            <motion.div className="bento-card bento-card--third" variants={item}>
              <div className="bento-eyebrow">03 / Leaks</div>
              <h3>Leak Detection</h3>
              <p>Flags negative-expectancy combos automatically. Not a dashboard — a diagnostic.</p>
              <div className="bento-stats" style={{ marginTop: 18 }}>
                <div className="bento-stat-row">
                  <span className="bento-stat-label">XAUUSD · New York</span>
                  <span className="bento-stat-value neg">−1.4R</span>
                </div>
                <div className="bento-stat-row">
                  <span className="bento-stat-label">Friday sessions</span>
                  <span className="bento-stat-value neg">−0.9R</span>
                </div>
              </div>
            </motion.div>
            <motion.div className="bento-card bento-card--third" variants={item}>
              <div className="bento-eyebrow">04 / Analytics</div>
              <h3>Session &amp; strategy breakdowns</h3>
              <p>Win rate, expectancy, and P&amp;L by session, instrument, strategy, and direction.</p>
              <div className="bento-stats" style={{ marginTop: 18 }}>
                <div className="bento-stat-row">
                  <span className="bento-stat-label">London open</span>
                  <span className="bento-stat-value pos">74% WR</span>
                </div>
                <div className="bento-stat-row">
                  <span className="bento-stat-label">New York</span>
                  <span className="bento-stat-value neg">31% WR</span>
                </div>
              </div>
            </motion.div>
            <motion.div className="bento-card bento-card--third" variants={item}>
              <div className="bento-eyebrow">05 / Discipline</div>
              <h3>Plan enforcement</h3>
              <p>Custom pre-trade checklist. Track every rule you break and see the exact P&amp;L cost.</p>
              <div className="bento-stats" style={{ marginTop: 18 }}>
                <div className="bento-stat-row">
                  <span className="bento-stat-label">When plan followed</span>
                  <span className="bento-stat-value pos">64% WR</span>
                </div>
                <div className="bento-stat-row">
                  <span className="bento-stat-label">When violated</span>
                  <span className="bento-stat-value neg">38% WR</span>
                </div>
              </div>
            </motion.div>
          </Stagger>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section className="section" id="how">
        <div className="wrap">
          <Reveal>
            <div className="section-head">
              <span className="lg eyebrow">How it works</span>
              <h2 className="section-title">Three steps from<br />trade to edge.</h2>
              <p className="section-sub">Log it. Analyse it. Cut what's losing and double down on what works.</p>
            </div>
          </Reveal>
          <Stagger className="how-grid">
            <motion.div className="how-card" variants={item}>
              <div className="how-num">01</div>
              <h3 className="how-title">Log your trades</h3>
              <p className="how-desc">Manual entry in seconds, or import a CSV from your broker. MT4/MT5, cTrader, Binance, IBKR, and more. No API keys, no setup.</p>
              <div className="how-vis" style={{ padding: 0, overflow: 'hidden', borderRadius: 8, border: 'none', background: 'transparent', marginTop: 16 }}>
                <img src="/screenshot-trades.webp" alt="Trades DB" loading="lazy" style={{ width: '100%', height: 180, objectFit: 'cover', objectPosition: 'top', borderRadius: 8, border: '1px solid var(--line)' }} />
              </div>
            </motion.div>
            <motion.div className="how-card how-card--active" variants={item}>
              <div className="how-num">02</div>
              <h3 className="how-title">Analyse performance</h3>
              <p className="how-desc">Win rates, expectancy, and P&amp;L breakdowns by session, instrument, strategy, and direction. See exactly where your edge lives.</p>
              <div className="how-vis" style={{ background: 'rgba(0,0,0,0.25)' }}>
                <div className="mock-analytics">
                  <div className="mock-analytics-header">
                    <span>Instrument</span><span>Win %</span><span>Exp.</span>
                  </div>
                  {[
                    { name: 'EURUSD', w: '71%', wPct: 71, exp: '+2.4R', c: '#3aff9d' },
                    { name: 'NAS100', w: '64%', wPct: 64, exp: '+1.8R', c: '#3aff9d' },
                    { name: 'GBPUSD', w: '58%', wPct: 58, exp: '+0.6R', c: '#76dfa8' },
                    { name: 'XAUUSD', w: '38%', wPct: 38, exp: '−1.2R', c: '#f87171' },
                    { name: 'US30',   w: '31%', wPct: 31, exp: '−2.1R', c: '#f87171' },
                  ].map(r => (
                    <div key={r.name} className="mock-analytics-row">
                      <span className="mock-analytics-name">{r.name}</span>
                      <span className="mock-analytics-bar-wrap">
                        <span className="mock-analytics-bar" style={{ width: `${r.wPct}%`, background: r.c === '#f87171' ? 'rgba(248,113,113,0.7)' : r.wPct > 60 ? 'rgba(248,248,242,0.55)' : 'rgba(248,248,242,0.45)' }} />
                        <span className="mock-analytics-bar-label">{r.w}</span>
                      </span>
                      <span style={{ color: r.c, fontFamily: 'monospace', fontSize: 11 }}>{r.exp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
            <motion.div className="how-card" variants={item}>
              <div className="how-num">03</div>
              <h3 className="how-title">Eliminate losing patterns</h3>
              <p className="how-desc">Use the Leak Detector and Atlas to pinpoint exact behaviours draining your account — and cut them precisely.</p>
              <div className="how-vis" style={{ background: 'rgba(0,0,0,0.25)' }}>
                <div className="mock-leaks">
                  <div className="mock-leaks-title">Detected leaks <span className="mock-leaks-badge">3</span></div>
                  <div className="mock-leak-row">
                    <div className="mock-leak-dot mock-leak-dot--high" />
                    <div><div className="mock-leak-name">Asian Session</div><div className="mock-leak-detail">31% WR · −$1,240</div></div>
                    <div className="mock-leak-tag">Cut</div>
                  </div>
                  <div className="mock-leak-row">
                    <div className="mock-leak-dot mock-leak-dot--high" />
                    <div><div className="mock-leak-name">Revenge trading</div><div className="mock-leak-detail">−2.8R avg after loss</div></div>
                    <div className="mock-leak-tag">Cut</div>
                  </div>
                  <div className="mock-leak-row">
                    <div className="mock-leak-dot mock-leak-dot--med" />
                    <div><div className="mock-leak-name">Friday trades</div><div className="mock-leak-detail">39% WR · −$480</div></div>
                    <div className="mock-leak-tag">Cut</div>
                  </div>
                  <div className="mock-leaks-atlas">
                    <span className="mock-leaks-atlas-dot" />
                    <em>"Stop trading Asian session. Your edge is in London open."</em>
                  </div>
                </div>
              </div>
            </motion.div>
          </Stagger>
        </div>
      </section>

      {/* ============ APP PREVIEW ============ */}
      <section className="preview-section" id="preview">
        <div className="wrap">
          <Reveal>
            <div className="section-head">
              <span className="lg eyebrow">See it in action</span>
              <h2 className="section-title">Your entire trading brain,<br />in one tab.</h2>
              <p className="section-sub">From trade log to leak detection to AI analyst — click through each tool below.</p>
            </div>
          </Reveal>
          <div className="preview-tabs">
            {tabLabels.map((label, i) => (
              <button key={i} className={`preview-tab-btn${activeTab === i ? ' active' : ''}`} onClick={() => switchTab(i)}>{label}</button>
            ))}
          </div>
          <div className="preview-frame">
            <div className="preview-chrome">
              <div className="preview-dots">
                <div className="preview-dot" style={{ background: '#ff5f57' }} />
                <div className="preview-dot" style={{ background: '#febc2e' }} />
                <div className="preview-dot" style={{ background: '#28c840' }} />
              </div>
              <div className="preview-url">{previewUrl}</div>
            </div>
            <div className="preview-body">
              <img src={previewImg} alt={`${tabLabels[activeTab]} — EdgeFlow`} loading="lazy" style={{ opacity: imgOpacity, transition: 'opacity .18s' }} />
            </div>
          </div>
        </div>
      </section>

      {/* ============ LEAK DETECTION SPOTLIGHT ============ */}
      <section className="spotlight-section">
        <div className="spotlight-inner">
          <motion.div
            className="spotlight-copy"
            initial={{ opacity: 0, x: -36 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-48px' }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <span className="lg eyebrow">Unique to EdgeFlow</span>
            <h2>Find the exact leaks<br />draining your edge.</h2>
            <p>Most traders know something is off. They just can't pinpoint it. Leak Detection scans every combination of instrument, session, strategy, and direction — and surfaces only the ones with negative expectancy. Not a dashboard to explore. A diagnostic that tells you what to cut.</p>
            <ul className="spotlight-list">
              <li>Negative-expectancy combinations flagged automatically</li>
              <li>Expectancy, win rate, and P&amp;L per combination</li>
              <li>Simulate the impact of removing any leak on your equity curve</li>
              <li>No other journal does this</li>
            </ul>
            <button className="lg btn-lg" style={{ marginTop: 24 }} onClick={() => navigate('/auth')}>See your leaks in the trial <span>→</span></button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 36 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-48px' }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="spotlight-visual">
              <div className="spotlight-visual-header">
                <span className="spotlight-visual-title">Leak Detection</span>
                <span className="spotlight-visual-badge">3 leaks found</span>
              </div>
              <div className="spotlight-visual-sub">Combinations with negative expectancy across your last 120 trades</div>
              <div className="spotlight-visual-body">
                {[
                  { label: 'XAUUSD · New York', type: 'Instrument + Session', trades: 11, exp: '−1.4R', wr: '26% win rate' },
                  { label: 'Long · Friday sessions', type: 'Direction + Day', trades: 8, exp: '−0.9R', wr: '31% win rate' },
                ].map((l, i) => (
                  <div key={i} className="leak-row">
                    <div className="leak-icon">↓</div>
                    <div style={{ flex: 1 }}>
                      <div className="leak-label">{l.label}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <span className="leak-type-pill">{l.type}</span>
                        <span style={{ fontSize: 11, color: 'var(--muted-2)' }}>{l.trades} trades</span>
                      </div>
                    </div>
                    <div className="leak-stats">
                      <div className="leak-exp">{l.exp}</div>
                      <div className="leak-wr">{l.wr}</div>
                    </div>
                  </div>
                ))}
                <div className="leak-row" style={{ borderBottom: 'none' }}>
                  <div className="leak-icon">↓</div>
                  <div style={{ flex: 1 }}>
                    <div className="leak-label">EUR/USD · Asian overlap</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <span className="leak-type-pill">Instrument + Session</span>
                      <span style={{ fontSize: 11, color: 'var(--muted-2)' }}>14 trades</span>
                    </div>
                  </div>
                  <div className="leak-stats">
                    <div className="leak-exp">−0.7R</div>
                    <div className="leak-wr">29% win rate</div>
                  </div>
                </div>
              </div>
              <div className="leak-footer">
                <span style={{ color: 'oklch(0.65 0.18 25)', fontWeight: 700 }}>Estimated impact: </span>
                Removing these 3 leaks improves your monthly expectancy by <span style={{ color: '#f2f0ea', fontWeight: 600 }}>+0.8R</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ ATLAS SPOTLIGHT ============ */}
      <section className="spotlight-section" style={{ paddingTop: 0 }}>
        <div className="spotlight-inner reverse">
          <motion.div
            className="spotlight-copy"
            initial={{ opacity: 0, x: 36 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-48px' }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <span className="lg eyebrow">Meet Atlas</span>
            <h2>Your personal<br />AI analyst.</h2>
            <p>Atlas has full context of every trade you've logged — win rates, expectancy by session, behavioral patterns, plan adherence, and your trader profile. Ask it anything. It gives direct, data-backed answers. No filler, no motivational fluff.</p>
            <ul className="spotlight-list">
              <li>Full context of your last 50 trades per message</li>
              <li>Identifies revenge trading, overtrading, and loss clustering</li>
              <li>Builds a behavioral memory across every conversation</li>
              <li>Powered by Claude (Anthropic)</li>
            </ul>
            <button className="lg btn-lg" style={{ marginTop: 24 }} onClick={() => navigate('/auth')}>Try Atlas in the Pro trial <span>→</span></button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -36 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-48px' }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="atlas-visual">
              <div className="atlas-header">
                <div className="atlas-header-left">
                  <span className="atlas-dot" />
                  <span className="atlas-title">Atlas</span>
                </div>
                <span className="atlas-sub">120 trades loaded</span>
              </div>
              <div className="atlas-body">
                <div className="atlas-msg-user">Why is my win rate dropping on Mondays?</div>
                <div className="atlas-msg-ai">Your Monday win rate is <strong style={{ color: '#f2f0ea' }}>31%</strong> vs <strong style={{ color: '#f2f0ea' }}>58%</strong> the rest of the week. The gap appears in the first 90 minutes of London open — 9 of your last 12 Monday losses came before 9:30am. You're trading before the range is established. Try a rule: no entries on Mondays before 9:30 London.</div>
                <div className="atlas-msg-user">What's my best performing session overall?</div>
                <div className="atlas-msg-ai">London open — <strong style={{ color: '#f2f0ea' }}>64% win rate</strong>, <strong style={{ color: '#3aff9d' }}>+1.3R expectancy</strong> across 48 trades. New York is dragging your overall stats down to 51%.</div>
              </div>
              <div className="atlas-input-row">
                <div className="atlas-input">Ask Atlas anything about your trading...</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ WHO IT'S FOR ============ */}
      <section className="for-section">
        <div className="wrap">
          <Reveal>
            <div className="section-head" style={{ textAlign: 'left', marginBottom: 0 }}>
              <span className="lg eyebrow">Who it's for</span>
              <h2 className="section-title">Built for traders who<br />take data seriously.</h2>
            </div>
          </Reveal>
          <Stagger className="for-list">
            <motion.div className="for-item" variants={item}>
              <div className="for-num">01</div>
              <div>
                <h3 className="for-title">You're losing — and you don't know why.</h3>
                <p className="for-body">You're following a system but the results don't add up. EdgeFlow's Leak Detection surfaces the exact instruments, sessions, and setups that are quietly draining your account — with expectancy numbers attached.</p>
              </div>
              <div className="for-tag">Leak Detection</div>
            </motion.div>
            <motion.div className="for-item" style={{ marginTop: 10 }} variants={item}>
              <div className="for-num">02</div>
              <div>
                <h3 className="for-title">You're breakeven — trying to go profitable.</h3>
                <p className="for-body">The data is in your trades but you can't see the pattern. Atlas reads your full trade history and behavioral profile to tell you exactly what to cut and what to double down on.</p>
              </div>
              <div className="for-tag">Atlas AI</div>
            </motion.div>
            <motion.div className="for-item" style={{ marginTop: 10 }} variants={item}>
              <div className="for-num">03</div>
              <div>
                <h3 className="for-title">You're profitable — and want to scale.</h3>
                <p className="for-body">Multiple accounts, prop firm challenges, PDF performance reports. EdgeFlow gives you the infrastructure to treat trading like a business — with multi-account analytics and full audit trails.</p>
              </div>
              <div className="for-tag">Multi-account + PDF</div>
            </motion.div>
          </Stagger>
        </div>
      </section>

      {/* ============ VS SPREADSHEET ============ */}
      <section className="vs-section">
        <div className="wrap">
          <Reveal>
            <div className="section-head">
              <span className="lg eyebrow">Why not a spreadsheet?</span>
              <h2 className="section-title">Your spreadsheet stores trades.<br />EdgeFlow decodes them.</h2>
            </div>
          </Reveal>
          <Stagger className="vs-table">
            <div className="vs-header">
              <span className="vs-label-bad">Your spreadsheet</span>
              <span className="vs-label-good">EdgeFlow</span>
            </div>
            {[
              ['Manual copy-paste after every trade', 'One-form entry — 20+ data points in under a minute'],
              ['SUM() formulas you built and maintain', 'Win rate, expectancy, profit factor, max drawdown — built in'],
              ['You have to notice your own patterns', 'Leak Detection flags negative-expectancy patterns automatically'],
              ['No behavioral data', 'Emotional state, plan adherence, and confidence tracked per trade'],
              ['No way to ask questions about your data', "Atlas — AI analyst with full context of every trade you've logged"],
              ['Another tab per account', 'Multi-account analytics, unified in one dashboard'],
              ['Screenshot of a chart', 'One-click PDF performance report'],
            ].map(([bad, good], i) => (
              <motion.div key={i} className="vs-row" variants={item}>
                <div className="vs-cell vs-cell-bad"><span className="vs-icon-bad">✕</span>{bad}</div>
                <div className="vs-cell vs-cell-good"><span className="vs-icon-good">✓</span>{good}</div>
              </motion.div>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      <section className="testi-section">
        <div className="wrap">
          <div className="section-head">
            <span className="lg eyebrow">Testimonials</span>
            <h2 className="section-title">What Our Users Are<br />Saying?</h2>
          </div>
          <div className="testi-feature">
            <div className="testi-feature-author">
              <div className="testi-avatar">{featuredTestimonial.name[0]}</div>
              <div>
                <div className="testi-name">{featuredTestimonial.name}</div>
                <div className="testi-role">{featuredTestimonial.role}</div>
              </div>
            </div>
            <blockquote className="testi-feature-quote">
              "{featuredTestimonial.quote}"
            </blockquote>
          </div>
        </div>
      </section>

      {/* ============ BROKERS ============ */}
      <section className="brokers-section" id="brokers">
        <div className="wrap">
          <div className="section-head">
            <span className="lg eyebrow">Broker support</span>
            <h2 className="section-title">Works with your broker.<br />Already.</h2>
            <p className="section-sub">No integrations to set up. No API keys. Every major broker lets you export your trade history as a file — upload it to EdgeFlow and your data is ready in seconds.</p>
          </div>
          <div className="brokers-steps">
            <div className="brokers-step">
              <div className="brokers-step-num">01</div>
              <h3 className="brokers-step-title">Export from your broker</h3>
              <p className="brokers-step-body">Go to your broker's trade history and export your trades as a file. Every platform supports this — it takes one click.</p>
            </div>
            <div className="brokers-step-arrow">→</div>
            <div className="brokers-step">
              <div className="brokers-step-num">02</div>
              <h3 className="brokers-step-title">Import into EdgeFlow</h3>
              <p className="brokers-step-body">Select your broker from the list and upload the file. EdgeFlow reads it, maps every trade, and handles the rest automatically.</p>
            </div>
            <div className="brokers-step-arrow">→</div>
            <div className="brokers-step">
              <div className="brokers-step-num">03</div>
              <h3 className="brokers-step-title">Your analytics are ready</h3>
              <p className="brokers-step-body">Your full trade history loads instantly across every report, chart, and AI analysis. Nothing else to set up.</p>
            </div>
          </div>
          <div className="brokers-grid">
            {brokers.map(b => (
              <div key={b.name} className="broker-pill">
                <span className="broker-pill-name">{b.name}</span>
                <span className="broker-pill-cat">{b.cat}</span>
              </div>
            ))}
            <div className="broker-pill broker-pill-more">
              <span className="broker-pill-name">+ any MT4/MT5 broker</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============ PRICING ============ */}
      <section className="pricing-section" id="pricing">
        <div className="wrap">
          <div className="section-head">
            <span className="lg eyebrow">Pricing</span>
            <h2 className="section-title">Start your 14-day Pro trial.<br />Upgrade when it earns its place.</h2>
            <p className="section-sub">No credit card required. Your trade history carries over when you upgrade.</p>
            <div className="lg pricing-toggle">
              <button className={!annualBilling ? 'active' : ''} onClick={() => setAnnualBilling(false)}>Monthly</button>
              <button className={annualBilling ? 'active' : ''} onClick={() => setAnnualBilling(true)}>Annual <span className="save-tag">2 months free</span></button>
            </div>
          </div>
          <Stagger className="pricing-grid" stagger={0.12}>
            <motion.div className="price-card featured" variants={item}>
              <div className="price-head">
                <div className="price-name">Pro</div>
                <div className="lg price-popular">14-day trial</div>
              </div>
              <div className="price-amount"><span className="num">{proPrice}</span><span className="per">/mo</span></div>
              <div className="price-per-label">{proLabel}</div>
              <button className="lg btn-primary price-cta" onClick={() => navigate('/auth')}>Start 14-day trial</button>
              <div className="price-divider"><span className="dot-l" /><span>FEATURES</span><span className="dot-r" /></div>
              <ul className="price-features">
                <li><span className="check">✓</span> 14-day full Pro trial</li>
                <li><span className="check">✓</span> Unlimited trades</li>
                <li><span className="check">✓</span> Session &amp; instrument analytics</li>
                <li><span className="check">✓</span> Atlas AI analyst</li>
                <li><span className="check">✓</span> Leak Detection</li>
                <li><span className="check">✓</span> Strategy Optimizer</li>
                <li><span className="check">✓</span> Trading Plan enforcement</li>
                <li><span className="check">✓</span> PDF performance reports</li>
                <li><span className="check">✓</span> Import from 13+ brokers</li>
                <li><span className="check">✓</span> Multiple accounts</li>
                <li><span className="check">✓</span> Weekly AI digest email</li>
              </ul>
            </motion.div>
          </Stagger>
          <Reveal delay={0.2}>
            <div className="pricing-note">New here? Start the full Pro trial — no credit card required. Upgrade only when EdgeFlow earns its place in your process.</div>
          </Reveal>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="faq-section" id="faq">
        <div className="wrap">
          <div className="faq-grid">
            <Reveal>
              <div>
                <span className="lg eyebrow">FAQ</span>
                <h2 className="section-title" style={{ fontSize: 'clamp(32px,3.8vw,48px)', marginTop: 18 }}>Questions<br />traders ask.</h2>
                <p className="section-sub" style={{ marginLeft: 0, marginTop: 14 }}>Still curious? <a href="mailto:support@edgeflow.capital" style={{ color: 'var(--purple)', textDecoration: 'underline' }}>Email us →</a></p>
              </div>
            </Reveal>
            <Stagger className="faq-list">
              {faqs.map((f, i) => (
                <motion.div key={i} className={`faq-item${openFaq === i ? ' open' : ''}`} variants={item}>
                  <button className="faq-q" onClick={() => toggleFaq(i)}>
                    {f.q} <span className="faq-q-icon">+</span>
                  </button>
                  <div className="faq-a">{f.a}</div>
                </motion.div>
              ))}
            </Stagger>
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="cta-section">
        <Reveal className="wrap cta-inner">
          <span className="lg eyebrow">AI-Powered</span>
          <h2 className="cta-title">Your edge is already<br />in your data.</h2>
          <p className="cta-sub">Stop guessing. Start with your own trade history and discover exactly where your edge is — and where it isn't. Set up in under 5 minutes.</p>
          <div className="cta-btns">
            <button className="lg btn-lg" onClick={() => navigate('/auth')}>Start 14-day Pro trial <span>→</span></button>
          </div>
        </Reveal>
      </section>

      {/* ============ GIANT WORDMARK ============ */}
      <section className="brand-wash" aria-hidden="true">
        <div className="brand-wordmark">EdgeFlow</div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="footer">
        <div className="wrap">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="logo">
                <img src="/Adobe Express - file.png" alt="EdgeFlow" width={38} height={38} style={{ objectFit: 'contain', flexShrink: 0, mixBlendMode: 'screen' }} aria-hidden />
                EdgeFlow
              </div>
              <p>The trading journal and analytics platform for traders who take their performance seriously. Works for any market, any strategy, any broker.</p>
            </div>
            <div className="footer-col">
              <h4>Product</h4>
              <ul>
                <li><a onClick={() => navigate('/auth')} style={{ cursor: 'pointer' }}>Dashboard</a></li>
                <li><a onClick={() => navigate('/auth')} style={{ cursor: 'pointer' }}>Analytics</a></li>
                <li><a onClick={() => navigate('/auth')} style={{ cursor: 'pointer' }}>Atlas</a></li>
                <li><a href="#pricing">Pricing</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Features</h4>
              <ul>
                <li><a href="#preview">Leak Detection</a></li>
                <li><a href="#preview">Equity Curve</a></li>
                <li><a href="#preview">Session Analytics</a></li>
                <li><a href="#preview">Strategy Optimizer</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Resources</h4>
              <ul>
                <li><a href="/blog">Trading Journal Blog</a></li>
                <li><a href="/how-to-use">Platform Guide</a></li>
                <li><a href="https://www.investopedia.com/articles/trading/09/how-to-trade-like-a-hedge-fund.asp" target="_blank" rel="noopener noreferrer">Trading Performance Guide</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Legal</h4>
              <ul>
                <li><a href="/privacy">Privacy Policy</a></li>
                <li><a href="/terms">Terms of Service</a></li>
                <li><a href="/refunds">Refund Policy</a></li>
              </ul>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginBottom: 16, fontSize: 12, color: 'rgba(255,255,255,0.2)', lineHeight: 1.6, maxWidth: 640, margin: '0 auto 16px' }}>
            Trading involves significant risk of loss. Capital at risk. EdgeFlow provides analytics and educational tools only — not financial advice. Past performance shown in simulations does not guarantee future results.
          </div>
          <div className="footer-meta">
            <span>© 2026 EdgeFlow. All rights reserved.</span>
            <span>The professional trading journal.</span>
          </div>
        </div>
      </footer>
    </>
  );
}
