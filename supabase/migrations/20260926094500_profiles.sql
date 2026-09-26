create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  companion_name text not null default 'Friend' check (char_length(companion_name) between 1 and 32),
  tone text not null default 'warm' check (tone in ('warm','calm','creative','direct')),
  interests text not null default '' check (char_length(interests) <= 500),
  memory_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = user_id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = user_id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "profiles_delete_own" on public.profiles for delete using (auth.uid() = user_id);
