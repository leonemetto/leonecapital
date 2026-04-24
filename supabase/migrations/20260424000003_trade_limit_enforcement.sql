-- Trade limit enforcement for free tier
-- Adds is_demo flag (demo trades excluded from cap), user_id index, and DB trigger

-- is_demo flag: demo trades generated during onboarding don't count against the cap
ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;

-- Backfill: existing trades are real trades
UPDATE public.trades SET is_demo = false WHERE is_demo IS NULL;

-- Index: trigger does COUNT(*) per user on every INSERT — needs to be fast
CREATE INDEX IF NOT EXISTS trades_user_id_idx ON public.trades(user_id);

-- Trade limit trigger: blocks free users above 50 real (non-demo) trades
CREATE OR REPLACE FUNCTION public.check_trade_limit()
RETURNS TRIGGER AS $$
DECLARE
  user_tier TEXT;
  user_status TEXT;
  trade_count INT;
BEGIN
  -- Demo trades never count against the cap
  IF NEW.is_demo = true THEN
    RETURN NEW;
  END IF;

  SELECT tier, status INTO user_tier, user_status
    FROM public.subscriptions WHERE user_id = NEW.user_id;

  -- No subscription row = treat as free
  IF user_tier IS NULL OR user_tier = 'free' OR
     (user_status IN ('canceled', 'past_due') AND user_tier = 'free') THEN
    SELECT COUNT(*) INTO trade_count
      FROM public.trades
      WHERE user_id = NEW.user_id AND is_demo = false;
    IF trade_count >= 50 THEN
      RAISE EXCEPTION 'Free tier limit reached. Upgrade to Pro to log more trades.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER enforce_trade_limit
  BEFORE INSERT ON public.trades
  FOR EACH ROW EXECUTE FUNCTION public.check_trade_limit();
