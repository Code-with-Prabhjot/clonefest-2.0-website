-- Patch 009: Leaderboard totals + role promotion
--
-- patch_008 keeps `scores` private: judges see their own rows, squads see their
-- own finalised rows, admins see everything. That is correct — per-criterion
-- marks and written feedback should not be world-readable.
--
-- The leaderboard is behind a login, but that alone is not enough: the policy
-- above scopes a squad to its OWN rows, so a signed-in hacker would see points
-- for their squad and blanks for everyone else.
--
-- This view returns only team_name and a summed total for finalised scores. A
-- Postgres view runs with the definer's rights by default, so it can read
-- `scores` without opening the table itself up. Granted to signed-in users
-- only — deliberately not to anon.
--
-- Safe to re-run.

create or replace view public.leaderboard_totals as
select
  s.team_name,
  sum(s.total)::int  as points,
  count(*)::int      as scored_count,
  max(s.updated_at)  as last_scored_at
from public.scores s
where s.status = 'final'
group by s.team_name;

comment on view public.leaderboard_totals is
  'Aggregate finalised score totals per squad. Deliberately excludes '
  'per-criterion marks and judge feedback. Signed-in users only.';

grant select on public.leaderboard_totals to authenticated;

-- Confirm:
--   select * from public.leaderboard_totals order by points desc;


-- ── 2. Promoting people to judge / admin ─────────────────────────────────────
--
-- New accounts are created as 'unassigned' by the signup trigger, and nothing
-- in the app can set 'judge' or 'admin'. This helper does it by email.
--
-- Create the login first: Supabase → Authentication → Users → Add user,
-- ticking "Auto Confirm User". Then call:
--
--   select public.promote_user('clonefest.admin@rvce.edu.in', 'admin', 'Raksha S');
--   select public.promote_user('judge.one@rvce.edu.in',       'judge', 'A Menon');
--
-- The third argument is optional; without it the email's local part is used.
-- An existing non-empty name is never overwritten.
--
-- security definer so it can read auth.users; execute is revoked from client
-- roles so it can only be called from the SQL editor / service role.

-- Safe to re-run even if the earlier two-argument version was already
-- applied: drop it before creating the current signature.
drop function if exists public.promote_user(text, text);

create or replace function public.promote_user(
  p_email text,
  p_role  text,
  p_name  text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_role not in ('unassigned', 'lead', 'member', 'judge', 'admin') then
    raise exception 'Invalid role: %', p_role;
  end if;

  select id into v_id from auth.users where lower(email) = lower(p_email);

  if v_id is null then
    raise exception
      'No account with email %. Create it first under Authentication → Users → Add user.',
      p_email;
  end if;

  -- The signup trigger has usually created the row already, with full_name
  -- NULL when the account was made from the dashboard (no user metadata).
  -- Fill the name here too, otherwise every organiser account stays nameless.
  insert into public.profiles (id, full_name, role)
  values (v_id, coalesce(p_name, split_part(p_email, '@', 1)), p_role)
  on conflict (id) do update
    set role      = excluded.role,
        full_name = coalesce(
          nullif(trim(public.profiles.full_name), ''),   -- keep a real name
          excluded.full_name);

  return format('%s is now %s', p_email, p_role);
end $$;

revoke execute on function public.promote_user(text, text, text) from anon, authenticated;

-- Check who holds elevated roles:
--   select u.email, p.role
--   from public.profiles p join auth.users u on u.id = p.id
--   where p.role in ('admin', 'judge');
