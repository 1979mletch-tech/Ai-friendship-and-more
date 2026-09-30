# Admin Boundary

No broad admin dashboard is required for the current companion MVP.

If administrative tooling is later added:
- use explicit server-verified roles;
- minimize access to private conversation/memory content;
- audit privileged access;
- prevent client-side role elevation;
- test direct URLs/APIs as a non-admin;
- never use a service-role credential in browser code.

Operational convenience is not justification for unrestricted user-content access.
