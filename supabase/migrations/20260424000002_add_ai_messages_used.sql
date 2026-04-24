-- Add AI message counter to profiles for free tier cap enforcement
-- DB-backed (not in-memory) so it survives edge function restarts and cold starts

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ai_messages_used INT NOT NULL DEFAULT 0;

-- Backfill existing rows: NULL would make "NULL < 3 = NULL" in Postgres
-- which evaluates as false/unknown, giving all existing users unlimited AI
UPDATE public.profiles
  SET ai_messages_used = 0
  WHERE ai_messages_used IS NULL;

-- RPC for atomic increment (called after first successful AI response chunk)
CREATE OR REPLACE FUNCTION public.increment_ai_messages(p_user_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.profiles
    SET ai_messages_used = ai_messages_used + 1
    WHERE id = p_user_id;
$$;
