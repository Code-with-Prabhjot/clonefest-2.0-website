-- Patch 014: Results Published
-- Adds a boolean flag to event_settings so admins can control when
-- judge feedback and final scores are visible to hacker teams.
--
-- Safe to re-run: guarded with IF NOT EXISTS / DO block.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'event_settings'
      AND column_name  = 'results_published'
  ) THEN
    ALTER TABLE public.event_settings
      ADD COLUMN results_published boolean NOT NULL DEFAULT false;
  END IF;
END;
$$;

-- Make sure a row with id=1 exists (idempotent).
INSERT INTO public.event_settings (id, results_published)
VALUES (1, false)
ON CONFLICT (id) DO NOTHING;
