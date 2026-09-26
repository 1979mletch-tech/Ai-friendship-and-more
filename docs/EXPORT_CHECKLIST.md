# Complete Project Export Checklist

When packaging AI Friendship:
- source, components, utilities and styles
- package.json + lockfile
- Vite/TypeScript config
- tests
- Supabase migrations/functions/config
- documentation
- .env.example only, never .env secrets
- README install/run/test instructions
- production checklist and known limitations

Exclude node_modules, build output, caches, tokens, passwords and private keys. Verify the exported source builds independently before calling the ZIP complete.
