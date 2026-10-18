-- Optimize user ownership RLS and scope policies explicitly to signed-in users.
drop policy if exists conversations_select_own on public.conversations;
create policy conversations_select_own on public.conversations for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists conversations_insert_own on public.conversations;
create policy conversations_insert_own on public.conversations for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists conversations_update_own on public.conversations;
create policy conversations_update_own on public.conversations for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists conversations_delete_own on public.conversations;
create policy conversations_delete_own on public.conversations for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists memories_select_own on public.memories;
create policy memories_select_own on public.memories for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists memories_insert_own on public.memories;
create policy memories_insert_own on public.memories for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists memories_update_own on public.memories;
create policy memories_update_own on public.memories for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists memories_delete_own on public.memories;
create policy memories_delete_own on public.memories for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists profiles_delete_own on public.profiles;
create policy profiles_delete_own on public.profiles for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists usage_select_own on public.ai_usage_events;
create policy usage_select_own on public.ai_usage_events for select to authenticated using ((select auth.uid()) = user_id);
