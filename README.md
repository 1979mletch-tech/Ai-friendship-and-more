# AI Doctor

AI Doctor is a mobile-first symptom-support web application focused on helping people understand symptoms, recognise when urgent care may be needed, and prepare for appropriate professional medical support.

## Product positioning

**AI Doctor**

**Understand your symptoms. Know what to do next.**

AI Doctor provides AI-powered health information and symptom guidance. It is **not** a doctor, **not** an emergency service, and **not** a replacement for professional medical care.

## What is included in this build

- Public website pages for Home, How It Works, About, Safety, Privacy, Terms, Contact, FAQ, Sign In, and Create Account
- Structured symptom intake with progressive questions
- Safety-focused response sections:
  - What you told me
  - What it could mean
  - What you can do now
  - When to seek medical help
  - Questions to ask a healthcare professional
  - Important safety warnings
- Emergency escalation messaging with UK-aware guidance and international-safe fallback wording
- Healthcare Visit Summary generation with copy/export support
- Local dashboard with recent consultations, summaries, and feedback capture
- Local account, sign-in, sign-out, forgot password, reset password, and account deletion flows stored in the browser
- Privacy settings, accessible text size controls, and on-device data deletion
- SEO basics including title, meta description, Open Graph tags, robots, sitemap, and favicon

## Important limitations

This repository currently contains a frontend-only Vite React application.

Before any real public launch, the following still require production implementation and human review:

- Server-side authentication and password recovery
- Secure backend storage with role-based access control
- Real AI provider integration with server-side secrets
- Admin dashboard with minimum-necessary access
- Production analytics implementation that avoids sending raw health text
- Jurisdiction-specific legal, privacy, clinical safety, and compliance review
- Security review of hosting, logs, infrastructure, and third-party services

## Local development

```bash
npm install
npm run dev
```

## Quality checks

```bash
npm run lint
npm run typecheck
npm run build
npm run test
```

## Environment

Copy `.env.example` to `.env` only if you need runtime variables.

Never commit secrets.
