# AI Friendship and More

AI Friendship is a warm AI companion for artists and creative people (writers, musicians, designers, filmmakers, dancers, photographers) and for non-artists who want reflective, supportive conversation.

It is **not human**, **not a therapist**, **not an emergency service**, and **not a substitute for professional care**.

## What is implemented in this phase

- Creative-first positioning and topic starters (without excluding general chat use)
- Chat mode switch: **General support** and **Creative mode**
- Local conversation history with clear/delete controls
- User-controlled local memory with add/forget/clear controls
- Companion naming with persistent AI-identity disclosure
- Settings/data-control route
- Dependency-risk and prompt-injection safety responses
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
- Plan entitlements + usage-limit helpers (honest local UI states)
- Privacy Centre secure-talk copy in plain language:
  - encryption in transit expectation (HTTPS/TLS in production)
  - secrets via environment variables
  - user deletion controls for local history/memory
  - minimal-data principles
  - provider processing disclosure
- Consent/disclosure control before active chat
- VR-ready immersive preview route with non-headset fallback and explicit “VR Preview / Coming Next” labeling

## What remains external / requires credentials or professional review

- Real billing checkout (Stripe or alternative) and server-side subscription lifecycle
- Webhook handling (checkout success, subscription updates, cancellations, invoice events)
- Authenticated server-side AI endpoint, server-verified entitlements and anti-abuse limits
- Account authentication, cloud conversation sync and user-scoped memory
- Database migrations/RLS plus two-account isolation verification
- Production security review, access control model, logging policy, and retention policy
- Provider legal/data-processing review and final privacy policy language
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

Copy `.env.example` to `.env` and fill only the variables you use.
Never commit secrets. **Do not put OpenAI or other private AI-provider keys in a `VITE_*` variable**; Vite exposes those values to the browser. Production AI calls must use an authenticated server/edge endpoint.

## Current data boundary

The current build stores chat history, project notes, consent, plan choice, companion name and user-controlled memory in browser localStorage. This is a preview/local fallback, not an authenticated private cloud account. The UI labels that limitation explicitly.

See `SECURITY.md` and `PRODUCTION_CHECKLIST.md` before production deployment.
