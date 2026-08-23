-- Patch 013: Normalized Scores
-- 
-- Replaces the public.leaderboard_totals view to include normalized points
-- using a Damped Z-Score standardization per judge.
--
-- Normalization is calculated PER TRACK to prevent easy/hard challenges
-- from skewing a judge's stats.
--
-- Safe to re-run.

drop view if exists public.leaderboard_totals;

create view public.leaderboard_totals as
with score_details as (
  select 
    s.id,
    s.team_name,
    s.judge_id,
    s.total,
    s.updated_at,
    sub.track_id
  from public.scores s
  join public.submissions sub on s.submission_id = sub.id
  where s.status = 'final'
),
global_stats as (
  select
    track_id,
    coalesce(avg(total), 75) as g_avg,
    coalesce(stddev(total), 10) as g_stddev
  from score_details
  group by track_id
),
judge_stats as (
  select
    judge_id,
    track_id,
    avg(total) as j_avg,
    stddev(total) as j_stddev,
    count(*) as j_count
  from score_details
  group by judge_id, track_id
),
normalized_scores as (
  select
    sd.team_name,
    sd.total as raw_total,
    case
      -- If judge graded less than 2 teams in this track, we cannot normalize reliably.
      when js.j_count < 2 then sd.total
      
      -- Damped Z-Score Normalization
      -- We clamp the judge's stddev to a minimum of 5.0.
      -- If a judge gives tightly clustered scores (e.g. 99, 98, 97 -> stddev 1.0),
      -- a pure Z-Score would mathematically explode a 1-point difference into a 20-point difference.
      -- Damping prevents this explosion and keeps scores fair.
      -- It also safely handles stddev=0 by mapping them directly to the global average.
      else greatest(0, least(100, round(
        ((sd.total - js.j_avg) / greatest(js.j_stddev, 5.0)) * greatest(gs.g_stddev, 5.0) + gs.g_avg
      )::int))
    end as normalized_total,
    sd.updated_at
  from score_details sd
  join judge_stats js on sd.judge_id = js.judge_id and sd.track_id = js.track_id
  join global_stats gs on sd.track_id = gs.track_id
)
select
  team_name,
  sum(raw_total)::int as points,
  sum(normalized_total)::int as normalized_points,
  count(*)::int as scored_count,
  max(updated_at) as last_scored_at
from normalized_scores
group by team_name;

comment on view public.leaderboard_totals is
  'Aggregate finalised score totals per squad, including Damped Z-Score normalized points per track.';

grant select on public.leaderboard_totals to authenticated;
