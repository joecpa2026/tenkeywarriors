-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── JOBS ────────────────────────────────────────────────────────────────────
create table if not exists jobs (
  id              uuid primary key default uuid_generate_v4(),
  jobkey          text unique not null,        -- Indeed's unique job ID
  title           text not null,
  normalized_title text,
  company         text,
  company_id      text,
  company_rating  numeric(3,2),
  location_city   text,
  location_state  text,
  formatted_location text,
  is_remote       boolean default false,
  salary_min      numeric(10,2),
  salary_max      numeric(10,2),
  salary_type     text,                        -- hourly, yearly, etc.
  salary_snippet  text,
  job_types       text[],                      -- ['contract', 'part-time', etc.]
  snippet         text,
  apply_url       text,
  indeed_apply    boolean default false,
  sponsored       boolean default false,
  urgently_hiring boolean default false,
  apply_count     integer,
  published_at    timestamptz,
  scraped_at      timestamptz default now(),
  expired         boolean default false,
  raw             jsonb                        -- full Apify payload for future use
);

create index if not exists jobs_published_at_idx on jobs (published_at desc);
create index if not exists jobs_location_state_idx on jobs (location_state);
create index if not exists jobs_is_remote_idx on jobs (is_remote);
create index if not exists jobs_expired_idx on jobs (expired);

-- ─── PROFILES ────────────────────────────────────────────────────────────────
create table if not exists profiles (
  id              uuid primary key references auth.users on delete cascade,
  email           text not null,
  full_name       text,
  role_types      text[],   -- ['cpa', 'controller', 'bookkeeper', 'cfo', 'tax', 'audit', 'payroll']
  skills          text[],   -- ['QuickBooks', 'NetSuite', 'Excel', 'tax prep', etc.]
  rate_min        numeric(8,2),
  rate_max        numeric(8,2),
  rate_type       text default 'hourly',       -- hourly or yearly
  location_city   text,
  location_state  text,
  remote_ok       boolean default true,
  on_site_ok      boolean default true,
  email_alerts    boolean default true,
  alert_frequency text default 'daily',        -- daily or weekly
  last_alerted_at timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ─── MATCH LOG ───────────────────────────────────────────────────────────────
-- Tracks which jobs have been sent to which profiles (prevents duplicate alerts)
create table if not exists match_log (
  id          uuid primary key default uuid_generate_v4(),
  profile_id  uuid references profiles on delete cascade,
  job_id      uuid references jobs on delete cascade,
  matched_at  timestamptz default now(),
  emailed     boolean default false,
  unique (profile_id, job_id)
);

create index if not exists match_log_profile_idx on match_log (profile_id);

-- ─── RLS POLICIES ────────────────────────────────────────────────────────────
alter table jobs enable row level security;
alter table profiles enable row level security;
alter table match_log enable row level security;

-- Jobs are public to read
create policy "jobs_public_read" on jobs for select using (true);

-- Profiles: users manage their own
create policy "profiles_own_read"   on profiles for select using (auth.uid() = id);
create policy "profiles_own_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_own_update" on profiles for update using (auth.uid() = id);
create policy "profiles_own_delete" on profiles for delete using (auth.uid() = id);

-- Match log: users see their own
create policy "match_log_own_read" on match_log for select using (auth.uid() = profile_id);

-- Service role can write to all tables (for Apify ingest + match engine)
create policy "jobs_service_insert"     on jobs      for insert with check (true);
create policy "jobs_service_update"     on jobs      for update using (true);
create policy "match_log_service_write" on match_log for insert with check (true);
create policy "match_log_service_update" on match_log for update using (true);
