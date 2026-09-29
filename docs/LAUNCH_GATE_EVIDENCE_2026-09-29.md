# Launch gate evidence — 29 September 2026

Candidate branch: `chatgpt/ai-friendship-build`

This record captures checks performed against the connected GitHub, Supabase, and Stripe resources. It contains no credentials.

## Completed checks

1. GitHub candidate quality gate completed successfully with dependency install, lint, typecheck, automated tests, and production build.
2. Connected Supabase AI Friendship project is ACTIVE_HEALTHY.
3. Nine expected database migrations are applied, including live Stripe entitlement separation and age-verification start limiting.
4. Conversations, memories, AI usage, profiles, billing subscriptions, and age-verification-start tables have RLS enabled.
5. Chat, delete-account, verify-age, speak, billing, and stripe-webhook Edge Functions are ACTIVE.
6. The deployed delete-account function was found behind the candidate and was redeployed to the exact-origin CORS version.
7. `reserve_ai_request()` rejects anonymous execution, derives its user from `auth.uid()`, serializes per-user reservations, and applies free/live-paid limits.
8. `reserve_age_verification_start()` rejects anonymous execution, derives its user from `auth.uid()`, serializes per-user starts, and enforces 10-minute/daily limits.
9. The Supabase security advisor warning for those two SECURITY DEFINER RPCs is retained for review; it is not silently dismissed.
10. The live Stripe account connection is available.
11. The live Stripe account currently has no product, recurring prices, webhook endpoint, or customer portal configuration; billing therefore remains intentionally disabled.
12. The repository's billing function fails closed unless `BILLING_LIVE_ENABLED=true` and live Stripe identifiers/secrets are valid.
13. The age-verification function rejects test-mode Identity results for live adult eligibility and stores only trusted boolean eligibility, not DOB.
14. The preview workflow stamps `dist/build-commit.txt` and verifies the public Pages deployment serves the expected SHA.
15. Production smoke-test documentation covers guest behavior, auth, isolation, age gate, server AI, quotas, privacy, mobile, and endpoint failure.

## Remaining external gates

The remaining gates require real provider values or human/consented interaction: choose monthly/annual subscription amounts; configure live Stripe prices/portal/webhook and Identity restricted DOB access; install production origin/provider secrets; run a consented adult Identity flow; run two disposable accounts through live isolation/chat/privacy/deletion; perform a real billing lifecycle; and complete Android/iPad/accessibility smoke testing.

No source-build result is being used as a substitute for those live checks.
