# V1 completion matrix

This matrix separates repository completion from external production work.

| Area | Repository status | Production evidence required |
|---|---|---|
| Companion setup | Implemented | Deployed profile API owner-scope test |
| Platonic chat | Implemented | Actual provider/model staging test |
| Crisis/dependency/sexual safety | Implemented + unit tests | Actual model red-team |
| Conversation history | Local + authenticated contracts implemented | Deployed persistence/reload test |
| Approved memory | Local + authenticated contracts implemented | Deployed owner-isolation test |
| Privacy export/delete | Implemented contracts | Deployed deletion/export evidence |
| Authentication | Frontend/API contract implemented | Deployed auth provider/session tests |
| Authorization | Data model + attack matrix documented | Two-account live attack |
| Billing | Trusted API contract implemented | Stripe test-mode/webhook tests |
| Responsive/accessibility | CSS/criteria implemented | Device/keyboard/screen-reader checks |
| CI | Automated lint/typecheck/test/build | Exact candidate must be green |
| Operations | Runbooks/gates implemented | Hosting, monitoring, rollback exercise |

A repository-green result is not equivalent to public-launch readiness. Production readiness requires the right-hand evidence against the exact deployed candidate.
