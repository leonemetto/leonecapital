# EdgeFlow — AI Trading Journal

## gstack

Use the `/browse` skill from gstack for all web browsing. Never use `mcp__claude-in-chrome__*` tools.

Available skills:
/office-hours, /plan-ceo-review, /plan-eng-review, /plan-design-review, /design-consultation, /design-shotgun, /design-html, /review, /ship, /land-and-deploy, /canary, /benchmark, /browse, /connect-chrome, /qa, /qa-only, /design-review, /setup-browser-cookies, /setup-deploy, /retro, /investigate, /document-release, /codex, /cso, /autoplan, /plan-devex-review, /devex-review, /careful, /freeze, /guard, /unfreeze, /gstack-upgrade, /learn

## What This Is
Professional trading journal at edgeflow.capital (formerly leone.capital)
Target: $2,000/month from paying traders globally

## Tech Stack
- Frontend: Vite + React 18 + TypeScript
- UI: shadcn/ui + Tailwind CSS
- Router: React Router DOM
- Data: TanStack Query
- Database: Supabase (project: aepmcmfidvkdjjgjvkkw)
- Hosting: Vercel (auto-deploys on push to main)
- Domain: edgeflow.capital
- Error monitoring: Sentry (production only)
- Emails: Resend (noreply@leone.capital)
- Icons: Phosphor Icons (no Lucide)
- Fonts: Geist (sans) + Geist Mono (all numbers), self-hosted
- SEO: react-helmet-async (dynamic page titles) + build-time prerender (scripts/prerender.mjs)
- Note: NO Lovable dependencies — fully standalone codebase

## Infrastructure
- GitHub: github.com/leonemetto/leonecapital
- Supabase Project ID: aepmcmfidvkdjjgjvkkw
- Supabase URL: https://aepmcmfidvkdjjgjvkkw.supabase.co
- Vercel: auto-deploys on every push to main
- Email: Resend (noreply@leone.capital)

## Git Rules — ALWAYS
- Push to main branch only
- Never create or use dev branch
- Commit after every change
- Write clear commit messages

## Database Tables
- profiles (user profiles, onboarding_completed, nickname, avatar_url, guide_progress)
- accounts (trading accounts per user — name, type, starting_balance, current_balance, currency)
- trades (all trade logs — 20+ fields incl. screenshot_url, r_multiple, emotional_state, followed_plan)
- trader_profiles (trading style, rules, behavioral_memory JSONB array auto-populated by AI)
- criteria_settings (pre-trade checklist items — label, category, is_active, sort_order)
- trade_verifications (checklist completions per trade — checks JSONB map of criteriaId → boolean)
- daily_journals (session notes, mood 1-5, key lesson — unique per user per date)
- trader_goals (daily/weekly/monthly P&L targets + max daily loss)

## Storage Buckets
- avatars (public) — user profile pictures, path: {user_id}/{filename}
- trade-screenshots (private) — trade chart images, path: {user_id}/{trade_id}.{ext}
  - Signed URLs expire after 1 hour
  - RLS: user can only access their own files

## Design System — EdgeFlow tokens (src/index.css)
The app uses a token-based design system with light + dark variants. Always use tokens, not hardcoded hex.

