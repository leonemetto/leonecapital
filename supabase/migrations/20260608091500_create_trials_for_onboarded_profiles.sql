begin;

-- Safety net: trial creation should not depend only on the frontend calling
-- the start-trial edge function. When onboarding flips complete, the database
-- creates the user's no-card Pro trial if they have no subscription history.
create or replace function public.create_pro_trial_for_onboarded_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.onboarding_completed is true
    and coalesce(OLD.onboarding_completed, false) is false
    and not exists (
      select 1
      from public.subscriptions
      where user_id = NEW.id
    )
    and exists (
      select 1
      from auth.users
      where id = NEW.id
    )
  then
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
    values (
      NEW.id,
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
    );
  end if;

  return NEW;
end;
$$;

drop trigger if exists create_pro_trial_after_onboarding on public.profiles;
create trigger create_pro_trial_after_onboarding
  after update of onboarding_completed on public.profiles
  for each row
  execute function public.create_pro_trial_for_onboarded_profile();

-- Repair current users stranded by the launch-night function issue.
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
  p.id,
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
from public.profiles p
join auth.users u on u.id = p.id
where p.onboarding_completed is true
  and not exists (
    select 1
    from public.subscriptions s
    where s.user_id = p.id
  );

commit;
