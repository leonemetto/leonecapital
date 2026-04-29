import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './landing.css';

const FAQS = [
  {
    q: 'How is this better than my Excel spreadsheet?',
    a: 'Excel shows you what happened. EdgeFlow shows you why, and what to do about it. It automatically segments your results by session, instrument, strategy, and direction — then flags the exact patterns (revenge trading, overtrading, bad sessions) draining your account. That analysis takes hours to build manually and has to be rebuilt every month. EdgeFlow does it in real time.',
  },
  {
    q: 'Does EdgeFlow work for prop firm challenges?',
    a: 'Yes. The Elite plan includes per-phase challenge tracking — set your firm\'s specific drawdown limit, daily loss limit, and profit target, and EdgeFlow tracks your remaining cushion live. You\'ll see exactly how much headroom you have in each phase. Works for FTMO, MyForexFunds, Topstep, Apex, and any firm with standard rules.',
  },
  {
    q: 'Can I import my existing trade history?',
    a: 'Yes — import directly from MT4/MT5 export files, or use the generic CSV mode for any other broker or platform. Your historical data loads immediately and appears in all analytics from day one. No data is lost on the free tier — if you upgrade later, your full history carries over.',
  },
  {
    q: 'Is my trading data secure and private?',
    a: 'Your data is encrypted at rest and in transit, stored on SOC 2 compliant infrastructure (Supabase). Row-level security ensures no other user can ever access your trades. We never share, sell, or use your data for any purpose other than providing your analytics. Export or delete your data at any time.',
  },
  {
    q: 'How does the AI Advisor work?',
    a: 'The AI Advisor is powered by Claude (Anthropic) and has full context of your last 50 trades, win rates, P&L breakdown, session analytics, and behavioural patterns. Ask it anything about your trading — it gives direct, data-backed answers with no filler. Available on Pro after 10 logged trades.',
  },
  {
    q: 'Can I cancel my subscription at any time?',
    a: 'Yes — no contracts, no cancellation fees. Cancel anytime and retain Pro or Elite access until the end of your billing period. Your trade data is always yours to export as CSV at any time.',
  },
];

const FEATURE_GROUPS = [
  {
    heading: 'Track every trade',
    sub: 'Manual entry in seconds. MT4/MT5 CSV import. Screenshot at entry. Everything in one place.',
    features: [
      { name: 'Trade Log', desc: 'Log any market — forex, futures, stocks, crypto, options, indices. Manual or CSV. Attach a screenshot of your chart at entry.' },
      { name: 'Multiple Accounts', desc: 'Separate live, demo, and prop firm accounts. Analyse each independently or aggregate all at once with one click.' },
      { name: 'Daily Journal', desc: 'Session mood, notes, and key lessons. 14-day history panel makes the mental patterns behind your best and worst days visible.' },
    ],
  },
  {
    heading: 'Understand your edge',
    sub: 'Your data broken down by every dimension that matters — so you see exactly where you make money.',
    features: [
      { name: 'Session Analytics', desc: 'Win rate, expectancy, and P&L by session (London, New York, Asian, Overlap), instrument, strategy, HTF bias, and direction.' },
      { name: 'Equity Curve', desc: 'Daily and cumulative P&L charted across any time window. Heat map calendar shows best and worst days at a glance.' },
      { name: 'Strategy Optimizer', desc: 'Simulate removing any filter — instantly see your equity curve with and without a given session, instrument, or setup.' },
    ],
  },
  {
    heading: 'Find and fix leaks',
    sub: 'Most traders lose money from 1–2 specific patterns they never see. This makes them visible.',
    features: [
      { name: 'Leak Detection', desc: 'Automatically flags negative-expectancy patterns — the instruments, sessions, and behaviours that are quietly draining your account.' },
      { name: 'AI Advisor', desc: 'Ask anything about your trading. Full context of your last 50 trades, win rates, and behavioural memory. Direct answers powered by Claude (Anthropic).' },
      { name: 'Plan Enforcement', desc: 'Custom pre-trade checklist. EdgeFlow tracks every rule you break and shows the exact P&L cost of each violation in plain numbers.' },
    ],
  },
];

