# BuildRush Base44 security finding — 16 October 2026 (read-only schema review)
Target existing BuildRush app ID: `6ac129b13c8f63e1f265f186` (NOT BuildRush Sync or copies).
Evidence: Base44 `list_entity_schemas`, current connected project; this is a *configuration finding*, not a demonstrated unauthenticated exploit.

## High priority: broad entity reads and potentially over-broad writes
- `Job` RLS `read: {}` while job fields include `customer_email`, `customer_name`, `postcode`, `payment_session_id`, and matching details.
- `Response` RLS `read: {}` while records include trade responses, `email`, availability slots, and calendar metadata.
- `Tradesperson` `read: {}` includes email and internal reputation notes, professionalism/standards scores.
- `JobRating` `read: {}` includes names and comments.
- `Job` and `Tradesperson` `create: {}`: public or broadly granted writes may permit abuse; exact meaning needs testing against Base44's policy engine. `SurplusMaterial` is a staged/unpublished change and needs create-policy validation separately.
- `User` role schema exists but does not by itself prove server-side owner-only authorization.
- `Response` creation is admin-gated according to entity policy; verify the current legitimate tradesperson flow operates via trusted backend, rather than expanding permissions without testing.
- `Subscription` `read` permits record owner, matching email, or admin; verify platform guarantees the email identity and never uses request-supplied values for authorization.

## Required remediation path (NO live changes made)
1. On a non-production branch or clone with synthetic accounts, attempt unauthenticated reads, homeowner A reading homeowner B personal data, tradesperson reading unrelated availability, and public create/update attempts.
2. Separate public-safe job summaries from private details. Public listing: title, category, offered fixed price, general location, and non-sensitive lifecycle status only. Never display exact contact details/payment session identifiers to unauthenticated users.
3. For private job details, use row ownership and server-confirmed account roles; verify that customers and authorized responders retain their required access. Use least privilege for calendar availability and admin reputation notes.
4. Enforce owner/admin roles server-side (not only hiding an owner link in UI). Use adversarial tests against endpoints, not just the page.
5. Apply schema changes first to staging, regression test real job posting / trades acceptance / direct contact / fee checkout, then owner approval for production.
6. Preserve existing job records, customer identities, payments and both independent live businesses. Rollback plan required.
7. Conduct a secrets inventory without ever printing key values, identify and rotate the reportedly exposed Stripe secret in a controlled window.

**Status**: OPEN / PROVISIONAL HIGH SEVERITY pending exploitability verification; no live exploit test and no mitigation deployed.
