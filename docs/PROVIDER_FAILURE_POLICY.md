# Provider Failure Policy

When live AI is unavailable:
- do not fabricate a successful live-provider response;
- show a clear fallback/unavailable status;
- do not expose provider diagnostics/secrets;
- preserve the user's local data;
- prevent rapid duplicate paid retries;
- allow safe retry after recovery.

Safety-critical immediate-risk copy should not depend solely on the remote AI provider.
