import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * useHackerData
 * Fetches everything the HackerPortal needs in one place:
 *  - Logged-in user
 *  - Profile (with role) + joined team row
 *  - All problem tracks from the DB
 *  - Team's submission history
 *
 * Returns { user, profile, team, tracks, submissions, loading, refetch }
 */
export function useHackerData() {
  const [user, setUser]               = useState(null);
  const [profile, setProfile]         = useState(null);
  const [team, setTeam]               = useState(null);
  const [tracks, setTracks]           = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading]         = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);

    // 1. Auth user
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      setLoading(false);
      return;
    }
    setUser(authUser);

    // 2. Profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (profileError) console.error('Supabase fetch error:', profileError);

    setProfile(profileData);

    // Fetch team directly using team_name
    let teamData = null;
    if (profileData?.team_name) {
      const { data: tData, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('name', profileData.team_name)
        .maybeSingle();
      
      if (teamError) console.error('Supabase fetch error:', teamError);
      teamData = tData;
    }
    setTeam(teamData);

    // 3. All tracks (problem statements)
    const { data: trackData, error: trackError } = await supabase
      .from('tracks')
      .select('*')
      .order('id');

    if (trackError) console.error('Supabase fetch error:', trackError);

    setTracks(trackData ?? []);

    // 4. Submissions for this team (only if they belong to one)
    if (profileData?.team_name) {
      const { data: subData, error: subError } = await supabase
        .from('submissions')
        .select('*')
        .eq('team_name', profileData.team_name)
        .order('created_at', { ascending: false });

      if (subError) console.error('Supabase fetch error:', subError);

      setSubmissions(subData ?? []);
    } else {
      setSubmissions([]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    (async () => {
      fetchAll();
    })();
  }, [fetchAll]);

  return { user, profile, team, tracks, submissions, loading, refetch: fetchAll };
}