const OUTCOMES = [
  {
    label: 'Prop firm trader',
    headline: 'Found the session killing the challenge',
    detail: 'Asian session trades on Fridays were responsible for 2.4R of weekly losses. Cut entirely. Weekly P&L turned positive within two weeks.',
    stat: '−2.4R/week',
    statLabel: 'weekly leak identified',
  },
  {
    label: 'Forex swing trader',
    headline: 'Caught a revenge trading pattern',
    detail: 'Win rate dropped from 61% to 38% on days following a loss. A single behavioural rule — no trading the day after a red day — fixed it completely.',
    stat: '−23% WR',
    statLabel: 'after-loss performance gap',
  },
  {
    label: 'Day trader',
    headline: 'Discovered a session mismatch',
    detail: 'London: 74% win rate. New York: 31% win rate. Stopped trading New York entirely. Profit factor improved from 1.2 to 2.1 within a month.',
    stat: '1.2 → 2.1',
    statLabel: 'profit factor after adjustment',
  },
];

const PREVIEW_TABS = ['Dashboard', 'Analytics', 'AI Advisor', 'Leak Detection', 'Optimizer'];
const TAB_SCREENSHOTS = [
  '/app-screenshot.webp',
  '/screenshot-analytic.webp',
  '/screenshot-ai.webp',
  '/screenshot-leaks.webp',
  '/screenshot-optimizer.webp',
];
const TAB_ALTS = [
  'EdgeFlow dashboard — equity curve, win rate, and session performance',
  'EdgeFlow Analytics — performance breakdown by instrument, session, and strategy',
  'EdgeFlow AI Advisor — Claude-powered trading coach with full trade context',
  'EdgeFlow Leak Detection — identify negative-expectancy patterns',
  'EdgeFlow Strategy Optimizer — simulate removing losing filters',
];
const TAB_PATHS = ['dashboard', 'analyst', 'ai', 'leak-detection', 'what-if'];

