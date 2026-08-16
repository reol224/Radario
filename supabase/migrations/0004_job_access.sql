-- Jobs are shared discovery records. Authenticated users may read them and
-- ingestion routes may create/update records, while personal state remains in
-- user_jobs and is protected separately.
alter table public.jobs enable row level security;

alter table public.jobs
  add column if not exists applicant_count_exact integer,
  add column if not exists applicant_count_lower_bound integer,
  add column if not exists applicant_count_upper_bound integer,
  add column if not exists applicant_count_is_approximate boolean not null default false,
  add column if not exists applicant_count_source text,
  add column if not exists applicant_count_updated_at timestamptz;

create policy "authenticated users can read jobs"
  on public.jobs for select
  using (auth.role() = 'authenticated');

create policy "authenticated users can create jobs"
  on public.jobs for insert
  with check (auth.role() = 'authenticated');

create policy "authenticated users can update jobs"
  on public.jobs for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create index if not exists jobs_posted_at_idx on public.jobs(posted_at desc);
create index if not exists jobs_score_idx on public.jobs(opportunity_score desc);
