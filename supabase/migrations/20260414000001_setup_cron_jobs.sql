-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Re-engagement emails: runs daily at 08:00 UTC
-- Checks users inactive for exactly 3 or 7 days and sends email
SELECT cron.schedule(
  're-engagement-daily',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := 'https://aepmcmfidvkdjjgjvkkw.supabase.co/functions/v1/re-engagement',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.service_role_key', true) || '"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Weekly AI digest: runs every Monday at 07:00 UTC
-- Sends performance digest to users who traded in the last 7 days
SELECT cron.schedule(
  'weekly-digest-monday',
  '0 7 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://aepmcmfidvkdjjgjvkkw.supabase.co/functions/v1/weekly-digest',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.service_role_key', true) || '"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
