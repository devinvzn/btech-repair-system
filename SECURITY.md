# Security Policy

## Current security controls

- Supabase Row Level Security is enabled on `public.jobs`.
- Anonymous users do not have job-table RLS policies.
- The broad duplicate `Allow logged in users` policy was removed.
- `public.rls_auto_enable()` is no longer directly executable by `PUBLIC`, `anon`, or `authenticated`.
- Telegram credentials are kept outside frontend source code.
- The Telegram Edge Function requires a valid Supabase JWT.
- GitHub Actions secrets are used for the daily service-role database job.
- Warranty references are enforced by a database foreign key.
- Job numbers are enforced as unique when present.
- User-provided text rendered into HTML is escaped in the frontend and Telegram messages.

## Reporting a vulnerability

Please do not publish credentials, tokens, or exploit details in a public issue.

Open a private security report through the repository's GitHub security/contact mechanism and include:

- affected page or endpoint,
- steps to reproduce,
- expected vs actual behavior,
- security impact,
- and any relevant screenshots or logs with secrets removed.

Never include passwords, Supabase service-role keys, Telegram bot tokens, or refresh tokens in a report.
