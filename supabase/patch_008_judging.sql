-- Patch 008: Judging
-- Adds score persistence and judge→squad assignment, so the judge portal can
-- read and write real data instead of running on hardcoded sample values.
--
-- Safe to re-run: every statement is guarded.

-- ── 1. Scores ────────────────────────────────────────────────────────────────
-- One row per (judge, submission). Criterion columns mirror the rubric shown
-- in the portal; `total` is generated so it can never drift from its parts.

create table if not exists public.scores (
  id            uuid default uuid_generate_v4() primary key,
  submission_id uuid not null references public.submissions(id) on delete cascade,
  judge_id      uuid not null references public.profiles(id)    on delete cascade,
  team_name     text not null references public.teams(name)     on update cascade on delete cascade,

  -- Rubric criteria, capped to the maxima the UI enforces.
  code_quality  int check (code_quality  between 0 and 20),
  completeness  int check (completeness  between 0 and 25),
  ux_design     int check (ux_design     between 0 and 20),
  deployment    int check (deployment    between 0 and 15),
  innovation    int check (innovation    between 0 and 20),

  total int generated always as (
    coalesce(code_quality, 0) + coalesce(completeness, 0) + coalesce(ux_design, 0)
    + coalesce(deployment, 0) + coalesce(innovation, 0)
  ) stored,

  comments   jsonb   default '{}'::jsonb,      -- per-criterion notes
  feedback   text,                             -- overall feedback to the squad
  status     text    not null default 'draft'
             check (status in ('draft', 'final')),

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  unique (submission_id, judge_id)
);

create index if not exists scores_team_idx   on public.scores (team_name);
create index if not exists scores_judge_idx  on public.scores (judge_id);
create index if not exists scores_status_idx on public.scores (status);

alter table public.scores enable row level security;

-- Judges see and manage only their own scores.
drop policy if exists "Judges view their own scores" on public.scores;
create policy "Judges view their own scores"
  on public.scores for select to authenticated
  using (auth.uid() = judge_id);

drop policy if exists "Judges insert their own scores" on public.scores;
create policy "Judges insert their own scores"
  on public.scores for insert to authenticated
  with check (
    auth.uid() = judge_id
    and exists (select 1 from public.profiles
                where id = auth.uid() and role in ('judge', 'admin'))
  );

-- A finalised score is locked; only an admin can reopen it.
drop policy if exists "Judges update their own draft scores" on public.scores;
create policy "Judges update their own draft scores"
  on public.scores for update to authenticated
  using (auth.uid() = judge_id and status = 'draft')
  with check (auth.uid() = judge_id);

drop policy if exists "Admins manage all scores" on public.scores;
create policy "Admins manage all scores"
  on public.scores for all to authenticated
  using (exists (select 1 from public.profiles
                 where id = auth.uid() and role = 'admin'));

-- Squads read their own finalised scores; the leaderboard reads totals.
drop policy if exists "Teams view their final scores" on public.scores;
create policy "Teams view their final scores"
  on public.scores for select to authenticated
  using (
    status = 'final'
    and exists (select 1 from public.profiles
                where id = auth.uid() and team_name = scores.team_name)
  );

-- ── 2. Judge assignments ─────────────────────────────────────────────────────

create table if not exists public.judge_assignments (
  id         uuid default uuid_generate_v4() primary key,
  judge_id   uuid not null references public.profiles(id) on delete cascade,
  team_name  text not null references public.teams(name)  on update cascade on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (judge_id, team_name)
);

create index if not exists judge_assignments_judge_idx on public.judge_assignments (judge_id);

alter table public.judge_assignments enable row level security;

drop policy if exists "Judges view their assignments" on public.judge_assignments;
create policy "Judges view their assignments"
  on public.judge_assignments for select to authenticated
  using (auth.uid() = judge_id);

drop policy if exists "Admins manage assignments" on public.judge_assignments;
create policy "Admins manage assignments"
  on public.judge_assignments for all to authenticated
  using (exists (select 1 from public.profiles
                 where id = auth.uid() and role = 'admin'));

-- ── 3. Announcements ─────────────────────────────────────────────────────────

create table if not exists public.announcements (
  id         uuid default uuid_generate_v4() primary key,
  title      text not null,
  body       text not null,
  audience   text not null default 'all'
             check (audience in ('all', 'leads', 'judges')),
  is_pinned  boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists announcements_created_idx on public.announcements (created_at desc);

alter table public.announcements enable row level security;

drop policy if exists "Anyone signed in can read announcements" on public.announcements;
create policy "Anyone signed in can read announcements"
  on public.announcements for select to authenticated using (true);

drop policy if exists "Admins manage announcements" on public.announcements;
create policy "Admins manage announcements"
  on public.announcements for all to authenticated
  using (exists (select 1 from public.profiles
                 where id = auth.uid() and role = 'admin'));

-- ── 4. keep updated_at honest on scores ──────────────────────────────────────

create or replace function public.handle_scores_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists scores_updated_at on public.scores;
create trigger scores_updated_at
  before update on public.scores
  for each row execute function public.handle_scores_updated_at();
