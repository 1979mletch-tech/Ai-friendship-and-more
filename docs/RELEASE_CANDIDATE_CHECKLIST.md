# Release candidate evidence checklist

For each candidate record the exact Git SHA, CI run URL, deployment identifier, environment name and test timestamp.

Automated gates must pass: clean install, high-severity dependency audit, lint, TypeScript, unit/regression suite, production build.

Staging evidence must cover authenticated registration/login/logout, companion profile persistence, server conversation create/send/reload/delete, cross-account ID denial, crisis/dependency/sexual pre-generation interception, generated-output policy, approved memory save/delete/clear, account export, conversation/memory deletion, account deletion, subscription status/checkout/portal in Stripe test mode, 401/429/5xx/offline/timeout behavior, mobile/tablet/desktop layout, keyboard-only use and 200% zoom.

Security evidence must confirm no password/token/chat/memory text in URLs or operational logs; no client secret variables; server ownership derives from authenticated identity; Stripe webhook entitlements are server-derived; destructive operations fail closed.

A candidate is not launch-ready merely because repository CI is green. Deployment and staging checks must reference the same exact SHA.
