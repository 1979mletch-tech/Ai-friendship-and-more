# Release Blockers

Public production launch remains blocked until the exact candidate is CI green, deployed, live UI verified, cloud configuration reviewed, synthetic auth/RLS isolation tested, account deletion tested, AI provider behavior tested, CORS restricted, provider data terms reviewed, payment entitlements server-verified if billing is enabled, and mobile/accessibility/adversarial checks are recorded.

A working static preview is not equivalent to production readiness.

The launch-gates branch prepares an Identity check and signed subscription flow. Its passing unit tests and staging SQL checks do not establish that live Stripe credentials, ID verification, Checkout, webhook delivery, cancellation, actual AI replies, or a deployed mobile browser work. Keep `VITE_PUBLIC_LIVE_MODE`, `VITE_AGE_VERIFICATION_ENABLED` and `BILLING_LIVE_ENABLED` off until those observations are recorded on the exact site.
