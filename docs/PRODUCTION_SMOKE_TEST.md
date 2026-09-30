# Production smoke test

Use two disposable accounts, A and B, on the deployed staging origin. Never use personal chat content.

| Area | Check | Expected result |
|---|---|---|
| Guest | Open home and chat | Preview is clearly labelled; no live AI claim |
| Guest | Send without disclosure | Send is blocked with an accessible explanation |
| Guest | Send after local 18+ preview control | Fixed preview reply only |
| Auth | Sign in as A | Account state loads without exposing B data |
| Isolation | A creates a conversation/memory | A can read/update/delete only A rows |
| Isolation | B requests A IDs directly | Request is denied or returns no A data |
| AI gate | Authenticated user without server adult status sends | Draft stays visible; no assistant reply |
| AI gate | Eligible authenticated user sends | Server response only; provider key never reaches browser |
| Limits | Repeated requests exceed quota | Server returns a safe rate-limit response |
| Privacy | Export/delete/restore account data | Only the signed-in account is affected |
| Mobile | 390px viewport and real phone | No clipped controls; chat remains usable |
| Failure | Disable chat endpoint | User sees a clear retryable error, not a fake AI reply |

Record the deployed commit SHA, Supabase project, test-account IDs, date, and pass/fail evidence outside the repository. Do not commit credentials or personal transcripts.
