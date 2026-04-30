import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './landing.css';

const S = {
  panel: { background: '#141413', border: '1px solid #23221f', borderRadius: 12, overflow: 'hidden', fontFamily: "'Geist', system-ui, sans-serif", height: '100%', display: 'flex', flexDirection: 'column' as const },
  header: { padding: '12px 16px', borderBottom: '1px solid #23221f', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 13, fontWeight: 600, color: '#f2f0ea', letterSpacing: '-0.2px' },
  badge: (color: string) => ({ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: color === 'red' ? 'oklch(0.25 0.08 25)' : 'oklch(0.25 0.07 155)', color: color === 'red' ? 'oklch(0.65 0.18 25)' : 'oklch(0.65 0.17 155)' }),
  dot: (color: string) => ({ width: 6, height: 6, borderRadius: '50%', background: color === 'green' ? 'oklch(0.65 0.17 155)' : '#5a5852', display: 'inline-block', marginRight: 6 }),
  row: { padding: '14px 16px', borderBottom: '1px solid #23221f', display: 'flex', alignItems: 'center', gap: 12 },
  label: { fontSize: 12, fontWeight: 600, color: '#f2f0ea', letterSpacing: '-0.2px', marginBottom: 3 },
  sub: { fontSize: 11, color: '#5a5852' },
  neg: { fontSize: 13, fontWeight: 700, color: 'oklch(0.65 0.18 25)', fontFamily: "'Geist Mono', monospace", marginLeft: 'auto' as const, flexShrink: 0 },
  pos: { fontSize: 13, fontWeight: 700, color: 'oklch(0.65 0.17 155)', fontFamily: "'Geist Mono', monospace", marginLeft: 'auto' as const, flexShrink: 0 },
  pill: (color: string) => ({ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: color === 'red' ? 'oklch(0.25 0.08 25)' : '#1e1e1c', color: color === 'red' ? 'oklch(0.65 0.18 25)' : '#5a5852', fontWeight: 600 }),
};

function LeakMockup() {
  const leaks = [
    { combo: 'XAUUSD · New York', type: 'Instrument + Session', wr: '26%', exp: '−1.4R', trades: 11 },
    { combo: 'Long · Friday sessions', type: 'Direction + Day', wr: '31%', exp: '−0.9R', trades: 8 },
    { combo: 'EUR/USD · Asian overlap', type: 'Instrument + Session', wr: '29%', exp: '−0.7R', trades: 14 },
  ];
  return (
    <div style={S.panel}>
      <div style={S.header}>
        <span style={S.headerTitle}>Leak Detection</span>
        <span style={S.badge('red')}>3 leaks found</span>
      </div>
      <div style={{ padding: '10px 16px 6px', borderBottom: '1px solid #23221f' }}>
        <span style={{ fontSize: 11, color: '#5a5852' }}>Combinations with negative expectancy across your last 120 trades</span>
      </div>
      {leaks.map((l, i) => (
        <div key={i} style={{ ...S.row, alignItems: 'flex-start' }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: 'oklch(0.25 0.08 25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
            <span style={{ fontSize: 14, color: 'oklch(0.65 0.18 25)' }}>↓</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={S.label}>{l.combo}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <span style={S.pill('gray')}>{l.type}</span>
              <span style={{ fontSize: 11, color: '#5a5852' }}>{l.trades} trades</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'oklch(0.65 0.18 25)', fontFamily: 'monospace' }}>{l.exp}</div>
            <div style={{ fontSize: 11, color: '#5a5852', marginTop: 2 }}>{l.wr} win rate</div>
          </div>
        </div>
      ))}
      <div style={{ padding: '14px 16px', marginTop: 'auto' as const, borderTop: '1px solid #23221f', background: 'rgba(255,255,255,0.01)' }}>
        <div style={{ fontSize: 12, color: '#908e87', lineHeight: 1.5 }}>
          <span style={{ color: 'oklch(0.65 0.18 25)', fontWeight: 700 }}>Estimated impact: </span>
          Removing these 3 leaks improves your monthly expectancy by <span style={{ color: '#f2f0ea', fontWeight: 600 }}>+0.8R</span>
        </div>
      </div>
    </div>
  );
}

