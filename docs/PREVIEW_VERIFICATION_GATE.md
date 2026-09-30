# Preview Verification Gate

For the exact preview SHA:

1. CI: npm ci, lint, typecheck, tests, build all green.
2. Preview deploy completes without red jobs.
3. Home, Chat, History, Memory, Settings, Account, Pricing, Privacy and Immersive routes render.
4. Mobile navigation works at narrow viewport.
5. Local chat works without cloud configuration.
6. Crisis text uses deterministic local safety handling.
7. Hosted preview clearly identifies itself as preview/staging.
8. No secrets appear in page source, network URLs, logs or client configuration.
9. If cloud is configured: signup/signin/recovery/session refresh/signout pass.
10. If cloud is configured: two-account RLS direct read/update/delete isolation passes.
11. If live AI is configured: authenticated chat, provider failure fallback and rate limit behavior pass.
12. Account deletion is tested only with synthetic accounts.

Record PASS/FAIL/NOT CONFIGURED. Never turn NOT CONFIGURED into PASS.
