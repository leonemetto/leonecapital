-- Unschedule the paystack-reconcile cron and schedule lemon-reconcile instead.
--
-- Why: pivoted from Paystack to Lemon Squeezy. The paystack-reconcile edge
-- function was never deployed (zero customers, no traffic), so unscheduling
-- is risk-free. The new cron calls the lemon-reconcile function (to be
-- deployed in a follow-up task).
--
-- The shared secret env var also gets renamed:
--   - was:  PAYSTACK_RECONCILE_INTERNAL_KEY (Supabase secret)
--           paystack_reconcile_key          (Vault secret used by cron)
--   - now:  RECONCILE_INTERNAL_KEY          (Supabase secret)
--           reconcile_key                   (Vault secret)
--
-- BEFORE THIS MIGRATION IS USEFUL, the user must:
--   1. Create the Supabase Edge Function secret RECONCILE_INTERNAL_KEY with a
--      strong random value (e.g. `openssl rand -hex 32`).
--   2. Create a matching Vault secret called 'reconcile_key' with the SAME
--      value, by running this one-time command in the Supabase SQL editor:
--
--          select vault.create_secret(
--            '<YOUR_KEY_VALUE>',
--            'reconcile_key',
--            'Shared secret pg_cron uses to call lemon-reconcile'
--          );
--
-- If the vault secret is missing, the cron statement runs but the edge function
-- returns 401 and no reconciliation happens. That is safe but the orphan
-- detector is not doing its job.

begin;

-- Make sure extensions are present (idempotent on Supabase)
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Remove the old Paystack cron if it was ever scheduled
do $$
begin
  if exists (select 1 from cron.job where jobname = 'paystack-reconcile-every-10-min') then
    perform cron.unschedule('paystack-reconcile-every-10-min');
  end if;
end $$;

-- Also remove an earlier-named version of the new cron (safe re-runs)
do $$
begin
  if exists (select 1 from cron.job where jobname = 'lemon-reconcile-every-10-min') then
    perform cron.unschedule('lemon-reconcile-every-10-min');
  end if;
end $$;

-- Schedule the new sweep, every 10 minutes
select cron.schedule(
  'lemon-reconcile-every-10-min',
  '*/10 * * * *',
  $$
  select net.http_post(
    url := 'https://aepmcmfidvkdjjgjvkkw.supabase.co/functions/v1/lemon-reconcile',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-reconcile-key', coalesce(
        (select decrypted_secret from vault.decrypted_secrets where name = 'reconcile_key' limit 1),
        ''
      )
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 25000
  );
  $$
);

commit;
