-- BuildRush Core Platform, Dual AI Memory, and Monthly Archives
-- Migration: 20261015120000_buildrush_core_and_memory.sql

create extension if not exists pgcrypto;

-- 1. User Profiles
create table if not exists public.buildrush_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  role text not null check (role in ('customer', 'tradesperson', 'owner')),
  full_name text not null check (char_length(full_name) between 1 and 100),
  phone text check (phone is null or char_length(phone) <= 30),
  trade text check (trade is null or char_length(trade) <= 100),
  postcode text check (postcode is null or char_length(postcode) <= 12),
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Marketplace Jobs
create table if not exists public.buildrush_jobs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 150),
  trade text not null check (char_length(trade) between 2 and 80),
  description text not null check (char_length(description) between 10 and 3000),
  budget_min numeric(10,2) check (budget_min is null or budget_min >= 0),
  budget_max numeric(10,2) check (budget_max is null or budget_max >= coalesce(budget_min, 0)),
  postcode text not null check (char_length(postcode) between 2 and 12),
  urgency text not null check (urgency in ('today', 'tomorrow', 'within_48h', 'flexible')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Tradesperson Bids / Applications
create table if not exists public.buildrush_bids (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.buildrush_jobs(id) on delete cascade,
  tradesperson_id uuid not null references auth.users(id) on delete cascade,
  proposed_price numeric(10,2) not null check (proposed_price > 0),
  message text not null check (char_length(message) between 5 and 1000),
  estimated_duration text check (estimated_duration is null or char_length(estimated_duration) <= 100),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, tradesperson_id)
);

-- 4. Tradesperson Subscriptions
create table if not exists public.buildrush_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  tier text not null default 'starter' check (tier in ('starter', 'pro', 'unlimited')),
  status text not null default 'active' check (status in ('active', 'past_due', 'cancelled')),
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. Support Tickets & Case Escalations
create table if not exists public.buildrush_support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null check (char_length(subject) between 3 and 200),
  description text not null check (char_length(description) between 5 and 3000),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'urgent')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  escalated_by_ai boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. Layer 1 Core Business Brain (Company Policies, Operating Rules, Advisory Pricing)
create table if not exists public.buildrush_ai_core_knowledge (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('operating_rules', 'uk_pricing', 'company_policy', 'assistant_identity', 'contingency_rule')),
  key text not null unique check (char_length(key) between 3 and 100),
  value jsonb not null,
  is_active boolean not null default true,
  updated_by text not null default 'system',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seed Initial Core Business Brain Knowledge
insert into public.buildrush_ai_core_knowledge (category, key, value, updated_by) values
  ('operating_rules', 'marketplace_matching', '{"rule": "Customers set their own budgets; tradespeople decide which jobs to pursue. Response timing aims for prompt repairs (today/tomorrow or within 48h where feasible), but outcomes are never guaranteed."}'::jsonb, 'owner'),
  ('operating_rules', 'contingency_fund_policy', '{"rule": "The optional £50 contingency for established tradespeople after 6 months is a discretionary owner-managed arrangement only. DO NOT build into the public website, automate approvals, or create a loan feature."}'::jsonb, 'owner'),
  ('uk_pricing', 'hourly_rate_guidance', '{"typical_min_gbp": 40, "typical_max_gbp": 80, "emergency_callout_min": 75, "emergency_callout_max": 150, "disclaimer": "All pricing guidance is advisory only and grounded in standard UK trade context. Customers and tradespeople retain full pricing freedom."}'::jsonb, 'owner'),
  ('assistant_identity', 'customer_ai', '{"name": "BuildRush Assistant", "role": "Public Customer and Tradesperson Guide", "tone": "friendly, honest, helpful, transparent", "is_ai": true}'::jsonb, 'owner'),
  ('assistant_identity', 'owner_ai', '{"name": "BuildRush HQ Advisor", "role": "Private Business & Operational Assistant", "tone": "clear, rigorous, sourced, executive", "is_ai": true}'::jsonb, 'owner')
on conflict (key) do update set value = excluded.value, updated_at = now();

