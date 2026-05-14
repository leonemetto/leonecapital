# EdgeFlow — Reddit & Community Outreach Playbook

Complete marketing playbook for EdgeFlow's Reddit + trading-community outreach. Synthesized from a 16-source Reddit-growth blueprint, adapted for EdgeFlow's specific stage (pre-monetization, free tier only, founder-led, Kenya-based).

---

## Table of Contents

1. [Pre-outreach: the original scripts (Forex Factory / TradingView)](#1-pre-outreach-the-original-scripts)
2. [Reddit blueprint — what applies vs what doesn't](#2-reddit-blueprint-applies-vs-doesnt)
3. [Foundational principles (account setup, karma, AI detection)](#3-foundational-principles)
4. [Target subreddit shortlist](#4-target-subreddit-shortlist)
5. [The 4 post types — full scripts](#5-the-4-post-types-full-scripts)
6. [Comment template](#6-comment-template)
7. [Lead magnet — the 20-Trade Audit](#7-lead-magnet)
8. [Competitor monitoring (F5bot)](#8-competitor-monitoring)
9. [3-month action plan](#9-3-month-action-plan)
10. [Metrics to track](#10-metrics-to-track)

---

## 1. Pre-outreach: the original scripts

Initial scripts for Forex Factory + TradingView before the Reddit blueprint was applied. Kept for reference and for when the user expands beyond Reddit.

### Before you post anything — Reddit rules

**Reddit will ban you fast if you do this wrong.** Non-negotiables:

- Use an account with **>60 days age and >100 comment karma** in trading subs. New accounts posting links get auto-removed.
- **Comment 10-15 times** in each target sub before posting your own thread. Mods check history.
- Subreddit-by-subreddit promotion rules:
  - r/Forex: Self-promo allowed if you participate. Tag `[Tool]` or `[Project]`.
  - r/Daytrading: Strict 9:1 rule (9 non-promo comments per 1 promo post). Read sidebar.
  - r/algotrading: Hates non-algo tools. **Skip this one** — wrong audience anyway.
  - r/propfirm: Friendlier, smaller. Good fit.
- **Never post the same text to multiple subs in the same week.** Reddit shadowbans for this.
- Use one consistent username, link to it from edgeflow.capital footer ("Built by /u/yourname"). Builds trust.

### Original Script 1 — Reddit long-form post

```
Title: I spent 4 months building my own trading journal because every existing one frustrated me — here's what I learned about my own trading

Body:

I trade forex out of Nairobi. About 6 months ago I got serious about journaling and tried Edgewonk, TraderSync, and a TradingView spreadsheet. All of them felt like data entry tools that gave me back a win rate and a P&L curve. Nothing told me *why* I was losing.

So I built my own. It's at edgeflow.capital (free tier, no card). I'm not here to pitch — I want to share the three patterns the tool surfaced about my own trading that I genuinely didn't know:

1. **My win rate on Mondays was 31%. On Wednesdays it was 64%.** I had no idea. I was averaging out to 47% across the week and thinking I had a mediocre edge. I have a great edge — just not on Mondays. (Turns out I overtrade after weekend gap analysis.)

2. **Every loss > 1.5R was followed within 90 minutes by another trade.** Classic revenge trading. I knew this was a thing in theory. Seeing it as a statistic — "you have done this 23 times in 60 days, win rate on those follow-up trades is 19%" — was different.

3. **My checklist compliance dropped to 40% after 2 winning trades in a row.** I get cocky after wins and skip my own rules. The data made this undeniable.

The tool that surfaced this is called Leak Detection. It just runs expectancy by every dimension (instrument, session, day-of-week, post-loss, plan-followed-yes/no) and flags the negative ones.

Happy to answer questions about the build, the trading process, or what I'd do differently. Not asking for signups — if it sounds useful, link is in my profile.

What patterns has your journaling surfaced about your own trading? Genuinely curious what other people are finding.
```

**Why this works:** real story, specific numbers, asks a question, link is in profile not body. Reddit-safe.

### Original Script 2 — Reddit comment template

Watch `/new` in r/Forex and r/Daytrading. When someone asks about journaling, tracking, "how do I know if I have an edge," revenge trading, prop firm drawdown:

```
I had the same problem until I started tracking [specific thing they mentioned].

The thing that helped me most was breaking my trades down by [session/day/instrument/post-loss] separately instead of looking at overall win rate. Mine was 47% overall but 64% on Wednesdays and 31% on Mondays — the average hid the edge.

If you want a free tool that does this automatically, I built one (edgeflow.capital) but honestly even a spreadsheet works — the key is the breakdown, not the tool.
```

Always offer the spreadsheet alternative. Looks honest, isn't pushy, mods leave it alone.

### Original Script 3 — Forex Factory thread (Trading Discussion section)

FF is older, slower, more tolerant of tools if you bring substance. Lead with data, not the product.

```
Title: After 60 days of structured journaling, here's the data on what actually predicts a losing day

Hi all — long-time lurker, first real post. I've been logging every trade for 60 days with a structured journal (date, instrument, session, R, plan-followed Y/N, emotional state 1-5, screenshot). 287 trades total.

I pulled out the patterns. Sharing in case it's useful.

**Strongest losing-day predictors (highest to lowest):**
1. First trade of the day was a loss → 71% chance the day ends red
2. Emotional state logged ≥4 (frustrated/anxious) → win rate drops from 51% to 28%
3. Trade taken outside my 2 main sessions → expectancy -0.4R
4. Plan-followed = No → expectancy -1.1R (vs +0.6R when followed)
5. More than 4 trades in a day → win rate of trades 5+ is 22%

**Strongest winning-day predictors:**
1. First trade was a win → 68% green day
2. ≤3 trades total → 64% green day
3. All trades on my A+ instrument list → expectancy +0.8R

None of this is novel as theory. What was new for me was the *magnitude*. Plan-followed alone was a 1.7R swing in expectancy. That's the entire edge.

I built a tool (edgeflow.capital) to track this because I couldn't find one that did the breakdown automatically, but any spreadsheet with these columns gets you 80% of the way there.

Curious what other long-term journalers have found. What's your strongest losing-day predictor?
```

**Why FF likes this:** data-first, mentions tool once near the bottom, ends with a question.

### Original Script 4 — TradingView

TradingView is hostile to outright tool promotion. **Don't post a "check out my app" thread.** Instead, publish a free **Idea** (their content format) about a specific pattern your tool found, and have edgeflow.capital in your TV profile bio.

Example Idea title: *"Why your Monday trades have a different win rate than your Wednesday trades — 287-trade study"*

The Idea links a chart, walks through one example trade per finding, and your bio link does the conversion. Slow but compliant.

### Original cadence

- Week 1-2: comment 20+ times in r/Forex, r/Daytrading, r/propfirm. Build karma. No posts.
- Week 3: one Reddit post (start with r/propfirm — smaller, friendlier).
- Week 4: Forex Factory thread.
- Week 5: second Reddit post, different sub, different angle.
- Track which signups came from where via a `?ref=reddit_forex` UTM parameter on the link you share.

---

## 2. Reddit blueprint — what applies vs what doesn't

The 16-source blueprint adapted for EdgeFlow's specific stage.

### Apply now

- Personal account, human face, "Kenyan forex trader building a journal tool" bio
- 2-week karma warm-up — you don't have this yet, this is the #1 gating step
- 90/10 rule, comment-first strategy
- No AI-generated content (this is critical — Reddit's detector is harsh and your account gets flagged permanently)
- Sweet-spot subreddit targeting (5–30 posts/day)
- Parasite SEO posts targeting "best trading journal 2026" type queries
- Competitor mention strategy (TraderSync, Edgewonk, TradeZella, Tradervue)
- F5bot alerts on competitor names
- Profile-as-CTA (link in bio, not in comments)
- Lead magnet for email capture

### Defer

- **Reddit Ads** — you don't have payments yet, ads at this stage drive free signups that cost Supabase storage and return $0. Revisit after Lemon Squeezy is live.
- **Own subreddit (r/EdgeFlow)** — Month 4+, too early
- **Gray hat edit trick** — works but if a mod or competitor screenshots it, your brand is done. Skip until you're bigger and care less.
- **Gummysearch / Map of Reddit paid tools** — manual research is fine at this scale

### Skip entirely

- r/algotrading (wrong audience, hostile to non-algo tools)
- Anything that smells like a launch announcement

---

## 3. Foundational principles

From the 16-source blueprint. All apply.

### Prioritize personal accounts

Users trust people, not logos. Use a personal account with a human profile picture and a bio that establishes niche credibility without being "salesy."

**EdgeFlow application:**
- Username: real first name + trading. e.g. `u/leone_trades`
- Profile photo: human face (founder), never the EdgeFlow logo
- Bio: *"Forex trader in Nairobi. 8mo into prop firm challenges. Building a journal tool — link below."*
- Single link to edgeflow.capital

### Build "account infrastructure"

Like warming up an email domain, you must warm up Reddit accounts by providing genuine value before plugging anything.

### Karma as currency

Karma is your reputation score. Low karma accounts are often shadowbanned or blocked from posting in major subreddits. Build it by upvoting and leaving helpful, non-promotional comments for at least two weeks.

**EdgeFlow target:** ~150 comment karma by end of Week 6 before any posting.

### Avoid AI shortcuts

Reddit detects over 70% of ChatGPT-style responses, which leads to immediate removal and account flags. **All comments and posts must be hand-written.** Use the scripts in this file as starting points but rewrite in your own voice each time.

### The 90/10 rule

90% education/contribution, 10% promotion. Track this — count comments vs posts that mention EdgeFlow.

---

## 4. Target subreddit shortlist

Sweet-spot vetted (5–30 posts/day target, with exceptions for high-intent communities).

| Subreddit | Size | Posts/day | Fit | Strategy |
|---|---|---|---|---|
| r/propfirm | ~80k | ~20 | ★★★★★ | Start here — friendliest, prop traders journal hardest |
| r/Forex | ~400k | ~40 | ★★★★ | Slightly past sweet spot but huge intent |
| r/Daytrading | ~2M | ~80 | ★★★ | Content buries fast, comment strategy > posts |
| r/FundedNext | ~30k | ~15 | ★★★★ | Tight community, prop-firm overlap |
| r/Trading | ~60k | ~10 | ★★★★ | Quieter, posts last longer |
| r/swingtrading | ~70k | ~8 | ★★★ | Older audience, more open to tools |

**Skip:** r/algotrading, r/wallstreetbets, r/options (wrong audience or hostile to promo)

### Research methods (from blueprint)

- **Reddit Ads dashboard:** Use targeting section for free audience research, no need to actually buy an ad.
- **AI search seeding:** Ask ChatGPT/Perplexity questions like "best trading journal for prop firm traders" and see which Reddit threads they cite. Target those threads.
- **Lurk before leaping:** Read the last 20-30 posts in each sub to understand the "immune system," tone, and rules.

---

## 5. The 4 post types — full scripts

Rewritten using the blueprint's four high-performing post structures.

### Post Type 1: The Relatable Post

**Target:** r/propfirm (Week 7 — smallest, friendliest, lowest risk)

```
Title: Anyone else feel like trading journals are designed for the trade you already won, not the one you're about to lose?

Body:

I've been on prop firm challenges for 8 months. Tried Edgewonk, TraderSync, a Notion template, a Google Sheet. They all do the same thing — you log a trade, they give you a win rate and a P&L line.

But the trade is already done. The information is too late.

What I actually want to know before I click buy is: "Last 3 times I traded this pair in this session after a losing trade, what happened?" That's the data that would have saved my last 2 challenges.

Is anyone else feeling this? What are you using and is it actually changing your behavior, or are you just logging trades into the void?
```

**Why this works:** rant frame, names competitors fairly, asks a real question, no link, no mention of EdgeFlow. Builds authority. EdgeFlow link sits in profile.

### Post Type 2: The Tactical Playbook

**Target:** r/Forex (Week 8)

```
Title: How I cut my losing days by 40% in 60 days using one pattern from my journal

Body:

Sharing the exact method, no upsell. This took me 6 months of tracking to find.

**The pattern:**
First trade of the day = loss → 71% of the time, the day ends red.
First trade of the day = win → 68% green day.

That single data point predicts my day better than my setup quality, news calendar, or hours slept.

**What I do now:**
1. Log every first-trade outcome separately.
2. If first trade is a loss > 1R, I walk away for 4 hours. No exceptions.
3. If first trade is a win, I cap myself at 3 trades total (because of a different pattern: my win rate on trades 5+ is 22%).

**How to find your own version:**
- Export your last 60+ trades to a spreadsheet.
- Group by "first trade of day W/L" → calculate day outcome %.
- Group by "trade number 1, 2, 3, 4, 5+" → calculate win rate per slot.
- Anything with > 15% variance from your overall win rate is a real pattern.

You can do this in Sheets. I ended up building my own tool because I was tired of doing it manually (it's in my profile if curious — free tier exists) but the spreadsheet method gets you 80% of the way there.

What patterns have you found in your own data? Genuinely curious if "first trade predicts day" holds for other people or if it's just me.
```

**Why this works:** specific numbers, gives the spreadsheet method (so it's not pitch-gated), one parenthetical mention of the tool, ends with a question.

### Post Type 3: The Conversation Starter

**Target:** r/Trading or r/swingtrading (Week 9)

```
Title: Brutal question: if your trading journal was deleted tomorrow, would your trading actually get worse?

Body:

I ask because I journaled for 4 months before realizing my journal was a diary, not a feedback loop. I logged trades, read them back, felt productive, and changed nothing.

The journal only started mattering when I forced it to answer one question per week: "What rule did I break most this week and what did it cost me in R?"

So I'm curious how the rest of you actually use yours:
- Do you re-read entries, or just log and forget?
- Has your journal ever made you stop taking a specific setup?
- What's the single insight your journal gave you that you didn't already know?

No wrong answers. Trying to figure out if journaling is genuinely useful or if it's just a productivity ritual we tell ourselves matters.
```

**Why this works:** invites confession, no product mention at all, builds you as a thoughtful voice in the community, drives profile clicks.

### Post Type 4: The Behind-the-Scenes Story

**Target:** r/propfirm or r/Daytrading (Week 10)

```
Title: I built a trading journal because I failed 3 prop firm challenges in a row. Here's what the data showed me.

Body:

Quick context: I'm a forex trader in Nairobi. Failed FTMO twice and MFF once between Oct and Feb. Each time I told myself it was "bad luck" or "news." Each time I was wrong.

I started logging every trade with full context: session, instrument, plan-followed Y/N, emotional state, time since last loss. After 287 trades I pulled the numbers.

The actual reasons I failed:

1. **Plan-followed = No: expectancy -1.1R. Plan-followed = Yes: expectancy +0.6R.** I was breaking my own rules 38% of the time and bleeding the entire edge there.
2. **Trades 5+ of the day: 22% win rate.** I was overtrading after wins, not losses. Counter-intuitive.
3. **Emotional state ≥4 (frustrated/anxious): win rate 28% vs 51% baseline.** Tilt was real and measurable.

None of this was visible until I had it in one place and broken down by dimension. The mainstream journals show you a win rate and a P&L curve. They don't show you that your edge is conditional on a specific behavior.

I ended up building my own tool to do this automatically because the spreadsheet was eating my Sundays. Won't link it here — it's in my profile if you want to look. Free tier, no card, fine to ignore.

If you're stuck on prop firm challenges, I'd bet money the same exercise (export → group by behavior → look at expectancy) reveals your specific leak. Happy to help anyone who wants to walk through their own data in DMs.
```

**Why this works:** vulnerable, Kenyan-trader detail makes it real, names FTMO/MFF (knowledge graph), data-first, link in profile, offers free help (drives DMs which is where conversion actually happens).

### Parasite SEO post (Week 11-12)

**Target:** r/propfirm or r/Forex

```
Title: Best trading journal apps for prop firm traders in 2026 — honest comparison after testing 5

Body:

I tested TraderSync, Edgewonk, TradeZella, Tradervue, and one I built myself (EdgeFlow) over the last 8 months while running prop firm challenges. Sharing the honest verdict because I couldn't find one that wasn't an affiliate-spam article.

**TraderSync** — Best for broker auto-import. If you trade futures or US stocks with a supported broker, it's the easiest setup. Weak on behavioral analysis. $30/mo.

**Edgewonk** — Most powerful analytics, ugliest UI. Steep learning curve. Pays off if you're willing to invest the setup time. $170 one-time.

**TradeZella** — Cleanest UI, strong community features. Light on the "why am I losing" analysis. $30/mo.

**Tradervue** — The OG. Reliable, basic, hasn't evolved much. $30/mo.

**EdgeFlow** (built it myself, biased) — Designed around leak detection: groups trades by every dimension and flags negative expectancy. Free tier exists. Weak on broker auto-import (manual + CSV only). edgeflow.capital

**Pick by use case:**
- Auto-import is priority → TraderSync
- Deep analytics, willing to learn → Edgewonk
- Behavioral / leak focus → EdgeFlow
- Just want it simple → TradeZella or Tradervue

Happy to expand on any of these in comments. What are you using?
```

**Why this works:** ranks for "best trading journal 2026" in Google within 2 weeks because Reddit has huge domain authority. Fair comparison = trust. EdgeFlow gets equal billing not preferential.

---

## 6. Comment template

Use 10x more than posts. Watch `/new` in target subs.

When someone posts about journaling, leak detection, prop firm fails, revenge trading, drawdown:

```
The thing that broke this open for me was grouping my trades by [the specific thing they mentioned] separately instead of looking at my overall win rate. My overall was 47% — fine, not great. But broken down by [day-of-week / session / first-trade-outcome / plan-followed], one slice was 64% and another was 28%. The average was hiding the edge AND hiding the leak.

You can do this in Sheets in 10 minutes. Export → pivot table → group by that field → win rate column. If anything is more than 15% off your overall, that's a real pattern.

I built a tool that does this automatically (link in profile, free tier) but honestly the spreadsheet works.
```

Always offer the manual method. That's what makes it not a pitch.

### Subtle competitor-mention variant

Per blueprint section IV, mention competitors casually alongside EdgeFlow:

```
I've used TraderSync and EdgeFlow — both fine. TraderSync is better if your broker is supported for auto-import. EdgeFlow is what I'd use if you care about figuring out which behavior is leaking your edge. Either way, the journaling habit matters more than the tool.
```

---

## 7. Lead magnet

The blueprint is right — Reddit can ban you and erase your presence. Build email capture you own.

### Product: "The 20-Trade Audit"

Free Notion template with:
- Pre-built columns: date, instrument, direction, session, R, plan-followed, emotional state
- Pivot tables that auto-calculate:
  - First-trade-of-day → day outcome %
  - Trade number (1/2/3/4/5+) → win rate
  - Plan-followed Y/N → expectancy
  - Session → expectancy
  - Post-loss trades → win rate
- One-page summary: "your top 3 leaks based on these 20 trades"

### Why this beats sending people to /auth

- No signup friction → higher conversion
- You own the email list, Reddit can't take it
- The template demonstrates "this is doing it manually — EdgeFlow does it automatically" → natural upgrade path
- Comments can link to a Notion page without smelling like product promo

### Email sequence

| Day | Email |
|---|---|
| 0 | Welcome + template + how to use it |
| 3 | Blog post: "How to detect trading leaks" |
| 7 | Case study: founder's own leak detection results |
| 14 | EdgeFlow soft pitch (free tier) + 20% off Pro once payments are live |

Tools: ConvertKit / Loops / Beehiiv free tier.

---

## 8. Competitor monitoring

Set up F5bot (free, f5bot.com). Add these alert terms:

- TraderSync
- Edgewonk
- TradeZella
- Tradervue
- Chartlog
- "trading journal" (broad — high volume but catches everything)
- "prop firm journal"

**Workflow:** when an alert triggers and someone is complaining about a competitor's flaw, comment within 2 hours with a free workaround first, then mention how EdgeFlow handles that specific issue (per blueprint section IV).

Example:
```
That's a known TraderSync issue — their session breakdown only supports the major 4 sessions and treats Asian/Sydney as one bucket. Workaround: export the CSV and re-tag manually in Sheets with a CASE statement on the hour. Annoying but works.

(EdgeFlow handles 5 sessions + custom session ranges if you want to skip the manual step — but the export workaround is fine.)
```

---

## 9. 3-month action plan

### Weeks 1-2 — Infrastructure & lurking

- [ ] Pick Reddit username — real first name + trading. e.g. `u/leone_trades`
- [ ] Profile: human photo (not a logo), bio: *"Forex trader in Nairobi. 8mo into prop firm challenges. Building a journal tool — link below."* Single link to edgeflow.capital.
- [ ] Join the 6 target subs. Set them to "show in feed."
- [ ] Read the last 30 posts in each sub. Note tone, recurring questions, mod personalities. Write this down.
- [ ] Build the Notion "20-Trade Audit" lead magnet. Host on Notion, capture email via ConvertKit/Loops/Beehiiv free tier.
- [ ] Set up F5bot alerts.
- [ ] Set up UTM links: `edgeflow.capital/?ref=reddit_propfirm`, `?ref=reddit_forex`, etc. Track in Supabase later.

### Weeks 3-6 — Karma & authority (no posts, only comments)

- [ ] **10-15 comments per week** across target subs. "Consultant-level" depth — 3-5 sentences minimum, specific, no links.
- [ ] **F5bot response:** every competitor name trigger → helpful comment within 2 hours.
- [ ] By end of Week 6: target ~150 comment karma. This unlocks posting in most major subs without auto-removal.
- [ ] Track: comment count per week, profile clicks (Reddit dashboard), email signups via the Notion template.

### Weeks 7-10 — Posting cadence (one post per week, max)

- [ ] Week 7: Post Type 1 (Relatable) → r/propfirm
- [ ] Week 8: Post Type 2 (Tactical Playbook) → r/Forex
- [ ] Week 9: Post Type 3 (Conversation Starter) → r/Trading or r/swingtrading
- [ ] Week 10: Post Type 4 (Story) → r/Daytrading or r/propfirm
- [ ] **Continue commenting** at 10+/week. Posts without ongoing comments look spammy.
- [ ] Track signups by UTM source weekly. Kill subs that produce zero signups after 2 posts.

### Weeks 11-12 — Parasite SEO + double down

- [ ] Post: "Best trading journal apps for prop firm traders in 2026" parasite SEO post (script above) → r/propfirm
- [ ] Repeat the best-performing post format from Weeks 7-10 with a different angle.
- [ ] By end of Week 12: search post titles in incognito Google to see which Reddit posts ranked.

### Month 4+ — Scale

- [ ] If payments are live: test Reddit Ads with $5/day Free Form ads on winners
- [ ] Consider launching r/EdgeFlow (only worth it if you have 200+ engaged users)
- [ ] Repurpose top-performing Reddit posts as blog posts on edgeflow.capital/blog

---

## 10. Metrics to track

Weekly sheet, one row per week:

| Week | Comments | Posts | Profile clicks | Notion template emails | EdgeFlow signups (UTM'd) | Top post karma |

**Decision rules:**
- If after Week 8 you have 0 signups from Reddit, the bottleneck is the **funnel** (profile → site → signup), not the posts. Fix that before posting more.
- If a sub produces 0 signups after 2 posts, kill it. Reallocate to a sub that's converting.
- If a single post format outperforms others by 3x in karma, double down on that format.

---

## Appendix A — Full 16-source blueprint (raw)

Preserved verbatim for reference.

### I. Foundational Principles & Account Setup

Success on Reddit requires a fundamental shift from "marketing" to "participating."

- **Prioritize Personal Accounts:** Users trust people, not logos. Use a personal account with a human profile picture and a bio that establishes niche credibility without being "salesy."
- **Build "Account Infrastructure":** Like warming up an email domain, you must warm up Reddit accounts by providing genuine value before plugging anything.
- **Karma as Currency:** Karma is your reputation score. Low karma accounts are often shadowbanned or blocked from posting in major subreddits. Build it by upvoting and leaving helpful, non-promotional comments for at least two weeks.
- **Avoid AI Shortcuts:** Reddit is highly effective at detecting AI-generated content (detecting over 70% of ChatGPT-style responses), which leads to immediate removal and account flags.
- **The 90/10 Rule:** Follow a strict ratio of 90% education/contribution and 10% promotion.

### II. Research & Subreddit Discovery

Don't just target the biggest communities; find where high-intent conversations happen.

- **Identify the "Sweet Spot":** Use tools like Gummysearch to find subreddits with 5–30 posts per day. This ensures the community is active but your content won't be immediately buried.
- **Map the Ecosystem:** Use the Map of Reddit tool to find visually related communities you might otherwise miss.
- **Target AI Search Opportunities:** Ask LLMs (like ChatGPT or Perplexity) questions about your niche and see which Reddit threads they cite as sources. Target those specific threads/subreddits to improve your visibility in AI search results.
- **Use the Ads Tool for Research:** You don't have to buy an ad to use the Reddit Ads dashboard. Use its targeting section to discover related communities and audience sizes for your niche.
- **Lurk Before Leaping:** Before posting, read the last 20–30 posts in a subreddit to understand its unique "immune system," tone, and specific rules.

### III. Organic Content & Engagement Strategy

Reddit rewards usefulness, honesty, and depth over flashy production.

Four high-performing post types:
- **The Relatable Post:** Share a familiar struggle or "rant" and ask an open question.
- **The Guide/Tactical Playbook:** Provide a step-by-step breakdown of how you achieved a specific result.
- **The Conversation Starter:** Spark a debate or ask for the community's collective wisdom.
- **The Story Post:** Tell a transparent "behind-the-scenes" story about your business, including failures.

**The "Killer Organic Post" Structure:** Start with a catchy headline (avoiding "launch" announcements), provide immediate value, and only plug your product at the end as a "by the way" or "resource if you want to go deeper."

**Comment-First Strategy:** For new accounts, start by answering questions in the comments of popular threads. Detailed, "consultant-level" answers build massive authority and drive users to click your profile.

**Subtle Brand Mentions:** Mention your brand casually alongside competitors (e.g., "I've tried Asana and [Your Tool], both are good but...") to avoid looking like a pitch.

### IV. Advanced SEO & AI Search Tactics

Reddit is a "triple threat" for ranking in Google, AI answers, and direct leads.

- **Parasite SEO:** Create definitive, keyword-rich Reddit threads for high-intent queries (e.g., "Best [Product] for [Niche] in 2026"). Reddit's high domain authority often pushes these posts to the top of Google within hours.
- **The Gray Hat Edit Trick:** Start a thread asking for recommendations (e.g., "What's the best HVAC in Dallas?"). Let the community comment for 1–2 weeks, then edit the original post to say, "Update: The consensus seems to be [Your Business]."
- **Helpful Competitor Strategy:** Use F5bot or Kwatch.io to set up alerts for your competitors' names. When someone rants about a competitor's flaw, jump in with a free workaround first, then mention how your product handles that specific issue.
- **Knowledge Graph Building:** Participate in threads comparing major players in your industry. This helps LLMs associate your brand with those established entities in their "knowledge graph."

### V. Reddit Advertising Strategy

Reddit ads can be half the cost of Meta ads but require a "native" feel.

- **Use "Free Form" Ads:** These ads look like organic Reddit posts rather than banners. They allow you to combine text, images, and video in one long-form post.
- **Target Desktop for Conversions:** While mobile has more traffic, desktop users often have higher intent and fewer bot-related issues.
- **The $5 Experiment:** Start multiple variations of ads at $5/day. Let them run for 1–2 weeks (the "learning phase") before scaling the winners.
- **Retargeting Flywheel:** Install the Reddit Pixel to retarget website visitors with a different ad or a helpful "Ask Me Anything" (AMA) thread.

### VI. Conversion & Growth Blueprint

- **Ownership via Email:** Reddit doesn't belong to you; one ban can erase your presence. Use Reddit to drive users to a "Lead Magnet" (e.g., a free Notion template or checklist) to build an email list you own.
- **Optimize Your Profile:** Since you shouldn't drop links in comments, optimize your profile bio with a clear CTA and link. High-value commenters often get "profile-stalked" by curious users.
- **Create Your Own "Home Base":** Once you have a small following, start your own subreddit. This gives you total control over the rules, provides a massive SEO boost for branded searches, and allows you to pin promotional posts at the top.

**3-Month Implementation Timeline (from blueprint):**
- Week 1: Lurk, join 15 subreddits, and learn the vibe.
- Weeks 2-6: Build karma via genuine comments; no links.
- Weeks 7-12: Post 2–3 high-value guides/stories per week; optimize profile.
- Month 4+: Scale with ads and start your own branded subreddit.
