# Production backend implementation specification

The web client already defines the contracts. A production backend must implement them without trusting browser ownership claims.

## Required infrastructure
- HTTPS API
- durable relational database
- authenticated session/token verification
- server-side AI provider integration
- server-side Stripe integration when billing is enabled
- secret manager/environment isolated from browser bundles
- structured privacy-minimal logging
- rate limiting

## Ownership rule
Every protected query derives user_id from the verified session. Never accept user_id from request body/query parameters as authority.

## Endpoints
Auth: POST /auth/register, /auth/login, /auth/logout; DELETE /account.
Profile: GET/PUT /companion-profile.
Conversations: GET/POST /conversations; GET/POST /conversations/:id/messages; DELETE /conversations/:id; DELETE /conversations.
Memory: GET/POST /memories; DELETE /memories/:id; DELETE /memories.
AI: POST /companion/reply.
Privacy: GET /account/export.
Billing: GET /billing/subscription; POST /billing/checkout; POST /billing/portal; verified webhook endpoint.

## Transaction requirements
- Account deletion must atomically remove/revoke data according to the published retention policy.
- Message persistence must not leave a user message presented as successfully answered if assistant generation/persistence failed.
- Webhook processing must be idempotent.
- Subscription entitlements are derived server-side.

## Safety
Run deterministic input safety before provider generation. Apply generated-output policy after generation. Provider prompts treat user-approved memory and conversation text as untrusted data, not instructions overriding safety.

## Acceptance
Pass API_ACCEPTANCE.md, TWO_ACCOUNT_ISOLATION.md, MANUAL_SMOKE_TEST.md and LAUNCH_EVIDENCE_TEMPLATE.md against the exact deployed SHA.
