-- support_emails — audit trail for every email sent to support@edgeflow.capital
--
-- Why: chargeback defense. If a customer disputes a charge claiming "I tried to
-- contact you but no one responded", we can prove from this table whether they
-- ever emailed us, when, and what we did with it. Also lets us prove a low
-- refund/complaint rate if Paystack ever audits us.
--
-- Written by support-inbox edge function (service role only).
-- Read by future admin dashboard.

create table if not exists public.support_emails (
  id                    uuid primary key default gen_random_uuid(),
  resend_email_id       text unique,            -- idempotency key from Resend webhook
  from_email            text not null,
  from_name             text,
  to_email              text not null,          -- support@, dpo@, leone@, etc.
  subject               text,
  body_text             text,
  body_html             text,
  received_at           timestamptz not null default now(),
  -- fan-out status
  telegram_message_id   bigint,                 -- Telegram message ID once posted
  telegram_posted_at    timestamptz,
  gmail_forwarded_at    timestamptz,
  gmail_forward_resend_id text,                 -- Resend send ID for the forward
  -- classification
  is_paystack_dispute   boolean not null default false,
  is_spam               boolean not null default false,
  -- raw payload for forensic recovery if our parsing misses something
  raw_payload           jsonb,
  created_at            timestamptz not null default now()
);

create index if not exists support_emails_received_at_idx
  on public.support_emails (received_at desc);

create index if not exists support_emails_from_email_idx
  on public.support_emails (from_email);

create index if not exists support_emails_is_paystack_dispute_idx
  on public.support_emails (is_paystack_dispute)
  where is_paystack_dispute = true;

alter table public.support_emails enable row level security;

-- No public SELECT policy. The table is admin-only.
-- Service role bypasses RLS, so the edge function can always insert.
-- A future admin dashboard will read via service role or a SECURITY DEFINER function.

-- Explicitly: authenticated users CANNOT read this table. We do NOT want
-- a customer's own email body queryable by them after we've classified it.

comment on table public.support_emails is
  'Audit log of every inbound email to support@edgeflow.capital. Chargeback evidence. Admin-only.';
