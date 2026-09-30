# Configuration Validation

At deployment startup/review verify required public values are present for enabled features. Disabled external features should fail clearly rather than silently pretending to be live.

Server functions independently require their own secret configuration. Never infer that because the browser has a Supabase URL, the AI provider/account deletion functions are correctly configured.
