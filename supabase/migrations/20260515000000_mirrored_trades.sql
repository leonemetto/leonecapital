-- Mirrored Trade Logging
-- Adds copy_weight to accounts (default 1) and trade_group_id to trades.
-- Denormalized model: shared fields live on each child row, linked by trade_group_id.

ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS copy_weight NUMERIC NOT NULL DEFAULT 1;

-- One row in `accounts` can represent N identical funded accounts (e.g., 20 mirrored
-- FTMO 50k accounts of the same size). Defaults to 1 for everyone else.
ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1;

ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS trade_group_id UUID;

CREATE INDEX IF NOT EXISTS trades_group_idx
  ON public.trades(trade_group_id)
  WHERE trade_group_id IS NOT NULL;

-- copy_weight should be positive — guard against 0 / negatives so the split math
-- can never divide by zero or produce inverted results.
ALTER TABLE public.accounts
  DROP CONSTRAINT IF EXISTS accounts_copy_weight_positive;
ALTER TABLE public.accounts
  ADD CONSTRAINT accounts_copy_weight_positive CHECK (copy_weight > 0);

ALTER TABLE public.accounts
  DROP CONSTRAINT IF EXISTS accounts_quantity_positive;
ALTER TABLE public.accounts
  ADD CONSTRAINT accounts_quantity_positive CHECK (quantity > 0);
