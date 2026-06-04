-- Make the subscriptions stack provider-agnostic.
--
-- Context:
--   The April migration (20260424000001) created subscriptions with `provider`
--   + `provider_subscription_id` already in place. The 20260529 Paystack
--   migration added paystack_* columns alongside (paystack_subscription_id,
--   paystack_customer_code, paystack_authorization_code, paystack_plan_code).
--   That created a column collision on provider_subscription_id which my
--   first version of this file tripped over.
--
--   On 2026-05-30 Paystack disabled the EdgeFlow account under their forex
--   AUP, and we pivoted to Lemon Squeezy. This migration:
--     - DROPs paystack_subscription_id (the April provider_subscription_id
--       wins; it had no data anyway)
--     - RENAMEs the other three paystack_* → provider_* (no collisions)
--     - ADDs provider discriminator + renames to provider_* across the three
--       support tables (webhook_events, refunds_issued, pending_intents)
--     - Re-adds the provider CHECK constraint on subscriptions
--
-- Idempotency:
--   Every step is wrapped in IF EXISTS / IF NOT EXISTS or a DO block so the
--   migration is safe to re-run after partial failures.
--
-- Assumptions:
--   - No production paid rows exist (zero customers as of 2026-06-04).
--   - Paystack edge functions were never deployed — no service code is
--     writing into these columns right now.
--   - Postgres enums (subscription_plan, subscription_status,
--     subscription_channel, billing_cycle) are provider-neutral. Keep them.

begin;

-- ─── subscriptions ─────────────────────────────────────────────────────────

-- Drop the unique index on paystack_subscription_id (was created by the
-- Paystack migration). It will be re-created on the surviving provider_
-- column at the end of this section.
drop index if exists public.subscriptions_paystack_sub_unique;

-- paystack_subscription_id collides with the April-era provider_subscription_id.
-- The April column has the right name and zero data — drop the paystack one.
alter table public.subscriptions
  drop column if exists paystack_subscription_id;

-- The other three paystack_* columns have no April equivalent. Rename them
-- if present; if a previous run already renamed them, skip.
do $$ begin
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='subscriptions'
               and column_name='paystack_customer_code')
     and not exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='subscriptions'
               and column_name='provider_customer_code')
  then
    execute 'alter table public.subscriptions rename column paystack_customer_code to provider_customer_code';
  end if;

  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='subscriptions'
               and column_name='paystack_authorization_code')
     and not exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='subscriptions'
               and column_name='provider_authorization_code')
  then
    execute 'alter table public.subscriptions rename column paystack_authorization_code to provider_authorization_code';
  end if;

  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='subscriptions'
               and column_name='paystack_plan_code')
     and not exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='subscriptions'
               and column_name='provider_plan_code')
  then
    execute 'alter table public.subscriptions rename column paystack_plan_code to provider_plan_code';
  end if;
end $$;

-- The provider CHECK was dropped in 20260529130000's wholesale CHECK sweep.
-- Re-add a provider-agnostic CHECK.
alter table public.subscriptions
  drop constraint if exists subscriptions_provider_check;
alter table public.subscriptions
  add constraint subscriptions_provider_check
  check (provider is null or provider in ('lemonsqueezy', 'intasend', 'manual'));

-- Re-create the unique index on the surviving provider_subscription_id column.
create unique index if not exists subscriptions_provider_sub_unique
  on public.subscriptions (provider_subscription_id)
  where provider_subscription_id is not null;

comment on column public.subscriptions.provider is
  'Payment processor: lemonsqueezy (international), intasend (Kenya M-Pesa), manual (admin).';
comment on column public.subscriptions.provider_subscription_id is
  'Processor-specific subscription ID (LS subscription_id, Intasend subscription_id). Unique when set.';
comment on column public.subscriptions.provider_customer_code is
  'Processor-specific customer ID. Reused across multiple subs if same user resubscribes.';
comment on column public.subscriptions.provider_authorization_code is
  'Processor-specific saved payment method token used for renewals.';
comment on column public.subscriptions.provider_plan_code is
  'Processor-specific plan/variant id snapshot at time of purchase.';

