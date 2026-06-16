-- ============================================================
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ============================================================

-- 1. Base resume per user (the resume they save once)
create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  raw_text text not null,
  updated_at timestamptz default now(),
  unique (user_id)
);

-- 2. History of customizations
create table if not exists public.customizations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_title text,
  jd_text text,
  signal_map jsonb,
  result jsonb,
  match_score int,
  created_at timestamptz default now()
);

-- ============================================================
-- Row Level Security — users can only touch their own rows
-- ============================================================
alter table public.resumes enable row level security;
alter table public.customizations enable row level security;

create policy "own resume select" on public.resumes
  for select using (auth.uid() = user_id);
create policy "own resume upsert" on public.resumes
  for insert with check (auth.uid() = user_id);
create policy "own resume update" on public.resumes
  for update using (auth.uid() = user_id);
create policy "own resume delete" on public.resumes
  for delete using (auth.uid() = user_id);

create policy "own cust select" on public.customizations
  for select using (auth.uid() = user_id);
create policy "own cust insert" on public.customizations
  for insert with check (auth.uid() = user_id);
create policy "own cust delete" on public.customizations
  for delete using (auth.uid() = user_id);
