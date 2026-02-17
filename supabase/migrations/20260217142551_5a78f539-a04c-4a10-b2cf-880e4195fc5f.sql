
-- Trader profiles for AI personalization
CREATE TABLE public.trader_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  trading_style TEXT NOT NULL DEFAULT '',
  favorite_instruments TEXT NOT NULL DEFAULT '',
  favorite_sessions TEXT NOT NULL DEFAULT '',
  account_goals TEXT NOT NULL DEFAULT '',
  common_mistakes TEXT NOT NULL DEFAULT '',
  trading_rules TEXT NOT NULL DEFAULT '',
  risk_per_trade TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.trader_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own trader profile"
ON public.trader_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trader profile"
ON public.trader_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trader profile"
ON public.trader_profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trader profile"
ON public.trader_profiles FOR DELETE
USING (auth.uid() = user_id);
