# Exact Head Rule

Never call a candidate green because an earlier commit passed.

After every source/config/test change:
1. Record the new SHA.
2. Wait for the quality workflow on that SHA.
3. Repair every failure.
4. Require a successful exact-SHA run.
5. Deploy only that green SHA.
6. Verify the deployed site corresponds to that SHA before issuing a preview link.

Documentation-only changes still create a new head and therefore must be accounted for in evidence.
