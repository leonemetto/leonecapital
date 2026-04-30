import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChartLineUp, MagnifyingGlass, Brain, Scales, ClipboardText,
  Drop, Rows, CurrencyDollar, DownloadSimple, FilePdf,
  ArrowLeft, ArrowRight, CaretRight,
} from '@phosphor-icons/react';
import logoImg from '@/assets/logo.svg';

interface Feature {
  id: string;
  icon: React.ElementType;
  label: string;
  tagline: string;
  sections: { heading: string; body: string }[];
  tip?: string;
}

const FEATURES: Feature[] = [
  {
    id: 'dashboard',
    icon: ChartLineUp,
    label: 'Dashboard',
    tagline: 'Your performance at a glance.',
    sections: [
      {
        heading: 'Equity Curve',
        body: 'Shows your cumulative P&L over time. Switch between daily, weekly, and monthly views. A smooth upward curve = consistency. Spikes followed by dips = variance or revenge trading.',
      },
      {
        heading: 'Heat Map Calendar',
        body: 'Every trading day colour-coded by P&L. Green = profitable day, red = losing day. Patterns you\'d never spot in a spreadsheet become obvious here — like losing every Monday, or always over-trading mid-month.',
      },
      {
        heading: 'Session Performance Bars',
        body: 'Win rate broken down by trading session (London, New York, Asian, Overlap). Your best session is highlighted. If one session is clearly underperforming, it\'s a direct signal to reduce size or skip it entirely.',
      },
      {
        heading: 'Stat Bar',
        body: 'Six key metrics at a glance: Win Rate, Net P&L, Profit Factor, Average R, Max Drawdown — each with a 7-day sparkline so you can see the trend, not just the number.',
      },
      {
        heading: 'Daily Journal Widget',
        body: 'Log your mood (1–5), session notes, and a key lesson after each session. The 14-day history panel lets you look back and connect emotional states to trading outcomes.',
      },
    ],
    tip: 'Use the account filter at the top to switch between accounts or view all at once.',
  },
  {
    id: 'log-trade',
    icon: Rows,
    label: 'Log Trade',
    tagline: 'The more detail you log, the smarter the analysis.',
    sections: [
      {
        heading: 'Core Fields',
        body: 'Date, instrument, direction (long/short), outcome, and P&L are always visible. These five fields alone give you win rate, expectancy, and equity curve — the foundation of every analysis.',
      },
      {
        heading: 'Advanced Fields',
        body: 'Expand the Advanced section to log: strategy, session, R-multiple, risk %, HTF bias, emotional state (1–5), confidence level (1–5), time in trade, and whether you followed your plan. These unlock the deeper behavioural analysis in the Analytic page.',
      },
      {
        heading: 'Pre-Trade Checklist',
        body: 'If you\'ve set up an entry checklist (in Trading Plan), it appears here at the bottom of the form. Check off each criterion before entering a trade. EdgeFlow tracks your compliance rate and shows you whether your win rate improves when you follow your rules.',
      },
      {
        heading: 'Screenshot Upload',
        body: 'Attach a chart screenshot to any trade. It\'s stored privately and accessible later from the Trades DB or the Recent Trades table. Useful for pattern recognition across multiple trades.',
      },
    ],
    tip: 'The P&L field auto-signs based on outcome — log the absolute amount and EdgeFlow makes it negative for losses.',
  },
  {
    id: 'trades-db',
    icon: Rows,
    label: 'Trades DB',
    tagline: 'Your complete trade history, filterable and sortable.',
    sections: [
      {
        heading: 'Filters & Sorting',
        body: 'Filter by account, instrument, direction, outcome, session, or date range. Sort by any column. The summary stats bar at the top updates in real time as you filter — so you can instantly see the stats for any subset of trades.',
      },
      {
        heading: 'Expanded Trade View',
        body: 'Click any row to expand it and see all fields including notes, emotional state, HTF bias, and a thumbnail of your screenshot if one was attached.',
      },
      {
        heading: 'CSV Export',
        body: 'Export any filtered view to a CSV file for further analysis in Excel or Google Sheets.',
      },
    ],
  },
  {
    id: 'analytic',
    icon: MagnifyingGlass,
    label: 'Performance Analytic',
    tagline: 'Where your edge is. Where it leaks.',
    sections: [
      {
        heading: 'Expectancy Tables',
        body: 'Six breakdowns: by Instrument, Direction, Strategy, Session, HTF Bias, and Plan Adherence. Each row shows trade count, win rate, average R, expectancy, and net P&L. Any row with negative expectancy gets a LEAK badge — that combination is costing you money on average.',
      },
      {
        heading: 'What Expectancy Means',
        body: 'Expectancy is the average R you make per trade in that segment. +0.5R means you make half your risk on average every trade. −0.8R means you lose nearly a full unit of risk every time. A segment with negative expectancy is a leak you should eliminate or reduce.',
      },
      {
        heading: 'Simulate with the Lightning Button',
        body: 'Next to each row is a ⚡ button. Click it to load that segment into the Strategy Optimizer and instantly see the equity curve impact of removing it from your trading.',
      },
      {
        heading: 'Behavioural Alerts',
        body: 'EdgeFlow automatically detects: revenge trading (multiple trades after a loss), overtrading (days with 2× your usual volume), loss clustering, emotional state correlation, and plan violation impact. If a pattern is detected, it shows up here with a plain-English explanation.',
      },
    ],
    tip: 'Look at Plan Adherence last — it\'s often the most important table. If your win rate when following your rules is significantly higher, you don\'t need a new strategy, you need more discipline.',
  },
  {
    id: 'leak-detection',
    icon: Drop,
    label: 'Leak Detection',
    tagline: 'Toxic combinations you might never notice manually.',
    sections: [
      {
        heading: 'What a Leak Is',
        body: 'A leak is a specific combination — instrument + session, direction + day, strategy + HTF bias — that has negative expectancy across your trade history. It\'s not a single bad trade. It\'s a pattern of bad trades that keeps repeating.',
      },
      {
        heading: 'Severity Levels',
        body: 'Leaks are rated High, Medium, or Low based on the magnitude of negative expectancy and the sample size. High leaks are confirmed patterns with strong statistical signal. Low leaks may still be noise — check the trade count before acting.',
      },
      {
        heading: 'Estimated Impact',
        body: 'Each leak shows the estimated monthly expectancy impact if you eliminated it. Use this to prioritise — fix the highest-impact leaks first.',
      },
      {
        heading: 'The Sidebar Badge',
        body: 'The Leak Detection sidebar item shows a badge with the count of new leaks since you last visited the page. Check it regularly — new leaks can appear as your trade history grows.',
      },
    ],
  },
  {
    id: 'optimizer',
    icon: Scales,
    label: 'Strategy Optimizer',
    tagline: 'What would my equity curve look like without this?',
    sections: [
      {
        heading: 'The Core Idea',
        body: 'The Optimizer lets you simulate removing any filter from your trading history and see the exact equity curve impact. Instead of guessing whether a setup is hurting you, you can prove it — or disprove it — with your own data.',
      },
      {
        heading: 'The Ghost Curve',
        body: 'The dashed grey line is your total equity curve. The solid coloured line is the filtered strategy. When the solid line runs above the dashed line, that setup is outperforming the rest of your book. When it runs below — it\'s a drag.',
      },
      {
        heading: 'Filtering',
        body: 'Filter by instrument, direction, session, strategy, HTF bias, or plan adherence — or any combination. The simulation updates instantly.',
      },
      {
        heading: 'From the Analytic Page',
        body: 'The fastest way to use the Optimizer is via the ⚡ button on any row in the Performance Analytic tables. It pre-loads that segment into the Optimizer for you.',
      },
    ],
    tip: 'Minimum 10 trades in a segment before drawing conclusions. Below that, you\'re looking at noise.',
  },
  {
    id: 'atlas',
    icon: Brain,
    label: 'Atlas',
    tagline: 'Your AI performance analyst. Reads your data, not the market.',
    sections: [
      {
        heading: 'What Atlas Does',
        body: 'Atlas is a senior risk manager who has read every trade you\'ve logged. Ask it anything about your performance — why your win rate is dropping, what your best setup is, whether you\'re revenge trading — and it will answer with specific numbers from your data.',
      },
      {
        heading: 'Unlocked After 10 Trades',
        body: 'Atlas needs a minimum of 10 trades to give statistically meaningful analysis. Before that, the data is too thin to confirm patterns.',
      },
      {
        heading: 'Methodology Awareness',
        body: 'Atlas adapts its language to your trading style. If your trader profile says ICT/Smart Money, it speaks that language. If you\'re an order flow trader, it uses order flow concepts. If no style is set, it uses universal concepts everyone understands.',
      },
      {
        heading: 'Behavioural Memory',
        body: 'After each session, Atlas extracts a key insight about your behaviour and stores it. Over time, this builds a profile of your patterns — so future sessions have more context and the advice gets more specific.',
      },
      {
        heading: 'Daily Review',
        body: 'The Daily Review button on the Dashboard opens Atlas with today\'s trade context pre-loaded. Use it at the end of each session to debrief.',
      },
    ],
    tip: 'Ask specific questions. "What\'s my worst session?" gets a better answer than "How am I doing?"',
  },
  {
    id: 'trading-plan',
    icon: ClipboardText,
    label: 'Trading Plan',
    tagline: 'Your rules. Enforced before every trade.',
    sections: [
      {
        heading: 'Entry Checklist',
        body: 'Create a list of criteria that every trade must meet before you enter. These appear on the Log Trade form as checkboxes. EdgeFlow tracks your compliance rate and compares your win rate when you follow vs break your rules.',
      },
      {
        heading: 'Categories',
        body: 'Organise criteria into categories — e.g. Technical, Risk, Psychological. You can toggle individual items active or inactive without deleting them.',
      },
      {
        heading: 'Compliance Analytics',
        body: 'On the Performance Analytic page, the Plan Adherence table shows your win rate when you fully followed your checklist vs when you skipped items. Most traders see a significant difference.',
      },
    ],
  },
  {
    id: 'accounts',
    icon: CurrencyDollar,
    label: 'Accounts',
    tagline: 'Separate analysis for every account you trade.',
    sections: [
      {
        heading: 'Multiple Accounts',
        body: 'Add as many accounts as you need — live, demo, and prop firm accounts tracked separately. Each account has its own equity curve, balance history, and performance stats.',
      },
      {
        heading: 'Account Filter',
        body: 'Use the account filter on the Dashboard and Analytic pages to focus analysis on a specific account, or view all accounts aggregated.',
      },
      {
        heading: 'Prop Firm Tracking',
        body: 'Log your prop firm account with its starting balance and track P&L against the firm\'s drawdown limits. Future updates will include per-phase challenge mode with live headroom tracking.',
      },
    ],
  },
  {
    id: 'import',
    icon: DownloadSimple,
    label: 'Import Trades',
    tagline: 'Bring in your trade history in seconds.',
    sections: [
      {
        heading: 'Supported Formats',
        body: 'EdgeFlow supports three CSV formats: EdgeFlow format (exported from another EdgeFlow account), MT4/MT5 statement exports, and a generic CSV format with column mapping.',
      },
      {
        heading: 'Live Preview',
        body: 'Before importing, you see a live preview of the parsed trades. Check that the columns mapped correctly before committing.',
      },
      {
        heading: 'Duplicate Detection',
        body: 'EdgeFlow skips trades that look like duplicates based on date, instrument, and P&L — so running the same import twice won\'t double your data.',
      },
    ],
  },
  {
    id: 'pdf-export',
    icon: FilePdf,
    label: 'PDF Export',
    tagline: 'A performance report you can share.',
    sections: [
      {
        heading: 'What\'s Included',
        body: 'The PDF report includes your key stats summary, session and strategy breakdown tables, and a trade list with outcomes. It\'s formatted for sharing with prop firm evaluators, mentors, or your own records.',
      },
      {
        heading: 'How to Export',
        body: 'The Export PDF button is on the Trades DB page. It generates from your current filtered view — so you can export a specific date range or account if needed.',
      },
    ],
  },
];

