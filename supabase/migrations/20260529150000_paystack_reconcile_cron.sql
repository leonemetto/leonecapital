-- Schedules paystack-reconcile to run every 10 minutes via pg_cron + pg_net.
--
-- The cron job calls the edge function over HTTP with an X-Reconcile-Key
-- header. The key is stored in Supabase Vault (encrypted at rest) and read at
-- runtime via vault.decrypted_secrets — that way the secret never appears in
-- pg_cron.job (which would be visible to anyone with DB access).
--
-- BEFORE THIS MIGRATION RUNS USEFULLY, you must:
--   1. Create the Supabase Edge Function secret PAYSTACK_RECONCILE_INTERNAL_KEY
--      with a strong random value (e.g. `openssl rand -hex 32`).
--   2. Create a matching Vault secret called 'paystack_reconcile_key' with the
--      SAME value, by running this one-time command:
--
--          select vault.create_secret(
--            '<YOUR_KEY_VALUE>',
--            'paystack_reconcile_key',
--            'Shared secret pg_cron uses to call paystack-reconcile'
--          );
--
-- If the vault secret is missing, the cron statement runs but the edge function
-- returns 401 and no work happens. That's safe — but the orphan-detector won't
-- be doing its job.

begin;

-- Required extensions (Supabase ships both; create-if-missing is a no-op if so)
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Drop any previous version of this job so re-running the migration is safe
do $$
begin
  if exists (select 1 from cron.job where jobname = 'paystack-reconcile-every-10-min') then
    perform cron.unschedule('paystack-reconcile-every-10-min');
  end if;
end $$;

-- Schedule the sweep. Every 10 minutes, on the hour and at 10/20/30/40/50.
select cron.schedule(
  'paystack-reconcile-every-10-min',
  '*/10 * * * *',
  $$
  select net.http_post(
    url := 'https://aepmcmfidvkdjjgjvkkw.supabase.co/functions/v1/paystack-reconcile',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-reconcile-key', coalesce(
        (select decrypted_secret from vault.decrypted_secrets where name = 'paystack_reconcile_key' limit 1),
        ''
      )
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 25000
  );
  $$
);

commit;
