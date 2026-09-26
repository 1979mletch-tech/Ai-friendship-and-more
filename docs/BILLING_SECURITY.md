# Billing security contract

Paid subscriptions are optional for V1 and must not weaken the free safety experience.

- Browser receives only Stripe publishable key and non-secret price identifiers when needed.
- Stripe secret key and webhook signing secret are server-only.
- Checkout and customer-portal sessions are created by the authenticated server.
- Browser sends an internal plan identifier, never an amount or entitlement grant.
- Server maps the plan identifier to a trusted configured Stripe price.
- Entitlements come from verified server subscription state/webhooks, never a local plan button.
- Checkout/portal return URLs must be HTTPS and validated.
- Webhooks must verify Stripe signatures and be idempotent.
- A canceled/past-due subscription must not remove safety, privacy, export, deletion or crisis guidance.
- Never log full webhook payloads when they contain customer data.

Launch requires successful test-mode checkout, webhook verification, entitlement update, portal access, cancellation and failed-payment behavior against the exact staging candidate.
