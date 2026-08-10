-- Clonefest 2.0 Supabase Schema Definition
-- Execute this file in your Supabase SQL Editor.

-- ==========================================
-- 1. EXTENSIONS
-- ==========================================
create extension if not exists "uuid-ossp";

-- ==========================================
-- 2. TABLES
-- ==========================================

-- Teams table
create table public.teams (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  invite_code text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  role text default 'unassigned'::text check (role in ('unassigned', 'lead', 'member', 'judge', 'admin')),
  team_name text references public.teams(name) on update cascade on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tracks (Problem Statements)
create table public.tracks (
  id text primary key, -- e.g., 'T1', 'T2'
  title text not null,
  description text,
  difficulty text,
  repo_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Submissions table
create table public.submissions (
  id uuid default uuid_generate_v4() primary key,
  team_name text not null references public.teams(name) on update cascade on delete cascade,
  track_id text not null references public.tracks(id) on update cascade on delete cascade,
  pr_url text not null,
  status text default 'pending'::text check (status in ('pending', 'accepted', 'rejected', 'scored')),
  notes text,
  submitted_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- 3. TRIGGERS
-- ==========================================

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'unassigned');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update updated_at for submissions
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_submission_updated
  before update on public.submissions
  for each row execute procedure public.handle_updated_at();

-- ==========================================
-- 4b. TEAM SIZE ENFORCEMENT (max 4 members)
-- ==========================================

-- Returns the current member count for a given team
create or replace function public.get_team_member_count(p_team_name text)
returns integer as $$
  select count(*)::integer
  from public.profiles
  where team_name = p_team_name;
$$ language sql security definer;

-- Raises an exception if the team is already at capacity (4 members)
create or replace function public.check_team_capacity()
returns trigger as $$
begin
  -- Only enforce when someone is joining (team_name being set for the first time)
  if new.team_name is not null and (old.team_name is null or old.team_name <> new.team_name) then
    if (select public.get_team_member_count(new.team_name)) >= 4 then
      raise exception 'Squad is full. Maximum 4 operatives per squad.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists enforce_team_capacity on public.profiles;
create trigger enforce_team_capacity
  before update on public.profiles
  for each row execute procedure public.check_team_capacity();

-- ==========================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ==========================================

alter table public.teams enable row level security;
alter table public.profiles enable row level security;
alter table public.tracks enable row level security;
alter table public.submissions enable row level security;

-- Profiles: Users can view all profiles, but only update their own
create policy "Profiles are viewable by everyone" 
  on public.profiles for select 
  using (true);

create policy "Users can update own profile" 
  on public.profiles for update 
  using (auth.uid() = id);

-- Teams: Anyone can view teams (to join or see roster)
-- Only leads can create/update teams, but for simplicity of the UI, any authenticated user can insert (to become lead).
create policy "Teams are viewable by everyone" 
  on public.teams for select 
  using (true);

create policy "Authenticated users can create teams" 
  on public.teams for insert 
  to authenticated 
  with check (true);

-- Tracks: Anyone can view tracks, only admins can modify
create policy "Tracks are viewable by everyone" 
  on public.tracks for select 
  using (true);

-- Submissions: 
-- Anyone can view submissions (or restrict to own team/judges/admins if desired, 
-- but for transparency, let's allow all authenticated to view)
create policy "Submissions viewable by authenticated users" 
  on public.submissions for select 
  to authenticated 
  using (true);

-- Only leads can insert submissions for their own team
create policy "Leads can insert submissions" 
  on public.submissions for insert 
  to authenticated 
  with check (
    exists (
      select 1 from public.profiles 
      where profiles.id = auth.uid() 
      and profiles.role = 'lead' 
      and profiles.team_name = submissions.team_name
    )
  );

-- Only Judges and Admins can update submissions (status, notes, etc.)
create policy "Judges and Admins can update submissions" 
  on public.submissions for update 
  to authenticated 
  using (
    exists (
      select 1 from public.profiles 
      where profiles.id = auth.uid() 
      and profiles.role in ('judge', 'admin')
    )
  );

-- ==========================================
-- 5. INITIAL SEED DATA (Tracks)
-- ==========================================

insert into public.tracks (id, title, description, difficulty, repo_url) values 
('T1', 'CMS', 'Rebuild the legacy PHP templates as server components.', 'Hard', 'https://github.com/clonefest/cms-starter'),
('T2', 'Data', 'Port the data layer to Postgres with RLS.', 'Medium', 'https://github.com/clonefest/data-starter'),
('T3', 'Commerce', 'E-commerce API and integrations.', 'Medium', 'https://github.com/clonefest/commerce-starter'),
('T4', 'Realtime', 'Realtime collaboration and fallback polling.', 'Hard', 'https://github.com/clonefest/realtime-starter'),
('T5', 'UI Kit', 'Reusable cyberpunk component library.', 'Easy', 'https://github.com/clonefest/uikit-starter'),
('BUGGY', 'Buggy Repo', 'Fix memory leaks and rendering issues in the custom repository.', 'Medium', 'https://github.com/clonefest/buggy-repo-challenge')
on conflict (id) do nothing;
