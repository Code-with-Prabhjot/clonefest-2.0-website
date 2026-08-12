-- Patch 005: Team Requests
-- Adds the team_requests table to allow users to request to join a squad.

-- 1. Create the table
create table public.team_requests (
  id uuid default uuid_generate_v4() primary key,
  team_name text not null references public.teams(name) on update cascade on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text default 'pending'::text check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(team_name, user_id)
);

-- 2. Enable RLS
alter table public.team_requests enable row level security;

-- 3. RLS Policies

-- Users can see requests they made
create policy "Users can view their own requests"
  on public.team_requests for select
  to authenticated
  using (auth.uid() = user_id);

-- Leads can see requests for their team
create policy "Leads can view requests for their team"
  on public.team_requests for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'lead'
      and profiles.team_name = team_requests.team_name
    )
  );

-- Unassigned users can insert a request
create policy "Unassigned users can request to join"
  on public.team_requests for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and (profiles.team_name is null or profiles.role = 'unassigned')
    )
  );

-- Leads can update requests for their team (to accept or reject)
create policy "Leads can update requests for their team"
  on public.team_requests for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'lead'
      and profiles.team_name = team_requests.team_name
    )
  );

-- ==========================================
-- 4. RPC FUNCTIONS
-- ==========================================

-- Function to accept a team request.
-- Runs as SECURITY DEFINER to bypass RLS when updating the requester's profile.
create or replace function public.accept_team_request(p_request_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_req record;
  v_lead_team text;
begin
  -- Get the request
  select * into v_req from public.team_requests where id = p_request_id and status = 'pending';
  if not found then
    raise exception 'Pending request not found';
  end if;

  -- Verify the caller is the lead of that team
  select team_name into v_lead_team from public.profiles where id = auth.uid() and role = 'lead';
  if v_lead_team is null or v_lead_team <> v_req.team_name then
    raise exception 'Unauthorized: Only the team lead can accept requests';
  end if;

  -- Verify squad capacity
  if (select public.get_team_member_count(v_req.team_name)) >= 4 then
    raise exception 'Squad is full. Maximum 4 operatives per squad.';
  end if;

  -- Update the request status
  update public.team_requests set status = 'accepted' where id = p_request_id;

  -- Update the user profile
  update public.profiles set team_name = v_req.team_name, role = 'member' where id = v_req.user_id;
end;
$$;
