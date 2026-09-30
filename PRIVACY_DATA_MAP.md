# AI Friendship Privacy Data Map

## Browser/local preview data
- consent acknowledgement
- selected preview plan
- conversation messages
- approved memory items
- creative project notes
- companion display name
- authenticated session envelope when cloud auth is configured

Browser storage is not a secure vault. Private provider keys are prohibited.

## Cloud account data (when configured)
- Supabase Auth: account identifier/email/session infrastructure
- conversations: user-owned conversation JSON
- memories: user-approved memory
- profiles: companion preferences
- ai_usage_events: user ID + timestamp only; no message text

RLS policies scope application rows to auth.uid().

## AI provider
The authenticated Edge Function sends the recent bounded conversation needed to generate a reply. Production deployment must document the chosen provider's retention/training/DPA configuration before launch.

## Analytics
The repository does not intentionally send conversation or memory text to an analytics service. Any future analytics integration must keep private conversation/memory content out of events, URLs, logs and error metadata.

## User controls
Local history/memory can be cleared. JSON export is provided for locally held user data. Cloud account deletion uses an authenticated server function and should be live-tested before production claims are made.
