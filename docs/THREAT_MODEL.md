# AI Friendship V1 threat model

## Protected assets
Account identity/session, conversation content, user-approved memories, companion profile, subscription state and provider secrets.

## Primary threats and controls
- Cross-account IDOR: server derives owner from verified session; deny guessed foreign IDs; two-user adversarial tests required.
- Credential/session theft: HTTPS, secure server session handling, no tokens/passwords in URLs or analytics, revocation on reset/deletion.
- Prompt injection/jailbreak: deterministic input safety before generation plus output-policy backstop after generation.
- Emotional dependency: no exclusivity, human impersonation or isolation encouragement.
- Sexualization: platonic product boundary enforced independently of normal companion generation.
- Data overcollection: explicit memory controls, bounded memory fields, deletion/export, minimal audit metadata.
- Abuse/cost exhaustion: trusted server rate limiting; browser limits are UX only.
- Secret exposure: AI/database/billing secret keys remain server-side.

## Release blockers
Do not claim production security until deployed auth, authorization, deletion, rate limits and two-account isolation have been attacked in staging and evidence recorded.
