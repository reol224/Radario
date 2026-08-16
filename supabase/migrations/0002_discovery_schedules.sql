create table public.discovery_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  interval_hours integer not null default 3 check (interval_hours in (1, 3, 6, 12, 24)),
  minimum_score integer not null default 80 check (minimum_score between 0 and 100),
  maximum_applicants integer not null default 25 check (maximum_applicants > 0),
  posted_within_hours integer not null default 48 check (posted_within_hours > 0),
  remote_europe boolean not null default true,
  email_enabled boolean not null default false,
  last_run_at timestamptz,
  next_run_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.discovery_schedules(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  channel text not null default 'email',
  matched_job_ids uuid[] not null default '{}',
  delivered_at timestamptz not null default now(),
  delivery_status text not null default 'queued'
);

alter table public.discovery_schedules enable row level security;
alter table public.notification_deliveries enable row level security;
create policy "manage own discovery schedules" on public.discovery_schedules for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "manage own notification deliveries" on public.notification_deliveries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
