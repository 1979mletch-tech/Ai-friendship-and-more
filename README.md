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

- Real billing checkout (Stripe or alternative) and server-side subscription lifecycle
- Real AI chat, authentication, account-scoped persistent data, and database migrations (the current chat uses fixed local responses)
- Webhook handling (checkout success, subscription updates, cancellations, invoice events)
- Server-verified entitlements and anti-abuse limits
- Production security review, access control model, logging policy, and retention policy
- Provider legal/data-processing review and final privacy policy language
- Professionally reviewed crisis handling; current keyword detection can miss indirect or nuanced language
- Future WebXR + Three.js immersive implementation, device testing, and voice/spatial privacy controls

## Billing foundation notes

Current implementation is intentionally safe:

- If `VITE_BILLING_PROVIDER=none` (default), pricing renders in preview mode.
- If `VITE_BILLING_PROVIDER=stripe` but required keys/price IDs are missing, UI shows setup-needed state.
- App does **not** fake successful payments.

### Required production billing pieces

1. Server endpoint to create checkout session
2. Stripe webhook endpoint with signature verification
3. Subscription state persistence (active/past_due/canceled/trialing)
4. Entitlement enforcement on trusted server boundary
5. Customer portal / cancellation flow

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

Copy `.env.example` to `.env` and fill only the public billing preview variables you use.
Never put secret keys in `VITE_` variables: these are bundled into public browser JavaScript.
