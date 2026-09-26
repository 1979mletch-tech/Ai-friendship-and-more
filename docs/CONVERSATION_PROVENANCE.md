# Conversation provenance

Every browser conversation is treated as either local or remote. Local means it has not been proven to exist in the authenticated account. Remote means it was created successfully through the server API or hydrated from that account.

A local identifier must never be sent directly to a server mutation merely because it exists in browser state. Before sending a message in server mode, a local conversation is first created remotely and the returned server identifier becomes authoritative. Local-only deletion does not issue a server delete.

Hydrated server conversations are marked remote. Legacy browser conversations migrate as local unless provenance was previously recorded. This prevents accidental ID assumptions and supports two-account isolation.
