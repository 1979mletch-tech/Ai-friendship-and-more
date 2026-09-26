-- User-owned data. Apply with Supabase migrations before enabling cloud mode.
create table public.companion_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  companion_name text not null default 'Friend' check (char_length(companion_name) between 1 and 40),
  updated_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  title text not null check (char_length(title) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);
create index conversations_owner_updated on public.conversations (user_id, updated_at desc);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  conversation_id uuid not null,
  role text not null check (role in ('user', 'assistant')),
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now(),
  foreign key (conversation_id, user_id) references public.conversations(id, user_id) on delete cascade
);
create index chat_messages_thread on public.chat_messages (conversation_id, created_at);

create table public.project_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  project text not null check (char_length(project) between 1 and 100),
  tags text not null default '' check (char_length(tags) <= 200),
  note text not null check (char_length(note) between 1 and 2000),
  updated_at timestamptz not null default now()
);
create index project_notes_owner on public.project_notes (user_id, updated_at desc);

alter table public.companion_profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.chat_messages enable row level security;
alter table public.project_notes enable row level security;

create policy "owner profile" on public.companion_profiles for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "owner conversations" on public.conversations for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "owner messages" on public.chat_messages for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "owner notes" on public.project_notes for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create function public.enforce_free_note_limit() returns trigger language plpgsql
set search_path = '' as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.user_id::text, 0));
  if (select count(*) from public.project_notes where user_id = new.user_id) >= 3 then
    raise exception 'Free project note limit reached';
  end if;
  return new;
end;
$$;
create trigger free_note_limit before insert on public.project_notes
  for each row execute function public.enforce_free_note_limit();

-- Only the chat function writes messages. Direct clients can read/delete their
-- own turns, but cannot bypass the function's quota or impersonate an assistant.
drop policy "owner messages" on public.chat_messages;
create policy "read own messages" on public.chat_messages for select to authenticated
  using (user_id = (select auth.uid()));
create policy "delete own messages" on public.chat_messages for delete to authenticated
  using (user_id = (select auth.uid()));

create table public.daily_chat_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null,
  used integer not null default 0 check (used between 0 and 25),
  primary key (user_id, usage_date)
);
alter table public.daily_chat_usage enable row level security;
create policy "read own usage" on public.daily_chat_usage for select to authenticated
  using (user_id = (select auth.uid()));

-- Atomic quota claim, callable only by signed-in users. Crisis guidance does
-- not call this function and remains available regardless of quota.
create function public.claim_free_chat_turn() returns boolean language plpgsql
security definer set search_path = '' as $$
declare claimed integer;
begin
  if (select auth.uid()) is null then return false; end if;
  insert into public.daily_chat_usage (user_id, usage_date, used)
    values ((select auth.uid()), (now() at time zone 'utc')::date, 1)
    on conflict (user_id, usage_date) do update
    set used = public.daily_chat_usage.used + 1
    where public.daily_chat_usage.used < 25
    returning used into claimed;
  return claimed is not null;
end;
$$;
revoke all on function public.claim_free_chat_turn() from public, anon;
grant execute on function public.claim_free_chat_turn() to authenticated;
