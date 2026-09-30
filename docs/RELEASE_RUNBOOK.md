# Release Runbook

1. Freeze the release commit and record SHA.
2. Require green CI on that exact SHA.
3. Review dependency audit output.
4. Apply reviewed Supabase migrations to staging.
5. Deploy Edge Functions with server secrets.
6. Configure allowed HTTPS origin and auth redirects.
7. Run TEST_PLAN.md including two-account isolation.
8. Record failures; repair and repeat until green.
9. Deploy front end from the same verified source.
10. Smoke test consent, account, chat, memory/history, privacy/export/delete and failure states.
11. Do not enable paid-plan claims until Stripe webhook entitlements are server-verified.
12. Keep rollback target available.
13. Only merge/release after human review.

Never copy production secrets into tickets, chat logs, screenshots or repository files.
