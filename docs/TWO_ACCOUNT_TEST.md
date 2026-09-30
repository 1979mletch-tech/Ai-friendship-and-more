# Two-Account Isolation Test

Use synthetic accounts only.

For account A and B:
1. Create one conversation, memory and profile each.
2. Capture row IDs.
3. As A: list own rows; direct GET B IDs; attempt PATCH/DELETE B IDs.
4. As B: repeat against A IDs.
5. Expected: other-user rows never appear; direct reads return no accessible row; writes/deletes affect zero other-user rows.
6. Verify each owner can still read/update/delete their own rows.
7. Delete one account and verify only that account's owned rows cascade.
8. Record exact staging URL, commit SHA, timestamps and response evidence.

A code-level RLS review is not a substitute for this live test.
## Automated staging subset

The repository includes `npm run test:staging:isolation` for disposable staging accounts. It signs in as two distinct users, creates synthetic memory and conversation rows for A, attempts cross-account read/update/delete/insert as B, checks A's rows remain unchanged, and removes the fixtures. It prints pass/fail labels only. Profile, reverse-direction attacks and account deletion still require the manual steps above. The script has not been run against staging until a staging URL and two test accounts are configured.

Set `STAGING_SUPABASE_URL`, `STAGING_EXPECTED_HOST` (the exact hostname in that URL), `STAGING_SUPABASE_ANON_KEY`, `STAGING_TEST_EMAIL_A`, `STAGING_TEST_PASSWORD_A`, `STAGING_TEST_EMAIL_B`, and `STAGING_TEST_PASSWORD_B` in a private test environment. Use disposable accounts and no real user content. Run the script twice against the exact deployed migration set, retain both logs and the deployed commit SHA, and verify cleanup. Never commit credentials or paste tokens into issue comments.
