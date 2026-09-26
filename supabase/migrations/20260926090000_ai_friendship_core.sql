-- AI Friendship account-backed data foundation.
-- Apply in a dedicated Supabase project only after review.

create extension if not exists pgcrypto;

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New conversation' check (char_length(title) <= 120),
  mode text not null default 'general' check (mode in ('general','creative')),
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'Memory' check (char_length(label) <= 80),
  value text not null check (char_length(value) between 1 and 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists conversations_user_updated_idx on public.conversations(user_id, updated_at desc);
create index if not exists memories_user_updated_idx on public.memories(user_id, updated_at desc);

alter table public.conversations enable row level security;
alter table public.memories enable row level security;

drop policy if exists "conversations_select_own" on public.conversations;
drop policy if exists "conversations_insert_own" on public.conversations;
drop policy if exists "conversations_update_own" on public.conversations;
drop policy if exists "conversations_delete_own" on public.conversations;
create policy "conversations_select_own" on public.conversations for select using (auth.uid() = user_id);
create policy "conversations_insert_own" on public.conversations for insert with check (auth.uid() = user_id);
create policy "conversations_update_own" on public.conversations for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "conversations_delete_own" on public.conversations for delete using (auth.uid() = user_id);

drop policy if exists "memories_select_own" on public.memories;
drop policy if exists "memories_insert_own" on public.memories;
drop policy if exists "memories_update_own" on public.memories;
drop policy if exists "memories_delete_own" on public.memories;
create policy "memories_select_own" on public.memories for select using (auth.uid() = user_id);
create policy "memories_insert_own" on public.memories for insert with check (auth.uid() = user_id);
create policy "memories_update_own" on public.memories for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "memories_delete_own" on public.memories for delete using (auth.uid() = user_id);
