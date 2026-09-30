# Secure Headers Deployment Notes

Configure the production host for appropriate security headers, including HTTPS/HSTS after domain validation, content-type protections, referrer policy and a reviewed Content Security Policy compatible with the chosen Supabase/AI/billing endpoints.

Do not copy a generic CSP blindly: test the exact deployed application and restrict origins to those actually required.
