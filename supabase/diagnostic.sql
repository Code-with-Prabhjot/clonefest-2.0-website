-- ============================================================
-- Clonefest 2.0 — Database Diagnostic Script
-- Paste this into Supabase SQL Editor and Run All.
-- Each section returns a separate result set.
-- ============================================================

-- ── 1. TABLES that exist in the public schema ────────────────
select
  table_name,
  (select count(*) from information_schema.columns c
   where c.table_schema = 'public' and c.table_name = t.table_name) as column_count
from information_schema.tables t
where table_schema = 'public'
  and table_type = 'BASE TABLE'
order by table_name;

-- ── 2. ALL COLUMNS with nullability and defaults ─────────────
select
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
order by table_name, ordinal_position;

-- ── 3. CONSTRAINTS (primary keys, foreign keys, checks, unique)
select
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name  as foreign_table,
  ccu.column_name as foreign_column,
  rc.delete_rule,
  rc.update_rule
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
  and tc.table_schema   = kcu.table_schema
left join information_schema.referential_constraints rc
  on tc.constraint_name = rc.constraint_name
left join information_schema.constraint_column_usage ccu
  on rc.unique_constraint_name = ccu.constraint_name
where tc.table_schema = 'public'
order by tc.table_name, tc.constraint_type;

-- ── 4. CHECK CONSTRAINTS (role enum, status enum) ────────────
select
  tc.table_name,
  tc.constraint_name,
  cc.check_clause
from information_schema.table_constraints tc
join information_schema.check_constraints cc
  on tc.constraint_name = cc.constraint_name
where tc.table_schema = 'public'
order by tc.table_name;

-- ── 5. TRIGGERS ──────────────────────────────────────────────
select
  trigger_name,
  event_object_table as table_name,
  event_manipulation as event,
  action_timing      as timing,
  action_statement
from information_schema.triggers
where trigger_schema = 'public'
order by event_object_table, trigger_name;

-- ── 6. FUNCTIONS defined in the public schema ─────────────────
select
  routine_name,
  routine_type,
  security_type,
  data_type as return_type
from information_schema.routines
where routine_schema = 'public'
order by routine_name;

-- ── 7. ROW LEVEL SECURITY — which tables have RLS enabled ─────
select
  schemaname,
  tablename,
  rowsecurity as rls_enabled
from pg_tables
where schemaname = 'public'
order by tablename;

-- ── 8. RLS POLICIES ──────────────────────────────────────────
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd        as operation,
  qual       as using_expr,
  with_check as with_check_expr
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- ── 9. SEED DATA — tracks table ──────────────────────────────
select id, title, difficulty, repo_url
from public.tracks
order by id;

-- ── 10. SUBMITTED_BY COLUMN — confirm NOT NULL is gone ───────
select
  column_name,
  is_nullable,
  data_type
from information_schema.columns
where table_schema = 'public'
  and table_name   = 'submissions'
  and column_name  = 'submitted_by';
-- is_nullable should be 'YES'
