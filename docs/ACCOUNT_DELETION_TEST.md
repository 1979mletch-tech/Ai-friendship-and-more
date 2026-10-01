# Account Deletion Test

In staging:
1. Create synthetic account.
2. Add profile, conversation, memory and usage event.
3. Invoke authenticated delete-account function.
4. Verify auth user no longer signs in.
5. Verify owned rows are removed by FK cascade.
6. Verify unrelated second account remains intact.
7. Verify invalid/other-user tokens cannot choose a target user.
8. Verify service-role key is never returned/logged/client-visible.

Record exact commit and responses. Until this passes, account deletion is CODE BUILT rather than LIVE VERIFIED.
