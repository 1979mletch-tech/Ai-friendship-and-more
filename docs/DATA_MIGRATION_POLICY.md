# Data Migration Policy

Persisted browser/cloud data structures must evolve deliberately.

- exports carry an explicit schema version before restore is enabled;
- migrations should be additive where possible;
- destructive schema changes require backup/rollback planning;
- old clients must fail safely rather than silently corrupt data;
- cloud migrations are reviewed in staging first;
- ownership/user_id constraints must never be weakened during migration.

No automatic destructive migration should run merely to make a demo pass.
