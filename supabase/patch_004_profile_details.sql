-- ============================================================
-- Clonefest 2.0 — Patch 004: Add USN / Branch / Batch columns
-- Paste this in Supabase SQL Editor and Run
-- ============================================================

-- Step 1: Add the three new columns to the profiles table
alter table public.profiles
  add column if not exists usn    text unique,
  add column if not exists branch text,
  add column if not exists batch  text;

-- Step 2: Branch check constraint (matches frontend dropdown)
alter table public.profiles
  drop constraint if exists profiles_branch_check;

alter table public.profiles
  add constraint profiles_branch_check
  check (branch is null or branch in (
    'CS', 'CD', 'CY', 'CI', 'BT',
    'EC', 'ET', 'EE', 'ME', 'IE',
    'CV', 'CH', 'AS'
  ));

-- Step 3: USN format check — 10 alphanumeric uppercase chars
alter table public.profiles
  drop constraint if exists profiles_usn_format_check;

alter table public.profiles
  add constraint profiles_usn_format_check
  check (usn is null or usn ~ '^[0-9A-Z]{10}$');

-- Step 4: Update the Sheets trigger to include new fields
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

-- VERIFY: Confirm the columns now exist
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name   = 'profiles'
  and column_name  in ('usn', 'branch', 'batch')
order by column_name;
-- Expected: 3 rows

