-- Patch 010: Stop stamping "Unknown Operative" on new accounts
--
-- The live handle_new_user had drifted from supabase/schema.sql: it had been
-- rewritten to validate invite codes and enforce squad capacity, but was never
-- committed. This file captures that live version verbatim and changes exactly
-- one thing.
--
-- THE BUG
--   The profile insert ended with a literal fallback:
--     COALESCE(..->>'name', ..->>'full_name', 'Unknown Operative')
--   The app never sends full_name in the auth metadata — CreateTeamForm and
--   JoinTeamForm write the real name to public.profiles *after* signup — so
--   that fallback fired for every account. Hackers had it overwritten moments
--   later when they joined a squad; judges and admins never take that path, so
--   the placeholder stuck to exactly the accounts it looks worst on.
--
-- THE FIX
--   Drop the literal and let full_name be NULL. promote_user() fills in the
--   name you pass it, and the portals fall back to the email's local part.
--   No user-visible placeholder anywhere.
--
-- Everything else below — the lead/member branches, the invite-code check, the
-- capacity limit — is unchanged from what is currently deployed.
--
-- Safe to re-run.

create or replace function public.handle_new_user()
returns trigger as $$
DECLARE
  v_team_id UUID;
  v_member_count INT;
  v_role TEXT;
BEGIN
  -- Default to 'unassigned' if no role is provided (e.g. standard GitHub login)
  v_role := COALESCE(new.raw_user_meta_data->>'role', 'unassigned');

  -- RULE 1: SQUAD CREATION (LEADER)
  IF v_role = 'lead' THEN
    INSERT INTO public.teams (name)
    VALUES (new.raw_user_meta_data->>'team_name')
    RETURNING id INTO v_team_id;

  -- RULE 2: ENLISTMENT (MEMBER)
  ELSIF v_role = 'member' THEN
    SELECT id INTO v_team_id
    FROM public.teams
    WHERE invite_code = new.raw_user_meta_data->>'invite_code';

    IF v_team_id IS NULL THEN
      RAISE EXCEPTION 'Access Denied: Invalid Squad Invite Code.';
    END IF;

    SELECT COUNT(*) INTO v_member_count
    FROM public.profiles
    WHERE team_id = v_team_id;

    IF v_member_count >= 4 THEN
      RAISE EXCEPTION 'Access Denied: Squad is at maximum capacity (4/4).';
    END IF;
  END IF;

  -- Create the profile safely
  INSERT INTO public.profiles (id, full_name, role, team_id)
  VALUES (
    new.id,
    -- Use GitHub's name if available, else the form's full_name.
    -- No literal fallback: a NULL name is filled by promote_user() or by the
    -- squad forms, and the portals degrade to the email's local part.
    COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name'),
    v_role,
    v_team_id
  );

  RETURN new;
END;
$$ language plpgsql security definer;

-- Clean up the accounts already stamped with the placeholder. Only touches
-- rows that literally hold it, so real names are untouched.
update public.profiles
set full_name = null
where full_name = 'Unknown Operative';

-- Then name your organisers properly:
--   select public.promote_user('raksha.judge@rvce.edu.in', 'judge', 'Raksha');
--
-- Note: promote_user only fills a blank name, so run the update above first —
-- it treats 'Unknown Operative' as a real name and would otherwise keep it.

-- Confirm:
--   select u.email, p.full_name, p.role
--   from public.profiles p join auth.users u on u.id = p.id
--   where p.role in ('admin', 'judge');
