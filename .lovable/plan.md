
# Visual Identity Upgrade: Apple x Bloomberg Fusion

This plan applies a comprehensive design refresh across the entire app -- updating colors, typography, card styles, charts, calendar, and interactions -- while keeping all existing functionality and layout intact.

---

## 1. Color Palette and Background (src/index.css)

Update all CSS custom properties in both `:root` and `.dark` blocks:

- **Background**: Change from `0 0% 4.3%` to `0 0% 5.5%` (approximately #0D0D0E)
- **Card**: Change from `0 0% 8.6%` to `0 0% 8.7%` (#161618)
- **Border**: Change from `0 0% 16%` to `0 0% 11%` (#1C1C1E)
- **Primary (Success Emerald)**: Change from `142 71% 45%` to `142 69% 50%` (#30D158)
- **Muted foreground (Slate Grey)**: Change from `0 0% 50%` to `0 0% 56%` (#8E8E93)
- **Profit**: Match the new primary emerald
- **Chart-1**: Match the new primary emerald
- Update `--input`, `--ring`, `--sidebar-border`, `--sidebar-ring`, and accent variables accordingly

Also update the `.glass-card` utility class:
```css
.glass-card {
  @apply bg-card/80 backdrop-blur-[10px] border border-border rounded-xl;
}
```

## 2. Typography -- The "Apple" Look (src/index.css, tailwind.config.ts)

- Font family is already Inter -- no change needed there.
- Add a new utility class for label styling:
```css
.label-text {
  @apply text-xs uppercase tracking-widest text-foreground/50;
}
```
- Add a utility for tabular numbers:
```css
.tabular-nums {
  font-variant-numeric: tabular-lining;
}
```

### Component updates for typography hierarchy:

- **StatsCard** (`src/components/dashboard/StatsCard.tsx`): Make label 12px (already `text-xs`), add `uppercase tracking-widest opacity-50`. Make the value `text-white` explicitly and add `tabular-lining` font-variant.
- **TradingCalendar**: Add `font-variant-numeric: tabular-lining` to all numeric displays.
- **All chart headers**: Already use `text-xs font-semibold uppercase tracking-wider` -- adjust to `tracking-widest` and add `opacity-50`.

## 3. Card Glassmorphism and Depth (src/index.css)

The `.glass-card` class update (mentioned in section 1) handles this:
- Background: `bg-card/80` (slightly transparent card color)
- Backdrop blur: `backdrop-blur-[10px]`
- Border: `border border-border` (using the new subtle #1C1C1E)
- Border radius: `rounded-xl` (already 12px via `--radius: 0.75rem`)

No component-level changes needed since all cards already use the `glass-card` class.

## 4. Data Visualization Refinement

### Radar Chart (`src/components/charts/PerformanceRadar.tsx`)
- Change `PolarGrid` stroke to use a thinner, subtler color: `stroke="hsl(0,0%,16%)"` with `strokeWidth={0.5}`
- Change the `Radar` component: `strokeWidth={1}`, `fillOpacity={0.08}`, stroke color to `#30D158`, fill to `#30D158`
- Remove dot styling or make dots very subtle: `dot={{ r: 2, fill: '#30D158', strokeWidth: 0 }}`

### Calendar (`src/components/calendar/TradingCalendar.tsx`)
- Remove the harsh colored backgrounds from day cells
- Use a transparent/minimal base for all days
- For the active/today day: add a soft inner glow using `box-shadow: inset 0 0 12px rgba(48,209,88,0.15)` and a subtle green left-border accent
- Trading days with data: show a very faint dot or subtle bottom-border accent instead of full cell background coloring
- Keep the P&L text coloring (green/red) for data readability

### Profit Factor Infinity (`src/pages/Dashboard.tsx`)
- Change `'∞'` display: use white color and add a small muted label. Update the StatsCard value rendering:
  - When infinity: show `∞` in white with a subtitle "Infinite" in muted text below

## 5. Buttons and Interaction

### Quick Actions (`src/components/dashboard/QuickActions.tsx`)
- Apply a premium button style with subtle gradient and internal stroke:
```css
bg-gradient-to-b from-white/[0.06] to-transparent 
border border-white/[0.08] 
shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]
hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_16px_rgba(48,209,88,0.08)]
```

### Global hover states
- Update button hover to use soft glow transitions rather than harsh color swaps
- Add to index.css:
```css
.hover-glow:hover {
  box-shadow: 0 0 20px -4px hsl(var(--primary) / 0.15);
}
```

## 6. Additional Polish

### Tooltip styles (all charts)
- Update tooltip background from `#161616` to `#161618`
- Border to `1px solid #1C1C1E`

### NicknamePrompt (`src/components/NicknamePrompt.tsx`)
- Will automatically inherit the new glass-card styling

### TopNav (`src/components/layout/TopNav.tsx`)
- Update `bg-card/90` will inherit the new card color automatically

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/index.css` | CSS variables, glass-card utility, new utility classes |
| `tailwind.config.ts` | Minor color reference adjustments if needed |
| `src/components/dashboard/StatsCard.tsx` | Label opacity, tabular nums, white value text |
| `src/components/dashboard/QuickActions.tsx` | Premium gradient button styling |
| `src/components/charts/PerformanceRadar.tsx` | Thinner strokes, softer fill, smaller dots |
| `src/components/charts/EquityCurve.tsx` | Updated green hex to #30D158, tooltip border |
| `src/components/charts/WinLossPie.tsx` | Updated green hex to #30D158, tooltip border |
| `src/components/charts/StrategyChart.tsx` | Updated green hex to #30D158, tooltip border |
| `src/components/calendar/TradingCalendar.tsx` | Ghost grid, inner glow for active day, subtler cell styling |
| `src/pages/Dashboard.tsx` | Profit Factor infinity display with "Infinite" sublabel |

No new files or dependencies are required.
