# Backup / Restore Design

Current export provides a local JSON portability artifact. Restore is intentionally not wired directly into storage until strict schema/version validation, conflict handling and user confirmation are implemented.

A future restore flow must:
- validate product + schema version;
- bound message/memory/note sizes;
- reject executable/HTML content as markup;
- preview counts before import;
- never overwrite cloud data silently;
- keep cross-account ownership server-controlled.

Export capability does not imply cloud backup completeness.
