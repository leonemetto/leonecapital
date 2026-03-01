
ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS r_multiple numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS risk_percent numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS htf_bias text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS emotional_state integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS confidence_level integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS time_in_trade integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS followed_plan boolean DEFAULT NULL;
