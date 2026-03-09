

## Auto-Sign P&L Based on Trade Outcome

When logging a trade, the P&L sign will be automatically determined by the selected outcome (Win/Loss/BE), so you only need to enter the absolute number.

### How It Will Work
- **Win**: P&L is always positive (e.g., entering "50" saves as +50)
- **Loss**: P&L is always negative (e.g., entering "50" saves as -50)
- **Breakeven**: P&L is set to 0 regardless of input

### Technical Changes

**File: `src/components/trade/TradeForm.tsx`**
- In `handleSubmit`, after parsing the P&L value, apply the sign based on the selected outcome:
  - If outcome is `"loss"`, ensure `pnl` is negative using `-Math.abs(pnl)`
  - If outcome is `"win"`, ensure `pnl` is positive using `Math.abs(pnl)`
  - If outcome is `"breakeven"`, set `pnl` to `0`
- Update the P&L input label/placeholder to hint that only the amount is needed (e.g., "P&L Amount ($)")