-- 7. Layer 2 Active Working Memory: Conversations
create table if not exists public.buildrush_ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  assistant_type text not null check (assistant_type in ('customer', 'owner')),
  title text not null default 'New conversation' check (char_length(title) <= 120),
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 8. Layer 2 Active Working Memory: Messages
create table if not exists public.buildrush_ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.buildrush_ai_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  text text not null check (char_length(text) between 1 and 4000),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 9. Monthly Working Archives (Retaining summaries, decisions & open cases across monthly rollovers)
create table if not exists public.buildrush_monthly_archives (
  id uuid primary key default gen_random_uuid(),
  month_key text not null check (month_key ~ '^\d{4}-\d{2}$'),
  assistant_type text not null check (assistant_type in ('customer', 'owner')),
  summary text not null,
  open_cases jsonb not null default '[]'::jsonb,
  key_decisions jsonb not null default '[]'::jsonb,
  archived_routine_count integer not null default 0 check (archived_routine_count >= 0),
  created_at timestamptz not null default now(),
  unique (month_key, assistant_type)
);

-- 10. Owner Audit Logs (Logged execution of all sensitive administrative actions)
create table if not exists public.buildrush_owner_audit_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (char_length(action) between 3 and 100),
  target_type text not null check (char_length(target_type) between 3 and 60),
  target_id text not null check (char_length(target_id) between 1 and 100),
  details jsonb not null default '{}'::jsonb,
  confirmed_by_owner boolean not null default true,
  ip_address text,
  created_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_buildrush_jobs_customer on public.buildrush_jobs(customer_id, created_at desc);
create index if not exists idx_buildrush_jobs_trade_status on public.buildrush_jobs(trade, status);
create index if not exists idx_buildrush_bids_job on public.buildrush_bids(job_id);
create index if not exists idx_buildrush_bids_tradesperson on public.buildrush_bids(tradesperson_id);
create index if not exists idx_buildrush_ai_conv_user on public.buildrush_ai_conversations(user_id, assistant_type, updated_at desc);
create index if not exists idx_buildrush_ai_messages_conv on public.buildrush_ai_messages(conversation_id, created_at asc);
create index if not exists idx_buildrush_owner_audit_owner on public.buildrush_owner_audit_logs(owner_id, created_at desc);

-- Enable Row Level Security (RLS) on all tables (DENY BY DEFAULT)
alter table public.buildrush_profiles enable row level security;
alter table public.buildrush_jobs enable row level security;
alter table public.buildrush_bids enable row level security;
alter table public.buildrush_subscriptions enable row level security;
alter table public.buildrush_support_tickets enable row level security;
alter table public.buildrush_ai_core_knowledge enable row level security;
alter table public.buildrush_ai_conversations enable row level security;
alter table public.buildrush_ai_messages enable row level security;
alter table public.buildrush_monthly_archives enable row level security;
alter table public.buildrush_owner_audit_logs enable row level security;

-- Helper function: is_owner()
create or replace function public.buildrush_is_owner()
returns boolean language sql stable security definer as $$
  select coalesce(
    (auth.jwt()->'app_metadata'->>'role') = 'owner' or
    (auth.jwt()->'app_metadata'->>'buildrush_owner') = 'true',
    false
  );
$$;

-- RLS Policies: buildrush_profiles
create policy "profiles_select_own_or_owner" on public.buildrush_profiles
  for select using (auth.uid() = user_id or public.buildrush_is_owner());

create policy "profiles_insert_own" on public.buildrush_profiles
  for insert with check (auth.uid() = user_id);

create policy "profiles_update_own_or_owner" on public.buildrush_profiles
  for update using (auth.uid() = user_id or public.buildrush_is_owner())
  with check (auth.uid() = user_id or public.buildrush_is_owner());

-- RLS Policies: buildrush_jobs
create policy "jobs_select_public" on public.buildrush_jobs
  for select using (status in ('open', 'in_progress', 'completed') or auth.uid() = customer_id or public.buildrush_is_owner());

create policy "jobs_insert_customer" on public.buildrush_jobs
  for insert with check (auth.uid() = customer_id);

create policy "jobs_update_customer_or_owner" on public.buildrush_jobs
  for update using (auth.uid() = customer_id or public.buildrush_is_owner())
  with check (auth.uid() = customer_id or public.buildrush_is_owner());

create policy "jobs_delete_customer_or_owner" on public.buildrush_jobs
  for delete using (auth.uid() = customer_id or public.buildrush_is_owner());

-- RLS Policies: buildrush_bids
create policy "bids_select_participant_or_owner" on public.buildrush_bids
  for select using (
    auth.uid() = tradesperson_id or
    auth.uid() in (select customer_id from public.buildrush_jobs where id = job_id) or
    public.buildrush_is_owner()
  );

