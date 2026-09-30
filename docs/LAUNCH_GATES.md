# Launch Gates

A release candidate requires:
- exact-SHA CI green
- no committed secrets
- staging deployment identified
- auth E2E pass
- two-account RLS isolation pass
- live AI auth/validation/rate-limit pass
- account deletion pass
- safety/adversarial regression pass
- privacy/data-flow review
- mobile/accessibility review
- failure-recovery pass
- billing either disabled/preview-labelled or fully server-verified
- final human review

Any failed critical gate blocks production release until repaired and re-tested.
