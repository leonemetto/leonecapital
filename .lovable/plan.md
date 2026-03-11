

# Recreation Prompt for EdgeFlow

Here is a comprehensive prompt you can paste into a new Lovable project to recreate EdgeFlow. Given the size and complexity of this app, I recommend breaking it into 3-4 sequential prompts. Below is the full master prompt, followed by a suggested breakdown.

---

## Master Prompt (send as first message)

```text
Build "EdgeFlow" — a professional trading journal and analytics platform. Dark-first design with green (#22c55e / HSL 142 69% 45%) as the primary accent color. Use Outfit font for UI and JetBrains Mono for numbers/data. The app should feel like a Bloomberg terminal meets modern SaaS — minimal, data-dense, glass-card UI with subtle grid background patterns.

BRAND: "EDGEFLOW" with tagline "Pro Analytics". Use an SVG logo icon.

## Authentication
- Email/password signup with email verification (OTP code confirmation, NOT auto-confirm)
- Google OAuth sign-in using Lovable Cloud auth
- Forgot password flow with /reset-password public route
- MFA/2FA support (TOTP) — enforced at login for users who enable it
- AuthGate wrapper that protects all routes

## Database Schema (6 tables)
1. **profiles** — user_id (uuid, FK auth.users), nickname (text), avatar_url (text), onboarding_completed (boolean default false), guide_progress (jsonb default '{"sections":[]}')
2. **accounts** — user_id, name (text), type (text: live/demo/prop), starting_balance (numeric), current_balance (numeric), currency (text default 'USD')
3. **trades** — user_id, account_id (FK accounts), date (text), instrument (text), direction (text: long/short), strategy (text), session (text), outcome (text: win/loss/breakeven), pnl (numeric), r_multiple (numeric nullable), risk_percent (numeric nullable), htf_bias (text), emotional_state (integer 1-5 nullable), confidence_level (integer 1-5 nullable), time_in_trade (integer nullable), followed_plan (boolean nullable), notes (text)
4. **trader_profiles** — user_id, trading_style, favorite_instruments, favorite_sessions, account_goals, common_mistakes, trading_rules, risk_per_trade, mental_triggers, notes (all text defaults ''), behavioral_memory (jsonb default '[]')
5. **criteria_settings** — user_id, label (text), category (text), is_active (boolean default true), sort_order (integer)
6. **trade_verifications** — user_id, trade_id (uuid), checks (jsonb default '{}')

All tables have RLS policies: users can only CRUD their own rows (auth.uid() = user_id). Create an "avatars" public storage bucket.

## Onboarding Flow (sequential gates)
1. **WelcomeModal** — shown once to new users (localStorage flag). Options: "View Platform Guide" (navigates to /guide) or "Skip — Go to Dashboard". Closing the modal (X button) dismisses it permanently.
2. **ProfileGate** — nickname prompt for new users. On submit, auto-provisions a Demo Account with $10,000 balance and 25 pre-seeded sample trades.
3. **ChecklistGate** — forces first-time entry criteria setup before accessing dashboard.

The 25 demo trades should include intentional "leaky" segments:
- NAS100 London longs = strong positive edge
- XAUUSD longs against bearish HTF bias = intentional leak (negative expectancy)
- EUR/USD mixed, GBP/JPY mixed
- Strategies: ICT OTE, Breaker Block, Order Block
- Sessions: London, New York AM, Asian, New York PM
- Include varied confidence (1-5), emotional states (1-5), and plan adherence

## App Layout
- Collapsible sidebar (left) with navigation: Analytics (/), Analyst (/analyst), Trades DB (/journal), Accounts (/accounts), AI Advisor (/ai), Guide (/guide)
- User section at bottom: avatar + nickname → Profile Settings, Sign Out button
- Sidebar collapses to icon-only mode with tooltips on desktop
- Mobile: hamburger menu with overlay
- Background: subtle grid pattern with faded edges

## Pages

### Dashboard (/)
- Time-of-day greeting with nickname
- Account filter dropdown (All Accounts + per-account)
- KPI cards: Win Rate, Total P&L, Trade Count, Profit Factor (with trend arrows)
- Account balance cards showing current balance + P&L %
- Entry Checklist sheet (slide-out panel showing active criteria)
- Quick Actions card (Log Trade, View Journal links)
- Performance Radar chart (recharts)
- Trading Calendar (color-coded days by P&L: green=profit, red=loss)
- Equity Curve (area chart), Win/Loss Pie chart, Strategy Performance bar chart
- Empty states: prompt to create account first, then prompt to log first trade or load demo data

### Performance Analyst (/analyst)
- Expectancy breakdown tables by: Instrument, Session, Direction, HTF Bias, Confidence, Emotional State, Plan Adherence
- Each table row shows: segment name, trade count, win%, avg R, expectancy (with heat-bar visualization), P&L
- Negative expectancy rows get "LEAK" badge with diagnostic text
- ⚡ simulate button on each row → loads into Strategy Optimizer
- Behavioral Patterns card (detects: revenge trading, Friday overtrading, emotional correlations, loss clustering)
- Risk Status indicator (green/yellow/red based on recent drawdown)
- Strategy Optimizer "What-If" simulator: filter by instrument, HTF bias, min confidence, min emotion, sessions, plan adherence → shows filtered vs original equity curve overlay (ghost curve), P&L improvement %, expectancy change
- Toxic Combinations detector
- Onboarding Tour support (spotlight-based, triggered via ?tour=1 URL param)

### Journal (/journal)
- Trade table with all fields, account filter
- Inline edit and delete capabilities
- Sortable columns

### Add Trade (/add-trade)
- Trade form: date, instrument (creatable select), direction, strategy (creatable select), session, HTF bias, outcome, P&L, R-multiple, risk%, confidence slider (1-5), emotional state slider (1-5), time in trade, followed plan toggle, notes
- Account selector
- Trade checklist verification (checks against user's criteria_settings, saves to trade_verifications)

### Accounts (/accounts)
- Account cards with: name, type badge (live/demo/prop), current balance, P&L, trade count
- Create account dialog: name, type, currency, starting/current balance
- Inline balance editing
- Delete with confirmation

### AI Advisor (/ai)
- Streaming chat interface with session persistence (sessionStorage)
- System prompt: "Head of Risk at a prop firm" persona — analytical, direct, no emojis, data-driven
- Sends: trade summary stats, recent 50 trades with full metadata, trader profile, checklist compliance analytics
- Suggestion chips: "What are my biggest weaknesses?", "Which session should I avoid?", etc.
- Clear chat button
- Supports navigation state (prompt + extraContext from other pages)
- Background insight extraction: after each conversation, extracts 1 behavioral insight and stores in trader_profiles.behavioral_memory (max 20)
- Uses two edge functions:
  - trade-advisor: streams AI response (gemini-3-flash-preview)
  - extract-insight: extracts behavioral insights (gemini-2.5-flash-lite)

### Profile Settings (/profile)
- Avatar upload (to avatars bucket)
- Nickname editor
- Password change
- 2FA enable/disable (TOTP QR code enrollment)
- AI Trading Profile form: trading style, favorite instruments, sessions, goals, mistakes, rules, risk per trade, mental triggers, notes
- Theme toggle (light/dark)
- Demo Data section: delete demo account button
- AI Memory card showing behavioral_memory entries

### Trading Plan (/trading-plan)
- Criteria Manager: add/edit/delete/reorder entry checklist items
- Items have label and category
- Toggle active/inactive

### Guide (/guide)
- 5-section interactive tutorial: Philosophy, Analyst, Optimizer, AI Advisor, Workflow
- Side nav with completion checkmarks
- Progress tracking (saved to profiles.guide_progress)
- "Finish Guide" navigates to /analyst?tour=1

### Reset Password (/reset-password)
- Public route, handles recovery token from email link

## Design System
- Glass-card components: backdrop-blur, subtle borders, transparency
- Color tokens: --profit (green), --loss (red), chart-1 through chart-5
- Animations: framer-motion for page transitions, card entrances, chat messages
- Font: Outfit for UI, JetBrains Mono for numbers
- Responsive: mobile-first with lg breakpoints
- Dark mode default with light mode support (next-themes)

## Key Libraries
React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, recharts, framer-motion, react-markdown, react-router-dom v6, @tanstack/react-query, sonner (toasts), date-fns

## Analytics Engine (src/lib/analytics.ts)
Pure TypeScript functions (no API calls):
- calculateAnalytics: win rate, P&L, profit factor, expectancy, max drawdown, streaks, R-expectancy
- getExpectancyByField: breakdown by any trade field with heat-bar data
- getExpectancyByPlanAdherence
- detectBehavioralPatterns: revenge trading, session biases, emotional correlations
- simulateFilter: "what-if" filter simulation with equity curve generation
- getCurrentRiskStatus: traffic-light risk indicator
- getLeakDiagnostic: contextual diagnostic text for leak segments
- detectToxicCombinations: finds specific multi-factor losing combinations
- getEquityCurve, getStrategyPerformance, getSessionPerformance
```

---

## Suggested Breakdown

Due to the complexity, send in this order:

1. **Prompt 1**: Everything from "Build EdgeFlow" through the Database Schema + Authentication + Onboarding Flow + App Layout + Dashboard page
2. **Prompt 2**: Performance Analyst page + Analytics Engine (the full analytics.ts with all functions)
3. **Prompt 3**: AI Advisor + edge functions (trade-advisor, extract-insight) + Profile Settings + Trading Plan + Guide
4. **Prompt 4**: Journal + Add Trade (with checklist verification) + polish/fixes

This ensures each prompt stays focused enough for quality output while maintaining the full scope.

