# Production Readiness Checklist

AI Friendship is not production-ready merely because the browser build passes.

- [ ] Auth provider configured and tested
- [ ] Password recovery / session expiry tested
- [ ] Server-side AI endpoint deployed
- [ ] AI provider key stored server-side only
- [ ] Request schema and message-size limits enforced server-side
- [ ] Per-user rate limiting / abuse controls enabled
- [ ] Conversation and memory database migrations applied
- [ ] RLS / authorization tested with two real test accounts
- [ ] Direct-ID cross-account read/update/delete attempts blocked
- [ ] Account deletion verified
- [ ] Data retention and provider processing documented
- [ ] Crisis/dependency safety policy professionally reviewed
- [ ] Prompt-injection and secret-exfiltration regression suite passes
- [ ] Stripe checkout/webhook/customer portal implemented before paid plans are sold
- [ ] Mobile browser test completed
- [ ] Keyboard/screen-reader accessibility test completed
- [ ] Privacy/terms/legal review completed
- [ ] Production deployment and rollback procedure verified
