# API contract acceptance checklist

The frontend contracts are not proof that a backend exists. Before production, verify the deployed API against this checklist.

## Authentication
- Registration/login issue a session for exactly one account.
- Logout revokes or invalidates the session as designed.
- DELETE /account deletes the authenticated account only.

## Companion
- PUT/GET /companion-profile are owner-scoped.
- POST /companion/reply runs safety controls and never trusts browser-provided identity.

## Conversations
- GET /conversations returns only authenticated user's rows.
- POST /conversations creates an owner-scoped row.
- GET /conversations/:id/messages rejects foreign IDs.
- POST /conversations/:id/messages rejects foreign IDs and persists both sides of the exchange according to the server model.
- DELETE /conversations/:id rejects foreign IDs.
- DELETE /conversations clears only the authenticated user's conversations.

## Memory
- GET/POST /memories are owner-scoped.
- DELETE /memories/:id rejects foreign IDs.
- DELETE /memories clears only authenticated user's memory.

## Privacy and billing
- GET /account/export exports only authenticated user's data.
- Billing endpoints derive account identity from the verified session.
- Server maps internal plan IDs to trusted Stripe price IDs.
- Webhook signatures and idempotency are verified server-side.

For every object endpoint, repeat with Account A's ID under Account B's token and vice versa. A 2xx response or leaked metadata is a release blocker.
