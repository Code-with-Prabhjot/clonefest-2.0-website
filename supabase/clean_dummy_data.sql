-- Clean up script to prepare for live registrations
-- WARNING: This will delete all teams, submissions, and non-admin users.

-- 1. Delete all submissions (this will clear the leaderboard)
DELETE FROM public.submissions;

-- 2. Delete all teams
DELETE FROM public.teams;

-- 3. Delete all dummy announcements (optional, uncomment if needed)
-- DELETE FROM public.announcements;

-- 4. Delete all non-admin users (this will automatically cascade and delete their profiles)
DELETE FROM auth.users 
WHERE id IN (
  SELECT id 
  FROM public.profiles 
  WHERE role != 'admin'
);