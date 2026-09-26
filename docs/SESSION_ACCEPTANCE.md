# Session and sign-out acceptance

A 401 response must be presented as an expired session and must never be retried as though it were a transient server error. Protected operations after expiry must not mutate local UI into a false success state.

Sign-out attempts server invalidation when available, then clears the local session so a user can leave the device even during an outage. Production backend tokens must have documented expiry/revocation behavior.

Account deletion differs from sign-out: local account data is cleared only after the server confirms deletion. Two-account staging tests must verify that tokens and object identifiers from account A cannot read, modify, export or delete account B data.
