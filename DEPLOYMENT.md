# AI Friendship Deployment Guide

## 1. Front end

Deploy the Vite application to an HTTPS static host. Configure only public browser values:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_CHAT_API_URL`
- optional Stripe publishable key / public price IDs

Never expose `OPENAI_API_KEY`, a Stripe secret key, or `SUPABASE_SERVICE_ROLE_KEY` as `VITE_*`.

## 2. Supabase

Create a dedicated project, then review and apply migrations in timestamp order. Verify RLS is enabled before using real accounts.

Deploy Edge Functions:
- `chat`
- `delete-account`

Server/Edge secrets:
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `SUPABASE_SERVICE_ROLE_KEY` (delete-account only)
- `ALLOWED_ORIGIN`

## 3. Authentication

Configure allowed site/redirect URLs for the deployed HTTPS origin. Decide whether email confirmation is required. Test sign-up, confirmation, sign-in, sign-out, password recovery, expired sessions and account deletion.

## 4. Mandatory two-account test

Create two synthetic accounts A and B. Each creates conversations and memories. Verify A cannot list/read/update/delete B rows and B cannot list/read/update/delete A rows, including direct-ID REST requests. Record evidence. Code inspection alone is not enough.

## 5. AI test

Verify unauthenticated chat is rejected, malformed JSON is rejected, message count/length is bounded, rate limiting returns 429, provider failures do not expose secrets, and the system prompt preserves AI identity and dependency safeguards.

## 6. Release gate

Run `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`. Then perform browser/mobile E2E testing on the exact deployed commit.
