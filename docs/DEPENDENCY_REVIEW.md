# Dependency Review

The automated quality gate installs the lockfile dependencies and builds the app. Before production also review:
- npm audit/security advisories
- runtime support policy
- abandoned/unnecessary packages
- lockfile integrity
- Edge Function import versions
- GitHub Action versions

Dependency review results must be dated and tied to an exact commit; this document does not claim a current vulnerability scan result.
