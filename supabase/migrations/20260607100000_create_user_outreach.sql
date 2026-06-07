-- user_outreach — one-off/founder-led outreach ledger.
-- Service-role scripts write here after Resend accepts an email, so a campaign
-- can be rerun safely without contacting the same user twice.

CREATE TABLE public.user_outreach (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  campaign_key TEXT NOT NULL,
  segment TEXT NOT NULL CHECK (segment IN ('dropped_before_onboarding', 'onboarded_no_trades')),
  subject TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'resend',
  provider_message_id TEXT UNIQUE,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, campaign_key)
);

CREATE INDEX user_outreach_campaign_key_idx
  ON public.user_outreach (campaign_key, sent_at DESC);

ALTER TABLE public.user_outreach ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.user_outreach IS
  'Admin-only ledger for one-off lifecycle/founder outreach. No client RLS policies; service role only.';
