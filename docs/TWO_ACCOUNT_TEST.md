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
