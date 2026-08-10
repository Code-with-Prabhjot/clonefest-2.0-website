-- ============================================================
-- Clonefest 2.0 — Patch 002: DB Alignment Fixes
-- Paste this into Supabase Dashboard → SQL Editor → New Query
-- All statements are idempotent (safe to re-run).
-- ============================================================


-- ──────────────────────────────────────────────────────────────
-- FIX 1: Add 'judge' and 'admin' to the role check constraint
-- Without this, assigning admin/judge roles will be rejected.
-- ──────────────────────────────────────────────────────────────
alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('unassigned', 'lead', 'member', 'judge', 'admin'));


-- ──────────────────────────────────────────────────────────────
-- FIX 2: Add FK from profiles.team_name → teams.name
-- Currently team_name is a loose text field with no referential
-- integrity. This enforces it at the DB level.
-- ──────────────────────────────────────────────────────────────
alter table public.profiles
  drop constraint if exists profiles_team_name_fkey;

alter table public.profiles
  add constraint profiles_team_name_fkey
  foreign key (team_name)
  references public.teams(name)
  on update cascade
  on delete set null;


-- ──────────────────────────────────────────────────────────────
-- FIX 3: Set a default value for the role column
-- The trigger handles new signups, but the column itself
-- should also have a default for safety.
-- ──────────────────────────────────────────────────────────────
alter table public.profiles
  alter column role set default 'unassigned'::text;


-- ──────────────────────────────────────────────────────────────
-- FIX 4: Replace the overly-restrictive profile SELECT policy
-- "Users can view own profile" blocks admin/judge portals from
-- reading any other user's profile. Switch to: all authenticated
-- users can view all profiles (needed for leaderboards, admin
-- panel, and the submission RLS sub-query).
-- ──────────────────────────────────────────────────────────────
drop policy if exists "Users can view own profile" on public.profiles;

create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);


-- ──────────────────────────────────────────────────────────────
-- FIX 5: Restore handle_updated_at + on_submission_updated
-- These were missing from the DB, so submissions.updated_at
-- was never being auto-updated on edits.
-- ──────────────────────────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_submission_updated on public.submissions;
create trigger on_submission_updated
  before update on public.submissions
  for each row execute procedure public.handle_updated_at();


-- ──────────────────────────────────────────────────────────────
-- VERIFY: Run these to confirm all fixes applied correctly.
-- ──────────────────────────────────────────────────────────────

-- 1. Role constraint should now include judge and admin
select constraint_name, check_clause
from information_schema.check_constraints
where constraint_name = 'profiles_role_check';
-- Expected: role = ANY (ARRAY['unassigned','lead','member','judge','admin'])

-- 2. team_name FK should now exist
select constraint_name, delete_rule
from information_schema.referential_constraints
where constraint_name = 'profiles_team_name_fkey';
-- Expected: 1 row, delete_rule = SET NULL

-- 3. Profile SELECT policy should now be for all authenticated users
select policyname, roles, using_expr
from pg_policies
where tablename = 'profiles' and cmd = 'SELECT';
-- Expected: "Profiles are viewable by authenticated users", using = true

-- 4. on_submission_updated trigger should now exist
select trigger_name, event_object_table
from information_schema.triggers
where trigger_schema = 'public'
  and trigger_name = 'on_submission_updated';
-- Expected: 1 row
