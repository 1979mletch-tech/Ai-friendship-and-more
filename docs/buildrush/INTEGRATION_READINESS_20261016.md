# BuildRush staging integration findings — 2026-10-16

## Verification performed (read-only)
- GitHub Actions run 38889408049 on staging commit 6bb6554df76c692240368d3336998486b269fbd4 completed with conclusion **success**. This is repository CI, not end-to-end verification of the two commercial sites.
- Connected Supabase project smsewzcyrqxiamqepffz is ACTIVE_HEALTHY but has **zero public tables named buildrush_%** in information_schema, and none of its seven deployed edge functions is named buildrush-customer-ai, buildrush-owner-ai or buildrush-archive. Existing functions relate to Aurora (chat, speak, billing etc). **Do not deploy BuildRush into this project based on name alone.**
- Other connected Supabase project wmosmryjcbmmoitqpmrf reported INACTIVE; not inspected further.
- Original Base44 BuildRush application 6ac129b13c8f63e1f265f186 has real site pages and one owner-only assistant component (Ruth / business_admin), plus a separate materials exchange change still unpublished. Base44 BuildRush Sync 6ac8443082f543d3b0166127 is a smaller auth-shell. Do not replace the original with Sync or its copies.
- GitHub source includes public AI, owner AI, owner HQ and monthly archiving, but deploying code into the user's existing independent Base44 company has not been proven.
- Sister company is said to be independently live with its own domain, temporarily hosted under a Wellbeing Hub site. Exact sister domain, application ID, API/data permissions and approved handoff semantics are **NOT VERIFIED**.
- Potentially exposed Stripe secret remains **UNRESOLVED**. The user has confirmed test-to-live payments work; avoid altering functioning Stripe settings or publishing any key value. Identify precise affected secret type and deployments before planned rotation.

## Blockers before any release
1. Confirm actual main and sister domain ownership, hosting and integration targets.
2. Identify whether existing Base44 admin AI overlaps the proposed new owner AI and whether the public price-guidance assistant already exists.
3. Obtain read-only runtime evidence for real role isolation, memory persistence and AI model connectivity.
4. Verify job handoff API contracts, allowed transferred personal data, transfer-once semantics, rollback.
5. Resolve exposed Stripe credential safely, preserving live payment operation.
6. Security-staging tests with synthetic accounts; do not run aggressive tests against production.
7. Owner approval to activate scheduled monthly audits, deployment, or any credential rotation.

## Security posture
Do not claim the entire business is secure because CI passes. This branch has *pure handoff eligibility rules and test coverage*, not a live transfer adapter or a deployed guardian. Security scanning must be evidence-led; mark unreachable sources NOT VERIFIED. Production remains untouched.
