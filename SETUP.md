# BTech Repair – Current Setup

## Supabase project

- Project ref: `mkdylncwtijbvishocse`
- Database: PostgreSQL 17
- `public.jobs` has RLS enabled.
- Authenticated users can read/insert/update/delete jobs according to the current RLS policies.

## Telegram notifications

The browser does **not** contain the Telegram bot token.

The app calls the Supabase Edge Function:

`/functions/v1/telegram-notify`

The function requires a valid Supabase JWT and reads these secrets only from Supabase Edge Function secrets:

- `TG_TOKEN`
- `TG_CHAT_IDS`

The function is already deployed with JWT verification enabled.

When the new Telegram token is available:

1. Open Supabase Dashboard → Edge Functions → `telegram-notify` → Secrets.
2. Add/update `TG_TOKEN`.
3. Add/update `TG_CHAT_IDS`.
4. Log into the app and create/update a test job.
5. Confirm the Telegram notification arrives.

Never paste the bot token into source code, GitHub files, or chat.

## GitHub Actions daily alert

The daily workflow runs at **10:00 AM Sri Lanka time** and reads:

- `SUPA_URL`
- `SUPA_SERVICE_KEY`
- `TG_TOKEN`
- `TG_CHAT_IDS`

from GitHub Actions Secrets.

The service-role key is never used by the browser.

## Database migrations

Schema/security changes are tracked in:

`supabase/migrations/`

Current production migrations include:

- `lock_down_rls_auto_enable`
- `sync_jobs_schema_and_rls`
- `add_jobs_integrity_constraints`
- `index_warranty_reference`
- `validate_job_values`
- `add_job_activity_audit_log`

The `warranty_of` field references the original job's `job_no` at the database level.

## Free-plan limitation

Supabase's HaveIBeenPwned leaked-password protection is currently unavailable on this Free plan. This is a plan limitation, not an application error.

## Frontend security notes

- Supabase anon/publishable key is safe to expose in browser code when RLS is correctly configured.
- Access/refresh session tokens are currently stored in browser localStorage because this is a static browser-only app.
- Logout now also performs a best-effort server-side Auth sign-out to revoke the refresh session.
- The service worker only caches same-origin application shell files; Supabase/API responses are not cached.

## Current app features

The dashboard now includes:

- customer/device history in the job details view,
- per-job activity timeline backed by public.job_activity,
- warranty tracking and linked warranty jobs,
- dashboard attention panels for delayed, unpaid, and warranty jobs,
- billed vs collected analytics and payment-method reporting,
- payment method capture on each job.

Warranty tracking links a repeat repair to the original job_no; no warranty duration is assumed by the system.