export default function HowToUse() {
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState(FEATURES[0].id);

  const active = FEATURES.find(f => f.id === activeId)!;
  const activeIdx = FEATURES.findIndex(f => f.id === activeId);

  return (
    <div style={{ minHeight: '100vh', background: '#080807', color: '#f2f0ea', fontFamily: "'Geist', system-ui, sans-serif" }}>
      {/* Nav */}
      <nav style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'rgba(8,8,7,0.92)', backdropFilter: 'blur(12px)', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src={logoImg} alt="EdgeFlow" style={{ height: 28, width: 28, borderRadius: 8 }} />
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em' }}>EdgeFlow</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginLeft: 4 }}>/ How to Use</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => navigate('/')}
            style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 12px' }}
          >
            Back to site
          </button>
          <button
            onClick={() => navigate('/auth')}
            style={{ fontSize: 13, fontWeight: 600, color: '#000', background: '#fff', border: 'none', borderRadius: 20, cursor: 'pointer', padding: '7px 18px' }}
          >
            Get started →
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px', display: 'flex', gap: 32 }}>
        {/* Sidebar nav */}
        <aside style={{ width: 220, flexShrink: 0 }}>
          <div style={{ position: 'sticky', top: 80 }}>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 600, marginBottom: 10 }}>Features</p>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {FEATURES.map(f => {
                const Icon = f.icon;
                const isActive = f.id === activeId;
                return (
                  <button
                    key={f.id}
                    onClick={() => setActiveId(f.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 10px', borderRadius: 8,
                      background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                      border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.45)',
                      fontSize: 13, fontWeight: isActive ? 600 : 400,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}
                  >
                    <Icon size={15} weight={isActive ? 'fill' : 'regular'} />
                    {f.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <main style={{ flex: 1, minWidth: 0 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {/* Header */}
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <active.icon size={22} color="rgba(255,255,255,0.8)" weight="regular" />
                  </div>
                  <div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: '#fff', margin: 0, lineHeight: 1.1 }}>{active.label}</h1>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '4px 0 0' }}>{active.tagline}</p>
                  </div>
                </div>
              </div>

              {/* Sections */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {active.sections.map((s, i) => (
                  <div
                    key={i}
                    style={{ padding: '20px 22px', borderRadius: 14, background: '#141413', border: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 8px', letterSpacing: '-0.01em' }}>{s.heading}</h3>
                    <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.55)', margin: 0, lineHeight: 1.7 }}>{s.body}</p>
                  </div>
                ))}

                {active.tip && (
                  <div style={{ padding: '14px 18px', borderRadius: 12, background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.18)' }}>
                    <p style={{ fontSize: 13, color: 'rgba(16,185,129,0.9)', margin: 0, lineHeight: 1.6 }}>
                      <span style={{ fontWeight: 700 }}>Tip: </span>{active.tip}
                    </p>
                  </div>
                )}
              </div>

              {/* Prev / Next */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 36, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {activeIdx > 0 ? (
                  <button
                    onClick={() => setActiveId(FEATURES[activeIdx - 1].id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
                  >
                    <ArrowLeft size={14} /> {FEATURES[activeIdx - 1].label}
                  </button>
                ) : <span />}
                {activeIdx < FEATURES.length - 1 ? (
                  <button
                    onClick={() => setActiveId(FEATURES[activeIdx + 1].id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
                  >
                    {FEATURES[activeIdx + 1].label} <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/auth')}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'oklch(0.65 0.17 155)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    Start using EdgeFlow <CaretRight size={14} />
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
