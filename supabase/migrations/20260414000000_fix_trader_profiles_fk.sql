-- Add missing foreign key constraint to trader_profiles
-- user_id had no REFERENCES auth.users — orphaned rows possible if user deleted

ALTER TABLE public.trader_profiles
  ADD CONSTRAINT trader_profiles_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;
