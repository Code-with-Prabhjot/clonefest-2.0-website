-- Patch 015: Final Leaderboard Override
-- Hardcodes the final leaderboard scores provided by the organisers.

drop view if exists public.leaderboard_totals;

create view public.leaderboard_totals as
select
  v.team_name::text,
  v.points::numeric as points,
  v.points::numeric as normalized_points,
  1::int as scored_count,
  now() as last_scored_at
from (
  values
    ('dihtectives', 194.73),
    ('Odessy', 190.39),
    ('nacho_cheese', 188.89),
    ('IgniteX', 187.23),
    ('QUAD SQUAD', 185.73),
    ('Techno_Savvies', 185.39),
    ('CRIMSON_CODE', 185.23),
    ('Still_Trying', 184.89),
    ('Conflux', 184.73),
    ('FIREFLIES', 182.73),
    ('Phantom Cascaders', 175.73),
    ('Lowcortisol', 173.73),
    ('Afterburner', 173.23),
    ('Singularity', 173.23),
    ('HoPES_aLive', 172.73),
    ('JALDI_THELATE', 170.73),
    ('Thedumbs', 169.39),
    ('APEX', 168.89),
    ('TEAM OG', 167.89),
    ('NEXON', 167.73),
    ('The Trinity', 164.73),
    ('git it girls', 159.73),
    ('Code_craft', 153.73),
    ('Prayatna', 153.73),
    ('Quadcore coders', 148.89),
    ('Team Nexus', 148.73),
    ('BYTE BANDITS', 148.73),
    ('VectorX', 146.73),
    ('Sekiro Dragon', 140.73),
    ('theshield', 128.89),
    ('YuriNation', 117.73),
    ('Code smugglers', 105.23),
    ('Vector_Voyage', 103.89),
    ('SILICON', 79.89),
    ('Shikari', 72.00),
    ('Time Loop', 67.00),
    ('0_to_X', 52.00)
) as v(team_name, points);

grant select on public.leaderboard_totals to authenticated;
