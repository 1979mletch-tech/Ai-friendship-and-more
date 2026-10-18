-- A Stripe Identity verification start is a cost-bearing request. Limit it
-- atomically by authenticated user before contacting Stripe.
create table public.age_verification_starts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index age_verification_starts_user_created_idx
  on public.age_verification_starts (user_id, created_at desc);
alter table public.age_verification_starts enable row level security;
-- No direct Data API grants or policies: clients only call the bounded RPC.
revoke all on public.age_verification_starts from public, anon, authenticated;

create function public.reserve_age_verification_start()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_time timestamptz := pg_catalog.now();
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(current_user_id::text, 1));
  if (select count(*) from public.age_verification_starts
      where user_id = current_user_id and created_at >= current_time - interval '10 minutes') >= 1 then
    return false;
  end if;
  if (select count(*) from public.age_verification_starts
      where user_id = current_user_id and created_at >= current_time - interval '1 day') >= 3 then
    return false;
  end if;
  insert into public.age_verification_starts (user_id) values (current_user_id);
  return true;
end;
$$;
revoke all on function public.reserve_age_verification_start() from public, anon;
grant execute on function public.reserve_age_verification_start() to authenticated;
