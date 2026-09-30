# Network Test Matrix

Test:
- offline before load
- offline during send
- slow response
- request timeout
- 401/403/429/500/502/503
- database REST failure
- recovery after network returns
- repeated tap/send under latency

Expected: no duplicate uncontrolled requests, useful non-sensitive status, local data preserved and retry path available.
