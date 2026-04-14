# EdgeFlow — AI Trading Journal

## What This Is
Professional trading journal at leone.capital
Target: $2,000/month from paying traders globally

## Tech Stack
- Frontend: Vite + React 18 + TypeScript
- UI: shadcn/ui + Tailwind CSS
- Router: React Router DOM
- Data: TanStack Query
- Database: Supabase (project: aepmcmfidvkdjjgjvkkw)
- Hosting: Vercel (auto-deploys on push to main)
- Domain: leone.capital
- Error monitoring: Sentry (production only)
- Emails: Resend (noreply@leone.capital)
- Icons: Phosphor Icons (no Lucide)
- Fonts: Inter (sans) + Roboto Mono (all numbers)
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

## Design System — STRICT RULES
### Colors
- #10b981 (green) = profit/wins/positive P&L ONLY
- #f87171 (red) = losses/negative P&L ONLY
- #ffffff (white) = all neutral UI elements
- rgba(255,255,255,0.4) = secondary text
- rgba(255,255,255,0.25) = muted/hint text
- rgba(255,255,255,0.07) = card borders
- rgba(255,255,255,0.02) = card backgrounds
- #0a0a0a = page background

### Fonts
- Sans: Inter
- Mono: Roboto Mono (clean zeros, no dot/slash — use for all numbers)
- All numeric values: font-mono tabular-nums

