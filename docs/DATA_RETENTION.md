# Data Retention Design

The application should minimize retained data.

- Local preview data remains until the user clears browser storage or uses deletion controls.
- Cloud conversations/memories remain until user deletion/account deletion or a future documented retention policy removes them.
- AI usage events contain user ID + timestamp only and should be periodically pruned after the operational rate-limit window.
- AI-provider retention is provider/configuration dependent and must be documented before production.
- Analytics must not contain conversation/memory text.
- Account deletion is designed to cascade owned database rows; staging verification is required.

Final retention periods are a production/legal configuration decision and are intentionally not invented in source documentation.
