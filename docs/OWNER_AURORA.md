# Owner Aurora

Owner Aurora is a private owner-only workspace layered on the existing AI Friendship application.

## Security boundary

- The browser never decides whether someone is an owner.
- `owner-aurora` authenticates the Supabase bearer session and requires trusted `app_metadata.owner_aurora === true`.
- The same account must have trusted `app_metadata.adult_verified === true`.
- Owner Aurora does not query customer conversations, memories, billing rows, or other customer private data.
- Private owner notes and chat are account-scoped browser data and are only sent as bounded context when the owner explicitly uses Owner Aurora.
- Saved owner notes are treated as untrusted context, never system instructions.

## Activation

1. Create/sign in to the real owner account in production.
2. Complete the normal server-side adult verification flow.
3. Confirm the exact production account ID.
4. Set `owner_aurora: true` in that user's trusted Supabase `app_metadata` using an administrative/server-side action.
5. Refresh/sign in again so the session and Owner Aurora status are current.

Do not grant owner access based on email text in the browser, local storage, `user_metadata`, query strings, or client-side flags.

## Launch readiness panel

Owner Aurora returns only booleans for these project-wide configuration gates:

- Real AI provider configured
- Aurora speech provider configured
- Live Stripe billing enabled
- Stripe webhook signing secret configured
- Live adult-verification dependencies configured
- Application return URL matches the allowed production origin

No secret values are returned to the browser.

## Private workspace controls

The owner can export or clear Owner Aurora browser data independently of customer-facing AI Friendship data.


## Multi-project control centre

- AI Friendship is the current project in this workspace.
- AI Doctor may be listed as the next project for planning, but its repository/deployment state is **not** treated as verified until that project is separately connected and checked.
- The browser accepts only the fixed project IDs supported by the application, deduplicates them, bounds text fields, and stores the registry under the signed-in owner's account-scoped browser key.
- Project registry entries sent to Owner Aurora are untrusted planning context. They are not evidence of CI, deployment, billing, database, or live-service state.
- Owner Aurora must not turn a registry label into a claim that a separate project is connected or healthy.