### Buttons
- Primary: white bg (#ffffff), black text,
  border-radius: 24px, font-weight: 600
- Secondary: transparent,
  border: 0.5px solid rgba(255,255,255,0.15),
  white text, border-radius: 24px
- NEVER use green on buttons except
  "Log Trade" submit (creates financial record)
  Log Trade submit: bg-[#10b981] text-black rounded-[24px]

### Cards
- background: rgba(255,255,255,0.02)
- border: 0.5px solid rgba(255,255,255,0.07)
- border-radius: 12px (rounded-xl)
- padding: 20px 24px
- NO colored backgrounds on cards ever

### Section Labels
- text-[10px] font-semibold uppercase tracking-[0.08em] text-[rgba(255,255,255,0.3)]

### Sidebar
- Active item: white text + 2px solid white left border, NO background
- Inactive items: rgba(255,255,255,0.35)
- No green anywhere in sidebar
- Collapsed: icon + 8px label, no Radix Tooltip
- Log Trade button: white pill at top of nav, always visible

### Typography
- Page titles: 24px, font-weight: 700, letter-spacing: -0.5px
- Section labels: 10px, font-weight: 600, letter-spacing: 0.08em, uppercase
- Body: 13-14px, rgba(255,255,255,0.8)
- Muted: 11-12px, rgba(255,255,255,0.35)

## Pages & Status
- /dashboard     — Analytics dashboard ✅ fully redesigned
- /analyst       — Performance Analytic ✅ (renamed from Analyst)
- /journal       — Trades DB ✅ summary stats added
- /accounts      — Trading Accounts ✅ (sparkline fixed)
- /add-trade     — Log Trade ✅ collapsible advanced fields
- /ai            — AI Advisor, gated behind 10 trades ✅
- /profile       — Settings ✅ (always accessible from sidebar)
- /guide         — Platform Guide ✅
- /import-trades — CSV/broker import ✅ (EdgeFlow, MT4/MT5, generic formats)
- /auth          — Login/Signup ✅
- /auth/callback — Email confirmation + OAuth redirect ✅
- /reset-password — Password reset ✅
- /onboarding   — 4-step onboarding flow ✅
- /             — Landing page ✅ (public marketing page)

## Sidebar Nav Labels (current)
- Dashboard → /dashboard (was "Analytics")
- Analytic → /analyst (was "Analyst")
- Trades DB → /journal
- Accounts → /accounts
- AI Advisor → /ai
- Trading Plan → /trading-plan (criteria/checklist management)
- Settings → /profile

## Features Complete
- ✅ Auth (signup, signin, reset password, Google OAuth)
- ✅ MFA/2FA — TOTP setup via QR code, verification on login
- ✅ Email delivery via Resend
- ✅ 4-step onboarding flow (nickname → account → checklist → first trade)
- ✅ Dashboard — equity curve, heatmap calendar, session performance bars, stat bar, recent trades, daily journal widget
- ✅ AI Advisor gated behind 10 trades, powered by Gemini 2.0 Flash (free)
- ✅ AI behavioral memory — extract-insight edge function appends insights to trader_profiles after each chat
- ✅ Supabase migration (own project)
- ✅ Vercel deployment + custom domain leone.capital
- ✅ Phosphor icons throughout (replaced all Lucide)
- ✅ Roboto Mono font (clean zeros, no center dot)
- ✅ Trade form — core fields always visible, advanced fields collapsible
- ✅ Trade screenshot upload — attach chart image, stored in Supabase Storage
- ✅ Screenshot viewer — camera icon in Recent Trades opens full-screen overlay
- ✅ Screenshot in Trades DB — thumbnail visible in expanded trade row
- ✅ Session Journal — mood selector (1-5), session notes, key lesson, 14-day history panel
- ✅ P&L Goals widget — daily/weekly/monthly targets with live progress bars
- ✅ Drawdown alerts — toast warning at 80%, error toast at 100% of daily loss limit
- ✅ Position size calculator — on Log Trade page, auto-reads account balance
- ✅ Journal page summary stats bar (trades, win rate, P&L, avg R)
- ✅ Sidebar Settings always visible (removed guide-completion gate)
- ✅ Accounts sparkline fixed
- ✅ Multi-account support — filter dashboard/analytics by account
- ✅ Demo data — 15 sample trades generated for new users, deletable from settings
- ✅ Trader behavioral profile — style, instruments, sessions, goals, mistakes, rules, mental triggers
- ✅ Entry checklist — custom criteria with category, active/inactive toggle, compliance tracking
- ✅ Avatar upload — profile picture stored in Supabase avatars bucket
- ✅ Theme toggle — light/dark mode (next-themes)
- ✅ Landing page — hero with animated word cycling, ContainerScroll 3D tilt, carousel, feature rows, testimonials, pricing, FAQ
- ✅ CSV/broker import — supports EdgeFlow, MT4/MT5, and generic CSV formats with live preview
- ✅ PDF export — dark-themed performance report via jsPDF (summary + session/strategy breakdown + trade list)
- ✅ Re-engagement emails — day-3 and day-7 inactivity emails via Resend (pg_cron: 0 8 * * *)
- ✅ Weekly AI digest — Monday performance email with Gemini insight (pg_cron: 0 7 * * 1)
- ✅ Sentry error monitoring — production only, PII stripped, DSN in Vercel env vars

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

## AI Advisor — How It Works
- Gate: requires 10+ trades (shows X/10 progress bar)
- Edge function: supabase/functions/trade-advisor/index.ts
- Model: Gemini 2.0 Flash via Google AI Studio (free tier)
- Personality: senior risk manager / performance coach, direct, data-driven, no fluff
- Context sent per message:
  - Last 50 trades with all fields
  - Aggregated stats (win rate, P&L, profit factor, etc.)
  - Checklist compliance analytics
  - Trader profile (style, rules, instruments, sessions, behavioral memory)
  - Criteria definitions
- Streaming: SSE, translated from Gemini format to OpenAI-compatible for client
- Chat stored in sessionStorage (cleared on browser close)
- Max 10 messages per session (auto-trims)
- Suggestion pills: quick prompts for common questions
- Daily Review: Dashboard button pre-injects today's trade context

## AI Behavioral Memory (extract-insight)
- Edge function: supabase/functions/extract-insight/index.ts
- Model: Gemini 2.0 Flash
- Triggered: after each AI chat response (async, fire-and-forget)
- Extracts ONE insight ≤10 words about behavioral patterns
- Appended to trader_profiles.behavioral_memory (JSONB array)
- Keeps last 20 insights
- Used in future AI sessions as additional context

## Edge Functions (supabase/functions/)
- trade-advisor — streaming chat with Gemini 2.0 Flash, requires GEMINI_API_KEY secret
- extract-insight — behavioral insight extraction, requires GEMINI_API_KEY secret
- re-engagement — daily email to users inactive 3 or 7 days, requires RESEND_API_KEY secret
- weekly-digest — Monday email to users who traded last 7 days, requires GEMINI_API_KEY + RESEND_API_KEY

## Supabase Secrets Required
- GEMINI_API_KEY — Google AI Studio API key (free tier)
- RESEND_API_KEY — Resend email API key (noreply@leone.capital)
- SUPABASE_URL — auto-set by Supabase
- SUPABASE_SERVICE_ROLE_KEY — auto-set by Supabase

## Key Analytics Functions (src/lib/analytics.ts)
- calculateAnalytics(trades) — 15+ metrics: winRate, netPnl, profitFactor, expectancy, avgR, maxDrawdown, currentStreak
- getExpectancyByField(trades, field) — breakdown by instrument/direction/strategy/session/bias
- getExpectancyByPlanAdherence(trades) — followed vs violated stats
- detectBehavioralPatterns(trades) — revenge trading, overtrading, clustering, emotional, post-loss, plan-deviation
- simulateFilter(trades, field, value) — what-if filter analysis
- getCurrentRiskStatus(trades) — drawdown %, streak, daily trend
- getLeakDiagnostic(field, key, expectancy, winRate) — human-readable leak explanation
- getDailyPnl(trades) — map of date → {pnl, tradeCount}

## Onboarding Flow (4 steps)
1. Nickname — trader's display name
2. Account Setup — name, type (live/demo/prop), starting balance, currency (USD/EUR/GBP/KES)
3. Entry Checklist — configure pre-trade criteria (defaults: HTF FVG, POI, CISD/IFVG)
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

## Supabase SQL — Run These Manually (CLI not authenticated)
All migrations are in supabase/migrations/ but must be applied via dashboard SQL editor.
Pending if not yet run:
1. screenshot_url column + trade-screenshots bucket + RLS policies
2. daily_journals table + RLS
3. trader_goals table + RLS

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

### BRAND & SEO ✅ ALL DONE
- [x] New EdgeFlow favicon + apple-touch-icon + manifest.json ✅
- [x] Page title + meta tags updated to leone.capital ✅
- [x] Google Search Console verified + indexed ✅

### FEATURES ✅ ALL DONE
- [x] Re-engagement emails (day 3 + day 7) ✅
- [x] Weekly AI digest email ✅
- [x] CSV/broker import (EdgeFlow, MT4/MT5, generic) ✅
- [x] PDF export (performance report) ✅
- [x] Error monitoring — Sentry ✅ (add VITE_SENTRY_DSN to Vercel env vars)

### INFRASTRUCTURE
- [ ] Upgrade Supabase to Pro ($25/mo) — free tier 1GB storage won't handle screenshots at scale
- [x] Cron jobs active — re-engagement (0 8 * * *) and weekly-digest (0 7 * * 1) confirmed running ✅
- [x] RESEND_API_KEY secret set in Supabase edge functions ✅

### MONETISATION — Last step
- [ ] Payment integration — Lemon Squeezy (international cards)
- [ ] Payment integration — Intasend (Kenya M-Pesa)
- [ ] subscriptions table in Supabase + tier enforcement (free/pro/elite feature gating)
- [ ] Upgrade prompts / paywall screens for gated features

### GROWTH (post-launch)
- [ ] Real prop firm mode — challenge phase tracking, per-phase drawdown limits
- [ ] Mobile app / PWA

## Payments Plan (when ready)
- Kenya users: Intasend (M-Pesa), KES 999/mo Pro, KES 1,999/mo Elite
- International: Lemon Squeezy, $12/mo Pro, $24/mo Elite
- Payouts: Wise → Binance (USDT)

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
