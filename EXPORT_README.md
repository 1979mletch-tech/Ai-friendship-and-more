# AI Friendship project export

This archive contains the complete tracked project source, assets, configuration, tests, and documentation. No private credentials should be added to the archive.

## Install and run

Use Node.js 24 and npm. From the project directory:

```bash
npm ci
cp .env.example .env
npm run dev
```

Set only the public `VITE_*` values needed for your local setup in `.env`. Never put private AI-provider keys, service-role keys, passwords, or other secrets in `VITE_*` variables; Vite exposes them to browsers.

## Tests and production build

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Before production

Configure and verify the Supabase project, migrations, authentication, server-side AI provider secrets, age verification, billing/webhooks, and deployment environment. Complete the staging, privacy, security, accessibility, and mobile checks documented in `DEPLOYMENT.md` and `PRODUCTION_CHECKLIST.md`. The local build alone does not establish that these services are live or production-ready.
