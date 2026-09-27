# AI Friendship — launch-readiness handover

This document records what can be verified from the repository and what still requires owner-controlled services. It prevents a green source build being mistaken for a live launch.

## Repository-verifiable gate

Run on the exact candidate commit:

- `npm ci`
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- Download the Actions artifact named `ai-friendship-dist-<commit-sha>` and verify it contains `index.html` and the Vite assets.

The preview workflow now runs for the candidate build branches and preserves that artifact even if the GitHub Pages environment blocks deployment.

## Owner-controlled release gate

These checks cannot be honestly completed by source inspection:

1. Configure the HTTPS frontend origin in Supabase Auth redirect/site URLs.
2. Apply all migrations in `supabase/migrations` to the intended staging project.
3. Deploy the `chat` and `delete-account` Edge Functions.
4. Set server-only secrets: `OPENAI_API_KEY`, `OPENAI_MODEL`, `SUPABASE_SERVICE_ROLE_KEY`, and `ALLOWED_ORIGIN`.
5. Configure a real adult-eligibility/age-assurance provider. The browser 18+ control is only a preview control.
6. Configure Stripe prices and server checkout/webhook handling. Do not put secret Stripe values in `VITE_*`.
7. Run two disposable-account isolation tests against the deployed Supabase project.
8. Test sign-up, email confirmation, sign-in, sign-out, password reset, expired session, deletion, live AI refusal without adult eligibility, rate limiting, and provider failure handling.
9. Verify the exact deployed frontend commit on desktop and a real phone before public launch.

## Current release language

Until the owner-controlled checks above pass, describe the app as a browser preview / production candidate. Do not describe it as live AI, paid, age-verified, or publicly launched.
