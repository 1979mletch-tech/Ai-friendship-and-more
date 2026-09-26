# Production environment contract

## Browser-safe variables
Only values intended to be public may use the VITE_ prefix:
- VITE_AUTH_MODE=server
- VITE_API_BASE_URL=https://your-api.example
- VITE_BILLING_PROVIDER=none|stripe
- VITE_STRIPE_PUBLIC_KEY=... (publishable key only)
- VITE_STRIPE_PRICE_PRO_MONTHLY=...
- VITE_STRIPE_PRICE_PRO_ANNUAL=...

## Server-only secrets
Never expose these through Vite/browser environment variables:
- AI provider API keys
- database passwords or service-role keys
- session-signing secrets
- Stripe secret key
- Stripe webhook signing secret

The production API must load those from its server/hosting secret store. The frontend only talks to the trusted HTTPS API boundary.

## Launch configuration
Set VITE_AUTH_MODE=server and VITE_API_BASE_URL only after the deployed API implements the documented authentication, ownership, deletion and safety contracts and passes the two-account isolation matrix.
