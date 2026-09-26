-- Trusted per-user AI request counters. No conversation text is stored here.
create table if not exists public.ai_usage_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists ai_usage_events_user_created_idx on public.ai_usage_events(user_id, created_at desc);
alter table public.ai_usage_events enable row level security;

drop policy if exists "usage_select_own" on public.ai_usage_events;
drop policy if exists "usage_insert_own" on public.ai_usage_events;
create policy "usage_select_own" on public.ai_usage_events for select using (auth.uid() = user_id);
create policy "usage_insert_own" on public.ai_usage_events for insert with check (auth.uid() = user_id);

-- Production maintenance can periodically remove old counters.
