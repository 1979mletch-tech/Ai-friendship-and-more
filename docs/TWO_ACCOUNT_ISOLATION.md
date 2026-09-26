# Two-account isolation attack matrix

Use synthetic accounts A and B on staging.

| Object/action | A own | A attempts B | B own | B attempts A |
|---|---|---|---|---|
| list conversations | allow | must not reveal | allow | must not reveal |
| fetch messages by guessed ID | allow | deny/no content | allow | deny/no content |
| delete conversation by guessed ID | allow | deny/no effect | allow | deny/no effect |
| list memories | allow | must not reveal | allow | must not reveal |
| delete memory by guessed ID | allow | deny/no effect | allow | deny/no effect |
| account deletion | own only | impossible | own only | impossible |

Also test malformed IDs, sequential/guessed IDs, stale sessions and direct API calls bypassing the UI. Record HTTP status and verify response bodies never reveal the foreign object's content or owner metadata.
