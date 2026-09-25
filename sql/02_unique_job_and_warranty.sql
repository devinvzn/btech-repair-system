-- Run this in the Supabase SQL Editor (paste the CONTENT below, not the filename)

-- 1) Warranty link: which job this one is a warranty repeat of
alter table public.jobs add column if not exists warranty_of integer;

-- 2) Job No must be unique (nulls are still allowed, no problem there)
--    Check for existing duplicates first with:
--    select job_no, count(*) from public.jobs where job_no is not null group by job_no having count(*) > 1;
--    If duplicates exist, the index creation below will fail — fix those rows first.
create unique index if not exists jobs_job_no_unique on public.jobs (job_no) where job_no is not null;
