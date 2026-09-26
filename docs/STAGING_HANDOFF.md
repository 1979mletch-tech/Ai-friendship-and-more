# Staging Handoff

Handoff inputs: exact candidate SHA, migration list, Edge Function list, public environment variable names, server secret names, synthetic-account policy, test matrices and rollback reference.

Do not include secret values in the handoff document.

## Project selected for staging

Project URL: `https://smsewzcyrqxiamqepffz.supabase.co` (project ref `smsewzcyrqxiamqepffz`). The URL identifies the project; it does not establish dashboard access, apply migrations, or deploy functions. Confirm this is a dedicated test project before applying SQL.

Apply the migrations in filename order from `supabase/migrations/`. Deploy `chat` and `delete-account` from `supabase/functions/` only after reviewing their required secrets and CORS origin in `supabase/functions/README.md`. Configure the browser's `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from this staging project through the preview deployment's environment settings. Do not commit keys, passwords, or provider credentials.

Create two disposable email-confirmed accounts in the staging project. Run `npm run test:staging:isolation` with `STAGING_SUPABASE_URL` set to the project URL, `STAGING_EXPECTED_HOST=smsewzcyrqxiamqepffz.supabase.co`, the project's public anon key as `STAGING_SUPABASE_ANON_KEY`, and credentials in `STAGING_TEST_EMAIL_A`, `STAGING_TEST_PASSWORD_A`, `STAGING_TEST_EMAIL_B`, and `STAGING_TEST_PASSWORD_B`. Supply these through a private environment, never a committed file or chat. The script uses synthetic fixtures, checks anonymous and cross-account isolation for conversations, memories, and profiles, and removes only fixtures it created. A pre-existing profile is read and checked without changing it.

Record the deployed commit, migration results, function versions, test output, and time in `docs/DEPLOYMENT_EVIDENCE.md`. Live AI remains blocked until a trusted process sets `app_metadata.adult_verified` for test accounts and the provider secret is configured. Do not mistake local test success for a live staging pass.
