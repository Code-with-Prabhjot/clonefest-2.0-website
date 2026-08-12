-- patch_010_delete_tracks.sql
-- Deletes the extraneous placeholder tracks (T3, T4, T5, BUGGY) from the live database.

DELETE FROM public.tracks
WHERE id IN ('T3', 'T4', 'T5', 'BUGGY');
