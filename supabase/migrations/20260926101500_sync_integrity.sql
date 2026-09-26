-- Prevent repeated cloud memory backups from creating duplicate rows.
-- Case-insensitive uniqueness is scoped to the authenticated owner.
create unique index if not exists memories_user_value_unique_idx
  on public.memories (user_id, lower(value));

-- Keep conversation update timestamps query-friendly.
create index if not exists conversations_user_created_idx
  on public.conversations (user_id, created_at desc);
