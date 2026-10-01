# Edge Functions

Authenticated functions verify the bearer session inside the function using Supabase Auth. All browser functions require an exact `ALLOWED_ORIGIN`. The Stripe webhook instead verifies the signed raw event payload.

## chat
Requires authenticated bearer token and `app_metadata.adult_verified === true` for every live AI request. The browser's 18+ confirmation does not grant server access. No preview environment switch bypasses this check. Configure a trusted adult verification flow before testing live AI. Validates message array, bounds context/content, applies deterministic crisis and dependency screens, rate-limits per authenticated user, calls the configured AI provider with server-held credentials, and screens obvious unsafe generated replies. The simple patterns are a backstop, not a complete safety evaluation.

## delete-account
Requires authenticated bearer token. Resolves the user from that token, then uses the service-role secret only on the server to delete that same authenticated user. Owned database rows cascade through foreign keys.

## verify-age

Requires a signed-in account and a deliberate start action. Redirects to Stripe Identity document verification; on return, the account page checks the session against Stripe using a separately scoped restricted key with access to verified DOB. Only a live verified session associated with the same user and a DOB at least 18 years old can set server-owned `app_metadata.adult_verified`. No DOB, ID document or image is saved in this app. Test-mode sessions never unlock live chat. Configure `STRIPE_SECRET_KEY`, `STRIPE_IDENTITY_DOB_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `APP_RETURN_URL` and `ALLOWED_ORIGIN` as server secrets. Review Stripe Identity eligibility, fees, retention and an alternative route for users who cannot complete this check before enabling it.

## billing and stripe-webhook

`billing` requires a signed-in, server-verified adult. It remains closed until `BILLING_LIVE_ENABLED=true`, a live Stripe key, a webhook signing secret, two recurring price IDs, and the exact return URL are configured. `stripe-webhook` verifies the Stripe signature on the raw request and retrieves current subscription state from Stripe before updating the server-owned subscription row. Public users can only read their own row. The checkout button must stay hidden until a test subscription, renewal/failure, cancellation and customer portal have been checked on the actual deployment.

Server secrets: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_ANNUAL`, `APP_RETURN_URL`, `BILLING_LIVE_ENABLED`, `SUPABASE_SERVICE_ROLE_KEY`, `ALLOWED_ORIGIN`. The webhook destination is `https://<PROJECT_REF>.supabase.co/functions/v1/stripe-webhook`. Subscribe to `customer.subscription.created`, `customer.subscription.updated`, and `customer.subscription.deleted`. Do not reuse the AI Doctor Stripe products or prices without creating and checking AI Friendship's own products and descriptions.

Set one restrictive `ALLOWED_ORIGIN` for the actual HTTPS frontend origin. Do not expose service-role, Stripe secret, restricted Identity key, webhook signing secret or AI-provider secret to the browser.

Local browser data uses distinct guest and per-account keys. Existing unscoped data remains guest data; users should review or export it before switching accounts. Staging must verify two-account isolation and deletion against a deployed database.
