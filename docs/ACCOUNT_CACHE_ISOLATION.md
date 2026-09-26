# Account cache isolation

Authenticated account data must never be treated as a single device-global cache. Conversation history, approved memories, companion profile and active conversation state are account-scoped.

On sign-out the UI clears account-derived data immediately after the local session is removed. On a change from authenticated user A to authenticated user B, prior account-derived UI state is cleared before B's hydration result is applied. A failed B hydration must not reveal A data.

Production persistence should use per-user cache namespaces or avoid durable browser caching of server-owned content entirely. Staging must exercise A sign-in -> hydrate -> sign-out -> B sign-in with B offline and confirm no A conversation, memory, profile or project content is visible.