function AtlasMockup() {
  return (
    <div style={S.panel}>
      <div style={S.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={S.dot('green')} />
          <span style={S.headerTitle}>Atlas</span>
        </div>
        <span style={{ fontSize: 11, color: '#5a5852' }}>120 trades loaded</span>
      </div>
      <div style={{ flex: 1, overflowY: 'hidden' as const, padding: '16px', display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
        <div style={{ alignSelf: 'flex-end' as const, background: '#1e1e1c', border: '1px solid #23221f', borderRadius: '12px 12px 4px 12px', padding: '10px 14px', maxWidth: '80%' }}>
          <p style={{ fontSize: 13, color: '#cfcdc5', lineHeight: 1.6, margin: 0 }}>Why is my win rate dropping on Mondays?</p>
        </div>
        <div style={{ alignSelf: 'flex-start' as const, background: 'oklch(0.25 0.07 155 / 0.3)', border: '1px solid oklch(0.65 0.17 155 / 0.15)', borderRadius: '4px 12px 12px 12px', padding: '10px 14px', maxWidth: '90%' }}>
          <p style={{ fontSize: 13, color: '#cfcdc5', lineHeight: 1.7, margin: 0 }}>
            Your Monday win rate is <span style={{ color: '#f2f0ea', fontWeight: 600 }}>31%</span> vs <span style={{ color: '#f2f0ea', fontWeight: 600 }}>58%</span> the rest of the week. The gap appears in the first 90 minutes of London open — 9 of your last 12 Monday losses came before 9:30am. You're trading before the range is established. Try a rule: no entries on Mondays before 9:30 London.
          </p>
        </div>
        <div style={{ alignSelf: 'flex-end' as const, background: '#1e1e1c', border: '1px solid #23221f', borderRadius: '12px 12px 4px 12px', padding: '10px 14px', maxWidth: '80%' }}>
          <p style={{ fontSize: 13, color: '#cfcdc5', lineHeight: 1.6, margin: 0 }}>What's my best performing session overall?</p>
        </div>
        <div style={{ alignSelf: 'flex-start' as const, background: 'oklch(0.25 0.07 155 / 0.3)', border: '1px solid oklch(0.65 0.17 155 / 0.15)', borderRadius: '4px 12px 12px 12px', padding: '10px 14px', maxWidth: '90%' }}>
          <p style={{ fontSize: 13, color: '#cfcdc5', lineHeight: 1.7, margin: 0 }}>
            London open — <span style={{ color: '#f2f0ea', fontWeight: 600 }}>64% win rate</span>, <span style={{ color: 'oklch(0.65 0.17 155)', fontWeight: 600 }}>+1.3R expectancy</span> across 48 trades. New York is dragging your overall stats down to 51%.
          </p>
        </div>
      </div>
      <div style={{ padding: '12px 16px', borderTop: '1px solid #23221f' }}>
        <div style={{ background: '#1e1e1c', border: '1px solid #23221f', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#5a5852' }}>
          Ask Atlas anything about your trading...
        </div>
      </div>
    </div>
  );
}

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
    a: 'Yes — EdgeFlow supports direct CSV import from MT4/MT5, TradingView, cTrader, Deriv, Binance, Bybit, OANDA, IG Markets, Interactive Brokers, TradeStation, Thinkorswim, NinjaTrader, and any generic CSV. Brokers like Exness, XM, Pepperstone, IC Markets, and HFM all export MT4/MT5 files — so they work too. Your historical data loads immediately and appears in all analytics from day one.',
  },
  {
    q: 'Is my trading data secure and private?',
    a: 'Your data is encrypted at rest and in transit, stored on SOC 2 compliant infrastructure (Supabase). Row-level security ensures no other user can ever access your trades. We never share, sell, or use your data for any purpose other than providing your analytics. Export or delete your data at any time.',
  },
  {
    q: 'How does the Atlas work?',
    a: 'The Atlas is powered by Claude (Anthropic) and has full context of your last 50 trades, win rates, P&L breakdown, session analytics, and behavioural patterns. Ask it anything about your trading — it gives direct, data-backed answers with no filler. Available on Pro after 10 logged trades.',
  },
  {
    q: 'Can I cancel my subscription at any time?',
    a: 'Yes — no contracts, no cancellation fees. Cancel anytime and retain Pro or Elite access until the end of your billing period. Your trade data is always yours to export as CSV at any time.',
  },
];

const FEATURE_GROUPS = [
  {
    heading: 'Track every trade',
    sub: 'Manual entry in seconds. Import from MT4/MT5, TradingView, cTrader, Binance, Bybit, OANDA, IBKR, and more. Screenshot at entry.',
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
      { name: 'Atlas', desc: 'Ask anything about your trading. Full context of your last 50 trades, win rates, and behavioural memory. Direct answers powered by Claude (Anthropic).' },
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

const TESTIMONIALS = [
  { quote: 'Found out my Friday New York session had a negative expectancy of −0.4R. Stopped trading it. My monthly P&L improved immediately.', name: 'James O.', role: 'Forex day trader' },
  { quote: 'The leak detection flagged a pattern I had no idea about — I was losing 30% more on trades taken after a gap open. That insight alone was worth it.', name: 'Priya S.', role: 'Futures trader' },
  { quote: 'I failed 3 prop firm challenges before EdgeFlow. It showed me I was overtrading on Thursdays. Passed the 4th challenge with 8% headroom left.', name: 'Tom K.', role: 'FTMO trader' },
  { quote: 'I used to keep a spreadsheet with 12 tabs. EdgeFlow does everything in seconds and surfaces things I would never have calculated manually.', name: 'Marcus L.', role: 'Swing trader, US equities' },
  { quote: 'The Atlas gave me a direct breakdown of my revenge trading pattern. Not motivational fluff — it showed me the actual R-multiple cost.', name: 'Aisha M.', role: 'Crypto trader' },
  { quote: 'I realised my Asian session win rate was 68% but I was only trading it 12% of the time. EdgeFlow made that obvious. Changed my whole schedule.', name: 'Daniel R.', role: 'FX scalper' },
  { quote: 'The plan enforcement checklist keeps me accountable. I can actually see what my win rate drops to when I break my own rules.', name: 'Sarah V.', role: 'Options trader' },
  { quote: 'Every serious trader needs this. I discovered I had a 74% win rate on London open but was cutting positions early and leaving 2R on the table.', name: 'Kwame A.', role: 'Gold and indices trader' },
];

const PREVIEW_TABS = ['Dashboard', 'Analytics', 'Atlas', 'Leak Detection', 'Optimizer'];
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
  'EdgeFlow Atlas — Claude-powered trading coach with full trade context',
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
  const [annualBilling, setAnnualBilling] = useState(false);

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

  /* Count-up: animate numeric values in .lp-count-up when they scroll into view */
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('#lp .lp-count-up');
    if (!els.length) return;
    function countUp(el: HTMLElement) {
      const target = parseFloat(el.dataset.target ?? '0');
      const suffix = el.dataset.suffix ?? '';
      const prefix = el.dataset.prefix ?? '';
      const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals) : 0;
      const duration = 900;
      const start = performance.now();
      function frame(now: number) {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        const val = target * eased;
        el.textContent = prefix + val.toFixed(decimals) + suffix;
        if (t < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          countUp(entry.target as HTMLElement);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    els.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div id="lp">
      {/* NAV */}
      <nav className={`lp-nav${navScrolled ? ' scrolled' : ''}`}>
        <div className="lp-nav-logo" onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setMobileMenuOpen(false); }}>
          <svg className="lp-nav-logo-mark" width="22" height="22" viewBox="0 0 20 20" fill="none" aria-hidden style={{ color: 'rgb(140,255,46)', flexShrink: 0 }}>
            <line x1="3" y1="3" x2="3" y2="17" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square"/>
            <line x1="3" y1="3" x2="16" y2="3" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square"/>
            <line x1="3" y1="10" x2="12" y2="10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square"/>
            <line x1="12" y1="10" x2="16" y2="6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square"/>
            <line x1="3" y1="17" x2="16" y2="17" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square"/>
          </svg>
          EdgeFlow
        </div>
        <ul className="lp-nav-links">
          <li><a href="#how" onClick={() => setMobileMenuOpen(false)}>How it works</a></li>
          <li><a href="#preview" onClick={() => setMobileMenuOpen(false)}>Features</a></li>
          <li><a href="#brokers" onClick={() => setMobileMenuOpen(false)}>Brokers</a></li>
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
        <a href="#preview" onClick={() => setMobileMenuOpen(false)}>Features</a>
        <a href="#brokers" onClick={() => setMobileMenuOpen(false)}>Brokers</a>
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
        <h1>Your edge is in your data.<br/><em>EdgeFlow finds it.</em></h1>
        <p className="lp-hero-sub">
          Log every trade. EdgeFlow automatically surfaces where your edge is, where it leaks, and exactly what to fix — no spreadsheets, no guesswork.
        </p>
        <div className="lp-hero-ctas">
          <button className="lp-btn-primary-lg" onClick={() => navigate('/auth')}>
            Analyse my trades free<span className="lp-cta-arrow-wrap">→</span>
          </button>
          <a href="#how" className="lp-btn-secondary-lg">See how it works</a>
        </div>
        <div className="lp-hero-trust">
          <span className="lp-hero-trust-item">No credit card needed</span>
          <span className="lp-hero-trust-item">50 trades on the free tier</span>
          <span className="lp-hero-trust-item">Set up in under 5 minutes</span>
        </div>

        <a href="#preview" className="lp-hero-scroll-hint" aria-label="See it in action">
          <span className="lp-hero-scroll-label">See it in action</span>
          <span className="lp-hero-scroll-arrow">↓</span>
        </a>

        <div className="lp-hero-tilt-glow"></div>

        <div className="lp-hero-tilt-wrap">
          <div className="lp-hero-tilt-inner" ref={tiltInnerRef}>
            <div className="lp-hero-preview-bezel">
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
        </div>
      </section>

      {/* HERO STRIP */}
      <div className="lp-hero-strip">
        <div className="lp-hero-strip-item">
          <div className="lp-hero-strip-num"><span className="lp-count-up" data-target="20" data-suffix="+">20+</span></div>
          <div className="lp-hero-strip-label">Data points captured per trade</div>
        </div>
        <div className="lp-hero-strip-item">
          <div className="lp-hero-strip-num"><span className="lp-count-up" data-target="8" data-suffix="+">8+</span></div>
          <div className="lp-hero-strip-label">Performance breakdowns built in</div>
        </div>
        <div className="lp-hero-strip-item">
          <div className="lp-hero-strip-num" style={{ color: 'var(--lp-green)' }}>AI</div>
          <div className="lp-hero-strip-label">Powered by Claude (Anthropic)</div>
        </div>
        <div className="lp-hero-strip-item">
          <div className="lp-hero-strip-num"><span className="lp-count-up" data-target="0" data-prefix="$">$0</span></div>
          <div className="lp-hero-strip-label">Free to start — no card needed</div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section id="how">
        <div className="lp-container">
          <div className="lp-reveal">
            <div className="lp-section-kicker"><span className="lp-section-kicker-dot"></span> How it works</div>
            <h2 className="lp-section-title">Three steps from<br/>trade to edge.</h2>
            <p className="lp-section-sub">Log it. Analyse it. Cut what's losing and double down on what works.</p>
          </div>
          <div className="lp-steps-grid">
            <div className="lp-step-card lp-reveal lp-delay-1">
              <div className="lp-step-mockup">
                <img src="/screenshot-trades.webp" alt="Trades DB — log and review all your trades" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', borderRadius: 6 }} />
              </div>
              <div className="lp-step-body">
                <div className="lp-step-num">01</div>
                <h3>Log your trades</h3>
                <p>Enter trades manually in seconds, or import a CSV from your broker. Supports MT4/MT5, TradingView, cTrader, Binance, Bybit, OANDA, IG, IBKR, Thinkorswim, TradeStation, NinjaTrader, and more. No API keys, no setup.</p>
              </div>
            </div>
            <div className="lp-step-card lp-reveal lp-delay-2">
              <div className="lp-step-mockup lp-step-mockup--code">
                {/* Analytics mockup */}
                <div className="lp-mock-analytics">
                  <div className="lp-mock-analytics-header">
                    <span>Instrument</span><span>Win %</span><span>Expect.</span>
                  </div>
                  {[
                    { name: 'EURUSD', win: 71, exp: '+2.4R', pos: true },
                    { name: 'NAS100', win: 64, exp: '+1.8R', pos: true },
                    { name: 'GBPUSD', win: 58, exp: '+0.6R', pos: true },
                    { name: 'XAUUSD', win: 38, exp: '−1.2R', pos: false },
                    { name: 'US30',   win: 31, exp: '−2.1R', pos: false },
                  ].map(row => (
                    <div className="lp-mock-analytics-row" key={row.name}>
                      <span className="lp-mock-analytics-name">{row.name}</span>
                      <span className="lp-mock-analytics-bar-wrap">
                        <span className="lp-mock-analytics-bar" style={{ width: `${row.win}%`, background: row.pos ? 'rgba(140,255,46,0.7)' : 'rgba(248,113,113,0.7)' }} />
                        <span className="lp-mock-analytics-bar-label">{row.win}%</span>
                      </span>
                      <span style={{ color: row.pos ? 'rgb(140,255,46)' : '#f87171', fontFamily: 'monospace', fontSize: 11 }}>{row.exp}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lp-step-body">
                <div className="lp-step-num">02</div>
                <h3>Analyse your performance</h3>
                <p>EdgeFlow surfaces win rates, expectancy, and P&L breakdowns by session, instrument, strategy, and direction — so you see exactly where your edge lives and where it doesn't.</p>
              </div>
            </div>
            <div className="lp-step-card lp-reveal lp-delay-3">
              <div className="lp-step-mockup lp-step-mockup--code">
                {/* Leak detection mockup */}
                <div className="lp-mock-leaks">
                  <div className="lp-mock-leaks-title">Detected leaks <span className="lp-mock-leaks-badge">3</span></div>
                  {[
                    { label: 'Asian Session', detail: '31% WR · −$1,240', severity: 'high' },
                    { label: 'Revenge trading', detail: '−2.8R avg after loss', severity: 'high' },
                    { label: 'Friday trades', detail: '39% WR · −$480', severity: 'med' },
                  ].map(leak => (
                    <div className="lp-mock-leak-row" key={leak.label}>
                      <div className={`lp-mock-leak-dot lp-mock-leak-dot--${leak.severity}`} />
                      <div className="lp-mock-leak-info">
                        <div className="lp-mock-leak-name">{leak.label}</div>
                        <div className="lp-mock-leak-detail">{leak.detail}</div>
                      </div>
                      <div className="lp-mock-leak-tag">Cut</div>
                    </div>
                  ))}
                  <div className="lp-mock-leaks-atlas">
                    <span className="lp-mock-leaks-atlas-dot" />
                    <em>"Stop trading Asian session. Your edge is in London open."</em>
                  </div>
                </div>
              </div>
              <div className="lp-step-body">
                <div className="lp-step-num">03</div>
                <h3>Eliminate losing patterns</h3>
                <p>Use the Leak Detector and Atlas to pinpoint the specific behaviours draining your account — revenge trading, bad sessions, overtrading — and cut them precisely.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* APP PREVIEW */}
      <section id="preview" className="lp-preview-section">
        <div className="lp-container">
          <div className="lp-reveal">
            <div className="lp-section-kicker"><span className="lp-section-kicker-dot"></span> See it in action</div>
            <h2 className="lp-section-title">Your entire trading brain,<br/>in one tab.</h2>
            <p className="lp-section-sub">From trade log to leak detection to AI analyst — click through each tool below.</p>
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

      {/* LEAK DETECTION SPOTLIGHT */}
      <section className="lp-leak-section">
        <div className="lp-leak-copy lp-reveal">
          <div className="lp-section-kicker"><span className="lp-section-kicker-dot"></span> Unique to EdgeFlow</div>
          <h2 className="lp-leak-title">Find the exact leaks<br/>draining your edge.</h2>
          <p className="lp-leak-body">Most traders know something is off. They just can't pinpoint it. Leak Detection scans every combination of instrument, session, strategy, and direction — and surfaces only the ones with negative expectancy. Not a dashboard to explore. A diagnostic that tells you what to cut.</p>
          <ul className="lp-leak-list">
            <li>Negative-expectancy combinations flagged automatically</li>
            <li>Expectancy, win rate, and P&L per combination</li>
            <li>Simulate the impact of removing any leak on your equity curve</li>
            <li>No other journal does this</li>
          </ul>
          <button className="lp-btn-primary-lg" style={{ marginTop: 8 }} onClick={() => navigate('/auth')}>See your leaks free<span className="lp-cta-arrow-wrap">→</span></button>
        </div>
        <div className="lp-leak-visual lp-reveal">
          <div className="lp-leak-img-wrap">
            <LeakMockup />
          </div>
        </div>
      </section>

      {/* ATLAS SPOTLIGHT */}
      <section className="lp-atlas-section">
        <div className="lp-atlas-visual lp-reveal">
          <div className="lp-atlas-img-wrap">
            <AtlasMockup />
          </div>
        </div>
        <div className="lp-atlas-copy lp-reveal">
          <div className="lp-section-kicker"><span className="lp-section-kicker-dot"></span> Meet Atlas</div>
          <h2 className="lp-atlas-title">Your personal<br/>AI analyst.</h2>
          <p className="lp-atlas-body">Atlas has full context of every trade you've logged — win rates, expectancy by session, behavioral patterns, plan adherence, and your trader profile. Ask it anything. It gives direct, data-backed answers. No filler, no motivational fluff.</p>
          <ul className="lp-atlas-list">
            <li>Full context of your last 50 trades per message</li>
            <li>Identifies revenge trading, overtrading, and loss clustering</li>
            <li>Builds a behavioral memory across every conversation</li>
            <li>Powered by Claude (Anthropic)</li>
          </ul>
          <button className="lp-btn-primary-lg" style={{ marginTop: 8 }} onClick={() => navigate('/auth')}>Try Atlas free<span className="lp-cta-arrow-wrap">→</span></button>
        </div>
      </section>

      {/* WHO IS THIS FOR */}
      <section className="lp-for-section">
        <div className="lp-container">
          <div className="lp-reveal">
            <div className="lp-section-kicker"><span className="lp-section-kicker-dot"></span> Who it's for</div>
            <h2 className="lp-section-title">Built for traders who<br/>take data seriously.</h2>
          </div>
          <div className="lp-for-list lp-reveal">
            <div className="lp-for-item">
              <div className="lp-for-num">01</div>
              <div className="lp-for-content">
                <h3 className="lp-for-title">You're losing — and you don't know why.</h3>
                <p className="lp-for-body">You're following a system but the results don't add up. EdgeFlow's Leak Detection surfaces the exact instruments, sessions, and setups that are quietly draining your account — with expectancy numbers attached.</p>
              </div>
              <div className="lp-for-tag">Leak Detection</div>
            </div>
            <div className="lp-for-item">
              <div className="lp-for-num">02</div>
              <div className="lp-for-content">
                <h3 className="lp-for-title">You're breakeven — trying to go profitable.</h3>
                <p className="lp-for-body">The data is in your trades but you can't see the pattern. Atlas reads your full trade history and behavioral profile to tell you exactly what to cut and what to double down on.</p>
              </div>
              <div className="lp-for-tag">Atlas AI</div>
            </div>
            <div className="lp-for-item">
              <div className="lp-for-num">03</div>
              <div className="lp-for-content">
                <h3 className="lp-for-title">You're profitable — and want to scale.</h3>
                <p className="lp-for-body">Multiple accounts, prop firm challenges, PDF performance reports. EdgeFlow gives you the infrastructure to treat trading like a business — with multi-account analytics and full audit trails.</p>
              </div>
              <div className="lp-for-tag">Multi-account + PDF</div>
            </div>
          </div>
        </div>
      </section>

      {/* VS SPREADSHEET */}
      <section className="lp-vs-section">
        <div className="lp-container">
          <div className="lp-reveal" style={{ textAlign: 'center', marginBottom: 56 }}>
            <div className="lp-section-kicker" style={{ justifyContent: 'center' }}><span className="lp-section-kicker-dot"></span> Why not a spreadsheet?</div>
            <h2 className="lp-section-title">Your spreadsheet stores trades.<br/>EdgeFlow decodes them.</h2>
          </div>
          <div className="lp-vs-table lp-reveal">
            <div className="lp-vs-header">
              <div className="lp-vs-col-label lp-vs-label-bad">Your spreadsheet</div>
              <div className="lp-vs-col-label lp-vs-label-good">EdgeFlow</div>
            </div>
            {[
              ['Manual copy-paste after every trade', 'One-form entry — 20+ data points in under a minute'],
              ['SUM() formulas you built and maintain', 'Win rate, expectancy, profit factor, max drawdown — built in'],
              ['You have to notice your own patterns', 'Leak Detection flags negative-expectancy patterns automatically'],
              ['No behavioral data', 'Emotional state, plan adherence, and confidence tracked per trade'],
              ['No way to ask questions about your data', 'Atlas — AI analyst with full context of every trade you\'ve logged'],
              ['Another tab per account', 'Multi-account analytics, unified in one dashboard'],
              ['Screenshot of a chart', 'One-click PDF performance report'],
            ].map(([bad, good], i) => (
              <div key={i} className="lp-vs-row">
                <div className="lp-vs-cell lp-vs-cell-bad"><span className="lp-vs-icon">✕</span>{bad}</div>
                <div className="lp-vs-cell lp-vs-cell-good"><span className="lp-vs-icon">✓</span>{good}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS CAROUSEL */}
      <section className="lp-testimonials-section">
        <div className="lp-container">
          <div className="lp-reveal" style={{ textAlign: 'center' }}>
            <div className="lp-section-kicker" style={{ justifyContent: 'center' }}><span className="lp-section-kicker-dot"></span> From traders</div>
            <h2 className="lp-section-title">What traders are saying</h2>
          </div>
        </div>
        <div className="lp-testi-marquee-wrap lp-reveal">
          <div className="lp-testi-marquee-track">
            {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
              <div key={i} className="lp-testi-card">
                <div className="lp-testi-stars">{[...Array(5)].map((_, s) => <span key={s} className="lp-star">★</span>)}</div>
                <p className="lp-testi-quote">"{t.quote}"</p>
                <div className="lp-testi-author">
                  <div className="lp-testi-avatar">{t.name[0]}</div>
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

      {/* BROKERS */}
      <section id="brokers" className="lp-brokers-section">
        <div className="lp-container">
          <div className="lp-reveal" style={{ textAlign: 'center', marginBottom: 56 }}>
            <div className="lp-section-kicker" style={{ justifyContent: 'center' }}><span className="lp-section-kicker-dot"></span> Broker support</div>
            <h2 className="lp-section-title">Works with your broker.<br/>Already.</h2>
            <p className="lp-section-sub" style={{ margin: '0 auto', maxWidth: 520 }}>No integrations to set up. No API keys. Every major broker lets you export your trade history as a file — upload it to EdgeFlow and your data is ready in seconds.</p>
          </div>

          {/* 3 steps */}
          <div className="lp-brokers-steps lp-reveal">
            <div className="lp-brokers-step">
              <div className="lp-brokers-step-num">01</div>
              <h3 className="lp-brokers-step-title">Export from your broker</h3>
              <p className="lp-brokers-step-body">Go to your broker's trade history and export your trades as a file. Every platform supports this — it takes one click.</p>
            </div>
            <div className="lp-brokers-step-arrow">→</div>
            <div className="lp-brokers-step">
              <div className="lp-brokers-step-num">02</div>
              <h3 className="lp-brokers-step-title">Import into EdgeFlow</h3>
              <p className="lp-brokers-step-body">Select your broker from the list and upload the file. EdgeFlow reads it, maps every trade, and handles the rest automatically.</p>
            </div>
            <div className="lp-brokers-step-arrow">→</div>
            <div className="lp-brokers-step">
              <div className="lp-brokers-step-num">03</div>
              <h3 className="lp-brokers-step-title">Your analytics are ready</h3>
              <p className="lp-brokers-step-body">Your full trade history loads instantly across every report, chart, and AI analysis. Nothing else to set up.</p>
            </div>
          </div>

          {/* Broker grid */}
          <div className="lp-brokers-grid lp-reveal">
            {[
              { name: 'Exness', cat: 'Forex / CFD' },
              { name: 'XM', cat: 'Forex / CFD' },
              { name: 'Pepperstone', cat: 'Forex / CFD' },
              { name: 'IC Markets', cat: 'Forex / CFD' },
              { name: 'HFM', cat: 'Forex / CFD' },
              { name: 'FBS', cat: 'Forex / CFD' },
              { name: 'Admirals', cat: 'Forex / CFD' },
              { name: 'Vantage', cat: 'Forex / CFD' },
              { name: 'Deriv', cat: 'Forex / CFD' },
              { name: 'OANDA', cat: 'Forex' },
              { name: 'IG Markets', cat: 'CFD' },
              { name: 'FxPro', cat: 'Forex / CFD' },
              { name: 'TradingView', cat: 'Multi-asset' },
              { name: 'cTrader', cat: 'Platform' },
              { name: 'Binance', cat: 'Crypto' },
              { name: 'Bybit', cat: 'Crypto' },
              { name: 'Interactive Brokers', cat: 'Multi-asset' },
              { name: 'Thinkorswim', cat: 'US Markets' },
              { name: 'TradeStation', cat: 'US Markets' },
              { name: 'NinjaTrader', cat: 'Futures' },
            ].map((b) => (
              <div key={b.name} className="lp-broker-pill">
                <span className="lp-broker-pill-name">{b.name}</span>
                <span className="lp-broker-pill-cat">{b.cat}</span>
              </div>
            ))}
            <div className="lp-broker-pill lp-broker-pill-more">
              <span className="lp-broker-pill-name">+ any MT4/MT5 broker</span>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing">
        <div className="lp-container">
          <div className="lp-reveal" style={{ textAlign: 'center' }}>
            <div className="lp-section-kicker" style={{ justifyContent: 'center' }}><span className="lp-section-kicker-dot"></span> Pricing</div>
            <h2 className="lp-section-title">Start free.<br/>Upgrade when you're ready to go deep.</h2>
            <p className="lp-section-sub" style={{ margin: '0 auto' }}>No commitment. Your trade history carries over on any plan.</p>
            <div className="lp-billing-toggle">
              <span className={`lp-billing-label${!annualBilling ? ' active' : ''}`}>Monthly</span>
              <button
                className={`lp-toggle-track${annualBilling ? ' on' : ''}`}
                onClick={() => setAnnualBilling(a => !a)}
                aria-label="Toggle annual billing"
              >
                <span className="lp-toggle-thumb" />
              </button>
              <span className={`lp-billing-label${annualBilling ? ' active' : ''}`}>
                Annual <span className="lp-billing-save">2 months free</span>
              </span>
            </div>
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
                <li><span className="lp-price-check">✓</span> 3 Atlas messages</li>
              </ul>
              <button className="lp-btn-price basic" onClick={() => navigate('/auth')}>Get started free</button>
            </div>

            <div className="lp-price-card pro lp-reveal" style={{ position: 'relative' }}>
              <div className="lp-price-popular">Best value</div>
              <div className="lp-price-badge">Pro</div>
              <div className="lp-price-amount">{annualBilling ? '$15.83' : '$19'}</div>
              <div className="lp-price-per">{annualBilling ? <>per month · <strong style={{ color: 'var(--lp-green)' }}>$190 billed annually</strong></> : 'per month · cancel anytime'}</div>
              <div className="lp-price-divider"></div>
              <ul className="lp-price-features">
                <li><span className="lp-price-check">✓</span> Unlimited trades</li>
                <li><span className="lp-price-check">✓</span> Session &amp; instrument analytics</li>
                <li><span className="lp-price-check">✓</span> Unlimited Atlas (Claude)</li>
                <li><span className="lp-price-check">✓</span> Leak Detection</li>
                <li><span className="lp-price-check">✓</span> Strategy Optimizer</li>
                <li><span className="lp-price-check">✓</span> Trading Plan enforcement</li>
                <li><span className="lp-price-check">✓</span> PDF performance reports</li>
                <li><span className="lp-price-check">✓</span> Import from 13 brokers &amp; platforms</li>
                <li><span className="lp-price-check">✓</span> Multiple accounts</li>
                <li><span className="lp-price-check">✓</span> Weekly AI digest email</li>
              </ul>
              <button className="lp-btn-price pro" onClick={() => navigate('/auth')}>Get Pro</button>
            </div>

            <div className="lp-price-card elite lp-reveal-right">
              <div className="lp-price-badge">Elite</div>
              <div className="lp-price-amount">{annualBilling ? '$32.50' : '$39'}</div>
              <div className="lp-price-per">{annualBilling ? <>per month · <strong style={{ color: 'var(--lp-green)' }}>$390 billed annually</strong></> : 'per month · cancel anytime'}</div>
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
            <h2 className="lp-section-title">Questions traders ask.</h2>
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
          <button className="lp-btn-primary-lg" onClick={() => navigate('/auth')}>Start free — no credit card<span className="lp-cta-arrow-wrap">→</span></button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-footer-top">
          <div className="lp-footer-brand">
            <div className="lp-nav-logo" style={{ cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <svg width="22" height="22" viewBox="0 0 20 20" fill="none" aria-hidden style={{ color: 'rgb(140,255,46)', flexShrink: 0 }}>
                <line x1="3" y1="3" x2="3" y2="17" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square"/>
                <line x1="3" y1="3" x2="16" y2="3" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square"/>
                <line x1="3" y1="10" x2="12" y2="10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square"/>
                <line x1="12" y1="10" x2="16" y2="6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square"/>
                <line x1="3" y1="17" x2="16" y2="17" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square"/>
              </svg>
              EdgeFlow
            </div>
            <p>The trading journal and analytics platform for traders who take their performance seriously. Works for any market, any strategy, any broker.</p>
          </div>
          <div className="lp-footer-col">
            <h4>Product</h4>
            <ul>
              <li><a onClick={() => navigate('/auth')}>Dashboard</a></li>
              <li><a onClick={() => navigate('/auth')}>Analytics</a></li>
              <li><a onClick={() => navigate('/auth')}>Atlas</a></li>
              <li><a href="#pricing">Pricing</a></li>
            </ul>
          </div>
          <div className="lp-footer-col">
            <h4>Features</h4>
            <ul>
              <li><a href="#preview">Leak Detection</a></li>
              <li><a href="#preview">Equity Curve</a></li>
              <li><a href="#preview">Session Analytics</a></li>
              <li><a href="#preview">Strategy Optimizer</a></li>
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
          <span>The professional trading journal.</span>
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
