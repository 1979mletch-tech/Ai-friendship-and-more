# Authentication storage boundary

The browser currently stores the authenticated session required by the configured API contract. Persisted values are treated as untrusted input and must match the expected session shape before use.

For production, prefer secure HttpOnly SameSite cookies or an equivalent architecture that keeps long-lived credentials inaccessible to application JavaScript. If bearer tokens remain necessary, use short lifetimes, server revocation, narrow scope, rotation where appropriate and a documented XSS threat model. Never place credentials in URLs, analytics, diagnostics, exports or client logs.

A green frontend CI run does not verify production token issuance, cookie flags, revocation or session expiry. Those require deployed backend evidence.
