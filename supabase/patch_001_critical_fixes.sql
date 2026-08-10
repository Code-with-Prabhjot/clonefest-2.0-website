-- ============================================================
-- Clonefest 2.0 — Patch 001: Critical Fixes
-- Run this in Supabase SQL Editor INSTEAD of the full schema.sql
-- Safe to run on an existing database — all statements are idempotent.
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- FIX 1: Remove NOT NULL from submitted_by (contradicts ON DELETE SET NULL)
-- ──────────────────────────────────────────────────────────────
alter table public.submissions
  alter column submitted_by drop not null;


-- ──────────────────────────────────────────────────────────────
-- FIX 2: Team size cap — max 4 members per squad
-- ──────────────────────────────────────────────────────────────

-- Helper: returns current member count for a team
create or replace function public.get_team_member_count(p_team_name text)
returns integer as $$
  select count(*)::integer
  from public.profiles
  where team_name = p_team_name;
$$ language sql security definer;

-- Trigger function: blocks join if squad is already full
create or replace function public.check_team_capacity()
returns trigger as $$
begin
  -- Only fire when a user is being assigned to a team for the first time
  if new.team_name is not null and (old.team_name is null or old.team_name <> new.team_name) then
    if (select public.get_team_member_count(new.team_name)) >= 4 then
      raise exception 'Squad is full. Maximum 4 operatives per squad.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Attach (or replace) the trigger on profiles
drop trigger if exists enforce_team_capacity on public.profiles;
create trigger enforce_team_capacity
  before update on public.profiles
  for each row execute procedure public.check_team_capacity();


-- ──────────────────────────────────────────────────────────────
-- VERIFY: Quick sanity check — should return column details
-- ──────────────────────────────────────────────────────────────
select column_name, is_nullable, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name   = 'submissions'
  and column_name  = 'submitted_by';
-- Expected result: is_nullable = 'YES'