-- ─── webhook_events ────────────────────────────────────────────────────────
alter table public.webhook_events
  add column if not exists provider text
    not null default 'lemonsqueezy'
    check (provider in ('lemonsqueezy', 'intasend', 'manual'));

do $$ begin
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='webhook_events'
               and column_name='paystack_created_at')
     and not exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='webhook_events'
               and column_name='provider_event_created_at')
  then
    execute 'alter table public.webhook_events rename column paystack_created_at to provider_event_created_at';
  end if;
end $$;

create index if not exists webhook_events_provider_idx
  on public.webhook_events (provider);

comment on column public.webhook_events.provider is
  'Which processor sent the webhook.';
comment on column public.webhook_events.provider_event_created_at is
  'Timestamp the provider stamped on the event. Used for replay rejection (>5 min old).';

-- ─── refunds_issued ────────────────────────────────────────────────────────
do $$ begin
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='refunds_issued'
               and column_name='paystack_refund_id')
     and not exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='refunds_issued'
               and column_name='provider_refund_id')
  then
    execute 'alter table public.refunds_issued rename column paystack_refund_id to provider_refund_id';
  end if;
end $$;

alter table public.refunds_issued
  add column if not exists provider text
    not null default 'lemonsqueezy'
    check (provider in ('lemonsqueezy', 'intasend', 'manual'));

-- Refresh issued_by CHECK to be provider-agnostic
do $$ declare ck text; begin
  select conname into ck from pg_constraint
   where conrelid = 'public.refunds_issued'::regclass
     and contype = 'c'
     and pg_get_constraintdef(oid) like '%issued_by%';
  if ck is not null then
    execute format('alter table public.refunds_issued drop constraint %I', ck);
  end if;
end $$;

update public.refunds_issued set issued_by = 'webhook' where issued_by = 'paystack';

alter table public.refunds_issued
  add constraint refunds_issued_issued_by_check
  check (issued_by in ('webhook', 'manual', 'cron-reconcile'));

create index if not exists refunds_issued_provider_idx
  on public.refunds_issued (provider);

comment on column public.refunds_issued.provider is
  'Which processor issued the refund.';
comment on column public.refunds_issued.provider_refund_id is
  'Processor-specific refund ID. Unique when set.';

-- ─── pending_intents ───────────────────────────────────────────────────────
do $$ begin
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='pending_intents'
               and column_name='paystack_reference')
     and not exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='pending_intents'
               and column_name='provider_reference')
  then
    execute 'alter table public.pending_intents rename column paystack_reference to provider_reference';
  end if;
end $$;

alter table public.pending_intents
  add column if not exists provider text
    not null default 'lemonsqueezy'
    check (provider in ('lemonsqueezy', 'intasend', 'manual'));

alter table public.pending_intents
  add column if not exists variant_id text;

-- Replace single-column UNIQUE with compound (provider, provider_reference)
-- so two different providers could (theoretically) reuse the same reference.
do $$ declare uc text; begin
  select conname into uc from pg_constraint
   where conrelid = 'public.pending_intents'::regclass
     and contype = 'u'
     and pg_get_constraintdef(oid) like '%(provider_reference)%';
  if uc is not null then
    execute format('alter table public.pending_intents drop constraint %I', uc);
  end if;
end $$;

do $$ declare ix text; begin
  select indexname into ix from pg_indexes
   where schemaname='public' and tablename='pending_intents'
     and indexdef like '%provider_reference%'
     and indexname != 'pending_intents_provider_ref_unique';
  if ix is not null then
    execute format('drop index public.%I', ix);
  end if;
end $$;

create unique index if not exists pending_intents_provider_ref_unique
  on public.pending_intents (provider, provider_reference);

create index if not exists pending_intents_provider_idx
  on public.pending_intents (provider);

comment on column public.pending_intents.provider is
  'Which processor this checkout intent targeted.';
comment on column public.pending_intents.provider_reference is
  'Processor-specific checkout reference. Unique per (provider, provider_reference).';
comment on column public.pending_intents.variant_id is
  'Processor variant id snapshot at click-time (e.g. LS variant_id). Forensics if pricing changes.';

commit;
