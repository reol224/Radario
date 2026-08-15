create type public.remote_type as enum ('fully_remote', 'restricted_remote', 'hybrid', 'on_site', 'unknown');
create type public.application_status as enum ('new', 'saved', 'applied', 'assessment', 'interview', 'rejected', 'ghosted', 'offer', 'ignored');

create table public.search_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  desired_roles text[] not null default '{}', positive_keywords text[] not null default '{}', negative_keywords text[] not null default '{}',
  preferred_countries text[] not null default '{}', allowed_remote_types public.remote_type[] not null default '{fully_remote,restricted_remote,hybrid}',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(), source text not null, source_job_id text, url text not null, title text not null, company text not null,
  company_url text, location text, country text, remote_type public.remote_type not null default 'unknown', remote_restriction text, description text,
  salary_min numeric, salary_max numeric, salary_currency text, employment_type text, experience_level text, technologies text[] not null default '{}',
  posted_at timestamptz, first_seen_at timestamptz not null default now(), last_seen_at timestamptz not null default now(), application_url text,
  duplicate_group_id uuid, opportunity_score integer not null default 0 check (opportunity_score between 0 and 100), raw_payload jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(source, source_job_id)
);

create table public.applicant_count_history (
  id uuid primary key default gen_random_uuid(), job_id uuid not null references public.jobs(id) on delete cascade, exact_count integer,
  lower_bound integer, upper_bound integer, is_approximate boolean not null default false, source text not null, observed_at timestamptz not null default now(),
  check (exact_count is not null or lower_bound is not null or upper_bound is not null)
);

create table public.user_jobs (
  user_id uuid not null references auth.users(id) on delete cascade, job_id uuid not null references public.jobs(id) on delete cascade,
  status public.application_status not null default 'new', applied_at timestamptz, last_contact_at timestamptz, next_follow_up_at timestamptz, notes text,
  primary key (user_id, job_id)
);

alter table public.search_preferences enable row level security;
alter table public.user_jobs enable row level security;
create policy "manage own preferences" on public.search_preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "manage own job state" on public.user_jobs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