export default function Landing() {
  const navigate = useNavigate();
  const tiltInnerRef = useRef<HTMLDivElement>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setNavScrolled(window.scrollY > 60);
      setShowScrollTop(window.scrollY > 800);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 768) setMobileMenuOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const inner = tiltInnerRef.current;
    if (!inner) return;
    let cur = { r: 14, s: 0.96 };
    let tgt = { r: 14, s: 0.96 };
    let raf: number;
    function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
    function update() {
      const scrollY = window.scrollY;
      const heroH = (inner.closest('.lp-hero') as HTMLElement)?.offsetHeight ?? 600;
      const progress = Math.min(1, scrollY / (heroH * 0.8));
      const eased = 1 - Math.pow(1 - progress, 2);
      tgt.r = lerp(14, 0, eased);
      tgt.s = lerp(0.96, 1.0, eased);
    }
    function animate() {
      cur.r += (tgt.r - cur.r) * 0.1;
      cur.s += (tgt.s - cur.s) * 0.1;
      inner.style.transform = `rotateX(${cur.r.toFixed(3)}deg) scale(${cur.s.toFixed(4)})`;
      raf = requestAnimationFrame(animate);
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
    animate();
    return () => { window.removeEventListener('scroll', update); cancelAnimationFrame(raf); };
  }, []);

  useEffect(() => {
    const els = document.querySelectorAll('#lp .lp-reveal, #lp .lp-reveal-left, #lp .lp-reveal-right, #lp .lp-reveal-scale');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });
    els.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (document.querySelector('#lp-manrope-font')) return;
    const link = document.createElement('link');
    link.id = 'lp-manrope-font';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap';
    document.head.appendChild(link);
  }, []);

  return (
    <div id="lp">
      {/* NAV */}
      <nav className={`lp-nav${navScrolled ? ' scrolled' : ''}`}>
        <div className="lp-nav-logo" onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setMobileMenuOpen(false); }}>
          <img src="/favicon.svg" alt="EdgeFlow" className="lp-nav-logo-img" />
          EdgeFlow
        </div>
        <ul className="lp-nav-links">
          <li><a href="#how" onClick={() => setMobileMenuOpen(false)}>How it works</a></li>
          <li><a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a></li>
          <li><a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</a></li>
          <li><a href="#faq" onClick={() => setMobileMenuOpen(false)}>FAQ</a></li>
        </ul>
        <div className="lp-nav-actions">
          <button className="lp-btn-ghost" onClick={() => navigate('/auth')}>Log in</button>
          <button className="lp-btn-primary lp-nav-cta" onClick={() => navigate('/auth')}>Start free →</button>
          <button
            className={`lp-hamburger${mobileMenuOpen ? ' open' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* MOBILE MENU */}
      <div className={`lp-mobile-menu${mobileMenuOpen ? ' open' : ''}`}>
        <a href="#how" onClick={() => setMobileMenuOpen(false)}>How it works</a>
        <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
        <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
        <a href="#faq" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
        <div className="lp-mobile-menu-actions">
          <button className="lp-btn-ghost" onClick={() => { navigate('/auth'); setMobileMenuOpen(false); }}>Log in</button>
          <button className="lp-btn-primary-lg" onClick={() => { navigate('/auth'); setMobileMenuOpen(false); }}>Start free →</button>
        </div>
      </div>

      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-hero-kicker">
          <span className="lp-hero-kicker-dot"></span>
          Free to start — no credit card needed
        </div>
        <h1>Find the patterns<br/>killing your <em>P&L.</em></h1>
        <p className="lp-hero-sub">
          Log every trade. EdgeFlow automatically surfaces where your edge is, where it leaks, and exactly what to fix — no spreadsheets, no guesswork.
        </p>
        <div className="lp-hero-ctas">
          <button className="lp-btn-primary-lg" onClick={() => navigate('/auth')}>Start journaling free</button>
          <a href="#features" className="lp-btn-secondary-lg">See all features</a>
        </div>
        <div className="lp-hero-trust">
          <span className="lp-hero-trust-item">No credit card needed</span>
          <span className="lp-hero-trust-item">50 trades free</span>
          <span className="lp-hero-trust-item">Set up in under 5 minutes</span>
        </div>

        <div className="lp-hero-tilt-glow"></div>

        <div className="lp-hero-tilt-wrap">
          <div className="lp-hero-tilt-inner" ref={tiltInnerRef}>
            <div className="lp-hero-preview">
              <div className="lp-hero-preview-chrome">
                <div className="lp-hero-preview-dots">
                  <div className="lp-hero-preview-dot" style={{ background: '#ff5f57' }}></div>
                  <div className="lp-hero-preview-dot" style={{ background: '#febc2e' }}></div>
                  <div className="lp-hero-preview-dot" style={{ background: '#28c840' }}></div>
                </div>
                <div className="lp-hero-preview-url">edgeflow.app/dashboard</div>
              </div>
              <img src="/app-screenshot.webp" alt="EdgeFlow dashboard — equity curve, session performance, and trade log" />
            </div>
          </div>
        </div>
      </section>

      {/* HERO STRIP */}
      <div className="lp-hero-strip">
        <div className="lp-hero-strip-item">
          <div className="lp-hero-strip-num">20<span>+</span></div>
          <div className="lp-hero-strip-label">Data points captured per trade</div>
        </div>
        <div className="lp-hero-strip-item">
          <div className="lp-hero-strip-num">8<span>+</span></div>
          <div className="lp-hero-strip-label">Performance breakdowns built in</div>
        </div>
        <div className="lp-hero-strip-item">
          <div className="lp-hero-strip-num" style={{ color: 'var(--lp-green)' }}>AI</div>
          <div className="lp-hero-strip-label">Powered by Claude (Anthropic)</div>
        </div>
        <div className="lp-hero-strip-item">
          <div className="lp-hero-strip-num">$0</div>
          <div className="lp-hero-strip-label">Free to start — no card needed</div>
        </div>
      </div>

      {/* LOGOS STRIP */}
      <div className="lp-logos-strip">
        <div className="lp-logos-strip-inner">
          <span className="lp-logos-label">Works with</span>
          <span className="lp-logo-item">MetaTrader 4</span>
          <span className="lp-logo-item">MetaTrader 5</span>
          <span className="lp-logo-item">Manual entry</span>
          <span className="lp-logo-item">Any CSV export</span>
          <span className="lp-logo-item">All brokers</span>
          <span className="lp-logo-item">Any market</span>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section id="how">
        <div className="lp-container">
          <div className="lp-reveal">
            <div className="lp-section-kicker"><span className="lp-section-kicker-dot"></span> How it works</div>
            <h2 className="lp-section-title">From raw trades to<br/>real insights</h2>
            <p className="lp-section-sub">Three simple steps between your brokerage and the clarity you've been missing.</p>
          </div>
          <div className="lp-steps-grid">
            <div className="lp-step-card lp-reveal lp-delay-1">
              <div className="lp-step-mockup">
                <img src="/screenshot-trades.webp" alt="Trades DB — log and review all your trades" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', borderRadius: 6 }} />
              </div>
              <div className="lp-step-body">
                <div className="lp-step-num">01</div>
                <h3>Log your trades</h3>
                <p>Enter trades manually in seconds, or import a CSV from your broker. Works with MT4/MT5 and any generic export. No API keys, no setup.</p>
              </div>
            </div>
            <div className="lp-step-card lp-reveal lp-delay-2">
              <div className="lp-step-mockup">
                <img src="/screenshot-analytic.webp" alt="Analytics — win rate and expectancy by instrument, session, and strategy" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', borderRadius: 6 }} />
              </div>
              <div className="lp-step-body">
                <div className="lp-step-num">02</div>
                <h3>Analyse your performance</h3>
                <p>EdgeFlow surfaces win rates, expectancy, and P&L breakdowns by session, instrument, strategy, and direction — so you see exactly where your edge lives and where it doesn't.</p>
              </div>
            </div>
            <div className="lp-step-card lp-reveal lp-delay-3">
              <div className="lp-step-mockup">
                <img src="/screenshot-leaks.webp" alt="Leak Detection — pinpoint patterns draining your P&L" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', borderRadius: 6 }} />
              </div>
              <div className="lp-step-body">
                <div className="lp-step-num">03</div>
                <h3>Eliminate losing patterns</h3>
                <p>Use the Leak Detector and AI Advisor to pinpoint the specific behaviours draining your account — revenge trading, bad sessions, overtrading — and cut them precisely.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* APP PREVIEW */}
      <section className="lp-preview-section">
        <div className="lp-container">
          <div className="lp-reveal">
            <div className="lp-section-kicker"><span className="lp-section-kicker-dot"></span> See it in action</div>
            <h2 className="lp-section-title">Every tool you need,<br/>in one place</h2>
            <p className="lp-section-sub">Click through to explore the dashboard and every major feature.</p>
          </div>
          <div className="lp-preview-tabs lp-reveal">
            {PREVIEW_TABS.map((tab, i) => (
              <button
                key={i}
                className={`lp-tab-btn${activeTab === i ? ' active' : ''}`}
                onClick={() => setActiveTab(i)}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="lp-preview-frame lp-reveal">
            <div className="lp-preview-chrome">
              <div className="lp-preview-dots">
                <div className="lp-preview-dot" style={{ background: '#ff5f57' }}></div>
                <div className="lp-preview-dot" style={{ background: '#febc2e' }}></div>
                <div className="lp-preview-dot" style={{ background: '#28c840' }}></div>
              </div>
              <div className="lp-preview-url">edgeflow.app/{TAB_PATHS[activeTab]}</div>
            </div>
            <div key={activeTab} className="lp-preview-body active lp-tab-fade">
              <img src={TAB_SCREENSHOTS[activeTab]} alt={TAB_ALTS[activeTab]} loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="lp-features-section">
        <div className="lp-container">
          <div className="lp-reveal">
            <div className="lp-section-kicker"><span className="lp-section-kicker-dot"></span> Features</div>
            <h2 className="lp-section-title">Everything serious<br/>traders need</h2>
            <p className="lp-section-sub">Built around one goal: turn your raw trade history into actionable intelligence.</p>
          </div>
          <div className="lp-feature-groups">
            {FEATURE_GROUPS.map((group, gi) => (
              <div key={gi} className={`lp-feature-group lp-reveal lp-delay-${gi + 1}`}>
                <div className="lp-feature-group-header">
                  <div className="lp-feature-group-num">0{gi + 1}</div>
                  <h3>{group.heading}</h3>
                  <p>{group.sub}</p>
                </div>
                <div className="lp-feature-items">
                  {group.features.map((f, fi) => (
                    <div key={fi} className="lp-feature-item">
                      <div className="lp-feature-item-dot" />
                      <div className="lp-feature-item-body">
                        <strong>{f.name}</strong>
                        <span>{f.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARISON */}
      <section>
        <div className="lp-container">
          <div className="lp-reveal">
            <div className="lp-section-kicker"><span className="lp-section-kicker-dot"></span> The EdgeFlow difference</div>
            <h2 className="lp-section-title">There's a smarter way<br/>to trade</h2>
          </div>
          <div className="lp-comparison-grid">
            <div className="lp-compare-card before lp-reveal-left">
              <div className="lp-compare-badge">Without EdgeFlow</div>
              <h3>Flying blind</h3>
              <ul className="lp-compare-list">
                <li><span className="lp-icon">✗</span> Running a 14-tab Excel file to calculate R-multiple after every trade</li>
                <li><span className="lp-icon">✗</span> No idea whether Friday afternoon trades are profitable or costing you the week</li>
                <li><span className="lp-icon">✗</span> Taking the same loss in the same session every week and calling it bad luck</li>
                <li><span className="lp-icon">✗</span> Failing a prop firm challenge with no data on what actually went wrong</li>
                <li><span className="lp-icon">✗</span> Emotional decisions after losing streaks with no way to quantify the damage</li>
                <li><span className="lp-icon">✗</span> Trading setups with no historical proof they actually have edge</li>
              </ul>
            </div>
            <div className="lp-compare-card after lp-reveal-right">
              <div className="lp-compare-badge">✦ With EdgeFlow</div>
              <h3>Data-driven edge</h3>
              <ul className="lp-compare-list">
                <li><span className="lp-icon" style={{ color: 'rgb(140,255,46)' }}>✓</span> Trades logged in seconds — manual, CSV, or MT4/MT5 import</li>
                <li><span className="lp-icon" style={{ color: 'rgb(140,255,46)' }}>✓</span> Exact P&L breakdown by session, instrument, strategy, and direction</li>
                <li><span className="lp-icon" style={{ color: 'rgb(140,255,46)' }}>✓</span> Leaks identified by name with the exact dollar cost of each one</li>
                <li><span className="lp-icon" style={{ color: 'rgb(140,255,46)' }}>✓</span> Prop firm challenge tracking — remaining headroom, phase rules, live drawdown</li>
                <li><span className="lp-icon" style={{ color: 'rgb(140,255,46)' }}>✓</span> AI Advisor keeps you objective after losing streaks with data, not pep talks</li>
                <li><span className="lp-icon" style={{ color: 'rgb(140,255,46)' }}>✓</span> Pre-trade checklist enforces your own rules — and shows what violations cost</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* OUTCOMES */}
      <section className="lp-outcomes-section">
        <div className="lp-container">
          <div className="lp-reveal">
            <div className="lp-section-kicker"><span className="lp-section-kicker-dot"></span> What traders discover</div>
            <h2 className="lp-section-title">Your edge is already<br/>in your data.</h2>
            <p className="lp-section-sub">Most traders lose money from 1–2 patterns they never knew existed. Here's what they typically find in the first week.</p>
          </div>
          <div className="lp-outcomes-grid">
            {OUTCOMES.map((o, i) => (
              <div key={i} className={`lp-outcome-card lp-reveal lp-delay-${i + 1}`}>
                <div className="lp-outcome-label">{o.label}</div>
                <h3 className="lp-outcome-headline">{o.headline}</h3>
                <p className="lp-outcome-detail">{o.detail}</p>
                <div className="lp-outcome-stat">
                  <div className="lp-outcome-stat-num">{o.stat}</div>
                  <div className="lp-outcome-stat-label">{o.statLabel}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing">
        <div className="lp-container">
          <div className="lp-reveal" style={{ textAlign: 'center' }}>
            <div className="lp-section-kicker" style={{ justifyContent: 'center' }}><span className="lp-section-kicker-dot"></span> Pricing</div>
            <h2 className="lp-section-title">Simple plans.</h2>
            <p className="lp-section-sub" style={{ margin: '0 auto' }}>Start free. Upgrade when your edge needs more power.</p>
          </div>
          <div className="lp-pricing-grid">
            <div className="lp-price-card basic lp-reveal-left">
              <div className="lp-price-badge">Starter</div>
              <div className="lp-price-amount">$0</div>
              <div className="lp-price-per">Free to start</div>
              <div className="lp-price-divider"></div>
              <ul className="lp-price-features">
                <li><span className="lp-price-check">✓</span> Up to 50 trades</li>
                <li><span className="lp-price-check">✓</span> Equity curve &amp; calendar</li>
                <li><span className="lp-price-check">✓</span> Basic P&amp;L analytics</li>
                <li><span className="lp-price-check">✓</span> Manual trade entry</li>
                <li><span className="lp-price-check">✓</span> Single account</li>
                <li><span className="lp-price-check">✓</span> 3 AI Advisor messages</li>
              </ul>
              <button className="lp-btn-price basic" onClick={() => navigate('/auth')}>Get started free</button>
            </div>

            <div className="lp-price-card pro lp-reveal" style={{ position: 'relative' }}>
              <div className="lp-price-popular">Best value</div>
              <div className="lp-price-badge">Pro</div>
              <div className="lp-price-amount">$19</div>
              <div className="lp-price-per">per month · cancel anytime</div>
              <div className="lp-price-divider"></div>
              <ul className="lp-price-features">
                <li><span className="lp-price-check">✓</span> Unlimited trades</li>
                <li><span className="lp-price-check">✓</span> Session &amp; instrument analytics</li>
                <li><span className="lp-price-check">✓</span> Unlimited AI Advisor (Claude)</li>
                <li><span className="lp-price-check">✓</span> Leak Detection</li>
                <li><span className="lp-price-check">✓</span> Strategy Optimizer</li>
                <li><span className="lp-price-check">✓</span> Trading Plan enforcement</li>
                <li><span className="lp-price-check">✓</span> PDF performance reports</li>
                <li><span className="lp-price-check">✓</span> CSV import (MT4/MT5 + generic)</li>
                <li><span className="lp-price-check">✓</span> Multiple accounts</li>
                <li><span className="lp-price-check">✓</span> Weekly AI digest email</li>
              </ul>
              <button className="lp-btn-price pro" onClick={() => navigate('/auth')}>Get Pro</button>
            </div>

            <div className="lp-price-card elite lp-reveal-right">
              <div className="lp-price-badge">Elite</div>
              <div className="lp-price-amount">$39</div>
              <div className="lp-price-per">per month · cancel anytime</div>
              <div className="lp-price-divider"></div>
              <ul className="lp-price-features">
                <li><span className="lp-price-check">✓</span> Everything in Pro</li>
                <li><span className="lp-price-check">✓</span> Prop firm challenge tracking</li>
                <li><span className="lp-price-check">✓</span> Per-phase drawdown &amp; daily loss limits</li>
                <li><span className="lp-price-check">✓</span> FTMO, Topstep, MFF &amp; custom rules</li>
                <li><span className="lp-price-check">✓</span> Extended AI memory (50 insights)</li>
                <li><span className="lp-price-check">✓</span> Advanced behavioral scoring</li>
                <li><span className="lp-price-check">✓</span> Priority support</li>
                <li><span className="lp-price-check">✓</span> Early access to new features</li>
              </ul>
              <button className="lp-btn-price elite" onClick={() => navigate('/auth')}>Get Elite</button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq">
        <div className="lp-container">
          <div className="lp-reveal">
            <div className="lp-section-kicker"><span className="lp-section-kicker-dot"></span> FAQ</div>
            <h2 className="lp-section-title">Got questions?<br/>We've got answers.</h2>
          </div>
          <div className="lp-faq-list lp-reveal">
            {FAQS.map((item, i) => (
              <div key={i} className={`lp-faq-item${openFaq === i ? ' open' : ''}`}>
                <button className="lp-faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  {item.q}
                  <div className="lp-faq-icon">+</div>
                </button>
                <div className="lp-faq-answer">{item.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="lp-cta-section">
        <div className="lp-cta-inner lp-reveal">
          <h2>Your edge is already<br/>in your data.</h2>
          <p>Stop guessing. Start with your own trade history and discover exactly where your edge is — and where it isn't. Set up in under 5 minutes.</p>
          <button className="lp-btn-primary-lg" onClick={() => navigate('/auth')}>Start for free — no credit card</button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-footer-top">
          <div className="lp-footer-brand">
            <div className="lp-nav-logo" style={{ cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <img src="/favicon.svg" alt="EdgeFlow" className="lp-nav-logo-img" />
              EdgeFlow
            </div>
            <p>The trading journal and analytics platform for traders who take their performance seriously. Works for any market, any strategy, any broker.</p>
          </div>
          <div className="lp-footer-col">
            <h4>Product</h4>
            <ul>
              <li><a onClick={() => navigate('/auth')}>Dashboard</a></li>
              <li><a onClick={() => navigate('/auth')}>Analytics</a></li>
              <li><a onClick={() => navigate('/auth')}>AI Advisor</a></li>
              <li><a href="#pricing">Pricing</a></li>
            </ul>
          </div>
          <div className="lp-footer-col">
            <h4>Features</h4>
            <ul>
              <li><a href="#features">Leak Detection</a></li>
              <li><a href="#features">Equity Curve</a></li>
              <li><a href="#features">Session Analytics</a></li>
              <li><a href="#features">Strategy Optimizer</a></li>
            </ul>
          </div>
          <div className="lp-footer-col">
            <h4>Legal</h4>
            <ul>
              <li><a onClick={() => navigate('/privacy')}>Privacy Policy</a></li>
              <li><a onClick={() => navigate('/terms')}>Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="lp-footer-bottom">
          <span>© 2026 EdgeFlow. All rights reserved.</span>
          <span>Built for traders, by traders.</span>
        </div>
      </footer>

      {/* SCROLL TO TOP */}
      <button
        className={`lp-scroll-top${showScrollTop ? ' visible' : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
      >
        ↑
      </button>
    </div>
  );
}
