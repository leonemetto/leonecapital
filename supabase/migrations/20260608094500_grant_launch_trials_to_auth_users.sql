begin;

-- Launch repair: preserve real signup dates, but give every real auth user
-- without current paid access a clean 14-day Pro trial from today.

create or replace function public.default_nickname_from_email(email text)
returns text
language sql
stable
as $$
  select left(
    coalesce(
      nullif(regexp_replace(split_part(coalesce(email, ''), '@', 1), '[._-]+', ' ', 'g'), ''),
      'Trader'
    ),
    30
  );
$$;

create or replace function public.create_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, nickname)
  values (NEW.id, public.default_nickname_from_email(NEW.email))
  on conflict (user_id) do nothing;

  return NEW;
end;
$$;

drop trigger if exists create_profile_after_auth_signup on auth.users;
create trigger create_profile_after_auth_signup
  after insert on auth.users
  for each row
  execute function public.create_profile_for_auth_user();

-- Backfill profiles for existing auth users that somehow missed profile creation.
insert into public.profiles (user_id, nickname)
select u.id, public.default_nickname_from_email(u.email)
from auth.users u
where not exists (
  select 1
  from public.profiles p
  where p.user_id = u.id
);

-- Refresh existing manual trial rows for users who do not already have paid access.
update public.subscriptions s
set
  plan = 'pro',
  status = 'trialing',
  provider = 'manual',
  billing_cycle = 'monthly',
  amount = 0,
  currency = 'USD',
  channel = 'other',
  started_at = now(),
  current_period_start = now(),
  current_period_end = now() + interval '14 days',
  updated_at = now()
where s.provider = 'manual'
  and s.plan = 'pro'
  and not exists (
    select 1
    from public.subscriptions paid
    where paid.user_id = s.user_id
      and paid.plan in ('pro', 'elite')
      and paid.status in ('active', 'past_due', 'cancelling')
  );

-- Create a trial row for every auth user with no subscription history.
insert into public.subscriptions (
  user_id,
  plan,
  status,
  provider,
  billing_cycle,
  amount,
  currency,
  channel,
  started_at,
  current_period_start,
  current_period_end
)
select
  u.id,
  'pro',
  'trialing',
  'manual',
  'monthly',
  0,
  'USD',
  'other',
  now(),
  now(),
  now() + interval '14 days'
from auth.users u
where not exists (
  select 1
  from public.subscriptions s
  where s.user_id = u.id
);

commit;
