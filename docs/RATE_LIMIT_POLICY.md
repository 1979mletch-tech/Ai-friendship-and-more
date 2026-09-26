# Rate Limit Policy

The Edge Function includes an authenticated per-user short-window request counter as an abuse-control foundation. It stores user ID + timestamp, not message text.

Before production:
- load-test the chosen thresholds;
- add longer-window/cost quotas if needed;
- prune old usage events;
- ensure retries do not accidentally multiply paid calls;
- distinguish 429 UX from provider outage;
- monitor aggregate abuse without logging private prompts.

Current threshold values are implementation defaults, not a final commercial allowance.
