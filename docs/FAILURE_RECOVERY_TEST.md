# Failure Recovery Test Matrix

Verify:
- AI endpoint offline
- AI provider returns 5xx
- malformed AI response
- database REST unavailable
- expired/invalid auth token
- localStorage unavailable/corrupt
- empty input
- maximum-length input
- rapid repeated send
- invalid hash route
- account deletion failure
- backup failure
- page-level render error

Expected behavior: clear non-sensitive error/fallback, no secret leakage, no accidental local deletion, no duplicate send, and a usable recovery path.
