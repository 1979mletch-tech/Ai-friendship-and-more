# Edge Functions

Both functions verify the bearer session inside the function using Supabase Auth.

## chat
Requires authenticated bearer token and `app_metadata.adult_verified === true` for every live AI request. The browser's 18+ confirmation does not grant server access. No preview environment switch bypasses this check. Configure a trusted adult verification flow before testing live AI. Validates message array, bounds context/content, applies deterministic crisis and dependency screens, rate-limits per authenticated user, calls the configured AI provider with server-held credentials, and screens obvious unsafe generated replies. The simple patterns are a backstop, not a complete safety evaluation.

## delete-account
Requires authenticated bearer token. Resolves the user from that token, then uses the service-role secret only on the server to delete that same authenticated user. Owned database rows cascade through foreign keys.

Set a restrictive ALLOWED_ORIGIN for production. Do not expose service-role or AI-provider secrets to the browser.

Local browser data uses distinct guest and per-account keys. Existing unscoped data remains guest data; users should review or export it before switching accounts. Staging must verify two-account isolation and deletion against a deployed database.
