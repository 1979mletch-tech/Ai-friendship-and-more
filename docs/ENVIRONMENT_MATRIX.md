# Environment Matrix

## Browser/public
VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_CHAT_API_URL and optional Stripe publishable/public price IDs.

## Server/Edge secret
OPENAI_API_KEY, OPENAI_MODEL, SUPABASE_SERVICE_ROLE_KEY (account deletion only), ALLOWED_ORIGIN.

Never place server secrets in VITE variables, source control or client logs.
