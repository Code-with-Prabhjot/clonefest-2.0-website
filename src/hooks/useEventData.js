import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Single source of truth for event-wide data.
 *
 * Admin, the leaderboard and the hacker portal all derive from the same
 * queries and the same status vocabulary, so a change made in one surface
 * shows up in the others on their next load rather than each page inventing
 * its own idea of the standings.
 *
 * Points come from finalised rows in `scores`, aggregated by the
 * public.leaderboard_totals view. A squad with nothing finalised reports
 * points: null, which surfaces as pending rather than as a zero.
 */

export const CLEARED = new Set(['accepted', 'scored']);
export const STATUSES = ['pending', 'accepted', 'rejected', 'scored'];

function buildSquads({ teams, profiles, submissions, totals }) {
  const pointsFor = new Map((totals || []).map((t) => [t.team_name, t]));
  const byTeam = new Map(
    teams.map((t) => [t.name, {
      name: t.name,
      invite: t.invite_code || '',
      isOpen: !!t.is_open,
      registered: t.created_at,
      lead: '',
      members: 0,
      roster: [],
      subs: [],
    }]),
  );

  for (const p of profiles) {
    const row = p.team_name && byTeam.get(p.team_name);
    if (!row) continue;
    row.members += 1;
    row.roster.push({
      id: p.id,
      callsign: p.full_name || 'operative',
      role: p.role === 'lead' ? 'LEAD' : 'MEMBER',
      usn: p.usn || '',
      branch: p.branch || '',
    });
    if (p.role === 'lead') row.lead = p.full_name || 'operative';
  }

  for (const s of submissions) {
    const row = byTeam.get(s.team_name);
    if (row) row.subs.push(s);
  }

  return [...byTeam.values()].map((row) => {
    // Oldest first, so "challenge 1" is the squad's first submission.
    const subs = row.subs
      .slice()
      .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));

    const cleared = subs.filter((s) => CLEARED.has(s.status)).length;
    const tracks = [...new Set(subs.map((s) => s.track_id).filter(Boolean))];

    row.roster.sort((a, b) =>
      (a.role === 'LEAD' ? 0 : 1) - (b.role === 'LEAD' ? 0 : 1) ||
      a.callsign.localeCompare(b.callsign));

    return {
      ...row,
      subs,
      tracks,
      track: tracks.join(', ') || '—',
      total: subs.length,
      cleared,
      pending: subs.filter((s) => s.status === 'pending').length,
      rejected: subs.filter((s) => s.status === 'rejected').length,
      // Status of the first and second submissions, for the two challenge columns.
      c1: subs[0]?.status || 'none',
      c2: subs[1]?.status || 'none',
      lastAt: subs.length ? subs[subs.length - 1].created_at : null,
      firstClearedAt: subs.find((s) => CLEARED.has(s.status))?.created_at || null,
      // Finalised judge scores, via the public leaderboard_totals view.
      points: pointsFor.get(row.name)?.points ?? null,
      scoredCount: pointsFor.get(row.name)?.scored_count ?? 0,
      lastScoredAt: pointsFor.get(row.name)?.last_scored_at ?? null,
      score: pointsFor.get(row.name)?.points ?? null,
      judge: '',
    };
  });
}

export function rankSquads(squads) {
  return squads
    .slice()
    .sort((a, b) =>
      // Points lead once judging starts; cleared count breaks ties and carries
      // the board before any score is finalised.
      (b.points ?? -1) - (a.points ?? -1) ||
      b.cleared - a.cleared ||
      b.total - a.total ||
      String(a.firstClearedAt || '9').localeCompare(String(b.firstClearedAt || '9')) ||
      a.name.localeCompare(b.name))
    .map((r, i) => ({ ...r, place: i + 1 }));
}

