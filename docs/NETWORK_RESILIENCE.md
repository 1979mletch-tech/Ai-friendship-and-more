# Network resilience contract

All production-facing API calls use a bounded timeout. Read-only requests may retry transient 408/429/5xx failures with bounded backoff. Mutation requests are never automatically replayed by the browser transport because an ambiguous POST/PUT/DELETE response could otherwise duplicate messages, subscriptions, memories or destructive actions.

The backend should support idempotency keys for mutations that need safe replay. Until that exists, the client fails visibly and lets the user decide whether to retry.

401 means re-authentication is required. 403 is an ownership/access denial and must never be treated as not-found success. 429 asks the user to wait. 5xx is temporary service failure. Raw infrastructure error bodies are not shown to users.
