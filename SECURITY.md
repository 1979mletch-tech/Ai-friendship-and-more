# AI Friendship Security Notes

## Current preview boundary

The current Vite application is a browser client. It must not contain private AI-provider, Stripe-secret, service-role, or database-admin credentials.

Only public browser configuration may use the `VITE_` prefix. Vite exposes these values to client-side JavaScript.

## Production requirements

Before enabling paid AI calls or account-backed memory:

- put AI-provider credentials behind an authenticated server or edge endpoint;
- validate and bound every request on the server;
- enforce per-user rate and usage limits on a trusted boundary;
- verify authenticated user identity server-side;
- store conversations and memory under user-scoped authorization/RLS;
- test cross-account read, update, and delete attempts;
- implement provider logging and retention rules;
- keep private conversation content out of analytics, URLs and error metadata;
- implement account deletion and provider-side deletion semantics;
- verify Stripe webhooks server-side before granting entitlements.

## Safety boundary

The browser safety helper is a defense-in-depth UX layer, not a professional crisis-detection system. It must not be described as guaranteeing detection of every dangerous message.
