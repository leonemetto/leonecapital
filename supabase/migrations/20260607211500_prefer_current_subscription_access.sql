begin;

-- One-time launch-night repair: if the first Pro trial rollout produced
-- manual trial rows that already look expired, give those users the full
-- 14-day trial window they were supposed to receive.
update public.subscriptions
  set
    status = 'trialing',
    started_at = coalesce(started_at, now()),
    current_period_start = now(),
    current_period_end = now() + interval '14 days',
    updated_at = now()
  where plan = 'pro'
    and status = 'trialing'
    and (provider is null or provider = 'manual')
    and (current_period_end is null or current_period_end <= now());

-- Historical subscription rows can exist next to a current trial/paid row.
-- Trade inserts should pass when any current Pro/Elite access row exists,
-- rather than relying on whichever row happens to be newest.
create or replace function public.check_trade_limit()
returns trigger language plpgsql security definer as $$
declare
  has_access boolean := false;
begin
  if NEW.is_demo = true then
    return NEW;
  end if;

  select exists (
    select 1
      from public.subscriptions
      where user_id = NEW.user_id
        and plan in ('pro', 'elite')
        and (
          status in ('active', 'past_due', 'cancelling') or
          (status = 'trialing' and current_period_end is not null and current_period_end > now())
        )
  ) into has_access;

  if not has_access then
    raise exception 'Trial ended. Upgrade to Pro to continue logging trades.';
  end if;

  return NEW;
end;
$$;

comment on function public.check_trade_limit() is
  'Enforces current Pro trial/paid access for real trade inserts. Demo trades bypass the gate.';

commit;
