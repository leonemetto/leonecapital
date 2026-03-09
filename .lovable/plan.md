

# Performance Analyst & Strategy Optimizer — Actionable Insights Refinement

## Overview
Transform the Performance Analyst page from raw data tables into an actionable intelligence dashboard with cyber-noir aesthetics, visual heat-bars, leak detection, ghost curve overlays, and direct-to-simulator integration.

## Changes

### 1. `src/lib/analytics.ts` — Extend SimulationResult & Add Helpers

- Add `originalEquityCurve` to `SimulationResult` so the ghost curve can be rendered alongside the filtered curve
- Compute both equity curves in `simulateFilter()`
- Add a helper `detectToxicCombinations(trades)` that checks instrument+session+direction combos for negative R-expectancy, returning flagged rows with diagnostic labels

### 2. `src/pages/PerformanceAnalyst.tsx` — Major UI Overhaul

**ExpectancyTable enhancements:**
- Add visual heat-bars behind "Expectancy" and "Avg R" columns — a thin `<div>` with `bg-[#30D158]` (positive) or `bg-red-500/40` (negative), width proportional to value
- Leak detection: rows with negative expectancy get an amber `AlertTriangle` icon + "Leak Detected" label
- Negative-expectancy rows get `bg-red-900/20` tint
- "Run Simulation" button at end of each row (using `Zap` icon). Amber color if leak detected. Clicking scrolls to simulator and pre-fills the relevant filter (instrument/session)
- Accept `title` field type (e.g. `instrument`, `session`) and an `onSimulate(key, field)` callback

**StrategySimulator enhancements:**
- Accept optional `preFilter` prop to auto-fill filters from table row clicks
- Dynamic insight header: replace static improvement label with human-language summary:
  - If filtered P&L < original: `"This setup accounts for X% ($Y) of your total gains"`
  - If filtered P&L > original: `"Filtering improves P&L by X% — removing [label] adds $Y"`
- Ghost curve overlay: render `originalEquityCurve` as dashed gray `Area`, filtered as bold neon green with glow (`filter: drop-shadow(0 0 4px #30D158)`)
- Impact badges: `Shield` icon if filtered max drawdown < original; `Zap` icon if expectancy > 0.500

**Metric cards:**
- Add impact badges next to values where applicable

**Page-level state:**
- Add `simulatorRef` for scroll-to behavior
- Add `preFilter` state managed by table row clicks
- Add instrument filter for simulator (new filter option)

### 3. Styling — Cyber-Noir Polish

- All `glass-card` backgrounds remain on pure black
- Neon green (`#30D158`) for positive accents throughout
- Mono-spaced font (`font-mono`) already used for financial digits — keep consistent
- 200ms transitions on filter changes via `transition-all duration-200`
- Heat-bar elements use `transition-all duration-200`

### 4. AI Advisor Integration (Lightweight)

- Skip the full AI-generated diagnostic tooltip for now (requires edge function calls per row, expensive)
- Instead, add static contextual diagnostics for flagged rows using pattern matching:
  - Negative expectancy + specific instrument → pre-written diagnostic templates
  - e.g., "Negative expectancy detected on {instrument}. Consider tightening filters or avoiding this pair."

### Files Modified
1. **`src/lib/analytics.ts`** — Add `originalEquityCurve` to SimulationResult, compute it in `simulateFilter`, add `detectToxicCombinations` helper
2. **`src/pages/PerformanceAnalyst.tsx`** — Full rewrite of ExpectancyTable, StrategySimulator, and page layout with all enhancements above

### Not Included (Scope Control)
- Grid background overlay (already exists as bg-pattern in the app)
- Font change to Inter/SF Pro (app uses Outfit per design system)
- Full AI-generated per-row diagnostics via edge function (too expensive per render; using template diagnostics instead)

