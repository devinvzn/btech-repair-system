-- Index the self-referencing warranty key for FK checks and warranty lookups.
create index if not exists jobs_warranty_of_idx on public.jobs (warranty_of);