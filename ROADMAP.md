# EdgeFlow — Roadmap

## Phase 1: Pre-Launch (required before charging anyone)

### Infrastructure
- [ ] Upgrade Supabase to Pro ($25/mo) — free tier 1GB storage won't handle screenshots at scale

### Payments & Monetisation
- [ ] Lemon Squeezy integration — international cards, $19/mo Pro, $39/mo Elite
- [ ] Intasend integration — Kenya M-Pesa, KES 1,499/mo Pro, KES 2,999/mo Elite
- [ ] `subscriptions` table in Supabase + tier enforcement (free/pro/elite feature gating)
- [ ] Free tier limits: 50 trades lifetime, 3 Atlas messages lifetime (DB-backed counters)
- [ ] Upgrade prompts / paywall screens for gated features
- [ ] Design doc: `~/.gstack/projects/leonemetto-leonecapital/ceo-plans/2026-04-24-paywall.md`

## Phase 2: Beta → Public Launch

### Prop Firm Challenge Mode (Elite tier feature)
- [ ] Per-phase drawdown limits (FTMO: 10% max, 5% daily; Topstep: 6% trailing; MFF: 8%)
- [ ] Live headroom gauge — how far from breach at any moment
- [ ] Phase tracking — Challenge → Verification → Funded transitions
- [ ] Breach alert toasts (80% warning, 100% halt)
- [ ] Dashboard widget: current phase, daily loss used, max drawdown used
- [ ] Support FTMO, Topstep, MyForexFunds, Apex rule sets
- [ ] Custom rule input for any prop firm not listed

## Phase 3: Post-Launch Growth

- [ ] Mobile app / PWA
- [ ] Real testimonials carousel — collect 6-8 quotes from beta users with specific data points (win rate improvement %, R-multiple, habit they fixed). Replace placeholder carousel on landing page.
- [ ] Blog / SEO content — target "trading journal", "prop firm tracker", "trading psychology" keywords
