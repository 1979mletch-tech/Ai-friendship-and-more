# Privacy-safe observability

Allowed examples: request ID, route template, HTTP status, duration bucket, deployment SHA, anonymous server error code.

Do not log: message text, approved memory values, project notes, passwords, bearer tokens, session cookies, authorization headers, AI provider secrets, Stripe secrets, raw exports.

Operational alerts should trigger on elevated 5xx, authentication failures, rate-limit saturation, webhook verification failures and authorization-denial anomalies without including private conversation content.

Crash reports must pass fields through diagnostic redaction before transmission. Production log retention and access must be documented and reviewed before launch.
