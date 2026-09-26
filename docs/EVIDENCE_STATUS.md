# Evidence Status

This file prevents build claims from outrunning evidence.

## Automated tested
GitHub quality gate executes npm ci, lint, TypeScript, Vitest and production build. Record the exact passing commit before merge.

## Code built / code verified
Supabase migrations, RLS policies, authenticated Edge Functions, account UI, cloud backup and deletion boundaries exist in source.

## Not yet live tested
- real Supabase staging authentication
- two-account RLS isolation
- deployed Edge Function AI path
- account deletion cascade
- real password recovery email
- production rate-limit behavior
- physical/mobile browser matrix
- screen-reader testing
- Stripe checkout/webhook/entitlement lifecycle

No item in the final group should be described as verified or production-ready until live evidence exists.
