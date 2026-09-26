# Security regression catalogue

Release-blocking regression cases:
1. Missing/expired bearer token cannot access protected resources.
2. Account A cannot read/update/delete Account B objects.
3. Object IDs containing path separators/traversal markers are rejected client-side and server-side.
4. Passwords/tokens/secrets never enter URLs, analytics or diagnostic fields.
5. AI/provider and Stripe secret keys never use VITE_ variables.
6. Crisis safety executes before ordinary model generation.
7. Generated output cannot claim human/therapist identity or exclusivity.
8. Account deletion does not report success unless the server confirms it in server mode.
9. Memory deletion does not report success when the server operation failed.
10. Billing entitlement cannot be granted by changing local plan state.
11. Checkout redirects are restricted to trusted HTTPS hosts.
12. Sync failures never display as successful account synchronization.
13. Conversation/message limits count across conversation boundaries.
14. Duplicate pending sends are blocked.
15. Export excludes passwords/session tokens by design.

Every fixed security bug should gain an automated regression where practical and a staging attack case where server behavior is involved.
