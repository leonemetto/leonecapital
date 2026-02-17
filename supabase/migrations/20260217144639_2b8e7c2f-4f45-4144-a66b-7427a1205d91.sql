
-- Add mental_triggers and behavioral_memory columns to trader_profiles
ALTER TABLE public.trader_profiles
  ADD COLUMN IF NOT EXISTS mental_triggers TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS behavioral_memory JSONB NOT NULL DEFAULT '[]'::jsonb;
