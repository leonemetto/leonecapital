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
    a: 'EdgeFlow supports CSV import from all major brokers including NinjaTrader, TradingView, MetaTrader 4/5, Interactive Brokers, Tradovate, OANDA, and more. Manual entry is available for any broker. Works for futures, forex, stocks, options, crypto, and indices.',
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
    a: 'The AI Advisor is powered by Gemini and has full context of your last 50 trades, win rates, P&L breakdown, and behavioural patterns. Ask it anything about your trading — it gives direct, data-backed answers. Available on Pro after 10 logged trades.',
  },
  {
    q: 'Can I cancel my subscription at any time?',
    a: 'Yes — no contracts, no cancellation fees. Cancel anytime and retain Pro or Elite access until the end of your billing period. Your trade data is always yours to keep, and you can export it as CSV at any time.',
  },
];

const PREVIEW_TABS = ['Dashboard', 'Analytics', 'AI Advisor', 'Leak Detection', 'Optimizer'];

export default function Landing() {
  const navigate = useNavigate();
  const heroWrapRef = useRef<HTMLDivElement>(null);
  const heroGlowRef = useRef<HTMLDivElement>(null);
  const heroContainerRef = useRef<HTMLDivElement>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  // Scroll tilt animation
  useEffect(() => {
    const heroWrap = heroWrapRef.current;
    const heroGlow = heroGlowRef.current;
    const heroContainer = heroContainerRef.current;
    if (!heroWrap || !heroGlow || !heroContainer) return;

    let currentRotate = 22, currentScale = 0.96, currentGlow = 0;
    let targetRotate = 22, targetScale = 0.96, targetGlow = 0;
    let rafId: number;

    function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

    function updateTarget() {
      const rect = heroContainer.getBoundingClientRect();
      const viewH = window.innerHeight;
      const total = rect.height + viewH;
      const scrolled = viewH - rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / total));
      const eased = 1 - Math.pow(1 - progress, 2.2);
      targetRotate = lerp(22, 0, eased);
      targetScale = lerp(0.96, 1.02, eased);
      targetGlow = eased > 0.5 ? (eased - 0.5) * 2 : 0;
    }

    function animate() {
      currentRotate += (targetRotate - currentRotate) * 0.09;
      currentScale += (targetScale - currentScale) * 0.09;
      currentGlow += (targetGlow - currentGlow) * 0.09;
      heroWrap.style.transform = `rotateX(${currentRotate.toFixed(3)}deg) scale(${currentScale.toFixed(4)})`;
      heroGlow.style.opacity = currentGlow.toFixed(3);
      rafId = requestAnimationFrame(animate);
    }

    window.addEventListener('scroll', updateTarget, { passive: true });
    updateTarget();
    animate();

    return () => {
      window.removeEventListener('scroll', updateTarget);
      cancelAnimationFrame(rafId);
    };
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
      <nav className="lp-nav">
        <div className="lp-nav-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="lp-nav-logo-mark">
            <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 11L6 7L9 10L14 4" stroke="#050505" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M11 4H14V7" stroke="#050505" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          EdgeFlow
        </div>

        <ul className="lp-nav-links">
          <li><a href="#how">How it works</a></li>
          <li><a href="#features">Features</a></li>
          <li><a href="#pricing">Pricing</a></li>
          <li><a href="#faq">FAQ</a></li>
        </ul>

        <div className="lp-nav-actions">
          <button className="lp-btn-ghost" onClick={() => navigate('/auth')}>Log in</button>
          <button className="lp-btn-primary" onClick={() => navigate('/auth')}>Start free →</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-hero-kicker">
          <span className="lp-hero-kicker-dot"></span>
          Free to start — no credit card needed
        </div>
        <h1>Trade smarter.<br/>Grow your <em>edge.</em></h1>
        <p className="lp-hero-sub">
          EdgeFlow is the trading journal built for serious traders. Log every trade, find your edge, and eliminate the habits killing your P&L — powered by AI.
        </p>
        <div className="lp-hero-ctas">
          <button className="lp-btn-primary-lg" onClick={() => navigate('/auth')}>Start for free</button>
          <a href="#pricing" className="lp-btn-secondary-lg">See pricing</a>
        </div>

        <div className="lp-hero-scroll-container" ref={heroContainerRef}>
          <div className="lp-hero-scroll-inner">
            <div className="lp-hero-image-wrap" ref={heroWrapRef}>
              <div className="lp-hero-image-glow" ref={heroGlowRef}></div>
              <div className="lp-hero-image-border">
                <div className="lp-hero-browser-bar">
                  <div className="lp-hero-browser-dots">
                    <div className="lp-hero-browser-dot" style={{ background: '#ff5f57' }}></div>
                    <div className="lp-hero-browser-dot" style={{ background: '#febc2e' }}></div>
                    <div className="lp-hero-browser-dot" style={{ background: '#28c840' }}></div>
                  </div>
                  <div className="lp-hero-browser-bar-url">leone.capital/dashboard</div>
                </div>
                <img src="/app-screenshot.png" alt="EdgeFlow dashboard — equity curve, session performance, and trade log" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LOGOS STRIP */}
      <div className="lp-logos-strip">
        <div className="lp-logos-strip-inner">
          <span className="lp-logos-label">Import trades from</span>
          <span className="lp-logo-item">MetaTrader 4 / 5</span>
          <span className="lp-logo-item">TradingView</span>
          <span className="lp-logo-item">NinjaTrader</span>
          <span className="lp-logo-item">Interactive Brokers</span>
          <span className="lp-logo-item">OANDA</span>
          <span className="lp-logo-item">Any CSV broker</span>
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
                <div className="lp-mock-row">
                  <span className="lp-mock-dot" style={{ background: 'rgb(140,255,46)' }}></span>
                  <div className="lp-mock-line" style={{ flex: 1, background: 'rgba(255,255,255,0.08)' }}></div>
                  <span className="lp-mock-tag" style={{ background: 'rgba(140,255,46,0.12)', color: 'rgb(140,255,46)' }}>WIN</span>
                  <span className="lp-mock-val" style={{ color: 'rgb(140,255,46)' }}>+$340</span>
                </div>
                <div className="lp-mock-row">
                  <span className="lp-mock-dot" style={{ background: 'rgb(255,80,80)' }}></span>
                  <div className="lp-mock-line" style={{ flex: 1, background: 'rgba(255,255,255,0.08)' }}></div>
                  <span className="lp-mock-tag" style={{ background: 'rgba(255,80,80,0.12)', color: 'rgb(255,80,80)' }}>LOSS</span>
                  <span className="lp-mock-val" style={{ color: 'rgb(255,80,80)' }}>−$120</span>
                </div>
                <div className="lp-mock-row">
                  <span className="lp-mock-dot" style={{ background: 'rgb(140,255,46)' }}></span>
                  <div className="lp-mock-line" style={{ flex: 1, background: 'rgba(255,255,255,0.08)' }}></div>
                  <span className="lp-mock-tag" style={{ background: 'rgba(140,255,46,0.12)', color: 'rgb(140,255,46)' }}>WIN</span>
                  <span className="lp-mock-val" style={{ color: 'rgb(140,255,46)' }}>+$210</span>
                </div>
              </div>
              <div className="lp-step-body">
                <div className="lp-step-num">01</div>
                <h3>Log your trades</h3>
                <p>Enter trades manually in seconds, or import a CSV from your broker. Works with MT4/MT5, TradingView, NinjaTrader, and more. No API keys required.</p>
              </div>
            </div>

            <div className="lp-step-card lp-reveal lp-delay-2">
              <div className="lp-step-mockup">
                <div className="lp-mock-row">
                  <div className="lp-mock-bar-wrap"><div className="lp-mock-bar" style={{ width: '88%', background: 'rgb(140,255,46)' }}></div></div>
                  <span className="lp-mock-val" style={{ color: 'rgb(140,255,46)' }}>72%</span>
                </div>
                <div className="lp-mock-row">
                  <div className="lp-mock-bar-wrap"><div className="lp-mock-bar" style={{ width: '58%', background: 'rgba(140,255,46,0.6)' }}></div></div>
                  <span className="lp-mock-val" style={{ color: 'rgba(140,255,46,0.7)' }}>54%</span>
                </div>
                <div className="lp-mock-row">
                  <div className="lp-mock-bar-wrap"><div className="lp-mock-bar" style={{ width: '28%', background: 'rgb(255,80,80)' }}></div></div>
                  <span className="lp-mock-val" style={{ color: 'rgb(255,80,80)' }}>28%</span>
                </div>
              </div>
              <div className="lp-step-body">
                <div className="lp-step-num">02</div>
                <h3>Analyse your performance</h3>
                <p>EdgeFlow surfaces win rates, expectancy, and P&L breakdowns by session, instrument, strategy, and direction — so you see exactly where your edge lives.</p>
              </div>
            </div>

            <div className="lp-step-card lp-reveal lp-delay-3">
              <div className="lp-step-mockup">
                <div className="lp-mock-row" style={{ background: 'rgba(255,80,80,0.06)', border: '1px solid rgba(255,80,80,0.15)' }}>
                  <span style={{ fontSize: 12, color: 'rgb(255,100,100)', fontWeight: 700 }}>⚠ Revenge trades detected</span>
                </div>
                <div className="lp-mock-row" style={{ background: 'rgba(255,160,0,0.06)', border: '1px solid rgba(255,160,0,0.15)' }}>
                  <span style={{ fontSize: 12, color: 'rgb(255,180,0)', fontWeight: 700 }}>⚠ Overtrading on Fridays</span>
                </div>
                <div className="lp-mock-row">
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Asian session win rate: 28%</span>
                </div>
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
            <div className="lp-stat-num">6<span>+</span></div>
            <div className="lp-stat-label">Broker import formats</div>
          </div>
          <div className="lp-reveal-scale lp-delay-3">
            <div className="lp-stat-num">AI</div>
            <div className="lp-stat-label">Gemini-powered advisor</div>
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
              <div className="lp-preview-url">
                leone.capital/{['dashboard', 'analyst', 'ai', 'leak-detection', 'what-if'][activeTab]}
              </div>
            </div>

            {/* Dashboard — real screenshot */}
            <div className={`lp-preview-body${activeTab === 0 ? ' active' : ''}`}>
              <img src="/app-screenshot.png" alt="EdgeFlow dashboard" />
            </div>

            {/* Analytics mockup */}
            <div className={`lp-preview-body${activeTab === 1 ? ' active' : ''}`}>
              <div className="lp-mock-analytics">
                <div className="lp-mock-analytics-title">Performance by Instrument</div>
                <table className="lp-mock-table">
                  <thead>
                    <tr>
                      <th>Instrument</th>
                      <th>Trades</th>
                      <th>Win %</th>
                      <th>Avg R</th>
                      <th>Expectancy</th>
                      <th>Net P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>EURUSD</td><td>38</td>
                      <td><span className="lp-mock-badge pos">72%</span></td>
                      <td className="lp-mock-pos">1.8R</td>
                      <td className="lp-mock-pos">+0.42</td>
                      <td className="lp-mock-pos">+$2,840</td>
                    </tr>
                    <tr>
                      <td>NQ Futures</td><td>24</td>
                      <td><span className="lp-mock-badge pos">63%</span></td>
                      <td className="lp-mock-pos">1.4R</td>
                      <td className="lp-mock-pos">+0.28</td>
                      <td className="lp-mock-pos">+$1,420</td>
                    </tr>
                    <tr>
                      <td>GBPUSD</td><td>19</td>
                      <td><span className="lp-mock-badge" style={{ background: 'rgba(255,160,0,0.12)', color: 'rgb(255,180,0)' }}>47%</span></td>
                      <td className="lp-mock-neg">0.9R</td>
                      <td className="lp-mock-neg">−0.06</td>
                      <td className="lp-mock-neg">−$340</td>
                    </tr>
                    <tr>
                      <td>XAUUSD</td><td>15</td>
                      <td><span className="lp-mock-badge neg">33%</span></td>
                      <td className="lp-mock-neg">0.7R</td>
                      <td className="lp-mock-neg">−0.24</td>
                      <td className="lp-mock-neg">−$890</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* AI Advisor mockup */}
            <div className={`lp-preview-body${activeTab === 2 ? ' active' : ''}`}>
              <div className="lp-mock-ai">
                <div className="lp-mock-ai-header">
                  <span className="lp-mock-ai-status"></span>
                  AI Advisor
                </div>
                <div className="lp-chat-msg ai">
                  <div className="lp-chat-avatar">AI</div>
                  <div className="lp-chat-bubble">Your XAUUSD trades have a 33% win rate and negative expectancy of −0.24R across 15 trades. That's not a sample size problem — it's a pattern. You're entering on Asian session breakouts but your edge only shows up in London open reversals. I'd recommend pausing XAUUSD until you define a specific entry for that session.</div>
                </div>
                <div className="lp-chat-msg user">
                  <div className="lp-chat-avatar">Y</div>
                  <div className="lp-chat-bubble">Why do I keep losing on Fridays?</div>
                </div>
                <div className="lp-chat-msg ai">
                  <div className="lp-chat-avatar">AI</div>
                  <div className="lp-chat-bubble">Friday trades make up 22% of your volume but only 11% of your profits. Your Friday win rate is 38% vs 64% Mon–Thu. The pattern: you're taking trades after 14:00 EST when liquidity drops. Your losing Friday trades average −1.4R vs your average −0.9R. Cut Friday afternoon trading and you reclaim roughly $600/month.</div>
                </div>
              </div>
            </div>

            {/* Leak Detection mockup */}
            <div className={`lp-preview-body${activeTab === 3 ? ' active' : ''}`}>
              <div className="lp-mock-leaks">
                <div className="lp-mock-leak-card">
                  <div className="lp-mock-leak-header">
                    <div className="lp-mock-leak-title">XAUUSD — Negative Expectancy</div>
                    <div className="lp-mock-leak-badge">−0.24R</div>
                  </div>
                  <div className="lp-mock-leak-desc">15 trades with a 33% win rate. This instrument is actively losing you money. Your edge on other pairs doesn't transfer here.</div>
                  <div className="lp-mock-leak-stats">
                    <div className="lp-mock-leak-stat"><span>Win rate</span><span>33%</span></div>
                    <div className="lp-mock-leak-stat"><span>Net loss</span><span>−$890</span></div>
                    <div className="lp-mock-leak-stat"><span>Trades</span><span>15</span></div>
                  </div>
                </div>
                <div className="lp-mock-leak-card warn">
                  <div className="lp-mock-leak-header">
                    <div className="lp-mock-leak-title">Friday Afternoon Trading</div>
                    <div className="lp-mock-leak-badge">Warning</div>
                  </div>
                  <div className="lp-mock-leak-desc">Win rate drops to 38% after 14:00 EST on Fridays. Liquidity thins out and your setups stop working in this window.</div>
                  <div className="lp-mock-leak-stats">
                    <div className="lp-mock-leak-stat"><span>Win rate</span><span>38%</span></div>
                    <div className="lp-mock-leak-stat"><span>Avg loss</span><span>−1.4R</span></div>
                    <div className="lp-mock-leak-stat"><span>Trades</span><span>11</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Optimizer mockup */}
            <div className={`lp-preview-body${activeTab === 4 ? ' active' : ''}`}>
              <div className="lp-mock-optimizer">
                <div className="lp-mock-optimizer-title">Strategy Optimizer</div>
                <div className="lp-mock-optimizer-sub">Simulate removing a filter and see the equity curve impact</div>
                <div className="lp-mock-curve">
                  <svg viewBox="0 0 400 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="og1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(140,255,46,0.3)" />
                        <stop offset="100%" stopColor="rgba(140,255,46,0)" />
                      </linearGradient>
                    </defs>
                    <path d="M0 80 L40 72 L80 65 L120 55 L160 48 L200 38 L240 45 L280 30 L320 20 L360 12 L400 5" stroke="rgb(140,255,46)" strokeWidth="2" fill="none" />
                    <path d="M0 80 L40 72 L80 65 L120 55 L160 48 L200 38 L240 45 L280 30 L320 20 L360 12 L400 5 L400 100 L0 100Z" fill="url(#og1)" />
                    <path d="M0 80 L40 78 L80 82 L120 78 L160 80 L200 85 L240 90 L280 87 L320 92 L360 95 L400 98" stroke="rgba(255,80,80,0.4)" strokeWidth="1.5" fill="none" strokeDasharray="4 4" />
                  </svg>
                </div>
                <div className="lp-mock-filter-list">
                  <div className="lp-mock-filter-row">
                    <span className="lp-mock-filter-label">Remove XAUUSD trades</span>
                    <span className="lp-mock-filter-delta" style={{ color: 'rgb(140,255,46)' }}>+$890 profit recovered</span>
                  </div>
                  <div className="lp-mock-filter-row">
                    <span className="lp-mock-filter-label">Remove Friday afternoon trades</span>
                    <span className="lp-mock-filter-delta" style={{ color: 'rgb(140,255,46)' }}>+22% win rate</span>
                  </div>
                  <div className="lp-mock-filter-row">
                    <span className="lp-mock-filter-label">Remove Asian session only</span>
                    <span className="lp-mock-filter-delta" style={{ color: 'rgba(255,255,255,0.4)' }}>−12 trades, +6% win rate</span>
                  </div>
                </div>
              </div>
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
              <p>Automatically identifies instruments, sessions, and behaviours secretly sabotaging your results — revenge trades, overtrading, plan violations.</p>
              <div className="lp-metric">−23%</div>
              <div className="lp-metric-label">avg. drawdown after 30 days</div>
            </div>
            <div className="lp-bento-card lp-reveal lp-delay-3">
              <div className="lp-bento-icon">🤖</div>
              <h3>AI Advisor</h3>
              <p>Ask anything about your trading. Full context of your last 50 trades, win rates, and behavioural patterns. Plain-language answers powered by Gemini.</p>
            </div>
            <div className="lp-bento-card lp-reveal lp-delay-1">
              <div className="lp-bento-icon">⚡</div>
              <h3>Strategy Optimizer</h3>
              <p>Simulate removing any instrument, session, or filter and instantly see how your equity curve changes. Know exactly what's worth trading.</p>
            </div>
            <div className="lp-bento-card lp-reveal lp-delay-2">
              <div className="lp-bento-icon">📋</div>
              <h3>Trading Plan Enforcement</h3>
              <p>Set your own pre-trade checklist. EdgeFlow tracks every time you broke your own rules — and shows the win rate impact of each violation.</p>
            </div>
            <div className="lp-bento-card lp-reveal lp-delay-3">
              <div className="lp-bento-icon">🗓</div>
              <h3>Daily Journal</h3>
              <p>Log session notes, mood, and key lessons daily. 14-day history panel lets you spot the mental patterns behind your best and worst trading days.</p>
            </div>
            <div className="lp-bento-card lp-reveal lp-delay-1">
              <div className="lp-bento-icon">🏦</div>
              <h3>Multiple Accounts</h3>
              <p>Track live, demo, and prop firm accounts separately. Switch between them instantly or analyse all accounts in aggregate.</p>
            </div>
            <div className="lp-bento-card lp-reveal lp-delay-2">
              <div className="lp-bento-icon">📄</div>
              <h3>PDF Performance Reports</h3>
              <p>Export a branded performance report with equity curve, session breakdown, and full trade list — ready to share with mentors or prop firms.</p>
            </div>
            <div className="lp-bento-card lp-reveal lp-delay-3">
              <div className="lp-bento-icon">📥</div>
              <h3>CSV Import</h3>
              <p>Import from MT4/MT5, TradingView, NinjaTrader, Interactive Brokers, and any generic CSV. No manual re-entry needed.</p>
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
                <li><span className="lp-price-check">✓</span> AI Advisor (Gemini powered)</li>
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
          <h2>Ready to find your edge?</h2>
          <p>Stop guessing. Start with your own data and discover exactly where your edge is — and where it isn't.</p>
          <button className="lp-btn-primary-lg" onClick={() => navigate('/auth')}>Start for free — no credit card</button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-footer-top">
          <div className="lp-footer-brand">
            <div className="lp-nav-logo" style={{ cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="lp-nav-logo-mark">
                <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 11L6 7L9 10L14 4" stroke="#050505" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M11 4H14V7" stroke="#050505" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
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
    </div>
  );
}
