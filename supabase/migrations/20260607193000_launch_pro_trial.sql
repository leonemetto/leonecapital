begin;

-- Trial users should count as the one current-access row while the trial is live.
drop index if exists public.subscriptions_one_active_per_user;
create unique index if not exists subscriptions_one_active_per_user
  on public.subscriptions (user_id)
  where status in ('trialing', 'active', 'past_due', 'cancelling');

-- Freemium is gone: real trade creation requires an active paid subscription
-- or a still-current Pro trial. Demo trades remain allowed.
create or replace function public.check_trade_limit()
returns trigger language plpgsql security definer as $$
declare
  user_plan public.subscription_plan;
  user_status public.subscription_status;
  period_end timestamptz;
  has_access boolean := false;
begin
  if NEW.is_demo = true then
    return NEW;
  end if;

  select plan, status, current_period_end
    into user_plan, user_status, period_end
    from public.subscriptions
    where user_id = NEW.user_id
    order by created_at desc
    limit 1;

  has_access :=
    user_plan in ('pro', 'elite') and (
      user_status in ('active', 'past_due', 'cancelling') or
      (user_status = 'trialing' and period_end is not null and period_end > now())
    );

  if not has_access then
    raise exception 'Trial ended. Upgrade to Pro to continue logging trades.';
  end if;

  return NEW;
end;
$$;

comment on function public.check_trade_limit() is
  'Enforces Pro trial/paid access for real trade inserts. Demo trades bypass the gate.';

commit;
