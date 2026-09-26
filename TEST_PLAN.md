# AI Friendship Test Plan

## Automated gate
Every PR runs dependency install, lint, TypeScript, Vitest and production build.

## Staging E2E
1. Home/nav/mobile.
2. Consent required before chat.
3. Local fallback chat.
4. Account registration/confirmation/sign-in/sign-out/recovery.
5. Authenticated AI reply.
6. Malformed/oversized/unauthenticated AI requests rejected.
7. Crisis and dependency safety examples.
8. Prompt-injection/secret requests.
9. History, memory add/remove/clear.
10. Data export and local deletion.
11. Cloud conversation/memory backup.
12. Two-account RLS: A cannot read/update/delete B; B cannot read/update/delete A.
13. Account deletion and owned-row cascade.
14. Expired/invalid session.
15. Provider/network/database failure UX.
16. Keyboard/focus/reduced-motion/mobile layout.
17. Billing remains preview-only until trusted webhook entitlements exist.

Record exact deployed commit and classify each result as LIVE TESTED, AUTOMATED TESTED, CODE VERIFIED, NOT TESTED or BLOCKED.
