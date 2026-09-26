# Manual V1 smoke test

Run on the exact release candidate SHA after automated CI passes.

1. Open home on narrow mobile, tablet and desktop widths.
2. Complete companion setup and reload.
3. Start two conversations; verify each restores only its own messages.
4. Trigger crisis, dependency and sexual-boundary cases; verify safety response precedes normal generation.
5. Save, remove and clear approved memories.
6. Export data and inspect that expected conversations/memories are present and credentials are absent.
7. Register/sign in/sign out using deployed auth.
8. Repeat conversation/memory operations under two synthetic accounts and attempt cross-account IDs.
9. Simulate offline, slow, 401, 429 and 5xx responses; verify honest recoverable UI.
10. Exercise account deletion and confirm sessions/data behave according to deployed retention policy.
11. Keyboard through all controls; verify visible focus and no trap.
12. At 200% zoom, verify chat/history/settings remain usable.
13. Test Stripe checkout/portal only in test mode until production approval.
14. Verify no secrets or health/relationship conversation text appears in browser URLs or analytics.
15. Record deployment ID, SHA, timestamp and results in LAUNCH_EVIDENCE_TEMPLATE.md.
