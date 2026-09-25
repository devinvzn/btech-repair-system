-- Sync the existing production jobs schema/security into version-controlled migrations.
-- Affected table: public.jobs
-- This migration is intentionally idempotent because these changes already exist in production.

alter table public.jobs enable row level security;

drop policy if exists "Allow logged in users" on public.jobs;
drop policy if exists "auth_select_jobs" on public.jobs;
drop policy if exists "auth_insert_jobs" on public.jobs;
drop policy if exists "auth_update_jobs" on public.jobs;
drop policy if exists "auth_delete_jobs" on public.jobs;

create policy "auth_select_jobs" on public.jobs
  for select to authenticated using (true);

create policy "auth_insert_jobs" on public.jobs
  for insert to authenticated with check (true);

create policy "auth_update_jobs" on public.jobs
  for update to authenticated using (true) with check (true);

create policy "auth_delete_jobs" on public.jobs
  for delete to authenticated using (true);

grant usage, select on all sequences in schema public to authenticated;

alter table public.jobs add column if not exists warranty_of integer;

create unique index if not exists jobs_job_no_unique
  on public.jobs (job_no) where job_no is not null;
