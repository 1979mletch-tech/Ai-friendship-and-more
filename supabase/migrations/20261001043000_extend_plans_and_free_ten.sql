alter table public.billing_subscriptions drop constraint if exists billing_subscriptions_plan_check;
alter table public.billing_subscriptions add constraint billing_subscriptions_plan_check
  check (plan in ('pro-daily','pro-weekly','pro-monthly','pro-annual'));

create or replace function public.reserve_ai_request()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_time timestamptz := pg_catalog.now();
  is_paid boolean;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(current_user_id::text, 0));

  select exists (
    select 1 from public.billing_subscriptions
    where user_id = current_user_id
      and livemode = true
      and status in ('active', 'trialing')
  ) into is_paid;

  if (select count(*) from public.ai_usage_events
      where user_id = current_user_id
        and created_at >= current_time - interval '1 minute') >= 12 then
    return false;
  end if;

  if is_paid then
    if (select count(*) from public.ai_usage_events
        where user_id = current_user_id
          and created_at >= pg_catalog.date_trunc('day', current_time at time zone 'UTC') at time zone 'UTC') >= 250 then
      return false;
    end if;
  else
    if (select count(*) from public.ai_usage_events where user_id = current_user_id) >= 10 then
      return false;
    end if;
  end if;

  insert into public.ai_usage_events (user_id) values (current_user_id);
  return true;
end;
$$;

revoke all on function public.reserve_ai_request() from public, anon;
grant execute on function public.reserve_ai_request() to authenticated;
