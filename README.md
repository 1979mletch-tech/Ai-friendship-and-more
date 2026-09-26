# AI Friendship and More

AI Friendship is a warm AI companion for artists and creative people (writers, musicians, designers, filmmakers, dancers, photographers) and for non-artists who want reflective, supportive conversation.

It is **not human**, **not a therapist**, **not an emergency service**, and **not a substitute for professional care**.

## What is implemented in this phase

- Creative-first positioning and topic starters (without excluding general chat use)
- Chat mode switch: **General support** and **Creative mode**
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
- Server-backed email/password accounts with private chat history, account deletion, companion setup, and approved project notes when the API is running
- Server chat endpoint with provider-backed replies when `OPENAI_API_KEY` and `OPENAI_MODEL` are configured; no fabricated live reply when unavailable
- Searchable, renameable, and deletable account conversations; editable and searchable project notes
- Server daily usage tracking that persists after a conversation or history is deleted
- Account security controls: change password (revokes all sessions), inspect session count, sign out other devices
- Yes/Somewhat/No feedback on saved replies, scoped to the account and deleted with the related history
- Complete JSON account export covering conversations, messages, notes, companion settings, and feedback; the browser also includes guest data in its export
- VR-ready immersive preview route with non-headset fallback and explicit “VR Preview / Coming Next” labeling

## What remains external / requires credentials or professional review

- Real billing checkout (Stripe or alternative) and server-side subscription lifecycle
- Live AI credentials and production identity features (password reset, email verification, multi-device session management); guest chat still uses fixed sample responses
- Production database deployment, backups, migration process, and hosted API configuration
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
npm run dev:api # terminal 1, API on localhost:3001
npm run dev     # terminal 2, website on Vite's local port
```

The API creates `data/ai-friendship.sqlite` on first start. Set `DATABASE_PATH` to an absolute persistent location for deployment. The API binds to `127.0.0.1` and expects a same-origin reverse proxy for `/api`; configure HTTPS and `NODE_ENV=production` before exposing it. Cookies are HttpOnly, SameSite=Lax, and Secure in production. The Vite dev server proxies `/api` to the local API. Guest chat and notes remain browser-only. Signed-in chat, notes, and companion setup are account-scoped on the server.

Existing saved chats are migrated into an "Earlier chat" conversation when the API starts after this update. Back up the SQLite file before upgrading a deployed instance. Conversation search matches titles; note search runs locally over the account's loaded notes.

Set `OPENAI_API_KEY` and `OPENAI_MODEL` **only on the server** to enable signed-in live AI chat. The server uses the OpenAI Responses API with `store: false`; it sends the latest conversation turns and up to three approved project notes. Without these variables, ordinary signed-in chat returns a clear setup error and does not save the message. Crisis wording matching the local safety screen receives immediate deterministic emergency guidance without calling the provider. This screen is a limited safeguard, not a clinically validated crisis detection system. Guest chat still uses fixed sample responses. No Stripe secret is needed in this phase.

This account foundation has not had a production security audit. Registration, sign-in, and password change have basic in-process attempt limits; these do not persist across server restarts or multiple instances. Before a public deployment, add password recovery and email verification, durable rate limiting, migrations and backups, and deployment checks for the proxy, HTTPS, and privacy policy.

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
