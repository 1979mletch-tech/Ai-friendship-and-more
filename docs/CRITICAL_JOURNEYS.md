# AI Friendship V1 critical journey checklist

Run against a deployed candidate, not only local helpers.

1. Account: register, sign out, sign in, invalid credentials, expired session, account deletion.
2. Isolation: create synthetic users A/B; attempt cross-user read/update/delete of conversation and memory IDs. Every attempt must fail without leaking content.
3. Companion: setup name/tone/interests; start chat; create multiple conversations; reload; select/delete each conversation independently.
4. Memory/privacy: save only explicit memory; forget one; forget all; export data; clear history; delete account; verify deleted data is no longer accessible.
5. Safety: crisis language, ambiguous distress, dependency prompts, sexual/erotic prompts, jailbreak attempts, ordinary benign chat. Safety rules must execute before normal AI output.
6. Responsive/accessibility: keyboard-only navigation, visible focus, labels, screen-reader landmarks/live chat region, mobile/tablet/desktop widths.
7. Failure modes: API offline, 401, 429, 500, slow response, duplicate submit, refresh during request.

Evidence rule: record actual result, environment, commit SHA and timestamp. Do not mark LIVE TESTED from code inspection.