export function useEventData() {
  const [teams, setTeams] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [settings, setSettings] = useState(null);
  const [totals, setTotals] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState('');
  const [fetchedAt, setFetchedAt] = useState(null);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const [t, p, s, tr, es, lt, an, ja] = await Promise.all([
        supabase.from('teams').select('*'),
        supabase.from('profiles').select('*'),
        supabase.from('submissions').select('*').order('created_at', { ascending: false }),
        supabase.from('tracks').select('*').order('id'),
        supabase.from('event_settings').select('*').eq('id', 1).maybeSingle(),
        supabase.from('leaderboard_totals').select('*'),
        supabase.from('announcements').select('*').order('is_pinned', { ascending: false })
                .order('created_at', { ascending: false }),
        supabase.from('judge_assignments').select('*'),
      ]);

      const failed = [t, p, s, tr].find((r) => r.error);
      if (failed) throw failed.error;

      setTeams(t.data || []);
      setProfiles(p.data || []);
      setSubmissions(s.data || []);
      setTracks(tr.data || []);
      setSettings(es.data || null);   // settings are optional, never fatal
      // Missing view (patch_009 not applied) must not break the page.
      setTotals(lt.error ? [] : (lt.data || []));
      // These tables arrived in patch_008; tolerate their absence.
      setAnnouncements(an.error ? [] : (an.data || []));
      setAssignments(ja.error ? [] : (ja.data || []));
      setFetchedAt(new Date());
      setStatus('ready');
    } catch (e) {
      setError(e?.message || 'Could not reach the database.');
      setStatus('error');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /** Moderate a submission. Updates locally first so the UI responds at once. */
  const setSubmissionStatus = useCallback(async (id, next) => {
    const before = submissions;
    setSubmissions((rows) => rows.map((r) => (r.id === id ? { ...r, status: next } : r)));
    const { error: err } = await supabase
      .from('submissions')
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (err) {
      setSubmissions(before);            // roll back on failure
      return { ok: false, error: err.message };
    }
    return { ok: true };
  }, [submissions]);

  const createAnnouncement = useCallback(async ({ title, body, audience, isPinned }) => {
    if (!title?.trim() || !body?.trim()) {
      return { ok: false, error: 'Title and body are both required.' };
    }
    const { data: auth } = await supabase.auth.getUser();
    const { data, error: err } = await supabase
      .from('announcements')
      .insert({
        title: title.trim(),
        body: body.trim(),
        audience: audience || 'all',
        is_pinned: !!isPinned,
        created_by: auth?.user?.id ?? null,
      })
      .select()
      .single();
    if (err) return { ok: false, error: err.message };
    setAnnouncements((rows) => [data, ...rows]);
    return { ok: true, announcement: data };
  }, []);

  const deleteAnnouncement = useCallback(async (id) => {
    const before = announcements;
    setAnnouncements((rows) => rows.filter((r) => r.id !== id));
    const { error: err } = await supabase.from('announcements').delete().eq('id', id);
    if (err) { setAnnouncements(before); return { ok: false, error: err.message }; }
    return { ok: true };
  }, [announcements]);

  /** Replace a judge's assignments with exactly `teamNames`. */
  const assignSquads = useCallback(async (judgeId, teamNames) => {
    if (!judgeId) return { ok: false, error: 'Pick a judge first.' };
    const del = await supabase.from('judge_assignments').delete().eq('judge_id', judgeId);
    if (del.error) return { ok: false, error: del.error.message };

    let inserted = [];
    if (teamNames.length) {
      const { data, error: err } = await supabase
        .from('judge_assignments')
        .insert(teamNames.map((team_name) => ({ judge_id: judgeId, team_name })))
        .select();
      if (err) return { ok: false, error: err.message };
      inserted = data || [];
    }
    setAssignments((rows) => [...rows.filter((r) => r.judge_id !== judgeId), ...inserted]);
    return { ok: true, count: inserted.length };
  }, []);

  const squads = useMemo(
    () => buildSquads({ teams, profiles, submissions, totals }),
    [teams, profiles, submissions, totals],
  );

  const stats = useMemo(() => {
    const hackers = profiles.filter((p) => ['lead', 'member'].includes(p.role));
    return {
      squads: teams.length,
      hackers: hackers.length,
      leads: profiles.filter((p) => p.role === 'lead').length,
      members: profiles.filter((p) => p.role === 'member').length,
      unassigned: profiles.filter((p) => p.role === 'unassigned').length,
      judges: profiles.filter((p) => p.role === 'judge').length,
      submissions: submissions.length,
      cleared: submissions.filter((s) => CLEARED.has(s.status)).length,
      pending: submissions.filter((s) => s.status === 'pending').length,
      rejected: submissions.filter((s) => s.status === 'rejected').length,
      tracks: tracks.length,
      scoredSquads: totals.length,
      totalPoints: totals.reduce((n, t) => n + (t.points || 0), 0),
    };
  }, [teams, profiles, submissions, tracks, totals]);

  const judges = useMemo(() => {
    const scoredByTeam = new Set(totals.map((t) => t.team_name));
    return profiles
      .filter((p) => p.role === 'judge')
      .map((p) => {
        const mine = assignments.filter((a) => a.judge_id === p.id).map((a) => a.team_name);
        return {
          id: p.id,
          callsign: p.full_name || 'judge',
          usn: p.usn || '',
          assignedTeams: mine,
          assigned: mine.length,
          scored: mine.filter((n) => scoredByTeam.has(n)).length,
        };
      })
      .sort((a, b) => a.callsign.localeCompare(b.callsign));
  }, [profiles, assignments, totals]);

  /** Squad counts per track, for the distribution panel. */
  const trackDistribution = useMemo(() => {
    const counts = new Map(tracks.map((t) => [t.id, 0]));
    for (const sq of squads) {
      for (const id of sq.tracks) {
        if (counts.has(id)) counts.set(id, counts.get(id) + 1);
      }
    }
    const total = [...counts.values()].reduce((a, b) => a + b, 0) || 1;
    return tracks.map((t) => ({
      id: t.id,
      title: t.title || t.id,
      count: counts.get(t.id) || 0,
      pct: Math.round(((counts.get(t.id) || 0) / total) * 100),
    }));
  }, [tracks, squads]);

  return {
    teams, profiles, submissions, tracks, settings, totals,
    announcements, assignments, judges,
    squads, stats, trackDistribution,
    status, error, fetchedAt,
    refetch: load,
    setSubmissionStatus,
    createAnnouncement, deleteAnnouncement, assignSquads,
  };
}
