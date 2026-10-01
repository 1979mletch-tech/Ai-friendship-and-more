# AI Friendship — Handoff / Parked State (2026-10-01)

## Canonical repository state

- Repository: `1979mletch-tech/Ai-friendship-and-more`
- Release-candidate consolidation PR: **#28**
- Squash-merged to `main`
- Canonical release-candidate commit: `1f5f5b5b9e8668b80edee17a8a9aa77dd8b53444`
- PR quality gate: install, lint, typecheck, tests and production build all passed.
- Post-merge `main` quality gate: install, lint, typecheck, tests and production build all passed.

## Aurora voice decision

Approved device-reference feel: **Karen + Gentle + en-PL**.

Production interpretation:
- English with a gentle, subtle Polish accent
- calm, soft, distinctly feminine and naturally warm
- reassuring, relaxed and unhurried
- slightly dreamy but conversational
- smooth intonation, clear articulation and natural pauses
- no theatrical, chirpy, harsh, exaggerated sensual, monotone or robotic delivery

Production speech uses OpenAI `gpt-4o-mini-tts` with voice `marin`. It is an approximation of the approved feel, not a clone of Apple's Karen voice.

Supabase `speak` Edge Function is ACTIVE at version 2 with the final Aurora prompt.

## Supabase security-advisor review

The current advisor reports:

1. `public.age_verification_starts` has RLS enabled with no RLS policies.
2. `public.reserve_age_verification_start()` is a `SECURITY DEFINER` function executable by `authenticated`.
3. `public.reserve_ai_request()` is a `SECURITY DEFINER` function executable by `authenticated`.

Live inspection found:

- Both functions take **no user-id argument** and derive the caller exclusively from `auth.uid()`.
- Both reject unauthenticated calls.
- `anon` cannot execute either function.
- Both functions read/write only records scoped to the caller's own `auth.uid()`.
- `age_verification_starts` grants no direct SELECT/INSERT/UPDATE/DELETE access to `anon` or `authenticated`; the lack of policies is therefore intentional for the current internal-only table boundary.
- `ai_usage_events` and `billing_subscriptions` expose only caller-owned SELECT rows through RLS; authenticated clients have no direct INSERT/UPDATE/DELETE grant on these tables.

These findings reduce the immediate IDOR/BOLA risk, but the advisor warnings are **not marked resolved**. Before public launch, review whether to retain this narrowly scoped `SECURITY DEFINER` pattern or move the quota functions behind a non-exposed/service-role boundary.

Supabase advisor references:
- RLS enabled with no policy: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
- Authenticated SECURITY DEFINER execution: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable

## Deployment truth

GitHub reports the post-merge Pages build/deploy workflow as successful. This does **not** by itself prove the Vite SPA is correctly served from the final public URL, so do not treat that workflow result alone as a production launch verification.

## Remaining launch gates

Before public launch:

1. Verify the exact deployed Vite build renders correctly at the intended URL.
2. Sign in with a server-verified adult test account and run end-to-end Aurora generated voice playback.
3. Check Aurora generated voice on iPad and Android against the approved Karen + Gentle + en-PL reference feel.
4. Complete live age/identity verification testing.
5. Complete live billing, Stripe webhook and entitlement tests with the intended credentials/prices.
6. Run the final two-account isolation, privacy/deletion, mobile and production smoke gates against the exact deployed build.
7. Make a final disposition on the two Supabase `SECURITY DEFINER` advisor warnings before public launch.

## Parked-state verdict

AI Friendship is **organised and safely parked as a release candidate**, with the full current product consolidated on `main` and Aurora's final voice direction recorded and deployed server-side. It is **not yet being represented as fully launch-verified** because the remaining items above require exact live deployment and credentialed end-to-end checks.
