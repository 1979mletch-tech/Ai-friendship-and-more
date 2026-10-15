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

The preview workflow builds candidate and feature branches, preserving an artifact for each exact commit. Only `chatgpt/ai-friendship-build` deploys to GitHub Pages. The workflow stamps `build-commit.txt` into the artifact and polls the public Pages URL until it serves that exact SHA; a green deployment job includes this commit check. Branch-specific concurrency prevents a feature-branch build from cancelling the launch-branch deployment.

## Owner-controlled release gate

These checks cannot be honestly completed by source inspection:

1. Configure the HTTPS frontend origin in Supabase Auth redirect/site URLs.
2. Apply all migrations in `supabase/migrations` to the intended staging project.
3. Deploy the `chat` and `delete-account` Edge Functions. Deploy `speak` for optional voice playback after its security and cost checks.
4. Set server-only secrets: `OPENAI_API_KEY`, `OPENAI_MODEL`, `SUPABASE_SERVICE_ROLE_KEY`, and `ALLOWED_ORIGIN`.
5. Configure a real adult-eligibility/age-assurance provider. The browser 18+ control is only a preview control.
6. Configure the existing Stripe checkout/webhook implementation with the owner's production Stripe account. Follow `docs/STRIPE_PRODUCTION_HANDOFF.md`; keep `BILLING_LIVE_ENABLED=false` until its live-mode verification passes. Do not put secret Stripe values in `VITE_*`.
7. Run two disposable-account isolation tests against the deployed Supabase project.
8. Test sign-up, email confirmation, sign-in, sign-out, password reset, expired session, deletion, live AI refusal without adult eligibility, rate limiting, and provider failure handling.
9. Verify the exact deployed frontend commit on desktop and a real phone before public launch. Keep `VITE_AURORA_SPEECH_ENABLED=false` until the generated voice is auditioned on Android/iPad and the `speak` function is verified with adult and non-adult test sessions.

## Current release language

Until the owner-controlled checks above pass, describe the app as a browser preview / production candidate. Do not describe it as live AI, paid, age-verified, or publicly launched.

### Identity request limit

Apply the `age_verification_start_limit` migration before deploying the updated
`verify-age` function. Each authenticated account can begin at most one Stripe
Identity session per 10 minutes and three per rolling 24 hours; attempts are
reserved atomically before a Stripe API call. The table is RLS-protected and has
no direct browser access. Test 429 for repeat starts, 401 without a session,
and confirm that a verified account does not reserve a further attempt.
