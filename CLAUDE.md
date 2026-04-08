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
- trades (all trade logs)
- trader_profiles (trading style, rules)
- criteria_settings (pre-trade checklist items)
- trade_verifications (checklist completions per trade)

## Design System — STRICT RULES
### Colors
- #4ade80 (green) = profit/wins/positive P&L ONLY
- #f87171 (red) = losses/negative P&L ONLY
- #ffffff (white) = all neutral UI elements
- rgba(255,255,255,0.4) = secondary text
- rgba(255,255,255,0.25) = muted/hint text
- rgba(255,255,255,0.07) = card borders
- rgba(255,255,255,0.02) = card backgrounds
- #0a0a0a = page background

### Buttons
- Primary: white bg (#ffffff), black text, 
  border-radius: 24px, font-weight: 600
- Secondary: transparent, 
  border: 0.5px solid rgba(255,255,255,0.15),
  white text, border-radius: 24px
- NEVER use green on buttons except 
  "Log Trade" submit (creates financial record)

### Cards
- background: rgba(255,255,255,0.02)
- border: 0.5px solid rgba(255,255,255,0.07)
- border-radius: 12px
- padding: 20px 24px
- NO colored backgrounds on cards ever

### Sidebar
- Active item: white text + 
  2px solid white left border, NO background
- Inactive items: rgba(255,255,255,0.4)
- No green anywhere in sidebar

### Typography
- Page titles: 24px, font-weight: 700, 
  letter-spacing: -0.5px
- Section labels: 10px, font-weight: 600, 
  letter-spacing: 0.1em, uppercase, 
  rgba(255,255,255,0.25)
- Body: 14px, rgba(255,255,255,0.8)
- Muted: 12px, rgba(255,255,255,0.35)

## Pages & Status
- /dashboard (Analytics) — redesigned ✅
- /analyst (Performance Analyst) — needs redesign
- /journal (Trades DB) — needs redesign  
- /accounts — needs redesign
- /ai — AI Advisor, gated behind 10 trades ✅
- /guide — Platform Guide ✅
- /auth — Login/Signup ✅
- /auth/callback — Email confirmation ✅
- /reset-password — Password reset ✅
- /onboarding — 4-step onboarding flow ✅

## Features Complete
- ✅ Auth (signup, signin, reset password)
- ✅ Email delivery via Resend
- ✅ 4-step onboarding flow
- ✅ Dashboard redesign (equity curve, 
     heatmap calendar, session bars, 
     sparklines, recent trades)
- ✅ AI Advisor gated behind 10 trades
- ✅ Supabase migration (own project)
- ✅ Vercel deployment
- ✅ Custom domain leone.capital

## Task List — DO THESE IN ORDER
- [ ] Fix remaining color issues on dashboard
      (Trade Entry button, sidebar active state,
       MAX DRAWDOWN sparklines, equity curve pills)
- [ ] Redesign Performance Analyst page
- [ ] Redesign Journal/Trades DB page
- [ ] Redesign Accounts page
- [ ] Add Google Sign In
- [ ] Payment integration (Lemon Squeezy + Intasend)
- [ ] Landing page complete redesign

## Payments Plan (when ready)
- Kenya users: Intasend (M-Pesa)
- International: Lemon Squeezy
- Payouts: Wise → Binance (USDT)
- Pricing: Free ($0) | Pro ($12/mo) | Elite ($24/mo)

## How to Start Every Session
1. Read this CLAUDE.md file
2. Check git status
3. Look at current task list above
4. Ask me what to work on if unclear
5. Make changes, commit, push to main

## Claude Code Tips
- Run /compact every 10-15 messages
- Run /clear when switching to new task
- Always read the relevant file before editing
- Make small focused commits
- Test on leone.capital after every push