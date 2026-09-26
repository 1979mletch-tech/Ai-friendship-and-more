# No-Secrets Policy

Never commit or paste:
- AI provider private keys
- Supabase service-role keys
- Stripe secret/webhook signing keys
- passwords or session tokens
- production credentials

VITE variables are browser-visible. Only public values belong there.

If a secret is exposed, rotate it; deleting it from a later commit is not sufficient remediation.
