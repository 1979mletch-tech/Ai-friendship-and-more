# AI Friendship and More

AI Friendship is a warm AI companion for artists and creative people (writers, musicians, designers, filmmakers, dancers, photographers) and for non-artists who want reflective, supportive conversation.

It is **not human**, **not a therapist**, **not an emergency service**, and **not a substitute for professional care**.

## What is implemented in this phase

- Creative-first positioning and topic starters (without excluding general chat use)
- Chat mode switch: **General support** and **Creative mode**
- Browser-only companion name and separate conversations with new, continue, rename, and delete controls
- Search across saved conversation titles and messages, with automatic local time labels
- Edit or delete individual project notes; export local conversations and notes as JSON
- Creative companion foundations:
  - project memory notes
  - project tags
  - creative check-in prompts
  - idea sparks
  - weekly review prompts
- Pricing/subscription route with navigation entry:
  - Free Friend
  - Studio Friend Pro ($9.99/month proposed)
  - Studio Friend Annual ($79/year proposed)
- Subscription service abstraction + environment-configurable billing setup state (Stripe-ready boundary)
- Free-plan local usage limits; paid plans are previews until server-verified billing exists
- Privacy Centre secure-talk copy in plain language:
  - encryption in transit expectation (HTTPS/TLS in production)
  - secrets via environment variables
  - user deletion controls for local history/memory
  - minimal-data principles
  - provider processing disclosure
- Consent/disclosure control before active chat
- Local privacy controls to clear chat and notes or reset all app data
- VR-ready immersive preview route with non-headset fallback and explicit “VR Preview / Coming Next” labeling

## What remains external / requires credentials or professional review

- Staging deployment and end-to-end verification of account, AI, and Stripe flows (local Chat uses fixed responses)
- Invoice, failed-payment, refund, duplicate-checkout, and subscription lifecycle policy review
- Additional anti-abuse protection beyond the per-user daily message and note limits
- Production security review, access control model, logging policy, and retention policy
- Provider legal/data-processing review and final privacy policy language
- Professionally reviewed crisis handling; current keyword detection can miss indirect or nuanced language
- Future WebXR + Three.js immersive implementation, device testing, and voice/spatial privacy controls

## Cloud account and AI chat (optional deployment)

The `Account & AI chat` screen is separate from browser-only Local Chat. It supports email sign-up/sign-in, password reset, account-scoped conversations and notes, cloud data export, and account deletion. The local chat is **not** automatically copied to the cloud. Cloud chat requires deployment and live integration testing before it is available to users.

1. Create a Supabase project and apply both SQL files in `supabase/migrations/` in filename order. They enable row-level security, account-scoped data, and server-enforced usage limits.
2. Configure email authentication and your production redirect URLs in Supabase Auth.
3. Deploy `chat`, `delete-account`, and `billing` with JWT verification enabled. Deploy `stripe-webhook` with JWT verification disabled and verify Stripe's signature in the handler. Set Edge Function secrets `APP_ORIGIN` (exact public site origin), `OPENAI_API_KEY`, optional `OPENAI_MODEL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SIGNING_SECRET`, `STRIPE_PRICE_MONTHLY`, and `STRIPE_PRICE_ANNUAL`. Supabase supplies its project URL, anon/publishable key, and service-role key to the function runtime; verify those names for your deployment.
4. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the website build environment. These are public client values. Never set a secret or service-role key in `VITE_` variables.
5. In Stripe test mode, register the `stripe-webhook` URL for `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, and `customer.subscription.deleted`. Enable the customer portal and verify the prices and currency. Set `VITE_BILLING_PROVIDER=stripe` only in deployments where these pieces are configured.
6. Test actual sign-up, email confirmation, password reset, user A/user B isolation, free and paid quotas, crisis handling, checkout/portal/cancellation, duplicate checkout, export, and account deletion against staging before public access.

The cloud function stores user and assistant turns in Supabase; it sends recent turns to OpenAI. Deleting the cloud account cascades the app tables in this migration; provider retention and operational logs require a separate privacy review. Local browser data can be deleted independently in Privacy.

## Billing foundation notes

Current implementation is intentionally safe:

- If `VITE_BILLING_PROVIDER=none` (default), pricing renders in preview mode.
- If `VITE_BILLING_PROVIDER=stripe`, signed-in users see hosted Checkout and portal controls. The server still refuses checkout until its Stripe secrets and prices exist.
- App does **not** fake successful payments.
- Paid cloud limits activate only from signed Stripe webhook state. Local Chat stays a free browser-only experience.
- Billing code is **not live-tested**; keep Checkout disabled until test-mode billing and cancellation scenarios pass.

## VR preview limitation and future architecture boundary

Current immersive route is a browser-safe visual preview that works on desktop/mobile without requiring a headset.

Future boundary:

- optional WebXR capability detection and launch path
- isolated Three.js/WebXR rendering module
- accessibility fallback for keyboard/screen reader and non-headset users
- explicit privacy controls for voice/spatial data before capture/processing

## Local development

```bash
npm install
npm run dev
```

## Quality checks

```bash
npm run lint
npm run typecheck
npm run build
npm run test
```

## Environment setup

Copy `.env.example` to `.env` and fill only public client configuration values.
Never put secret keys in `VITE_` variables: these are bundled into public browser JavaScript.
