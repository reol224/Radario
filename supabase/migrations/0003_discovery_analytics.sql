create table public.discovery_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_id text not null,
  query text not null,
  discovered_count integer not null default 0 check (discovered_count >= 0),
  low_competition_count integer not null default 0 check (low_competition_count >= 0),
  failure_count integer not null default 0 check (failure_count >= 0),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'running'
);

create table public.job_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  event_type text not null check (event_type in ('discovered', 'saved', 'applied', 'assessment', 'interview', 'rejected', 'ghosted', 'offer', 'ignored')),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.discovery_runs enable row level security;
alter table public.job_events enable row level security;
create policy "manage own discovery runs" on public.discovery_runs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "manage own job events" on public.job_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index job_events_user_created_idx on public.job_events(user_id, created_at desc);
