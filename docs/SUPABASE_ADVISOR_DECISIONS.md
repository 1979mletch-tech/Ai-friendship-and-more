# Supabase advisor decisions — 2026-09-29

## Accepted informational finding: age_verification_starts has RLS with no policies
Intentional. The table is an internal rate-limit ledger. Direct grants to anon and authenticated are revoked. It is written only through `reserve_age_verification_start()`, which derives the user from `auth.uid()`.

## Accepted warning: authenticated SECURITY DEFINER RPCs
`reserve_ai_request()` and `reserve_age_verification_start()` intentionally remain callable by authenticated users because the Edge Functions invoke them with the caller JWT. Both:
- reject missing `auth.uid()`;
- use `SECURITY DEFINER SET search_path = ''`;
- fully qualify referenced objects;
- expose no caller-supplied user ID;
- use per-user advisory locks;
- have EXECUTE revoked from anon;
- return only a boolean reservation result.

Changing these RPCs to service-role-only would require redesigning the Edge Functions and is not treated as a launch fix.

## Performance advisor
The previous 13 auth RLS init-plan warnings were remediated using explicit `TO authenticated` policies and `(select auth.uid())`. Remaining unused-index notices are informational on an empty/pre-launch database; indexes are retained because they support expected user/date access patterns.
