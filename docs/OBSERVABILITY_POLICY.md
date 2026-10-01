# Observability Policy

Operational telemetry should be minimal and privacy-preserving.

Allowed examples: request success/failure counts, latency, anonymous build/version health, rate-limit counts.

Do not intentionally log: conversation text, memory text, passwords, bearer tokens, API keys, recovery tokens or full private exports.

Errors shown to users should be useful but non-sensitive. Server/provider diagnostic detail belongs in restricted operational systems, not browser output.
