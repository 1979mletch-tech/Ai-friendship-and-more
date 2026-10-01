# Security Test Matrix

Test:
- unauthenticated Edge calls
- forged/expired JWT
- malformed JSON
- oversized message/context
- direct-ID cross-account CRUD
- user_id spoofing on insert
- RLS update ownership
- prompt injection/secret requests
- browser bundle secret scan
- private query-string scan
- XSS/unsafe rendering attempts
- rate-limit enforcement
- account deletion authorization
- dependency advisories
- error/log secret leakage

Record exact commit and environment; code inspection is not a substitute for live authorization testing.
