# Production operations runbook

1. Deploy the trusted API and database over HTTPS.
2. Store provider, database, session-signing, Stripe secret and webhook secrets only in the hosting secret store.
3. Configure the web app with VITE_AUTH_MODE=server and VITE_API_BASE_URL pointing at that API.
4. Apply owner-scoped database authorization before accepting users.
5. Verify account deletion revokes sessions and applies the published retention policy.
6. Configure server-side rate limits for authentication and companion generation.
7. Configure structured logs that exclude passwords, tokens, message text, memories and project notes.
8. Run the two-account isolation matrix and complete LAUNCH_EVIDENCE_TEMPLATE.md against staging.
9. Run crisis/dependency/sexual-boundary tests against the actual model configuration.
10. Promote only the exact tested commit/deployment pair.

Rollback: if authorization, deletion, safety routing, session handling or data isolation fails, stop promotion and roll back to the last verified candidate. Never bypass these gates to restore availability.
