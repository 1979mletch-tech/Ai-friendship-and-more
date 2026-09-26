# Mutation idempotency requirements

Production backend mutation endpoints should accept an opaque idempotency key scoped to the authenticated user and operation. At minimum cover conversation creation, message append, memory creation, checkout-session creation and account/data deletion jobs where retries can occur across network boundaries.

The server must persist the first completed result for the key, return the same semantic result for a duplicate key, reject reuse with a different request payload, expire keys under a documented retention window, and never derive ownership from a client-supplied user id.

Client automatic retries remain disabled for mutations until endpoint-specific idempotency is verified in staging.
