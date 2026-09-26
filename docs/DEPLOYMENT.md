# Deployment checklist

1. Configure a trusted HTTPS backend and set VITE_AUTH_MODE=server plus VITE_API_BASE_URL.
2. Keep AI-provider, database/admin and billing secret keys exclusively on the server.
3. Implement the API/data authorization contracts in docs/BACKEND_DATA_MODEL.md and docs/SECURITY_MODEL.md.
4. Run migrations with owner-scoped authorization enabled before exposing endpoints.
5. Run the two-account isolation matrix and critical-journey suite on staging.
6. Verify crisis/dependency/platonic input rules and generated-output backstop with the actual model.
7. Verify account deletion, memory deletion, conversation deletion and export against deployed storage.
8. Verify rate limits, session expiry, 401/429/5xx/offline behavior.
9. Record accessibility/mobile/desktop checks.
10. Only promote the exact tested commit after CI and release-gate evidence pass.
