-- Run this in the Supabase SQL Editor
-- This makes sure anonymous (not logged in) users cannot read or change data.

alter table public.jobs enable row level security;

-- Drop existing policies if any (names may differ, check first)
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

-- Optional: sequence permission
grant usage, select on all sequences in schema public to authenticated;

-- Check:
-- select tablename, rowsecurity from pg_tables where tablename = 'jobs';
