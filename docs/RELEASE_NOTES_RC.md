# Release candidate notes

Stage: **release candidate preparation — not deployed, not launch-approved.**

## Material changes in this candidate
- Reconciled `main` with `feature/aurora-places-explorer` (Places Explorer, comfort controls, expressive/distress-aware voice presets, Quest WebXR room shell with XR framebuffer + stereo viewports + local-floor/local fallback, optional hand-tracking request).
- Fixed CI failure: unused `xrStatus` state in `src/App.tsx` (duplicate WebXR detection; detection now lives only in `getVrCapabilities`).
- Fixed VR capability API naming inconsistency: the field is `handTrackingRequestable` (meaning it can be *requested*, never that hand tracking is confirmed); test updated.

## Status labels
| Item | Status |
| --- | --- |
| Typecheck, lint (warnings only), unit tests (310), production build | VERIFIED in CI-equivalent local run |
| Server-side owner/auth/billing/delete functions (`supabase/functions/*`) | Present; live behaviour NOT VERIFIED |
| Two-account isolation against a live backend | NOT VERIFIED (`npm run test:staging:isolation` needs staging) |
| Stripe test-mode checkout/webhooks end to end | NOT VERIFIED |
| Phone / desktop manual smoke tests | NOT VERIFIED |
| Quest 3S physical test, hand tracking, spatial audio | NOT VERIFIED |
| Approved photorealistic Aurora model | NOT PRESENT — see `ASSET_PROVENANCE.md` |

## Remaining gaps
Approved 3D asset, lip-sync/visemes in 3D, spatial audio, consent-led gesture animation in VR, live-backend verification, manual device tests.

## Migration / rollback
No new database migrations in this candidate. Existing migrations are in `supabase/migrations/`; see `docs/ROLLBACK.md` and `docs/DATA_MIGRATION_POLICY.md`.
