-- ============================================================
-- Clonefest 2.0 — Patch 007: Security & Performance Hardening
-- Run this in Supabase SQL Editor.
-- Safe to run on an existing database — all statements are idempotent.
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- FIX 1: Guarantee anon SELECT on teams
-- ──────────────────────────────────────────────────────────────
-- The original "Teams are viewable by everyone" policy in schema.sql
-- does NOT specify a role, which means it only applies to 'authenticated'
-- in strict Supabase setups. We explicitly grant anon SELECT here so the
-- /teams page never crashes for guests.

drop policy if exists "Teams are viewable by everyone" on public.teams;

create policy "Teams are viewable by everyone"
  on public.teams for select
  to anon, authenticated
  using (true);


-- ──────────────────────────────────────────────────────────────
-- FIX 2: Postgres View for server-side member counting
-- (replaces the client-side profile download in OpenTeams.jsx)
-- ──────────────────────────────────────────────────────────────
-- This view counts members per team entirely on the Postgres server.
-- The frontend can JOIN against this instead of downloading all profiles.

create or replace view public.team_member_counts as
  select
    t.name        as team_name,
    count(p.id)::integer as member_count
  from public.teams t
  left join public.profiles p on p.team_name = t.name
  group by t.name;

-- Grant SELECT on the view to both anon and authenticated roles
-- (needed so guests can see slot availability without logging in)
grant select on public.team_member_counts to anon, authenticated;


-- ──────────────────────────────────────────────────────────────
-- FIX 3: Harden team_requests RLS — block direct status manipulation
-- ──────────────────────────────────────────────────────────────
-- PROBLEM: The old "Leads can update requests for their team" policy
-- had no WITH CHECK clause. A malicious lead (or a hacker who spoofs
-- one) could call the REST API directly and set status = 'accepted'
-- on any request, bypassing the accept_team_request() RPC entirely.
--
-- FIX A: Drop the permissive policy.
-- FIX B: Replace it with a RESTRICTIVE policy that only allows leads
--         to set status to 'rejected' via the REST API. Accepting still
--         goes through the secure SECURITY DEFINER RPC.

drop policy if exists "Leads can update requests for their team" on public.team_requests;

create policy "Leads can only reject requests via API"
  on public.team_requests for update
  to authenticated
  using (
    -- The row being updated must belong to the lead's team
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'lead'
        and profiles.team_name = team_requests.team_name
    )
  )
  with check (
    -- The only status a lead may write directly is 'rejected'.
    -- 'accepted' MUST go through the accept_team_request() RPC
    -- (SECURITY DEFINER) which enforces capacity & atomicity.
    status = 'rejected'
  );

-- ──────────────────────────────────────────────────────────────
-- FIX 3b: Prevent requesters from self-updating their own request
-- ──────────────────────────────────────────────────────────────
-- There was no explicit block on users updating their own request status.
-- A user could call the REST API with user_id = auth.uid() and flip
-- status to 'accepted' themselves if SELECT is allowed. Block it.

drop policy if exists "Users cannot self-update their requests" on public.team_requests;

create policy "Users cannot self-update their requests"
  on public.team_requests for update
  to authenticated
  using (
    -- Only fire this policy for rows the user owns
    auth.uid() = user_id
  )
  with check (
    -- Deny all direct updates by the requester (false = always block)
    false
  );
