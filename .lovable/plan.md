

# Compulsory Onboarding Flow — Implementation Plan

## Overview
Add a guided onboarding system: Welcome modal, `/guide` page with tracked progress, auto-provisioned demo account with 25 sample trades, account switcher with sandbox banner, demo management, and a post-guide onboarding tour.

## Database Changes

**Add `onboarding_status` column to `profiles` table** via migration:
```sql
ALTER TABLE profiles ADD COLUMN onboarding_completed boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN guide_progress jsonb NOT NULL DEFAULT '{"sections":[]}'::jsonb;
```

No new tables needed. Demo accounts use the existing `accounts` table (type = `'demo'`). Demo trades use the existing `trades` table linked via `account_id`.

## Files to Create

### 1. `src/components/onboarding/WelcomeModal.tsx`
Full-screen modal shown when `profile.onboarding_completed === false`. Two CTAs:
- **"View Platform Guide"** (primary) — navigates to `/guide`
- **"Go to Dashboard"** (secondary/ghost) — sets `onboarding_completed = true`, closes modal

### 2. `src/pages/Guide.tsx`
Dedicated `/guide` page with side-nav layout. Five sections:
1. **The EdgeFlow Philosophy** — "Truth Machine" concept
2. **Performance Analyst (Leak Detector)** — explains leak badges, negative expectancy
3. **Strategy Optimizer (The Proof)** — how to validate edge with What-If filters
4. **AI Advisor (Your Consultant)** — pattern detection, toxic combinations
5. **Daily Workflow** — suggested daily routine

Each section has a "Continue" button that updates `guide_progress` in the profile. Final section button says "Finish Guide" and navigates to `/analyst` with `?tour=1` query param.

### 3. `src/hooks/useOnboarding.ts`
Hook managing:
- `onboardingCompleted` state from profile
- `guideProgress` tracking which sections are done
- `completeOnboarding()` — marks profile as onboarded
- `markSectionComplete(sectionId)` — updates guide_progress
- `provisionDemoAccount()` — creates demo account + 25 sample trades

### 4. `src/lib/demoData.ts`
Generates 25 realistic sample trades with varied instruments (XAUUSD, NAS100, EUR/USD, GBP/JPY), sessions, directions, outcomes, R-multiples, HTF biases, confidence levels, and emotional states. Intentionally includes some "leaky" segments (e.g., XAUUSD longs with negative expectancy) so the Analyst view has data to flag.

### 5. `src/components/onboarding/OnboardingTour.tsx`
Lightweight step-by-step tour (custom implementation, no external library). Highlights 3-4 key elements on the Analyst page:
- The "LEAK" badge on a table row
- The "Run Simulation" (Zap) button
- The equity chart
Uses a focused spotlight overlay + tooltip card. Triggered by `?tour=1` query param on `/analyst`.

### 6. `src/components/onboarding/SandboxBanner.tsx`
A slim amber/yellow banner: "SANDBOX MODE — You are viewing demo data". Rendered at the top of AppLayout when the selected account is a demo account.

## Files to Modify

### `src/App.tsx`
- Add `/guide` route inside the authenticated routes
- Wrap Dashboard route with an `OnboardingGate` that shows WelcomeModal for new users

### `src/components/layout/TopNav.tsx`
- Add account switcher dropdown in the header (between brand and profile menu)
- Groups accounts by type: "Live Accounts" and "Demo Accounts" with labels
- Selecting an account updates a shared state (context or URL param)
- Add "GUIDE" tab to the nav tabs array

### `src/components/layout/AppLayout.tsx`
- Render `SandboxBanner` when the active account is demo type

### `src/hooks/useProfile.ts`
- Extend `Profile` interface with `onboardingCompleted: boolean` and `guideProgress: { sections: string[] }`
- Map from DB columns in query

### `src/pages/ProfileSettings.tsx`
- Add "Demo Data" management section
- Single "Delete Demo Account" button that removes the demo account (cascade deletes trades)
- Only visible if a demo account exists

### `src/pages/PerformanceAnalyst.tsx`
- Read `?tour=1` query param and trigger `OnboardingTour` overlay

### `src/contexts/AccountsContext.tsx`
- Add `selectedAccountId` and `setSelectedAccountId` to the shared context so TopNav and all pages can share the active account filter

## Auto-Provisioning Flow
When a new user completes the NicknamePrompt (ProfileGate), the system:
1. Creates the profile (existing behavior)
2. Calls `provisionDemoAccount()` which inserts a "Demo Account" (type=`'demo'`, starting_balance=10000) and 25 sample trades linked to it
3. Shows the WelcomeModal

## Account Switcher Behavior
- Stored in AccountsContext as `selectedAccountId`
- Default: `'__all__'` (existing behavior)
- When a demo account is selected, `SandboxBanner` appears
- All pages already filter by `selectedAccountId` — no additional wiring needed for Dashboard/Analyst

