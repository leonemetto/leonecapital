import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './landing.css';

const TESTIMONIALS = [
  { initials: 'JK', quote: 'EdgeFlow showed me I was giving back 40% of my profits during the New York close. One small change, massive difference.', name: 'James K.', role: 'Futures trader, 4 years' },
  { initials: 'SM', quote: 'I finally stopped keeping my journal in Excel. The session analytics alone paid for the subscription in the first week.', name: 'Sarah M.', role: 'Forex swing trader' },
  { initials: 'TR', quote: 'The AI Advisor caught that I was consistently overtrading on Mondays. My win rate went from 52% to 71% just by sitting out.', name: 'Tariq R.', role: 'Prop firm trader' },
  { initials: 'AO', quote: "I was hesitant about paying for a journal app, but the leak detector found $1,200/month I was bleeding on Friday afternoon trades.", name: 'Alex O.', role: 'Crypto day trader' },
  { initials: 'NB', quote: 'The equity curve and session breakdowns make it obvious where I need to tighten up. First tool that actually changed my behavior.', name: 'Nadia B.', role: 'Equity options trader' },
  { initials: 'MP', quote: "Passed my prop firm challenge in 3 weeks after using EdgeFlow to nail down which setups had real edge. Couldn't have done it without it.", name: 'Marcus P.', role: 'Prop firm funded trader' },
];

