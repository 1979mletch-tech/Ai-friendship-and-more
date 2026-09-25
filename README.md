# AI Friendship V1

A warm AI companion product prototype built with Next.js, TypeScript, and Tailwind CSS.

Positioning:
- Friendly AI companion always ready to talk
- Clearly AI (not a human, not a therapist)
- Not a substitute for professional care

## Features in this V1

- Landing page with topic starters and disclosure footer
- Account entry screen with Supabase-ready auth wiring
- Companion setup (name, personality, preferences)
- Chat experience with:
  - message history
  - suggested prompts
  - loading/typing state
  - empty/error states
  - OpenAI-backed API route
  - honest demo mode when `OPENAI_API_KEY` is missing
- Memory management (non-sensitive preferences/interests)
- Conversation history (continue/delete/clear)
- Settings/profile controls
- Privacy Centre with local data deletion controls
- Safety screen and initial crisis-language handling

## Tech stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Supabase JS client integration points

## Environment variables

Copy `.env.example` to `.env.local` and fill values as needed.

Required for Supabase auth integration:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Required for live OpenAI responses:
- `OPENAI_API_KEY`

Optional:
- `OPENAI_MODEL` (default `gpt-4o-mini`)
- `NEXT_PUBLIC_COMPANION_NAME`

## Demo mode behavior

If `OPENAI_API_KEY` is not set:
- Chat still works in demo mode
- Responses are explicitly labeled as demo
- The app does **not** pretend a live model was used

If Supabase env vars are not set:
- Account form remains functional
- Sign-in shows a clear configuration message instead of fake success

## Supabase setup expectations

This repo includes client wiring via `@supabase/supabase-js` and environment-based initialization.
For production auth and persistence, configure:
- Supabase Auth providers
- Row-level security policies
- Database tables and migrations

Current persistence fallback is local browser storage to keep local development usable without credentials.

## Safety limitations

This includes an initial safety handling layer for language indicating immediate danger/self-harm/harm to others.
Responses provide calm direction to emergency services and crisis hotlines.

⚠️ Safety language, triggers, and escalation logic are initial implementation only and require professional review before production launch.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Scripts

```bash
npm run lint
npm run typecheck
npm run build
npm run test
```

## Notes

- Local data stored by default: companion profile, memory, conversation history
- Privacy Centre provides controls to delete memory/history/all local data
- No fake testimonials, fake user counts, or unsupported clinical claims are included
