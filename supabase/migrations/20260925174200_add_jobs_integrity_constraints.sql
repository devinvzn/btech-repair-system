-- Enforce warranty links at the database level.
-- warranty_of stores the original job's job_no (not id), so job_no must be
-- a real unique key before it can be referenced by a foreign key.

alter table public.jobs
  add constraint jobs_job_no_key unique (job_no);

alter table public.jobs
  add constraint jobs_warranty_of_fkey
  foreign key (warranty_of)
  references public.jobs (job_no)
  on update cascade
  on delete restrict;

drop index if exists public.jobs_job_no_unique;