const FAQS = [
  {
    q: 'What brokers and platforms does EdgeFlow support?',
    a: 'EdgeFlow works with any broker. You can log trades manually in seconds, or import a CSV — with dedicated parsers for MetaTrader 4/5 and a generic CSV mode that handles exports from any other platform. Works across futures, forex, stocks, options, crypto, and indices.',
  },
  {
    q: 'Is my trading data secure and private?',
    a: 'Your data is encrypted at rest and in transit, stored on SOC 2 compliant infrastructure (Supabase). Row-level security ensures no other user can access your trades. We never share, sell, or use your data for any purpose other than providing your analytics. Export or delete your data at any time.',
  },
  {
    q: "Can I use EdgeFlow if I'm a beginner trader?",
    a: "Absolutely. EdgeFlow is built to be useful from day one, even with a handful of trades. The AI Advisor explains everything in plain language — no data science background required. Many beginners find it significantly speeds up their learning curve.",
  },
  {
    q: "What's the difference between Pro and Elite?",
    a: "Pro gives you the full analytics suite — AI Advisor, Leak Detection, Session Analytics, Strategy Optimizer, and PDF reports. Elite adds prop firm challenge tracking (per-phase drawdown limits and targets), advanced behavioral scoring, priority AI responses, and early access to new features.",
  },
  {
    q: 'How does the AI Advisor work?',
    a: 'The AI Advisor is powered by Claude (Anthropic) and has full context of your last 50 trades, win rates, P&L breakdown, and behavioural patterns. Ask it anything about your trading — it gives direct, data-backed answers. Available on Pro after 10 logged trades.',
  },
  {
    q: 'Can I cancel my subscription at any time?',
    a: 'Yes — no contracts, no cancellation fees. Cancel anytime and retain Pro or Elite access until the end of your billing period. Your trade data is always yours to keep, and you can export it as CSV at any time.',
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

  // Nav scroll + scroll-to-top visibility
  useEffect(() => {
    const onScroll = () => {
      setNavScrolled(window.scrollY > 60);
      setShowScrollTop(window.scrollY > 800);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 768) setMobileMenuOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Tilt-flatten scroll animation
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

  // Scroll reveal observer
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

  // Load Manrope font
  useEffect(() => {
    if (document.querySelector('#lp-manrope-font')) return;
    const link = document.createElement('link');
    link.id = 'lp-manrope-font';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap';
    document.head.appendChild(link);
  }, []);

  const doubled = [...TESTIMONIALS, ...TESTIMONIALS];

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
          Free forever plan — no credit card needed
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
          <span className="lp-hero-trust-item">Free forever plan</span>
          <span className="lp-hero-trust-item">Up and running in 2 minutes</span>
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
                <div className="lp-hero-preview-url">leone.capital/dashboard</div>
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
          <div className="lp-hero-strip-label">Free forever — no credit card</div>
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

      {/* WHO IT'S FOR */}
      <section>
        <div className="lp-container">
          <div className="lp-reveal">
            <div className="lp-section-kicker"><span className="lp-section-kicker-dot"></span> Who it's for</div>
            <h2 className="lp-section-title">Built for every type<br/>of serious trader</h2>
            <p className="lp-section-sub">Any market, any strategy, any broker. If you trade, EdgeFlow works for you.</p>
          </div>
          <div className="lp-for-grid">
            <div className="lp-for-card lp-reveal lp-delay-1">
              <div className="lp-for-icon">💱</div>
              <div>
                <div className="lp-for-label">Forex traders</div>
                <div className="lp-for-sub">Session analytics, currency pair breakdowns</div>
              </div>
            </div>
            <div className="lp-for-card lp-reveal lp-delay-2">
              <div className="lp-for-icon">📊</div>
              <div>
                <div className="lp-for-label">Futures traders</div>
                <div className="lp-for-sub">Instrument-level edge, session P&L mapping</div>
              </div>
            </div>
            <div className="lp-for-card lp-reveal lp-delay-3">
              <div className="lp-for-icon">₿</div>
              <div>
                <div className="lp-for-label">Crypto traders</div>
                <div className="lp-for-sub">24/7 session tracking, drawdown alerts</div>
              </div>
            </div>
            <div className="lp-for-card lp-reveal lp-delay-1">
              <div className="lp-for-icon">📈</div>
              <div>
                <div className="lp-for-label">Stock traders</div>
                <div className="lp-for-sub">Strategy & direction win rate breakdowns</div>
              </div>
            </div>
            <div className="lp-for-card lp-reveal lp-delay-2">
              <div className="lp-for-icon">⚡</div>
              <div>
                <div className="lp-for-label">Options traders</div>
                <div className="lp-for-sub">R-multiple tracking, plan adherence scoring</div>
              </div>
            </div>
            <div className="lp-for-card lp-reveal lp-delay-3">
              <div className="lp-for-icon">🏆</div>
              <div>
                <div className="lp-for-label">Prop firm traders</div>
                <div className="lp-for-sub">Challenge tracking, per-phase drawdown limits</div>
              </div>
            </div>
          </div>
        </div>
      </section>

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
                <p>EdgeFlow surfaces win rates, expectancy, and P&L breakdowns by session, instrument, strategy, and direction — so you see exactly where your edge lives.</p>
              </div>
            </div>

            <div className="lp-step-card lp-reveal lp-delay-3">
              <div className="lp-step-mockup">
                <img src="/screenshot-leaks.webp" alt="Leak Detection — pinpoint patterns draining your P&L" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', borderRadius: 6 }} />
              </div>
              <div className="lp-step-body">
                <div className="lp-step-num">03</div>
                <h3>Eliminate losing patterns</h3>
                <p>Use the Leak Detector and AI Advisor to pinpoint the specific behaviours draining your account — revenge trading, overtrading, bad sessions.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <div className="lp-stats-section">
        <div className="lp-stats-grid">
          <div className="lp-reveal-scale lp-delay-1">
            <div className="lp-stat-num">20<span>+</span></div>
            <div className="lp-stat-label">Analytics fields per trade</div>
          </div>
          <div className="lp-reveal-scale lp-delay-2">
            <div className="lp-stat-num">8<span>+</span></div>
            <div className="lp-stat-label">Analytics breakdowns built in</div>
          </div>
          <div className="lp-reveal-scale lp-delay-3">
            <div className="lp-stat-num">AI</div>
            <div className="lp-stat-label">Powered by Claude (Anthropic)</div>
          </div>
          <div className="lp-reveal-scale lp-delay-4">
            <div className="lp-stat-num">$0</div>
            <div className="lp-stat-label">To get started</div>
          </div>
        </div>
      </div>

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
              <div className="lp-preview-url">leone.capital/{TAB_PATHS[activeTab]}</div>
            </div>
            <div key={activeTab} className="lp-preview-body active lp-tab-fade">
              <img src={TAB_SCREENSHOTS[activeTab]} alt={TAB_ALTS[activeTab]} loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES BENTO */}
      <section id="features" className="lp-bento-section">
        <div className="lp-container">
          <div className="lp-reveal">
            <div className="lp-section-kicker"><span className="lp-section-kicker-dot"></span> Features</div>
            <h2 className="lp-section-title">Built for traders,<br/>not spreadsheets</h2>
          </div>
          <div className="lp-bento-grid">
            <div className="lp-bento-card wide lp-reveal lp-delay-1">
              <div className="lp-bento-icon">📈</div>
              <h3>Equity Curve & P&L Analytics</h3>
              <p>Visualise your account growth over any time window. Heat map calendar shows your best and worst days at a glance. Spot drawdowns before they compound.</p>
              <div className="lp-mini-bars">
                <div className="lp-mini-bar-row"><span className="lp-mini-bar-label">London</span><div className="lp-mini-bar-track"><div className="lp-mini-bar-fill" style={{ width: '88%' }}></div></div><span className="lp-mini-bar-val">72% WR</span></div>
                <div className="lp-mini-bar-row"><span className="lp-mini-bar-label">New York</span><div className="lp-mini-bar-track"><div className="lp-mini-bar-fill" style={{ width: '62%' }}></div></div><span className="lp-mini-bar-val">58% WR</span></div>
                <div className="lp-mini-bar-row"><span className="lp-mini-bar-label">Asian</span><div className="lp-mini-bar-track"><div className="lp-mini-bar-fill" style={{ width: '34%' }}></div></div><span className="lp-mini-bar-val">31% WR</span></div>
                <div className="lp-mini-bar-row"><span className="lp-mini-bar-label">Overlap</span><div className="lp-mini-bar-track"><div className="lp-mini-bar-fill" style={{ width: '76%' }}></div></div><span className="lp-mini-bar-val">68% WR</span></div>
              </div>
            </div>
            <div className="lp-bento-card lp-reveal lp-delay-2">
              <div className="lp-bento-icon">🔍</div>
              <h3>Leak Detection</h3>
              <p>Automatically identifies instruments, sessions, and behaviours secretly sabotaging your results — revenge trades, overtrading, plan violations — and tells you exactly what to cut.</p>
            </div>
            <div className="lp-bento-card lp-reveal lp-delay-3">
              <div className="lp-bento-icon">🤖</div>
              <h3>AI Advisor</h3>
              <p>Ask anything about your trading. Full context of your last 50 trades, win rates, and behavioural patterns. Direct, data-backed answers powered by Claude (Anthropic).</p>
            </div>
            <div className="lp-bento-card lp-reveal lp-delay-1">
              <div className="lp-bento-icon">⚡</div>
              <h3>Strategy Optimizer</h3>
              <p>Simulate removing any instrument, session, or filter and instantly see how your equity curve changes. Know exactly what's worth trading before you risk another dollar.</p>
            </div>
            <div className="lp-bento-card lp-reveal lp-delay-2">
              <div className="lp-bento-icon">📋</div>
              <h3>Trading Plan Enforcement</h3>
              <p>Set your own pre-trade checklist. EdgeFlow tracks every time you broke your own rules — and shows the P&L impact of each violation in plain numbers.</p>
            </div>
            <div className="lp-bento-card lp-reveal lp-delay-3">
              <div className="lp-bento-icon">🗓</div>
              <h3>Daily Journal</h3>
              <p>Log session notes, mood, and key lessons daily. 14-day history panel lets you spot the mental patterns behind your best and worst trading days.</p>
            </div>
            <div className="lp-bento-card lp-reveal lp-delay-1">
              <div className="lp-bento-icon">🏦</div>
              <h3>Multiple Accounts</h3>
              <p>Track live, demo, and prop firm accounts separately. Switch between them instantly or analyse all accounts in aggregate with one click.</p>
            </div>
            <div className="lp-bento-card lp-reveal lp-delay-2">
              <div className="lp-bento-icon">📄</div>
              <h3>PDF Performance Reports</h3>
              <p>Export a branded performance report with equity curve, session breakdown, and full trade list — ready to share with mentors or prop firm evaluators.</p>
            </div>
            <div className="lp-bento-card lp-reveal lp-delay-3">
              <div className="lp-bento-icon">📥</div>
              <h3>CSV Import</h3>
              <p>Import directly from MT4/MT5 export files, or use the generic CSV mode for any other broker. No API keys or third-party connections required.</p>
            </div>
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
                <li><span className="lp-icon">✗</span> Spreadsheets that take hours to maintain</li>
                <li><span className="lp-icon">✗</span> No idea which setups are actually profitable</li>
                <li><span className="lp-icon">✗</span> Repeating the same costly mistakes every week</li>
                <li><span className="lp-icon">✗</span> Guessing what session or instrument to trade</li>
                <li><span className="lp-icon">✗</span> Emotional decisions after losing streaks</li>
                <li><span className="lp-icon">✗</span> No accountability to your own trading rules</li>
              </ul>
            </div>
            <div className="lp-compare-card after lp-reveal-right">
              <div className="lp-compare-badge">✦ With EdgeFlow</div>
              <h3>Data-driven edge</h3>
              <ul className="lp-compare-list">
                <li><span className="lp-icon" style={{ color: 'rgb(140,255,46)' }}>✓</span> Trades logged in seconds — manual or CSV import</li>
                <li><span className="lp-icon" style={{ color: 'rgb(140,255,46)' }}>✓</span> Clear P&L breakdown by instrument, session &amp; strategy</li>
                <li><span className="lp-icon" style={{ color: 'rgb(140,255,46)' }}>✓</span> Leaks identified and fixed systematically</li>
                <li><span className="lp-icon" style={{ color: 'rgb(140,255,46)' }}>✓</span> Know your best session before you open a chart</li>
                <li><span className="lp-icon" style={{ color: 'rgb(140,255,46)' }}>✓</span> AI Advisor keeps you objective and disciplined</li>
                <li><span className="lp-icon" style={{ color: 'rgb(140,255,46)' }}>✓</span> Pre-trade checklist enforces your own rules</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="lp-testimonials-section">
        <div className="lp-container">
          <div className="lp-reveal">
            <div className="lp-section-kicker"><span className="lp-section-kicker-dot"></span> Hear from our traders</div>
            <h2 className="lp-section-title">Loved by traders<br/>at every level</h2>
          </div>
        </div>
        <div className="lp-testi-marquee-wrap lp-reveal">
          <div className="lp-testi-marquee-track">
            {doubled.map((t, i) => (
              <div className="lp-testi-card" key={i}>
                <div className="lp-testi-stars">{'★★★★★'.split('').map((s, j) => <span key={j} className="lp-star">{s}</span>)}</div>
                <p className="lp-testi-quote">"{t.quote}"</p>
                <div className="lp-testi-author">
                  <div className="lp-testi-avatar">{t.initials}</div>
                  <div>
                    <div className="lp-testi-name">{t.name}</div>
                    <div className="lp-testi-role">{t.role}</div>
                  </div>
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
              <div className="lp-price-per">Free forever</div>
              <div className="lp-price-divider"></div>
              <ul className="lp-price-features">
                <li><span className="lp-price-check">✓</span> Unlimited trade logging</li>
                <li><span className="lp-price-check">✓</span> Equity curve &amp; calendar</li>
                <li><span className="lp-price-check">✓</span> Basic P&amp;L analytics</li>
                <li><span className="lp-price-check">✓</span> Manual trade entry</li>
                <li><span className="lp-price-check">✓</span> CSV import</li>
                <li><span className="lp-price-check">✓</span> Multiple accounts</li>
              </ul>
              <button className="lp-btn-price basic" onClick={() => navigate('/auth')}>Get started free</button>
            </div>

            <div className="lp-price-card pro lp-reveal" style={{ position: 'relative' }}>
              <div className="lp-price-popular">Most popular</div>
              <div className="lp-price-badge">Pro</div>
              <div className="lp-price-amount">$12</div>
              <div className="lp-price-per">per month · cancel anytime</div>
              <div className="lp-price-divider"></div>
              <ul className="lp-price-features">
                <li><span className="lp-price-check">✓</span> Everything in Starter</li>
                <li><span className="lp-price-check">✓</span> Session &amp; instrument analytics</li>
                <li><span className="lp-price-check">✓</span> AI Advisor (Claude powered)</li>
                <li><span className="lp-price-check">✓</span> Leak Detection</li>
                <li><span className="lp-price-check">✓</span> Trading Plan enforcement</li>
                <li><span className="lp-price-check">✓</span> Strategy Optimizer</li>
                <li><span className="lp-price-check">✓</span> PDF performance reports</li>
                <li><span className="lp-price-check">✓</span> Daily journal &amp; behavioral tracking</li>
              </ul>
              <button className="lp-btn-price pro" onClick={() => navigate('/auth')}>Get Pro</button>
            </div>

            <div className="lp-price-card elite lp-reveal-right">
              <div className="lp-price-badge">Elite</div>
              <div className="lp-price-amount">$24</div>
              <div className="lp-price-per">per month · cancel anytime</div>
              <div className="lp-price-divider"></div>
              <ul className="lp-price-features">
                <li><span className="lp-price-check">✓</span> Everything in Pro</li>
                <li><span className="lp-price-check">✓</span> Prop firm challenge tracking</li>
                <li><span className="lp-price-check">✓</span> Per-phase drawdown limits</li>
                <li><span className="lp-price-check">✓</span> Advanced behavioral scoring</li>
                <li><span className="lp-price-check">✓</span> Priority AI responses</li>
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
          <p>Stop guessing. Start with your own trade history and discover exactly where your edge is — and where it isn't. Takes 2 minutes to set up.</p>
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
