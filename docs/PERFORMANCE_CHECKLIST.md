# Performance Checklist

Before launch measure the deployed candidate:
- initial JS/CSS payload
- mobile load on constrained network
- chat interaction latency
- local history rendering with large bounded dataset
- Edge Function cold/warm latency
- provider timeout behavior
- duplicate/retry behavior

Optimize based on measurements; do not trade away safety/auth/privacy checks for benchmark scores.
