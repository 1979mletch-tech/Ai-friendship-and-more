# Session Policy

Browser sessions are convenience state, not long-term secrets.

- reject expired cached sessions;
- server/Edge must independently validate bearer tokens;
- never authorize from a client user_id alone;
- sign-out clears local session state;
- account deletion resolves identity from the authenticated token;
- never put bearer/refresh tokens in URLs or analytics.

Refresh-token lifecycle and session rotation must be verified with the configured auth provider before launch.
