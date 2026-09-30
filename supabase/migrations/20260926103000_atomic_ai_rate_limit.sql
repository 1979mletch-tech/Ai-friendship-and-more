-- Reserve one AI request atomically per user and minute.
-- A transaction-level lock prevents simultaneous requests from exceeding the cap.
drop policy if exists "usage_insert_own" on public.ai_usage_events;

create or replace function public.reserve_ai_request()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(current_user_id::text, 0));
  if (select count(*) from public.ai_usage_events
      where user_id = current_user_id and created_at >= pg_catalog.now() - interval '1 minute') >= 12 then
    return false;
  end if;

  insert into public.ai_usage_events (user_id) values (current_user_id);
  return true;
end;
$$;

revoke all on function public.reserve_ai_request() from public, anon;
grant execute on function public.reserve_ai_request() to authenticated;
