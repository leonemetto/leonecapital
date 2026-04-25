-- Block authenticated users from directly writing ai_messages_used.
-- Only the increment_ai_messages() SECURITY DEFINER function (which runs as
-- postgres) can update this column. This prevents users from resetting or
-- lowering their own counter via the REST API or client SDKs.
REVOKE UPDATE (ai_messages_used) ON public.profiles FROM authenticated;
