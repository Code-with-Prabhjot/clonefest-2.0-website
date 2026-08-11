-- ============================================================
-- Clonefest 2.0 — Patch 002: Submission Card Fields + Event Settings
-- Run this in Supabase SQL Editor after patch_001.
-- All statements are idempotent (safe to re-run).
-- ============================================================


-- ──────────────────────────────────────────────────────────────
-- 1. Extend tracks: subtitle + long_description
-- ──────────────────────────────────────────────────────────────

alter table public.tracks
  add column if not exists subtitle        varchar(255),
  add column if not exists long_description varchar(4000);

-- Seed example content on existing tracks (update to real values)
update public.tracks set
  subtitle = 'Modernise the content management layer',
  long_description = E'## Overview\n\nYour goal is to rebuild the legacy PHP CMS templates as server-rendered React Server Components.\n\n### What you need to build\n\n- A headless CMS API using Supabase as the backend\n- A Next.js frontend that consumes that API\n- Rich-text authoring support (MDX or Tiptap recommended)\n\n### Evaluation criteria\n\n1. **Correctness** — all CRUD operations work end-to-end\n2. **Performance** — Lighthouse score >= 90\n3. **Code quality** — clean, documented, type-safe\n4. **UX** — authoring experience is smooth and intuitive\n\n### Bonus points\n\n- Preview mode (draft vs published)\n- Image optimisation pipeline\n- Automatic sitemap generation'
where id = 'T1';

update public.tracks set
  subtitle = 'Port the data layer to Postgres with row-level security',
  long_description = E'## Overview\n\nMigrate a legacy MySQL data layer to Supabase Postgres, adding RLS policies that enforce multi-tenant isolation.\n\n### What you need to build\n\n- Full schema migration with seed data\n- RLS policies for all tables\n- A React dashboard that visualises the data\n\n### Evaluation criteria\n\n1. **Schema design** — normalised, indexed, documented\n2. **RLS correctness** — no data leaks between tenants\n3. **Query performance** — use EXPLAIN ANALYSE to prove it\n4. **Dashboard** — clear, filterable, responsive'
where id = 'T2';

update public.tracks set
  subtitle = 'Build an e-commerce API and checkout integrations',
  long_description = E'## Overview\n\nCreate a production-ready e-commerce API with product catalogue, cart management, and payment integration.\n\n### What you need to build\n\n- REST or GraphQL API for products, cart, orders\n- Stripe (test mode) checkout flow\n- Admin dashboard for order management\n\n### Evaluation criteria\n\n1. **API design** — RESTful, versioned, documented with OpenAPI\n2. **Security** — auth guards, rate limiting, input validation\n3. **Payments** — correct Stripe webhook handling\n4. **Tests** — unit + integration coverage >= 70%'
where id = 'T3';

update public.tracks set
  subtitle = 'Real-time collaboration with graceful offline fallback',
  long_description = E'## Overview\n\nBuild a collaborative editing experience powered by Supabase Realtime, with a polling fallback when the WebSocket connection drops.\n\n### What you need to build\n\n- Live cursor presence (who is online, where they are editing)\n- Conflict-free collaborative text editing (CRDT or OT)\n- Automatic polling fallback with reconnect logic\n\n### Evaluation criteria\n\n1. **Realtime correctness** — no ghost cursors, no missed updates\n2. **Offline resilience** — seamless fallback and resync\n3. **Latency** — p99 < 200 ms on a standard connection\n4. **UX** — presence indicators are clear and non-intrusive'
where id = 'T4';

update public.tracks set
  subtitle = 'Reusable cyberpunk component library in React',
  long_description = E'## Overview\n\nDesign and implement a themeable component library that matches the Clonefest cyberpunk aesthetic.\n\n### What you need to build\n\n- At least 12 fully accessible components\n- Storybook documentation for every component\n- A design token system (CSS custom properties)\n\n### Evaluation criteria\n\n1. **Accessibility** — WCAG 2.1 AA compliant (axe-core clean)\n2. **Theming** — swap colour scheme via a single token override\n3. **Documentation** — every prop documented with examples\n4. **Bundle size** — tree-shakeable, < 50 kB gzipped'
where id = 'T5';

update public.tracks set
  subtitle = 'Fix memory leaks and rendering bugs in a broken repository',
  long_description = E'## Overview\n\nYou are given a deliberately broken React application. Find and fix all memory leaks, rendering bugs, and performance regressions.\n\n### What you need to do\n\n- Clone the buggy repo (link below)\n- Profile and document every bug\n- Fix each bug with a clear, isolated commit\n- Write a post-mortem report\n\n### Evaluation criteria\n\n1. **Bug count** — how many distinct issues you identified\n2. **Fix quality** — targeted, no regressions introduced\n3. **Report clarity** — technical but accessible explanation\n4. **Commit hygiene** — one logical change per commit, good messages'
where id = 'BUGGY';


-- ──────────────────────────────────────────────────────────────
-- 2. Extend submissions: deployed_url, app_notes, env_snapshot
-- ──────────────────────────────────────────────────────────────

alter table public.submissions
  add column if not exists deployed_url  varchar(2048),
  add column if not exists app_notes     varchar(4000),
  add column if not exists env_snapshot  varchar(8000);

comment on column public.submissions.deployed_url is
  'Vercel / Netlify / any live deployment URL for this submission';
comment on column public.submissions.app_notes is
  'Team description of their app — up to 4000 chars';
comment on column public.submissions.env_snapshot is
  'Pasted .env content (keys only, values redacted by team) — up to 8000 chars';


-- ──────────────────────────────────────────────────────────────
-- 3. event_settings — admin-controlled countdown + kill switch
-- ──────────────────────────────────────────────────────────────

create table if not exists public.event_settings (
  id                   int primary key default 1
                         check (id = 1),
  submission_deadline  timestamptz,
  submissions_open     boolean  not null default true,
  updated_at           timestamptz not null default now()
);

insert into public.event_settings (id, submissions_open)
values (1, true)
on conflict (id) do nothing;

create or replace function public.handle_event_settings_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_event_settings_updated on public.event_settings;
create trigger on_event_settings_updated
  before update on public.event_settings
  for each row execute procedure public.handle_event_settings_updated_at();


-- ──────────────────────────────────────────────────────────────
-- 4. RLS for event_settings
-- ──────────────────────────────────────────────────────────────

alter table public.event_settings enable row level security;

drop policy if exists "event_settings readable by all" on public.event_settings;
create policy "event_settings readable by all"
  on public.event_settings for select
  using (true);

drop policy if exists "admins can update event_settings" on public.event_settings;
create policy "admins can update event_settings"
  on public.event_settings for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );

-- Enable realtime for instant countdown sync:
-- alter publication supabase_realtime add table public.event_settings;


-- ──────────────────────────────────────────────────────────────
-- VERIFY
-- ──────────────────────────────────────────────────────────────
select column_name, data_type, character_maximum_length
from information_schema.columns
where table_schema = 'public'
  and table_name in ('submissions', 'tracks', 'event_settings')
  and column_name in (
    'deployed_url', 'app_notes', 'env_snapshot',
    'subtitle', 'long_description',
    'submission_deadline', 'submissions_open'
  )
order by table_name, column_name;
