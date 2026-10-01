# Staging Data Policy

AI Friendship staging is for synthetic test data only.

- Do not enter real health, financial, identity, legal, workplace-confidential, or other sensitive personal data.
- Test accounts must use dedicated non-production addresses.
- Two-account RLS tests use synthetic conversations and memories.
- Delete synthetic accounts after verification when they are no longer needed.
- Never copy production secrets into client-side `VITE_*` variables.
- Preview screenshots and logs must not contain access tokens, passwords, provider keys, or real user messages.
- A staging pass is evidence for the exact deployed commit only; it is not a production-security certification.
