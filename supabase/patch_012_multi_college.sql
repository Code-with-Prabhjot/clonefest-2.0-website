-- ============================================================
-- Clonefest 2.0 — Patch 012: Multi-College Support
-- ============================================================

-- Step 1: Add college column
alter table public.profiles
  add column if not exists college text;

-- Step 2: Drop restrictive constraints
alter table public.profiles
  drop constraint if exists profiles_branch_check;

alter table public.profiles
  drop constraint if exists profiles_usn_format_check;

-- Step 3: Update Sheets trigger to include college
create or replace function public.send_profile_to_sheets()
returns trigger as $$
declare
  payload jsonb;
  script_url text := 'https://script.google.com/macros/s/AKfycbzPC2xlxMHZa_6hDrBbxin3WXQ8WMBgIVQNE523ArH4Iy8mOndr5uH2ykRQfsdcGhVq/exec';
begin
  payload := json_build_object(
    'event',      TG_OP,
    'id',         NEW.id,
    'full_name',  NEW.full_name,
    'role',       NEW.role,
    'team_name',  NEW.team_name,
    'usn',        NEW.usn,
    'branch',     NEW.branch,
    'batch',      NEW.batch,
    'college',    NEW.college,
    'created_at', NEW.created_at
  )::jsonb;

  perform net.http_post(
    url     => script_url,
    body    => payload,
    headers => '{"Content-Type":"application/json"}'::jsonb
  );

  return NEW;

exception when others then
  raise warning 'send_profile_to_sheets failed: %', sqlerrm;
  return NEW;
end;
$$ language plpgsql security definer;
