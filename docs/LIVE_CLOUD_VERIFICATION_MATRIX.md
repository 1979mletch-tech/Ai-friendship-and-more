# Live Cloud Verification Matrix

Use two synthetic accounts A and B.

| Check | Expected |
|---|---|
| A creates conversation | A can read it |
| B lists conversations | A row absent |
| B direct GET A id | empty/denied |
| B PATCH A id | 0 rows/denied |
| B DELETE A id | 0 rows/denied |
| A updates own conversation | succeeds |
| A deletes own conversation | succeeds |
| A creates memory | A can read it |
| B direct GET A memory id | empty/denied |
| repeated memory backup | no duplicate owner/value row |
| profile upsert | owner can read own profile |
| B profile read for A | empty/denied |
| delete account A | auth user and owned rows removed |

Capture exact commit, deployment URL, timestamps and observed HTTP/result evidence.
