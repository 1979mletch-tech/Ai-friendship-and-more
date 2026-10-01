# Authentication Test Matrix

Staging tests:
- registration valid/invalid input
- email confirmation if enabled
- sign-in correct/incorrect password
- sign-out invalidates app session
- recovery request does not disclose account existence
- recovery link/reset completion
- expired token handling
- malformed/forged token rejected by Edge Functions
- protected cloud data inaccessible without bearer token
- account deletion requires authenticated identity
- session state survives expected refresh only
- no passwords/tokens in URLs, logs or analytics

Record exact commit and provider configuration.
