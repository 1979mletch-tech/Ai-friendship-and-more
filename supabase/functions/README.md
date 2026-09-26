# Edge Functions

Both functions verify the bearer session inside the function using Supabase Auth.

## chat
Requires authenticated bearer token. Validates message array, bounds context/content, applies a deterministic high-risk check, rate-limits per authenticated user, then calls the configured AI provider with server-held credentials.

## delete-account
Requires authenticated bearer token. Resolves the user from that token, then uses the service-role secret only on the server to delete that same authenticated user. Owned database rows cascade through foreign keys.

Set a restrictive ALLOWED_ORIGIN for production. Do not expose service-role or AI-provider secrets to the browser.
