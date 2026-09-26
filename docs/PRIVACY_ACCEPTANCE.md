# Privacy acceptance checks

Verify on the deployed candidate that account export contains only user-facing profile, conversation and approved-memory data and contains no password, access token, refresh token, Authorization header, provider secret or internal credential.

Verify remote deletion succeeds before the UI removes server-backed records. On server failure the record remains visible and the user receives an explicit failure message.

Verify local preview data can be deleted without an account. Verify account deletion clears the authenticated session only after the server confirms deletion. Verify diagnostics and analytics never receive chat text, memory values or project-note bodies.
