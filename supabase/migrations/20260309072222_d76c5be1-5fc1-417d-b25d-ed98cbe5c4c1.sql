
ALTER TABLE profiles ADD COLUMN onboarding_completed boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN guide_progress jsonb NOT NULL DEFAULT '{"sections":[]}'::jsonb;
