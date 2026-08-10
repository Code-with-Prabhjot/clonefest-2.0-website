-- ============================================================
-- Clonefest 2.0 — Patch 003: Fix Google Sheets Integration
-- Paste this in Supabase SQL Editor → New Query
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- Step 1: Create a proper trigger function that builds the
-- JSON payload from the actual profile row and sends it.
-- The old trigger called http_request with a static '{}' body.
-- ──────────────────────────────────────────────────────────────
create or replace function public.send_profile_to_sheets()
returns trigger as $$
declare
  payload jsonb;
  script_url text := 'https://script.google.com/macros/s/AKfycby331ZEY3x33-ZEEdapC52iuip1UWvN3XvErn2MblL_2OR7DqtK4oXG-QoUK3td-Pmt/exec';
begin
  -- Build JSON payload from the profile row
  payload := json_build_object(
    'event',      TG_OP,
    'id',         NEW.id,
    'full_name',  NEW.full_name,
    'role',       NEW.role,
    'team_name',  NEW.team_name,
    'created_at', NEW.created_at
  )::jsonb;

  -- Fire HTTP POST via pg_net (non-blocking, async)
  perform net.http_post(
    url     => script_url,
    body    => payload,
    headers => '{"Content-Type":"application/json"}'::jsonb
  );

  return NEW;

exception when others then
  -- NEVER block a sign-up/team-join if Sheets is down
  raise warning 'send_profile_to_sheets failed: %', sqlerrm;
  return NEW;
end;
$$ language plpgsql security definer;


-- ──────────────────────────────────────────────────────────────
-- Step 2: Drop the old broken triggers, replace with one smart
-- trigger that only fires when a team is actually assigned.
-- Firing on every INSERT (sign-up) is noise — we want to fire
-- only when team_name gets set (team creation or join).
-- ──────────────────────────────────────────────────────────────
drop trigger if exists send_to_google_sheets on public.profiles;

create trigger send_to_google_sheets
  after update on public.profiles
  for each row
  when (
    new.team_name is not null
    and (old.team_name is null or old.team_name is distinct from new.team_name)
  )
  execute procedure public.send_profile_to_sheets();


-- ──────────────────────────────────────────────────────────────
-- VERIFY: Check the trigger now only fires on UPDATE (team join)
-- ──────────────────────────────────────────────────────────────
select trigger_name, event_manipulation as event, action_timing as timing
from information_schema.triggers
where trigger_schema = 'public'
  and trigger_name = 'send_to_google_sheets';
-- Expected: 1 row, event = UPDATE, timing = AFTER
