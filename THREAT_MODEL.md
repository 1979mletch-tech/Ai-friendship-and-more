# Threat Model — AI Friendship

Protected assets: user account, conversation content, approved memory, AI-provider key, database credentials, billing state.

Primary trust boundaries:
1. Browser ↔ authentication provider.
2. Browser ↔ database REST API protected by user JWT + RLS.
3. Browser ↔ authenticated AI Edge Function.
4. Edge Function ↔ AI provider.
5. Billing client ↔ future trusted webhook/entitlement service.

Key threats and controls:
- **IDOR/cross-user data:** user_id foreign keys + RLS; requires live two-account verification.
- **AI-key theft:** private key only in Edge Function secret store; never VITE/browser.
- **Prompt injection:** system identity/secret rules + browser defense-in-depth refusal; adversarial testing still required.
- **Dependency manipulation:** assistant instructed not to promote exclusivity, isolation, guilt or replacement of human relationships.
- **Paid endpoint abuse:** authenticated requests, bounded history/content, per-user request counter; production quotas should be tuned and monitored.
- **Sensitive logging:** usage counter stores user id + timestamp only, not message text.
- **Account deletion:** authenticated Edge Function deletes the authenticated auth user; FK cascades remove owned cloud rows.
- **Client compromise:** localStorage is not a secure secret vault. Do not store provider secrets there.
- **Billing spoofing:** client-selected plan is not a trusted entitlement. Paid access must later come from verified server webhook state.
