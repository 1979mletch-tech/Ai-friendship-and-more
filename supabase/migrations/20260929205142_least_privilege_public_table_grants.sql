-- Reduce Data API grants to the minimum needed by the browser client.
revoke all on table public.conversations, public.memories, public.profiles, public.ai_usage_events, public.billing_subscriptions, public.age_verification_starts from anon;
revoke all on table public.conversations, public.memories, public.profiles, public.ai_usage_events, public.billing_subscriptions, public.age_verification_starts from authenticated;
grant select, insert, update, delete on table public.conversations, public.memories, public.profiles to authenticated;
grant select on table public.ai_usage_events, public.billing_subscriptions to authenticated;
