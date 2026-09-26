# Failure-mode acceptance matrix

Before public launch, test the exact deployed candidate against: offline network, request timeout, 401/expired session, 403 cross-account object, 404 deleted object, 408, 429, 500, 502, 503, 504, malformed JSON, empty optional profile, AI provider timeout, database timeout, Stripe unavailable, invalid checkout redirect, duplicate submit, refresh during sync, and deletion interrupted mid-request.

For every case record: expected UI, actual UI, whether local data remains intact, whether the action can be retried safely, whether any private text reached logs/URLs, deployment SHA and timestamp.

No failure may be presented as a successful save, synchronization, deletion, payment, or account action.
