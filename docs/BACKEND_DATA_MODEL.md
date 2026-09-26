# Backend data model and authorization contract

## users
Identity is owned by the authentication provider. Application tables reference the verified authenticated subject.

## companion_profiles
- user_id: unique owner key
- display_name: max 30
- tone: warm | calm | upbeat
- interests: max 300
- updated_at

## conversations
- id: opaque server-generated ID
- user_id: owner key
- title: max 80
- created_at / updated_at

## messages
- id: opaque server-generated ID
- conversation_id
- user_id: denormalized owner key for authorization defense-in-depth
- role: user | assistant
- text
- created_at

## memories
- id: opaque server-generated ID
- user_id: owner key
- label: max 60
- value: max 500
- created_at

## authorization invariants
Every SELECT/INSERT/UPDATE/DELETE is constrained to authenticated user_id. Client-supplied user_id is ignored/rejected. Conversation message writes additionally verify the parent conversation belongs to the same authenticated user. Bulk deletion is scoped to the authenticated owner. Admin/service credentials are never exposed to the browser.

## deletion
DELETE /account removes or irreversibly detaches profile, conversations/messages, memories, sessions and application-owned account metadata according to the published retention policy.