create policy "bids_insert_tradesperson" on public.buildrush_bids
  for insert with check (auth.uid() = tradesperson_id);

create policy "bids_update_tradesperson_or_owner" on public.buildrush_bids
  for update using (auth.uid() = tradesperson_id or public.buildrush_is_owner())
  with check (auth.uid() = tradesperson_id or public.buildrush_is_owner());

-- RLS Policies: buildrush_subscriptions
create policy "subscriptions_select_own_or_owner" on public.buildrush_subscriptions
  for select using (auth.uid() = user_id or public.buildrush_is_owner());

-- RLS Policies: buildrush_support_tickets
create policy "tickets_select_own_or_owner" on public.buildrush_support_tickets
  for select using (auth.uid() = user_id or public.buildrush_is_owner());

create policy "tickets_insert_own" on public.buildrush_support_tickets
  for insert with check (auth.uid() = user_id);

create policy "tickets_update_owner" on public.buildrush_support_tickets
  for update using (public.buildrush_is_owner())
  with check (public.buildrush_is_owner());

-- RLS Policies: buildrush_ai_core_knowledge (Layer 1)
create policy "core_knowledge_select_all" on public.buildrush_ai_core_knowledge
  for select using (is_active = true or public.buildrush_is_owner());

create policy "core_knowledge_modify_owner_only" on public.buildrush_ai_core_knowledge
  for all using (public.buildrush_is_owner())
  with check (public.buildrush_is_owner());

-- RLS Policies: buildrush_ai_conversations (Layer 2)
create policy "conversations_select_authorized" on public.buildrush_ai_conversations
  for select using (
    (assistant_type = 'customer' and auth.uid() = user_id) or
    (assistant_type = 'owner' and public.buildrush_is_owner() and auth.uid() = user_id)
  );

create policy "conversations_insert_authorized" on public.buildrush_ai_conversations
  for insert with check (
    (assistant_type = 'customer' and auth.uid() = user_id) or
    (assistant_type = 'owner' and public.buildrush_is_owner() and auth.uid() = user_id)
  );

create policy "conversations_delete_authorized" on public.buildrush_ai_conversations
  for delete using (
    (assistant_type = 'customer' and auth.uid() = user_id) or
    (assistant_type = 'owner' and public.buildrush_is_owner() and auth.uid() = user_id)
  );

-- RLS Policies: buildrush_ai_messages (Layer 2)
create policy "messages_select_authorized" on public.buildrush_ai_messages
  for select using (
    exists (
      select 1 from public.buildrush_ai_conversations c
      where c.id = conversation_id and (
        (c.assistant_type = 'customer' and c.user_id = auth.uid()) or
        (c.assistant_type = 'owner' and c.user_id = auth.uid() and public.buildrush_is_owner())
      )
    )
  );

create policy "messages_insert_authorized" on public.buildrush_ai_messages
  for insert with check (
    exists (
      select 1 from public.buildrush_ai_conversations c
      where c.id = conversation_id and (
        (c.assistant_type = 'customer' and c.user_id = auth.uid()) or
        (c.assistant_type = 'owner' and c.user_id = auth.uid() and public.buildrush_is_owner())
      )
    )
  );

-- RLS Policies: buildrush_monthly_archives
create policy "archives_select_owner_only" on public.buildrush_monthly_archives
  for select using (public.buildrush_is_owner());

create policy "archives_modify_owner_only" on public.buildrush_monthly_archives
  for all using (public.buildrush_is_owner())
  with check (public.buildrush_is_owner());

-- RLS Policies: buildrush_owner_audit_logs
create policy "audit_logs_select_owner_only" on public.buildrush_owner_audit_logs
  for select using (public.buildrush_is_owner());

create policy "audit_logs_insert_owner_only" on public.buildrush_owner_audit_logs
  for insert with check (public.buildrush_is_owner() and auth.uid() = owner_id);

-- Grants
grant select on public.buildrush_jobs to anon;
grant select, insert, update on public.buildrush_profiles, public.buildrush_jobs, public.buildrush_bids, public.buildrush_subscriptions, public.buildrush_support_tickets, public.buildrush_ai_conversations, public.buildrush_ai_messages to authenticated;
grant select on public.buildrush_ai_core_knowledge to authenticated;
grant select, insert, update, delete on public.buildrush_ai_core_knowledge, public.buildrush_monthly_archives, public.buildrush_owner_audit_logs to authenticated;
