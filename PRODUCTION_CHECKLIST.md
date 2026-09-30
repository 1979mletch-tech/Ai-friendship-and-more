# Production Readiness Checklist

Status snapshot: 29 September 2026. This checklist separates repository/backend work already verified from live owner/provider gates that still require real production configuration or consented device testing.

## Verified in repository / connected staging backend

- [x] Candidate CI installs dependencies, lints, typechecks, runs the automated suite, and builds successfully.
- [x] Supabase project identified and healthy.
- [x] Core conversation, memory, usage, profile, billing, live-entitlement, and age-start migrations applied.
- [x] User-data tables have RLS enabled.
- [x] Edge Functions deployed for chat, account deletion, age verification, speech, billing, and Stripe webhooks.
- [x] Account deletion deployment synced to the candidate's exact-origin CORS implementation.
- [x] AI quota RPC is authenticated, derives ownership from auth.uid(), and blocks anonymous execution.
- [x] Age-verification start quota RPC is authenticated, derives ownership from auth.uid(), and blocks anonymous execution.
- [x] Stripe live/test entitlement separation is represented in schema and server code.
- [x] Stripe webhook signature validation and live/test subscription checks are implemented.
- [x] Production preview workflow stamps and verifies the exact source SHA.

## Live launch gates still required

- [ ] Configure the exact public production origin in frontend/backend environment values.
- [ ] Install server-only AI provider secret and verify a real authenticated AI response.
- [ ] Configure Stripe Identity live/restricted DOB access and complete one consented adult verification.
- [ ] Create/select live monthly and annual recurring Stripe prices after the owner chooses amounts.
- [ ] Configure Stripe customer portal and live webhook endpoint.
- [ ] Keep BILLING_LIVE_ENABLED=false until the complete live billing lifecycle passes.
- [ ] Run two-account direct-ID isolation tests against deployed production/staging.
- [ ] Verify account export/deletion with disposable accounts.
- [ ] Run Android/iPad/mobile layout, microphone, speech, and accessibility smoke tests.
- [ ] Complete privacy/terms/legal and companion-safety professional review.
- [ ] Record final deployed SHA, rollback procedure, and launch evidence.

## Security-advisor note

Supabase currently reports the two authenticated SECURITY DEFINER quota RPCs because signed-in users may execute them. Inspection confirms both reject missing auth, derive the target user exclusively from auth.uid(), use a fixed empty search_path, and do not accept a user-id argument. The warning remains recorded for professional review rather than being hidden.

Do not describe the service as publicly launched or payments as live until every applicable live launch gate above has passed.
