-- subscriptions Paystack migration (T1 in eng-review plan)
--
-- The April migration (20260424000001_create_subscriptions.sql) created the
-- table with: tier, status, provider, provider_subscription_id, current_period_end,
-- and UNIQUE(user_id). We need to migrate it to the Paystack-aware schema with
-- 14 audit columns, enums, and a partial unique index — WITHOUT losing existing
-- rows or breaking the trade-limit trigger.
--
-- This is wrapped in a single transaction so the table is either fully migrated
-- or fully untouched (Postgres DDL is transactional).

begin;

-- ─── 1. Create enums ────────────────────────────────────────────────────────
do $$ begin
  create type public.subscription_plan as enum ('free', 'pro', 'elite');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.subscription_status as enum (
    'trialing', 'active', 'past_due', 'cancelling', 'cancelled', 'expired'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.subscription_channel as enum ('card', 'mpesa', 'bank', 'apple_pay', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.billing_cycle as enum ('monthly', 'annual');
exception when duplicate_object then null; end $$;

-- ─── 2. Drop old defaults + CHECK constraints (blockers to type changes) ────
alter table public.subscriptions
  alter column tier drop default,
  alter column status drop default;

-- The April migration's CHECK constraints have auto-generated names; iterate.
do $$ declare ck text; begin
  for ck in
    select conname from pg_constraint
    where conrelid = 'public.subscriptions'::regclass and contype = 'c'
  loop
    execute format('alter table public.subscriptions drop constraint %I', ck);
  end loop;
end $$;

-- ─── 3. Spelling normalisation: 'canceled' → 'cancelled' ───────────────────
-- Old enum used American spelling; new enum uses British.
update public.subscriptions set status = 'cancelled' where status = 'canceled';

-- ─── 4. Rename tier → plan, convert both columns to enum types ─────────────
alter table public.subscriptions rename column tier to plan;

alter table public.subscriptions
  alter column plan type public.subscription_plan using plan::public.subscription_plan;

alter table public.subscriptions
  alter column status type public.subscription_status using status::public.subscription_status;

-- Re-apply defaults with new enum types
alter table public.subscriptions
  alter column plan set default 'free',
  alter column status set default 'active';

-- ─── 5. Drop old UNIQUE(user_id) — we now allow multiple rows per user ─────
-- (historical 'cancelled' rows can coexist with a new 'active' row)
do $$ declare uc text; begin
  for uc in
    select conname from pg_constraint
    where conrelid = 'public.subscriptions'::regclass
      and contype = 'u'
  loop
    execute format('alter table public.subscriptions drop constraint %I', uc);
  end loop;
end $$;

-- ─── 6. Add new columns (all nullable — webhook will populate paid rows) ───
alter table public.subscriptions
  add column if not exists billing_cycle public.billing_cycle,
  add column if not exists amount integer,
  add column if not exists currency text,
  add column if not exists channel public.subscription_channel,
  add column if not exists started_at timestamptz,
  add column if not exists current_period_start timestamptz,
  add column if not exists cancel_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists ended_at timestamptz,
  add column if not exists paystack_subscription_id text,
  add column if not exists paystack_customer_code text,
  add column if not exists paystack_authorization_code text,
  add column if not exists paystack_plan_code text,
  add column if not exists terms_version_accepted text,
  add column if not exists refunds_version_accepted text,
  add column if not exists privacy_version_accepted text,
  add column if not exists ip_at_signup inet,
  add column if not exists user_agent_at_signup text,
  add column if not exists consent_checkbox_text text;

-- Currency check (allows NULL for legacy 'free' rows that pre-date the column)
alter table public.subscriptions
  add constraint subscriptions_currency_check
  check (currency is null or currency in ('KES', 'USD', 'EUR', 'GBP'));

-- ─── 7. Indexes ─────────────────────────────────────────────────────────────
-- Webhook lookup: find the subscription by Paystack's identifier
create unique index if not exists subscriptions_paystack_sub_unique
  on public.subscriptions (paystack_subscription_id)
  where paystack_subscription_id is not null;

-- Enforce one active subscription per user (a chargeback-fraud defense too)
create unique index if not exists subscriptions_one_active_per_user
  on public.subscriptions (user_id)
  where status in ('active', 'past_due', 'cancelling');

-- Hot-path filters
create index if not exists subscriptions_user_id_idx on public.subscriptions (user_id);
create index if not exists subscriptions_status_idx on public.subscriptions (status);

-- ─── 8. updated_at auto-trigger ────────────────────────────────────────────
create or replace function public.tg_subscriptions_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists subscriptions_updated_at on public.subscriptions;
create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.tg_subscriptions_updated_at();

-- ─── 9. Rewrite check_trade_limit() — read `plan` instead of `tier` ────────
-- The previous version (April) read `tier` and `status` from a TEXT column.
-- New version reads the enum-typed `plan` and the new status enum. Without
-- this change, the trigger silently treats every newly-Pro user as free and
-- blocks them at 50 trades.
create or replace function public.check_trade_limit()
returns trigger language plpgsql security definer as $$
declare
  user_plan public.subscription_plan;
  user_status public.subscription_status;
  trade_count int;
begin
  -- Demo trades never count against the cap
  if NEW.is_demo = true then
    return NEW;
  end if;

  -- Get the most-recent subscription row for this user. The partial unique
  -- index ensures at most one active row, but historical 'cancelled' rows
  -- can exist alongside — sort by created_at desc to find the relevant one.
  select plan, status into user_plan, user_status
    from public.subscriptions
    where user_id = NEW.user_id
    order by created_at desc
    limit 1;

  -- No row OR free plan OR a 'free' row that's been cancelled/expired:
  -- treat as free and enforce the 50-trade cap.
  if user_plan is null or user_plan = 'free' then
    select count(*) into trade_count
      from public.trades
      where user_id = NEW.user_id and is_demo = false;
    if trade_count >= 50 then
      raise exception 'Free tier limit reached. Upgrade to Pro to log more trades.';
    end if;
  end if;

  return NEW;
end;
$$;

-- ─── 10. Comments for future-you ───────────────────────────────────────────
comment on table public.subscriptions is
  'One row per Paystack subscription. Source of truth for Pro/Elite access. Audit trail for chargebacks.';
comment on column public.subscriptions.terms_version_accepted is
  'Date of the Terms version the user accepted on the upgrade modal. Required for chargeback defense.';
comment on column public.subscriptions.consent_checkbox_text is
  'Exact text of the consent checkbox at the moment of purchase. Stored for forensics if disputed.';
comment on column public.subscriptions.ip_at_signup is
  'IP address at the moment of upgrade. Chargeback evidence — proves the cardholder (not a fraudster) signed up.';

commit;
