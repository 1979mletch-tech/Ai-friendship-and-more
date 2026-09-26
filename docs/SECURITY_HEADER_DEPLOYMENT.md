# Security Header Deployment

The client now records the baseline header policy expected from production hosting. Static GitHub Pages preview hosting may not permit all application-defined response headers.

Before production, verify response headers live: X-Content-Type-Options, Referrer-Policy, Permissions-Policy and Cross-Origin-Opener-Policy. Add CSP only after enumerating required Supabase/API origins and testing the deployed app; do not ship a guessed CSP that breaks auth or chat.
