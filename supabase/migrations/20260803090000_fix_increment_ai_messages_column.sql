-- Fix increment_ai_messages: it matched the wrong column.
--
-- public.profiles has BOTH `id` (synthetic primary key) and `user_id` (the
-- auth.users UUID). The original function in 20260424000002 did:
--     WHERE id = p_user_id
-- but p_user_id is always an auth uid, and profiles.id is never equal to it
-- (verified in production: 0 of 96 rows have id = auth uid). So the UPDATE
-- matched zero rows every time and the counter could never move.
--
-- Combined with the fact that nothing ever called this function, Atlas usage
-- has been completely unmeasurable since launch.
--
-- Backward compatible: same name, same signature, same return type. Callers
-- need no changes. Rollback is simply restoring the previous body.

CREATE OR REPLACE FUNCTION public.increment_ai_messages(p_user_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.profiles
    SET ai_messages_used = COALESCE(ai_messages_used, 0) + 1
    WHERE user_id = p_user_id;
$$;
