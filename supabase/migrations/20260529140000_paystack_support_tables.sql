-- T2/T3/T4 — three support tables behind the Paystack webhook
--   webhook_events   — idempotency + replay defense (every Paystack event lands here first)
--   refunds_issued   — refund-rate audit (used to defend low refund rate if Paystack reviews us)
--   pending_intents  — orphan detector (paid but webhook never arrived → cron reconciles)
--
-- All three are service-role-writable only. Users see at most their own rows.

begin;

-- ─── T2. webhook_events ────────────────────────────────────────────────────
-- Paystack signs each webhook with HMAC SHA-512 and includes a unique event id.
-- We insert the event id as the primary key. If Paystack retries the same event
-- (which they do on transient failures), the second insert raises a 23505 unique
-- violation — we catch that and return 200 immediately, never reprocessing.
--
-- Replay defense: we also reject events whose Paystack timestamp is >5 min old.
--
-- raw_payload is preserved indefinitely so we can re-derive state during a
-- chargeback or audit, even if our code later changes how we interpret events.
create table if not exists public.webhook_events (
  id                  text primary key,           -- Paystack event id (e.g. "evt_xxxxx")
  event_type          text not null,              -- e.g. "charge.success"
  raw_payload         jsonb not null,
  signature_verified  boolean not null default true,
  received_at         timestamptz not null default now(),
  processed_at        timestamptz,                -- set when handler finishes
  processing_error    text,                       -- set if handler threw
  paystack_created_at timestamptz                 -- the timestamp in event.created_at
);

create index if not exists webhook_events_event_type_idx
  on public.webhook_events (event_type);
create index if not exists webhook_events_received_at_idx
  on public.webhook_events (received_at desc);
create index if not exists webhook_events_unprocessed_idx
  on public.webhook_events (received_at)
  where processed_at is null;

alter table public.webhook_events enable row level security;
-- No policies — service role only. The webhook handler runs with service role.
-- A future admin viewer will read via a SECURITY DEFINER function gated on
-- an allowlisted email.

comment on table public.webhook_events is
  'Idempotency log for every Paystack webhook. Replay defense + audit trail.';

-- ─── T3. refunds_issued ────────────────────────────────────────────────────
-- Every refund — Paystack-initiated or manual — gets a row here. Used for:
--   1. Showing the user their refund history (RLS lets them read their own).
--   2. Proving to Paystack that our refund rate stays below their threshold
--      (typically <2% of monthly transaction value).
--   3. Forensics if a user claims they were refunded but the money didn't
--      arrive — we have the Paystack refund id to escalate with.
create table if not exists public.refunds_issued (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  subscription_id     uuid references public.subscriptions(id) on delete set null,
  amount              integer not null,             -- smallest currency unit
  currency            text not null check (currency in ('KES', 'USD', 'EUR', 'GBP')),
  reason              text,                          -- 'customer_request', 'duplicate_charge', 'outage', 'chargeback_resolved', etc.
  paystack_refund_id  text unique,                   -- "REF_xxx" from Paystack
  issued_at           timestamptz not null default now(),
  issued_by           text not null check (issued_by in ('paystack', 'manual', 'cron-reconcile')),
  notes               text,                          -- free-form notes for the audit trail
  created_at          timestamptz not null default now()
);

create index if not exists refunds_issued_user_id_idx on public.refunds_issued (user_id);
create index if not exists refunds_issued_issued_at_idx on public.refunds_issued (issued_at desc);

alter table public.refunds_issued enable row level security;

drop policy if exists "refunds_issued read own" on public.refunds_issued;
create policy "refunds_issued read own"
  on public.refunds_issued for select
  using (auth.uid() = user_id);
-- No INSERT/UPDATE/DELETE for authenticated users — service role only.

comment on table public.refunds_issued is
  'Every refund issued, ever. Proves refund-rate discipline to Paystack if audited.';

-- ─── T4. pending_intents ───────────────────────────────────────────────────
-- The orphan detector. When a user clicks Upgrade we create a row here BEFORE
-- redirecting them to Paystack. Three things can happen:
--   1. They pay → Paystack webhook fires → we upsert subscription + mark this
--      intent 'completed'.
--   2. They pay → webhook is lost/delayed → user looks 'unpaid' to us. The
--      cron job at paystack-reconcile sweeps intents older than 10 min and
--      asks Paystack /transaction/verify/{reference} for the truth. If paid,
--      it synthesises the same handler call the webhook would have made.
--   3. They abandon checkout → status stays 'pending' until the 24h sweep
--      marks it 'orphaned' and Sentry-alerts so we can follow up if it was
--      actually a payment we missed.
create table if not exists public.pending_intents (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  paystack_reference  text not null unique,         -- the reference we passed to /transaction/initialize
  plan                public.subscription_plan not null,
  billing_cycle       public.billing_cycle not null,
  currency            text not null check (currency in ('KES', 'USD', 'EUR', 'GBP')),
  amount              integer not null,
  status              text not null default 'pending' check (status in ('pending', 'completed', 'failed', 'orphaned')),

  -- Consent captured at the moment of intent (NOT at the moment of charge) so
  -- we always have it even if the user abandons checkout.
  terms_version_accepted   text not null,
  refunds_version_accepted text not null,
  privacy_version_accepted text not null,
  ip_at_signup             inet,
  user_agent_at_signup     text,
  consent_checkbox_text    text,

  created_at          timestamptz not null default now(),
  completed_at        timestamptz,
  last_checked_at     timestamptz                   -- cron updates this each sweep so we don't hammer Paystack
);

create index if not exists pending_intents_user_id_idx on public.pending_intents (user_id);
create index if not exists pending_intents_status_idx on public.pending_intents (status);
create index if not exists pending_intents_pending_old_idx
  on public.pending_intents (created_at)
  where status = 'pending';

alter table public.pending_intents enable row level security;

drop policy if exists "pending_intents read own" on public.pending_intents;
create policy "pending_intents read own"
  on public.pending_intents for select
  using (auth.uid() = user_id);
-- No INSERT/UPDATE/DELETE for authenticated users — service role only.
-- (paystack-init-transaction edge function runs with service role even though
-- it requires user auth, so it can insert on behalf of the user.)

comment on table public.pending_intents is
  'Per-checkout intent row. Orphan detector for paid-but-webhook-missed flows.';

commit;
