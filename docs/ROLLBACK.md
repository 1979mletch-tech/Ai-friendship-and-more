# Rollback Procedure

Before release record the last known-good commit/deployment.

If critical regression occurs:
1. stop new release traffic or restore prior deployment;
2. do not roll database schema backward blindly;
3. assess whether migration is backward-compatible;
4. rotate credentials if exposure is suspected;
5. repair on a branch;
6. run exact-SHA quality and staging gates;
7. redeploy and document incident.

Rollback planning must include both frontend and backend/schema compatibility.
