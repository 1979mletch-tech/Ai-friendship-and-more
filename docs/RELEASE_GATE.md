# Release gate

A candidate can move from draft review only when:

- lint, typecheck, unit tests and production build pass on the candidate SHA;
- no committed secrets are found;
- account register/login/logout/delete works against the configured backend;
- two synthetic accounts cannot access each other's conversations or memories;
- crisis, dependency and platonic-boundary tests pass before and after model generation;
- conversation create/select/delete survives reload as designed;
- memory save/forget/export/delete behaves as documented;
- 401/429/5xx/offline states are understandable and do not corrupt data;
- keyboard/mobile/accessibility acceptance checks are recorded;
- privacy/retention text matches actual deployed behavior.

Any failed security, safety, authorization or deletion check blocks launch. Record evidence against the exact commit and deployment.
