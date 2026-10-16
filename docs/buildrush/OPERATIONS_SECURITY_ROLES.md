# BuildRush operations and security — staging contract (16 Oct 2026)
This document is a proposal on a GitHub staging branch; it does not activate agents, grant permissions, or alter either live business.

## Non-negotiable commercial rules
- Main site: thebuildrush.com; customers offer their own fixed price for an urgent job, with a 48-hour target (not a guarantee). No quotes, bidding-up at the door, or hidden extras.
- Customer can increase the public offer to attract faster interest. The tradesperson accepts and contacts the customer to arrange attendance. Never promise a slot.
- If a job is not completed within 48 hours, it becomes eligible for handoff to the existing sister company's longer-duration marketplace. Keep records, user permissions, domain, and billing separate. Never silently duplicate a paid job or transfer payment credentials.
- The customer/trades AI's price advice is only an indicative ballpark; no binding estimate.
- Job payments stay directly between customer and tradesperson, not BuildRush-held escrow.

## Three narrowly scoped roles
1. Customer/Trades AI — public, least privilege. Job-intake explanations; optional contextual UK ballpark price guidance, clear uncertainties; assist in browsing legitimate offers; handle questions without leaking another account's history. Read only public job details and authenticated user's own records. Cannot change prices, pay fees, approve jobs, access administrative data, or promise availability.
2. Owner/Admin AI — owner-authenticated, server-role-verified, strict per-operation authorization. Read real authorized jobs, subscriptions, payment summaries, monthly archive and sister-company transfer summaries; prepare proposed actions and require explicit owner confirmation. Never claim a proposed action was executed; every performed action needs actual server result and audit log. It cross-checks the other two reports.
3. Security Guardian — NOT an unconstrained AI operator. Read-only, server-generated security health summaries: authentication failure trends, role-policy drift, unexpected config/secret exposure, audit-log integrity, dependencies, webhook verification state, backup/restore evidence, site uptime. **No API keys in model context; no admin write permissions; no raw personal-data dumps; no testing live systems aggressively.** Any credential rotation requires separate human-led change window.

## First-of-month review
Run on the 1st monthly, with a report per role and an owner-level consolidation. The owner chooses or approves a schedule in the actual production scheduler; this branch alone does not schedule work.
- Security report: configuration checks, alerts since last period, unresolved findings, verification evidence and severity.
- Trades report: main site's 48-hour throughput, jobs waiting, customer/trades cases and sister-site handoff reconciliation; don't equate 48-hour expiry with completed job.
- Admin report: real job volumes and exceptions, subscriptions/fees, reconciled financial reports, assistant status, open cases, and verification of both other reports.
- Archive routine completed-month summaries, retain core business policy, approved AI identities, owner preferences, active jobs, ongoing incidents and historical audit trail. No deletion of original records just because a new month begins.
- Report PASS / FAIL / NOT VERIFIED for each independent check; never fabricate counts, scans or evidence.

## Release gates — BLOCKED until verified
- Validate which original Base44 app is the live domain target, and document sister company's real domain and API contract.
- Confirm existing public customer assistant and new owner assistant are not duplicates; verify server-side role isolation and encrypted durable memory.
- Confirm Stripe active live transactions remain untouched; investigate exposed secret safely, rotate in an owner-approved window and verify without disclosing its value.
- Exercise two test accounts and owner account in isolated staging; check authorization, job handoff idempotency, expiry, and failure rollback.
- Preserve the live production system, existing jobs, customers and other companies. Owner must approve deploy and any Stripe changes.
