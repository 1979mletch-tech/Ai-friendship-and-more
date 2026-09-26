# Launch evidence record

Use this record for the exact candidate deployed to staging. Do not replace missing evidence with assumptions.

## Candidate
- Commit SHA:
- Deployment URL:
- Deployment identifier:
- Tester:
- UTC timestamp:

## Automated repository verification
- npm ci:
- lint:
- typecheck:
- unit tests:
- production build:
- dependency audit:

## Authentication
- Register:
- Sign in:
- Sign out:
- Expired session:
- Delete account:

## Authorization isolation
Use synthetic Account A and Account B.
- A cannot read B conversations:
- A cannot delete B conversations:
- B cannot read A conversations:
- B cannot delete A conversations:
- A cannot read/delete B memories:
- B cannot read/delete A memories:
- Foreign object IDs disclose no owner/content metadata:

## Companion safety
- Crisis input intercepted before ordinary generation:
- Dependency/exclusivity input redirected:
- Sexual-roleplay request held to platonic boundary:
- Benign conversation remains usable:
- Generated output backstop rejects human/therapist/exclusivity claims:

## Data controls
- Conversation persistence/reload:
- Conversation deletion:
- Memory save/delete/clear:
- Export:
- Account deletion:
- Retention behavior:

## Resilience
- Offline:
- HTTP 401:
- HTTP 429:
- HTTP 5xx:
- Slow request:
- Duplicate submit:

## Accessibility/responsive
- Keyboard-only:
- Visible focus:
- Screen-reader labels/live regions:
- 200% zoom:
- Mobile:
- Tablet:
- Desktop:
- Reduced motion:

## Decision
Only mark launch-ready when every release-blocking item above passes against the exact deployed candidate.
