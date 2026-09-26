-- Stripe identifiers and subscription state are writable only by server functions.
create table public.billing_customers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text not null unique
);
create table public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_subscription_id text not null unique,
  status text not null,
  price_id text not null,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.billing_customers enable row level security;
alter table public.subscriptions enable row level security;
create policy "read own billing customer" on public.billing_customers for select to authenticated
  using (user_id = (select auth.uid()));
create policy "read own subscription" on public.subscriptions for select to authenticated
  using (user_id = (select auth.uid()));

-- Subscription state is trusted only after a signed Stripe webhook updates it.
alter table public.daily_chat_usage drop constraint daily_chat_usage_used_check;
alter table public.daily_chat_usage add constraint daily_chat_usage_used_check check (used between 0 and 250);
create or replace function public.claim_free_chat_turn() returns boolean language plpgsql
security definer set search_path = '' as $$
declare claimed integer;
declare max_turns integer;
begin
  if (select auth.uid()) is null then return false; end if;
  select case when exists (
    select 1 from public.subscriptions s
    where s.user_id = (select auth.uid()) and s.status in ('active', 'trialing')
      and s.current_period_end > now()
  ) then 250 else 25 end into max_turns;
  insert into public.daily_chat_usage (user_id, usage_date, used)
    values ((select auth.uid()), (now() at time zone 'utc')::date, 1)
    on conflict (user_id, usage_date) do update set used = public.daily_chat_usage.used + 1
    where public.daily_chat_usage.used < max_turns
    returning used into claimed;
  return claimed is not null;
end;
$$;
revoke all on function public.claim_free_chat_turn() from public, anon;
grant execute on function public.claim_free_chat_turn() to authenticated;

create or replace function public.enforce_free_note_limit() returns trigger language plpgsql
set search_path = '' as $$
declare max_notes integer;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.user_id::text, 0));
  select case when exists (
    select 1 from public.subscriptions s
    where s.user_id = new.user_id and s.status in ('active', 'trialing')
      and s.current_period_end > now()
  ) then 100 else 3 end into max_notes;
  if (select count(*) from public.project_notes where user_id = new.user_id) >= max_notes then
    raise exception 'Project note limit reached';
  end if;
  return new;
end;
$$;
