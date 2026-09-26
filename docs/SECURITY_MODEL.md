# AI Friendship V1 — server security contract

The browser application must never be treated as an authorization boundary.

## Required backend rules

- Authenticate every protected request server-side.
- Derive the user ID from the verified session/token; never trust a user ID supplied by the browser.
- Scope conversations, messages, memories, profile data and subscription entitlements to that verified user ID.
- Reject cross-user object access even when a valid object ID is guessed or supplied directly.
- Keep AI-provider, database service-role and billing secret keys server-side.
- Rate-limit login, registration and companion endpoints.
- Hash passwords with a modern password hashing function when passwords are owned by this service, or delegate authentication to a reputable identity provider.
- Rotate/revoke sessions on password reset and account deletion.
- Account deletion must delete or irreversibly detach user-owned conversations and memories according to the published retention policy.
- Do not place conversation content, memory text, passwords or access tokens in analytics events or URLs.

## Required API surface

POST /auth/register
POST /auth/login
POST /auth/logout
DELETE /account
POST /companion/reply

The companion endpoint must run the safety policy before normal AI generation and must not allow a model response to override crisis, dependency or platonic-boundary handling.

## Data isolation acceptance test

Create synthetic users A and B. Create conversations and memories for both. With A authenticated, attempt to read/update/delete B's object IDs through every endpoint. Every attempt must fail without revealing B's content. Repeat B against A.

This repository currently contains the frontend/API contract, not a deployed backend. Do not label two-account isolation as verified until those live server tests pass.
