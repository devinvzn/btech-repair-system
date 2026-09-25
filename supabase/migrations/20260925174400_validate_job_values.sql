-- Keep core job values valid even when data is written outside the UI.

alter table public.jobs
  add constraint jobs_charge_nonnegative_chk
  check (charge is null or charge >= 0);

alter table public.jobs
  add constraint jobs_status_chk
  check (status in ('Pending', 'Done', 'Can''t Repair'));

alter table public.jobs
  add constraint jobs_payment_status_chk
  check (payment_status in ('Not Paid', 'Paid', 'N/A'));

alter table public.jobs
  add constraint jobs_na_payment_zero_charge_chk
  check (payment_status <> 'N/A' or coalesce(charge, 0) = 0);
