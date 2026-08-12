-- Patch 006: Team Open Listing
-- Adds is_open flag to teams so leads can control whether their squad
-- appears in the public /teams directory.

-- 1. Add the column (default false = private by default)
alter table public.teams
  add column if not exists is_open boolean not null default false;

-- 2. RLS policy: anyone can read is_open (it's public info)
-- The existing teams table policies should already cover SELECT.
-- We just need to allow authenticated leads to UPDATE their own team's is_open.

create policy "Leads can toggle their team listing"
  on public.teams for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'lead'
      and profiles.team_name = teams.name
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'lead'
      and profiles.team_name = teams.name
    )
  );
