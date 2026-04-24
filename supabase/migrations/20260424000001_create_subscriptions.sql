-- Subscriptions table: tracks user tier and payment status
-- Service role only for writes (webhooks). Users read their own row.

CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'elite')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  provider TEXT CHECK (provider IN ('lemon_squeezy', 'intasend', NULL)),
  provider_subscription_id TEXT,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE for authenticated users — service role only (webhooks)
