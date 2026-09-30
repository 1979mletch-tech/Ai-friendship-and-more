# Preview Failure Playbook

If preview CI/deployment is red:

1. Freeze feature additions.
2. Identify the exact failing workflow, job and step.
3. Reproduce from the exact branch SHA when possible.
4. Fix the smallest root cause; do not hide errors by weakening tests.
5. Re-run lint, typecheck, tests and build.
6. Re-run deployment.
7. Verify the deployed bundle corresponds to the repaired SHA.
8. Resume live verification only after green.

If the preview loads but a cloud feature fails, keep local fallback available, label the cloud feature NOT VERIFIED, and inspect configuration/CORS/auth/RLS before changing product behavior.
