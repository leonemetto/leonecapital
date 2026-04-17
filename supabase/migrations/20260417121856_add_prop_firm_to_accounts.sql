-- Add prop firm challenge fields to accounts table
-- These are only used when account type = 'prop'

ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS challenge_size        NUMERIC,
  ADD COLUMN IF NOT EXISTS profit_target_pct     NUMERIC,
  ADD COLUMN IF NOT EXISTS max_daily_dd_pct      NUMERIC,
  ADD COLUMN IF NOT EXISTS max_total_dd_pct      NUMERIC,
  ADD COLUMN IF NOT EXISTS trailing_drawdown      BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS challenge_start_date  TEXT;