### CSS Custom Properties (var(--ef-*))
- `var(--ef-bg)` — page background (#000000 dark, #fafaf7 light)
- `var(--ef-bg-elev)` — elevated card background (#141413 dark, #ffffff light)
- `var(--ef-bg-sunken)` — sunken/input background
- `var(--ef-ink)` — primary text
- `var(--ef-ink-2)` — secondary text
- `var(--ef-ink-3)` — muted text
- `var(--ef-ink-4)` — very muted / placeholder
- `var(--ef-line)` — border/divider color (#23221f dark, #e8e6df light)
- `var(--ef-pos)` — profit green (oklch)
- `var(--ef-neg)` — loss red (oklch)
- `var(--ef-pos-wash)` — green tint background
- `var(--ef-neg-wash)` — red tint background
- `var(--ef-warn)` — amber warning
- `var(--ef-warn-high)` — stronger amber
- `var(--ef-warn-wash)` — amber tint background
- `var(--ff-mono)` — mono font stack ('Geist Mono')

### Fonts
- Sans: Geist (variable, loaded from /fonts/Geist-Variable.woff2)
- Mono: Geist Mono (variable, loaded from /fonts/GeistMono-Variable.woff2)
- All numeric values: `font-mono tabular-nums` class

### Buttons
- Primary: `bg-foreground text-background` rounded-[24px] font-semibold
- Secondary: transparent, border border-border, rounded-[24px]
- Log Trade submit ONLY: `bg-[#10b981] text-black` rounded-[24px]
- NEVER use green on any button except Log Trade submit

### Cards (dark mode)
- Use `var(--ef-bg-elev)` background, `1px solid var(--ef-line)` border
- border-radius: 14px
- glass-card / glass-card-elevated classes available (glassmorphism in light, flat in dark)

### Section Labels
- `.section-label` utility: text-[9px] uppercase tracking-[0.2em] text-muted-foreground/40 font-bold
- `.label-text` utility: text-[10px] uppercase tracking-[0.12em] text-muted-foreground/60 font-semibold

### Sidebar
- Active item: bg-foreground text-background rounded-[8px]
- Inactive items: text-muted-foreground hover:text-foreground hover:bg-muted
- No green anywhere in sidebar
- Collapsed: icon (17px) + 8px label, no Radix Tooltip
- Log Trade button: bg-foreground text-background pill at top of nav, always visible
- Settings removed from nav — accessible via clicking profile name at bottom

### Typography
- Page titles: ~22px, font-weight: 500, letter-spacing: -0.02em
- Section labels: 9-10px, font-semibold, uppercase, tracking wide
- Body: 13px
- Numbers: font-mono class (Geist Mono), tabular-nums

## Pages & Status
- /dashboard        — Analytics dashboard ✅ fully redesigned
- /analyst          — Performance Analytic ✅ (renamed from Analyst)
- /journal          — Trades DB ✅ summary stats + 50-per-page pagination
- /accounts         — Trading Accounts ✅ (sparkline fixed)
- /add-trade        — Log Trade ✅ collapsible advanced fields, double-submit guard
- /ai               — Atlas, gated behind 10 trades ✅
- /profile          — Settings ✅ (accessible from sidebar bottom profile section)
- /guide            — Platform Guide ✅
- /import-trades    — CSV/broker import ✅ (EdgeFlow, MT4/MT5, generic formats)
- /leak-detection   — Leak Detection ✅ sidebar badge for new leaks
- /what-if          — Strategy Optimizer ✅ what-if simulation with equity curve
- /trading-plan     — Trading Plan / Entry Checklist ✅
- /auth             — Login/Signup ✅
- /auth/callback    — Email confirmation + OAuth redirect ✅
- /reset-password   — Password reset ✅
- /onboarding       — 4-step onboarding flow ✅
- /                 — Landing page ✅ (public marketing page)
- /blog             — Blog index ✅ (SEO content hub)
- /blog/:slug       — Blog post pages ✅ (5 posts live: trading journal, forex journal, prop firm, leaks, revenge trading)

## Sidebar Nav Labels (current)
- Dashboard → /dashboard
- Analytic → /analyst
- Trades DB → /journal
- Accounts → /accounts
- Atlas → /ai
- Trading Plan → /trading-plan (criteria/checklist management)
- Leak Detection → /leak-detection (badge shows new leaks since last visit)
- Optimizer → /what-if
- Profile/Settings → bottom of sidebar (click avatar/name to navigate to /profile)

## Features Complete
- ✅ Auth (signup, signin, reset password, Google OAuth)
- ✅ MFA/2FA — TOTP setup via QR code, verification on login
- ✅ Email delivery via Resend
- ✅ 4-step onboarding flow (nickname → account → checklist → first trade)
- ✅ Dashboard — equity curve, heatmap calendar, session performance bars, stat bar, recent trades, daily journal widget
- ✅ Atlas gated behind 10 trades, powered by Claude Haiku (Anthropic) via ANTHROPIC_API_KEY
- ✅ AI behavioral memory — extract-insight edge function appends insights to trader_profiles after each chat
- ✅ Supabase migration (own project)
- ✅ Vercel deployment + custom domain leone.capital
- ✅ Phosphor icons throughout (replaced all Lucide)
- ✅ Roboto Mono font (clean zeros, no center dot)
- ✅ Trade form — core fields always visible, advanced fields collapsible, double-submit protected
- ✅ Trade screenshot upload — attach chart image, stored in Supabase Storage
- ✅ Screenshot viewer — camera icon in Recent Trades opens full-screen overlay
- ✅ Screenshot in Trades DB — thumbnail visible in expanded trade row
- ✅ Session Journal — mood selector (1-5), session notes, key lesson, 14-day history panel
- ✅ P&L Goals widget — daily/weekly/monthly targets with live progress bars
- ✅ Drawdown alerts — toast warning at 80%, error toast at 100% of daily loss limit
- ✅ Journal page summary stats bar (trades, win rate, P&L, avg R)
- ✅ Trades DB pagination — 50 trades per page with filter/sort preserved
- ✅ Accounts sparkline fixed
- ✅ Multi-account support — filter dashboard/analytics by account
- ✅ Demo data — 25 sample trades generated for new users, deletable from settings
- ✅ Trader behavioral profile — style, instruments, sessions, goals, mistakes, rules, mental triggers
- ✅ Entry checklist — custom criteria with category, active/inactive toggle, compliance tracking
- ✅ Avatar upload — profile picture stored in Supabase avatars bucket
- ✅ Theme toggle — light/dark mode (next-themes)
- ✅ Landing page — redesigned: hero with tilt scroll, grouped features section, outcomes section (replaces fake testimonials), pricing matching approved paywall plan, FAQ including prop firm and AI questions
- ✅ CSV/broker import — supports EdgeFlow, MT4/MT5, and generic CSV formats with live preview
- ✅ PDF export — dark-themed performance report via jsPDF (summary + session/strategy breakdown + trade list)
- ✅ Re-engagement emails — day-3 and day-7 inactivity emails via Resend (pg_cron: 0 8 * * *)
- ✅ Weekly AI digest — Monday performance email with Claude insight (pg_cron: 0 7 * * 1)
- ✅ Sentry error monitoring — production only, PII stripped, DSN in Vercel env vars
- ✅ Leak Detection page — identifies negative-expectancy patterns across instrument/session/discipline
- ✅ Strategy Optimizer (What-If Simulator) — simulate removing any filter and see equity curve impact
- ✅ Leak Detection sidebar badge — shows count of new leaks since user last visited the page
- ✅ Loading skeletons — Dashboard and Trades DB show skeleton UI while data fetches
- ✅ React.lazy code splitting — heavy pages lazy-loaded, reduces initial bundle
- ✅ Per-page error boundaries — a crash on one page shows "try again" without killing the app
- ✅ LeaksContext — single computation shared across sidebar badge and Leak Detection page
- ✅ Fully typed Supabase hooks — useTrades, useCriteria typed against generated Database types
- ✅ 21 analytics unit tests — calculateAnalytics, getExpectancyByField, simulateFilter, getDailyPnl

## Trade Form — All Fields
### Always Visible (required)
- Date (calendar picker)
- Instrument (creatable select — user can add custom)
- Direction (long/short toggle)
- Outcome (win/loss/breakeven)
- P&L (auto-signed based on outcome)
- Account (select, required if >1 account)

### Advanced (collapsible)
- Strategy (creatable select)
- Session (London, New York, Asian, Overlap, Off-hours)
- R-Multiple
- Risk %
- HTF Bias (Bullish/Bearish/Neutral)
- Emotional State (1-5 slider)
- Confidence Level (1-5 slider)
- Time In Trade (minutes)
- Followed Plan (yes/no)
- Notes (textarea)
- Screenshot (file upload with preview + clear)

### Checklist (shown when criteria exist)
- All active criteria as checkboxes
- Auto-checks all if "Followed Plan: Yes"
- Saves to trade_verifications table

## Dashboard Widgets
1. Greeting header — time-based (morning/afternoon/evening) + nickname
2. Account filter — switch between all accounts or specific account
3. Entry Checklist button — opens sheet with active criteria, link to customize
4. Daily Review button — navigates to AI with today's trade context pre-injected
5. Log Trade button — quick entry
6. StatBar — Win rate, Net P&L, Profit Factor, Avg R, Max Drawdown (with 7-day sparklines)
7. Equity Curve — area chart, daily/weekly/monthly toggle
8. Heat Map Calendar — P&L by day, month navigation, monthly stats
9. Session Performance — win rate bars per session, best session highlighted
10. Recent Trades — latest trades table with P&L color coding
11. Daily Journal — mood (1-5 emoji), notes, key lesson, save, 14-day history

## Performance Analytic Page — Sections
1. Expectancy tables (sortable, color-coded) by:
   - Instrument, Direction, Strategy, Session, HTF Bias, Plan Adherence
   - Columns: name, trade count, win %, avg R, expectancy, net P&L
   - Lightning button → simulate "what if I removed this filter?"
2. Behavioral alerts panel:
   - Revenge trading detection (multiple trades after loss same day)
   - Overtrading (days with 2x+ average daily volume)
   - Loss clustering (consecutive losing trades/days)
   - Emotional correlation (emotional state vs win rate)
   - Plan violation impact (win rate when followed vs violated)
3. Risk status — current drawdown, streak, daily P&L trend
4. Account selector — focus analysis on one account
5. Leak diagnostic — human-readable explanation for negative-expectancy segments

## Atlas — How It Works
- Gate: requires 10+ trades (shows X/10 progress bar)
- Edge function: supabase/functions/trade-advisor/index.ts
- System prompt: supabase/functions/_shared/atlas-prompt.ts (shared with eval harness — change in one place)
- Model: Claude Haiku (claude-haiku-4-5-20251001) via Anthropic API
- Personality: senior risk manager / performance coach, direct, data-driven, no fluff
- Context sent per message (ANALYTICS SUMMARY block, pre-computed by buildTradesSummary in src/pages/AIAdvisor.tsx):
  - Core stats: win rate, profit factor, avg win, avg loss, net P&L, max drawdown
  - BY INSTRUMENT, BY SESSION, BY STRATEGY, BY DIRECTION
  - BY INSTRUMENT × DIRECTION, BY INSTRUMENT × SESSION (cross-tabs)
  - BY PLAN COMPLIANCE (on-plan vs off-plan WR + P&L)
  - BY EMOTIONAL STATE (per state + combined 1-2 / 4-5 buckets)
  - BY HTF BIAS ALIGNMENT, BY MONTH, BY ACCOUNT
  - Last 50 trades with all fields (RECENT TRADES block)
  - Trader profile + behavioral memory (last 10 insights)
- Length tiers enforced in prompt: Tier 1 factual lookup (30–80w), Tier 2 single focused (120–220w), Tier 3 broad review (280–400w), Tier 4 greeting/closing (<40w)
- Streaming: SSE (Anthropic streaming format)
- Chat stored in sessionStorage (cleared on browser close)
- Max 10 messages per session (auto-trims)
- Suggestion pills: quick prompts for common questions
- Daily Review: Dashboard button pre-injects today's trade context

## Atlas Eval Harness
- Location: scripts/atlas-evals/ (run.ts, prompts.json, fixture.json)
- Run: `ANTHROPIC_API_KEY=sk-ant-... npm run evals:atlas`
- What it does: replays 12 test prompts against Atlas using the deployed system prompt + a 30-trade synthetic fixture, then grades each response with Claude Sonnet against 7 criteria (relevance, factual_accuracy, no_fabricated_citations, no_banned_phrases, appropriate_length, no_template_drift, no_contradictions).
- Cost: ~$0.20 per full run.
- Output: console scorecard + results.json for run-to-run diffing.
- When to use: before deploying any change to atlas-prompt.ts. Confirms whether the change improves overall behaviour or just shifts the failure mode.
- Current baseline (May 2026): 83.5% overall. Strong on relevance, banned phrases, length, template drift. Weakest on factual_accuracy (~2.0–2.6 / 3.0) due to Haiku-class arithmetic limits.

## AI Behavioral Memory (extract-insight)
- Edge function: supabase/functions/extract-insight/index.ts
- Model: Claude Haiku (claude-haiku-4-5-20251001) via Anthropic API
- Triggered: after each AI chat response (async, fire-and-forget)
- Extracts ONE insight ≤10 words about behavioral patterns
- Appended to trader_profiles.behavioral_memory (JSONB array)
- Keeps last 20 insights (free/pro), 50 insights (elite)
- Used in future AI sessions as additional context

## Edge Functions (supabase/functions/)
- trade-advisor — streaming chat with Claude Haiku, requires ANTHROPIC_API_KEY secret
- extract-insight — behavioral insight extraction, requires ANTHROPIC_API_KEY secret
- re-engagement — daily email to users inactive 3 or 7 days, requires RESEND_API_KEY secret
- weekly-digest — Monday email to users who traded last 7 days, requires ANTHROPIC_API_KEY + RESEND_API_KEY

## Supabase Secrets Required
- ANTHROPIC_API_KEY — Anthropic API key for Claude Haiku (trade-advisor + extract-insight + weekly-digest)
- RESEND_API_KEY — Resend email API key (noreply@leone.capital)
- SUPABASE_URL — auto-set by Supabase
- SUPABASE_SERVICE_ROLE_KEY — auto-set by Supabase

## Key Analytics Functions (src/lib/analytics.ts)
- calculateAnalytics(trades) — 15+ metrics: winRate, netPnl, profitFactor, expectancy, avgR, maxDrawdown, currentStreak
- getExpectancyByField(trades, field) — breakdown by instrument/direction/strategy/session/bias
- getExpectancyByPlanAdherence(trades) — followed vs violated stats
- detectBehavioralPatterns(trades) — revenge trading, overtrading, clustering, emotional, post-loss, plan-deviation
- simulateFilter(trades, filters) — what-if simulation, returns SimulationResult with equity curves
- detectToxicCombinations(trades) — finds instrument+session+direction combos with negative expectancy
- getCurrentRiskStatus(trades) — drawdown %, streak, daily trend
- getLeakDiagnostic(field, key, expectancy, winRate) — human-readable leak explanation
- getDailyPnl(trades) — Map of date → {pnl, trades} (returns Map, not plain object)
- getEquityCurve(trades) — daily cumulative P&L series for charts
- getStrategyPerformance(trades) — per-strategy win rate + expectancy
- getSessionPerformance(trades) — per-session win rate + expectancy
- exportTradesCSV(trades) — triggers CSV download

## Onboarding Flow (4 steps)
1. Nickname — trader's display name
2. Account Setup — name, type (live/demo/prop), starting balance, currency (USD/EUR/GBP/KES)
3. Entry Checklist — configure pre-trade criteria (universal defaults: trend, structure, R:R, risk, confirmation, news)
4. First Trade — optional first trade to initialize portfolio
- Sets profiles.onboarding_completed = true on finish
- Demo data option: generates 15 realistic sample trades

## Auth Flows
- Email/password signup → email confirmation → onboarding
- Email/password login → optional MFA (TOTP 6-digit)
- Google OAuth → /auth/callback → dashboard or onboarding
- Forgot password → email link → /reset-password
- MFA enrollment: Settings → Set Up 2FA → QR code → verify code → active
- MFA login: after password → TOTP screen → verify → dashboard

## Profile Settings Page
- Nickname edit + save
- Avatar upload (Supabase storage)
- Password change
- 2FA/MFA setup and unenroll
- Theme toggle (light/dark)
- Trader profile: style, instruments, sessions, goals, mistakes, rules, risk/trade, mental triggers, notes
- Behavioral memory (read-only, AI-populated)
- Goals: daily/weekly/monthly targets, max daily loss
- Demo data deletion

## State Architecture
- TanStack Query handles all server state (trades, accounts, criteria, profile, goals)
- QueryClient configured with staleTime: 5min — no refetch on every window focus
- React Context lifts query results app-wide (no prop drilling, no duplicate fetches):
  - TradesContext — wraps useTrades(), all pages call useSharedTrades()
  - AccountsContext — wraps useAccounts() + selectedAccountId state
  - LeaksContext — single computeLeaks() call shared by sidebar badge + LeakDetection page
- All heavy pages (AIAdvisor, PerformanceAnalyst, Landing, etc.) are React.lazy loaded
- PageErrorBoundary wraps every route — a page crash shows "try again" without killing the app
- useTrades fetches up to 2000 trades (safety cap) — enough for 1-2 years of active trading

## Supabase SQL — Run These Manually (CLI not authenticated)
All migrations are in supabase/migrations/ but must be applied via dashboard SQL editor.
Pending if not yet run:
1. screenshot_url column + trade-screenshots bucket + RLS policies
2. daily_journals table + RLS
3. trader_goals table + RLS
Note: trader_goals and daily_journals are NOT in generated types (types.ts) — hooks for
these tables use `as any` casts intentionally until `supabase gen types typescript` is re-run.

## Task List — DO THESE IN ORDER

### DONE
- [x] Add Google Sign In ✅
- [x] Landing page complete redesign ✅
- [x] Redesign Performance Analyst page ✅
- [x] CSV export button wired up (exportTradesCSV in analytics.ts) ✅
- [x] Remove false claims from landing page pricing ✅
- [x] Fix CORS (www + non-www origins, Allow-Methods header) ✅
- [x] Fix .env committed to git + add to .gitignore ✅
- [x] npm audit fix (8 vulnerabilities) ✅

### SECURITY ✅ ALL DONE
- [x] Rotate Supabase anon key ✅
- [x] Fix AIAdvisor.tsx session fallback ✅
- [x] JWT verification on edge functions ✅
- [x] Per-user rate limiting on AI edge functions ✅
- [x] All Supabase tables have RLS + user_id policies ✅
- [x] trader_profiles FK constraint added ✅
- [x] HTTP security headers (X-Frame-Options, HSTS, CSP, etc.) in vercel.json ✅
- [x] File upload type/size validation on screenshot upload ✅
- [x] XSS fix on screenshot img src (safeImgSrc helper) ✅
- [x] Password minimum 8 chars enforced on signup + reset ✅
- [x] extract-insight edge function switched from Gemini → Claude Haiku ✅
- [x] SECURITY.md vulnerability disclosure policy created ✅
- [x] Log Trade double-submit guard (useRef sync lock) ✅

### BRAND & SEO — PHASE 1 COMPLETE ✅
- [x] New EdgeFlow favicon (E letterform) + apple-touch-icon + manifest.json ✅
- [x] Page title + meta tags updated to edgeflow.capital ✅
- [x] Google Search Console verified + indexed ✅
- [x] JSON-LD structured data (WebApplication + FAQPage schema) in index.html ✅
- [x] react-helmet-async installed — unique title + description per public route ✅
- [x] Build-time prerendering via scripts/prerender.mjs — Google sees full HTML, not empty div ✅
  - Prerenders: /, /how-to-use, /blog, and all 5 blog post pages
  - Runs automatically as part of npm run build
- [x] Blog infrastructure built — /blog index + /blog/:slug post pages ✅
- [x] 5 SEO-optimized blog posts written and live ✅
  - /blog/how-to-keep-a-trading-journal (primary keyword: "how to keep a trading journal")
  - /blog/forex-trading-journal (primary keyword: "forex trading journal")
  - /blog/prop-firm-trading-journal (primary keyword: "prop firm trading journal")
  - /blog/how-to-detect-trading-leaks (primary keyword: "detect trading leaks")
  - /blog/revenge-trading-how-to-detect-it (primary keyword: "revenge trading detection")
- [x] Sitemap updated — includes all blog posts, /blog, /how-to-use ✅
- [x] Landing page H1 updated to include "trading journal" keyword ✅
- [x] Landing page: Blog link in nav + external resource links in footer ✅
- [x] /how-to-use: SEO H1 added + internal links to blog posts ✅
- [x] robots.txt correct — auth/app routes blocked, sitemap referenced ✅

### SEO — REQUIRES YOUR ACTION (you do these, Claude cannot)
- [ ] **Verify keywords with a real tool** — use Google Keyword Planner (free) or Semrush/Ahrefs to confirm
  the target keywords and find more. Tell Claude and blog posts will be updated/added accordingly.
  - Priority targets: "trading journal app", "free trading journal", "best trading journal", "trade tracker"
- [ ] **Submit updated sitemap in Google Search Console**
  - Go to: search.google.com/search-console → Sitemaps → Submit → edgeflow.capital/sitemap.xml
- [ ] **Request indexing for each new page** — do this for every new public page Claude builds
  - Search Console → URL Inspection → paste URL → Request Indexing
  - Do for: /blog, and each of the 5 blog post URLs
- [ ] **Check Core Web Vitals in Search Console**
  - Go to: Search Console → Core Web Vitals → Mobile
  - Report any red/yellow metrics to Claude to fix
- [ ] **Create Twitter/X profile for EdgeFlow** — brand signal Google uses to verify real products
  - Handle suggestion: @edgeflow_ or @edgeflowcap
  - Bio must include "trading journal" in plain text. Link: edgeflow.capital
- [ ] **Post in trading communities** — after blog posts are indexed (2-3 weeks after submission)
  - r/Forex, r/Daytrading, r/algotrading on Reddit
  - Forex Factory "Trading Discussion" section
  - TradingView community
  - Post the BLOG ARTICLES (not the app directly) — share as helpful content
- [ ] **Real testimonials** — current testimonials on landing page are placeholders
  - Need 6-8 real quotes with names, specific data points ("my win rate went from X to Y")
  - Once collected, Claude will replace the placeholder carousel
- [ ] **Backlink outreach** — guest posts on trading blogs, broken link swapping on competitor sites
  - When ready: share the blog post URLs in trading forums and Discord servers you're in
  - Reach out to trading education sites (BabyPips, etc.) to propose guest posts

### FEATURES ✅ ALL DONE
- [x] Re-engagement emails (day 3 + day 7) ✅
- [x] Weekly AI digest email ✅
- [x] CSV/broker import (EdgeFlow, MT4/MT5, generic) ✅
- [x] PDF export (performance report) ✅
- [x] Error monitoring — Sentry ✅ (add VITE_SENTRY_DSN to Vercel env vars)

### ATLAS AI
- [x] Adaptive advice quality standards (no blanket prohibitions, conditional filters) ✅
- [x] Mandatory market context (macro regime, session dynamics, instrument drivers) ✅
- [x] Methodology-agnostic base prompt (no ICT-specific language) ✅
- [x] Style detection priority: trader profile → notes → both → neither (universal fallback) ✅
- [x] Fix checklist compliance hallucination (was reporting 0% when no trade_verifications rows exist; now reads Followed Plan field instead) ✅
- [x] Add emotional state, plan compliance, HTF, monthly, instrument×direction, instrument×session breakdowns to ANALYTICS SUMMARY ✅
- [x] Tier-based length control (Tier 1/2/3/4 with strict word ranges) — stops over-answering narrow questions ✅
- [x] Pre-compute combined emotional state buckets (states 1-2 / 4-5) — eliminates Atlas mental-arithmetic errors ✅
- [x] Ban bold inline labels for analytical content — kills the "Where your edge lives" template trigger ✅
- [x] Strict factual-accuracy rules: read pre-computed, don't re-derive; list trade IDs for custom cross-tabs; ban contradictions ✅
- [x] Macro events knowledge (Feb 28 2026 Iran strikes, Apr 8 ceasefire) — Atlas can correlate loss clusters to regime shifts ✅
- [x] Extract system prompt to supabase/functions/_shared/atlas-prompt.ts (shared with eval harness, no drift) ✅
- [x] Build eval harness at scripts/atlas-evals/ with Sonnet grader and synthetic fixture ✅
- [ ] When Elite tier launches: upgrade Atlas model from Haiku to Sonnet for Elite users only. Justifies the higher tier price ("Elite uses our most accurate AI") and fixes the remaining factual_accuracy ceiling (Haiku miscounts on cross-tabs; Sonnet doesn't). One-line model swap in trade-advisor/index.ts, gated on subscription tier. Free + Pro stay on Haiku.

### UX ✅ ALL DONE
- [x] Onboarding flow full rewrite — 4 steps: Welcome → Account → Trading Style → Demo/Fresh ✅
  - Step 3 collects methodology, instruments, sessions, risk/trade → saves to trader_profiles
  - Step 3 silently seeds entry checklist with methodology-matched defaults
  - Step 4 replaces "log first trade" with demo data vs fresh start choice
- [x] Help & Features page — public /how-to-use, 11 features documented ✅
- [x] Sidebar: Help & Features link added, nav reordered by workflow ✅
  - Order: Dashboard → Trades DB → Analytics → Leak Detection → Optimizer → Atlas → Trading Plan → Accounts
- [x] Landing page: scroll hint in hero pointing to #preview section ✅
- [x] Landing page: How it Works cards use live code mockups (analytics table, leak detection) ✅
- [x] Landing nav: Docs link added pointing to /how-to-use ✅

### PERFORMANCE ✅ ALL DONE
- [x] Removed redundant Google Fonts request (fonts are self-hosted at /fonts/) ✅
- [x] Added <link rel="preload"> for fonts + hero image in index.html ✅
- [x] 1-year immutable cache headers for /assets/*, /fonts/*, all images in vercel.json ✅
- [x] PagePrefetcher: all lazy page chunks background-downloaded 2s after app load ✅

### LEGAL — DEFERRED (before UK launch / scale)
- [ ] **Acceptable Use Policy** — add clause preventing users from using EdgeFlow data/exports to train competing AI models, resell aggregated trade data, or scrape programmatically. Add as a new section in Terms or a standalone /legal/aup page.
- [ ] **Professional Indemnity Insurance** — £1,500–£5,000/yr. Not needed at bootstrap stage but required before scaling. Revisit when MRR exceeds £2k.
- [ ] **UK solicitor review of ToS + Privacy Policy** — 1-hour review (~£200–£400). Book before UK launch. Governing law is already set to England and Wales.
- [ ] **Delete-my-data flow** — right to erasure (GDPR Art. 17). Currently data deletion is manual (admin). Build a self-serve "Delete my account and all data" button in Settings that wipes profiles, trades, accounts, and storage files.
- [ ] **Subscription terms review** — once payments launch, review cancellation, downgrade, and data-retention-on-cancellation wording in Terms Section 6 with a solicitor.

### INFRASTRUCTURE
- [ ] Upgrade Supabase to Pro ($25/mo) — free tier 1GB storage won't handle screenshots at scale
- [ ] **Set up inbound email for edgeflow.capital** — needed to receive Gmail "Send As" verification + beta user replies at leone@edgeflow.capital
  - Plan: Resend Inbound + Gmail Send As (no nameserver move, stays on Spaceship)
  - Steps: (1) add MX records at Spaceship pointing to Resend inbound, (2) configure Resend inbound forwarding rule to leone.metto@gmail.com, (3) Gmail Settings → Accounts → Add another email address → leone@edgeflow.capital, (4) enter Resend SMTP credentials, (5) confirm verification code that arrives in Gmail
  - Outcome: send personal founder emails from leone@edgeflow.capital, receive replies in Gmail

### MONETISATION — PAYSTACK GO-LIVE SEQUENCE
Primary processor decision (May 2026): Paystack for both international (cards/Amex) and Kenya (M-Pesa). Lemon Squeezy + Intasend deferred until 50+ paying customers (single-rail risk acceptable while we have zero customers).

**PRE-FIRST-CUSTOMER (must ship before any real payment runs)**
- [x] Branding cleanup — leone.capital → edgeflow.capital in Terms, Privacy, Landing ✅
- [x] /refunds page — standalone, carved out of Terms §6, linked from footer ✅
- [x] Terms §6 rewritten with chargeback "contact us first" clause + free-plan-first defense ✅
- [ ] **subscriptions table** in Supabase with audit columns:
  - user_id, plan, status, started_at, current_period_end, cancel_at, paystack_subscription_id,
    paystack_customer_code, amount, currency, channel (card/mpesa), terms_version_accepted,
    ip_at_signup, user_agent_at_signup
  - RLS: user_id = auth.uid()
  - Index on paystack_subscription_id (webhook lookup) + on user_id+status
- [ ] **refunds_issued table**: user_id, amount, currency, reason, paystack_refund_id, issued_at
  - Used to prove refund-rate discipline if Paystack ever audits
- [ ] **Upgrade modal** with REQUIRED consent checkbox:
  - "I have read and agree to the Terms, Privacy Policy, and Refund Policy"
  - Cannot submit without ticking. Persist terms_version_accepted to subscriptions row.
- [ ] **Free-plan gate on upgrade**: user must have created an account and logged ≥1 trade before
  the upgrade button is clickable. Defends against "I didn't know what I was buying" chargebacks.
- [ ] **Webhook handler** (Supabase edge function `paystack-webhook`):
  - Verify X-Paystack-Signature HMAC SHA-512 against PAYSTACK_SECRET_KEY
  - Handle: subscription.create, subscription.disable, charge.success, invoice.payment_failed, refund.processed
  - Idempotency: store event ID, drop duplicates
  - Never grant Pro access from client — only the verified webhook flips status
- [ ] **Welcome-to-Pro Resend email** triggered on charge.success:
  - Restates: amount paid, next billing date, how to cancel (link to Settings → Subscription),
    refund window (link to /refunds), support email
- [ ] **Self-serve cancel** in Settings → Subscription:
  - Calls Paystack disable subscription endpoint
  - Updates local subscriptions.cancel_at + status=cancelling
  - Confirmation email via Resend
- [ ] **Test mode dry-run** before flipping to live keys:
  - Full happy path: signup → trade → upgrade → webhook → access granted → welcome email
  - Refund path: refund issued → webhook → access revoked at period end
  - Failed payment: card declined → no access granted
  - Cancel path: cancel → access until period end → no renewal charge

**WITHIN 30 DAYS OF GO-LIVE**
- [ ] Register sole proprietorship on eCitizen (~KES 1,000, 1–3 days). Lifts Paystack Starter Business
      KES 600K transaction cap. Needed before MRR scales.
- [ ] Audit Atlas system prompt for forward-looking advice language (target: 30 minutes).
      Confirm the "never predict market direction" guardrail at atlas-prompt.ts:250 is intact.
- [ ] Audit landing page copy for: "make money", "guaranteed", "profit guarantee", "signals",
      "predictions". Replace with: "see your patterns", "find your leaks", "improve discipline".
- [ ] Sign Supabase + Vercel DPAs in dashboards (15 min each, free). Save signed copies to Drive.

**WITHIN 90 DAYS OF GO-LIVE (or if dispute happens)**
- [ ] Self-serve account deletion in Settings → Profile (right-to-erasure under Kenya DPA Art. 40).
      Wipes profiles, trades, accounts, trader_profiles, daily_journals, trader_goals, storage files.
- [ ] Request Paystack reserve reduction via support — only after clean track record (0 chargebacks,
      <2% refund rate, 90+ days). Many merchants don't ask; they release on request.
- [ ] Sign Anthropic + Resend DPAs (only at 100+ customers — they're free, just admin overhead).

**AT KES 20K MRR / FIRST PAYING CUSTOMERS TRACTION**
- [ ] Add Lemon Squeezy as backup international rail (single-rail = single point of failure)
- [ ] Add direct M-Pesa Paybill (separate from Paystack) as backup Kenyan rail
- [ ] Hire Kenyan CPA (~KES 50–150K/yr) — at KES 100K MRR this is cheap insurance

**AT KES 5M/yr REVENUE RUN-RATE**
- [ ] Register for VAT proactively (statutory threshold)
- [ ] Register Limited Company on eCitizen (transfers liability off your personal assets;
      also unlocks better banking, investor-readiness)

**DEFERRED — premature optimization for current stage**
- Lemon Squeezy + Intasend (until 50+ paying customers; we have 0)
- Cookie banner (only if EU traffic >5%)
- Quarterly API key rotation (set calendar reminder; don't rotate today)

- Design doc: ~/.gstack/projects/leonemetto-leonecapital/ceo-plans/2026-04-24-paywall.md
- Pricing (gross): $19/mo Pro, $39/mo Elite (intl) / KES 1,499 Pro, KES 2,999 Elite (M-Pesa)
- Paystack fees: 2.9% local card, 3.8% intl/Amex, 1.5% M-Pesa (VAT included in rate)
- Settlement: T+2 local KES, T+7 international. Maintain 1-month cost buffer in KCB.
- Reserve: assume 10% held for first 6 months as new Starter Business.

### GROWTH (post-launch)
- [ ] Prop firm challenge mode — per-phase drawdown limits, FTMO/Topstep/MFF rules, live headroom tracking (Elite feature)
- [ ] Mobile app / PWA
- [ ] Real testimonials carousel on landing page — collect real quotes from real traders with Twitter/X handles, then replace the current placeholder carousel. Quotes must be specific (name the feature, include a data point). Target: 6-8 quotes minimum before re-adding.

### BLOG — ONGOING SEO CONTENT (Claude builds these when asked)
- [x] Blog infrastructure live at /blog ✅
- [x] 5 initial posts written ✅ (see SEO section above for slugs)
- [ ] Add 5+ more posts targeting remaining KD<30 keywords:
  - "trading journal app" (comparison/commercial intent)
  - "free trading journal" (acquisition intent)
  - "best trading journal" (comparison/commercial intent)
  - "day trading journal" (informational)
  - "options trading journal" (informational)
  - "how to analyze trading performance" (informational)
  - "prop firm challenge tips" (informational, growing search)
- [ ] Add blog link to app sidebar (for logged-in users to find it)
- [ ] Add blog to /how-to-use page footer CTA section
- NOTE: When adding a new blog post, also add its URL to public/sitemap.xml and ask user to request indexing in Search Console

## Payments Plan (when ready)
- International: Lemon Squeezy, $19/mo Pro, $39/mo Elite
- Kenya: Intasend (M-Pesa), KES 1,499/mo Pro, KES 2,999/mo Elite
- Free tier: 50 trades lifetime cap, 3 Atlas messages lifetime (DB-backed counter)
- Payouts: Wise → Binance (USDT)
- Design doc: ~/.gstack/projects/leonemetto-leonecapital/ceo-plans/2026-04-24-paywall.md

## Security Standards (apply to all new code)
- Zero-trust: validate and authorise on the backend for every request, never trust client input
- RLS required on every Supabase table: ALTER TABLE ... ENABLE ROW LEVEL SECURITY + explicit USING (auth.uid() = user_id) policies
- No wildcard CORS in production — whitelist leone.capital and www.leone.capital only
- No hardcoded secrets — env vars only, .env always in .gitignore
- Schema validation at every API boundary (edge function entry points)
- Rate limit all edge functions per user/IP, return 429 on breach
- Never expose raw stack traces or internal error details to the client
- All DB migrations must be backward-compatible with a rollback plan

## How to Start Every Session
1. Read this CLAUDE.md file
2. Check git status
3. Look at current task list above
4. Ask user what to work on if unclear
5. Make changes, commit, push to main

## Claude Code Tips
- Run /compact every 10-15 messages
- Run /clear when switching to new task
- Always read the relevant file before editing
- Make small focused commits
- Test on leone.capital after every push

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health
