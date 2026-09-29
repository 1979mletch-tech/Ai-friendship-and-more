# Preview Deployment

Goal: produce a public HTTPS preview for test accounts tied to an exact commit.

Requirements:
- deploy only after exact-SHA CI green;
- show test/preview status where appropriate;
- use synthetic accounts/data;
- configure public env values separately from server secrets;
- restrict ALLOWED_ORIGIN to preview origin;
- do not enable paid billing;
- record deployment ID/URL/commit;
- run smoke + auth + safety + failure tests.

A repository URL is not a live app preview URL.

# Public cloud preview configuration

The GitHub Pages preview reads the repository Actions **variables**
`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (modern `sb_publishable_` key),
and `VITE_CHAT_API_URL` together. Set them to the connected AI Friendship
Supabase project and its `/functions/v1/chat` endpoint. A missing or mismatched
value fails the build before deployment; when all three are absent the existing
local-only preview remains available.

The preview workflow explicitly keeps public live mode, age-verification UI,
speech, and billing disabled. These public values do not replace the server-only
Edge Function secrets or a consented adult live test. Never add a service-role,
Stripe, or AI-provider key to Actions variables or any `VITE_*` value.
