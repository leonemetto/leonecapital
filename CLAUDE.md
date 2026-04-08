# EdgeFlow — AI Trading Journal

## What This Is
Professional trading journal at leone.capital
Target: $2,000/month from paying traders globally

## Tech Stack
- Frontend: Vite + React 18 + TypeScript
- UI: shadcn/ui + Tailwind CSS
- Router: React Router DOM
- Data: TanStack Query
- Database: Supabase
- Hosting: Vercel
- Domain: leone.capital

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
- profiles (user profiles, onboarding_completed)
- accounts (trading accounts per user)
- trades (all trade logs, incl. screenshot_url)
- trader_profiles (trading style, rules)
- criteria_settings (pre-trade checklist items)
- trade_verifications (checklist completions per trade)
- daily_journals (session notes, mood, key lesson — one per user per date)
- trader_goals (daily/weekly/monthly P&L targets + max daily loss)

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
- /analyst       — Performance Analyst ✅ (was already solid, left as-is)
- /journal       — Trades DB ✅ summary stats added
- /accounts      — Trading Accounts ✅ (sparkline fixed)
- /add-trade     — Log Trade ✅ collapsible advanced fields
- /ai            — AI Advisor, gated behind 10 trades ✅
- /profile       — Settings ✅ (always accessible from sidebar)
- /guide         — Platform Guide ✅
- /auth          — Login/Signup ✅
- /auth/callback — Email confirmation ✅
- /reset-password — Password reset ✅
- /onboarding   — 4-step onboarding flow ✅

## Features Complete
- ✅ Auth (signup, signin, reset password)
- ✅ Email delivery via Resend
- ✅ 4-step onboarding flow
- ✅ Dashboard — equity curve, heatmap calendar, session performance bars, stat bar, recent trades
- ✅ AI Advisor gated behind 10 trades
- ✅ Supabase migration (own project)
- ✅ Vercel deployment + custom domain leone.capital
- ✅ Phosphor icons throughout (replaced all Lucide)
- ✅ Roboto Mono font (clean zeros, no center dot)
- ✅ Trade form — core fields always visible, advanced fields collapsible
- ✅ Trade screenshot upload — attach chart image, stored in Supabase Storage
- ✅ Screenshot viewer — camera icon in Recent Trades opens full-screen overlay
- ✅ Screenshot in Trades DB — thumbnail visible in expanded trade row
- ✅ Session Journal — mood selector, session notes, key lesson, 14-day history panel
- ✅ P&L Goals widget — daily/weekly/monthly targets with live progress bars
- ✅ Drawdown alerts — toast warning at 80%, error toast at 100% of daily loss limit
- ✅ Position size calculator — on Log Trade page, auto-reads account balance
- ✅ Journal page summary stats bar (trades, win rate, P&L, avg R)
- ✅ Sidebar Settings always visible (removed guide-completion gate)
- ✅ Accounts sparkline fixed

## Supabase SQL — Run These Manually (CLI not authenticated)
All migrations are in supabase/migrations/ but must be applied via dashboard SQL editor.
Pending if not yet run:
1. screenshot_url column + trade-screenshots bucket + RLS policies
2. daily_journals table + RLS
3. trader_goals table + RLS

## Task List — DO THESE IN ORDER
- [ ] Add Google Sign In
- [ ] Payment integration (Lemon Squeezy for international, Intasend for Kenya M-Pesa)
- [ ] Landing page complete redesign
- [ ] Weekly email digest (Supabase Edge Function + Resend)
- [ ] Redesign Performance Analyst page (already functional, needs visual polish)

## Payments Plan (when ready)
- Kenya users: Intasend (M-Pesa)
- International: Lemon Squeezy
- Payouts: Wise → Binance (USDT)
- Pricing: Free ($0) | Pro ($12/mo) | Elite ($24/mo)

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
