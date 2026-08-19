import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Data for the judge portal.
 *
 * Reads real squads, submissions and saved scores. If patch_008_judging.sql
 * has not been applied yet the `scores` / `judge_assignments` tables are
 * missing; that is reported through `migrationMissing` rather than throwing,
 * so the portal still renders its review side and only scoring is disabled.
 */

// Rubric keys used in the UI ↔ column names in public.scores
export const CRITERION_COLUMNS = {
  cq: 'code_quality',
  fc: 'completeness',
  ux: 'ux_design',
  dd: 'deployment',
  iv: 'innovation',
};

const isMissingTable = (err) =>
  !!err && (err.code === '42P01' || /does not exist/i.test(err.message || ''));

export function useJudgeData() {
  const [me, setMe] = useState(null);
  const [squads, setSquads] = useState([]);
  const [scores, setScores] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState('');
  const [migrationMissing, setMigrationMissing] = useState(false);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) throw new Error('Not signed in.');

      const { data: profile, error: pErr } = await supabase
        .from('profiles').select('*').eq('id', auth.user.id).single();
      if (pErr) throw pErr;
      setMe({ ...profile, email: auth.user.email });

      // Which squads is this judge responsible for?
      let assignedNames = null;                       // null = everything
      const assignRes = await supabase
        .from('judge_assignments').select('team_name').eq('judge_id', auth.user.id);

      if (assignRes.error) {
        if (isMissingTable(assignRes.error)) setMigrationMissing(true);
        else throw assignRes.error;
      } else if (assignRes.data?.length) {
        assignedNames = assignRes.data.map((a) => a.team_name);
      }
      // Admins, and judges with no explicit assignment, review everything.

      const [teamsRes, profilesRes, subsRes] = await Promise.all([
        supabase.from('teams').select('*'),
        supabase.from('profiles').select('id, full_name, role, team_name'),
        supabase.from('submissions').select('*').order('created_at', { ascending: true }),
      ]);
      for (const r of [teamsRes, profilesRes, subsRes]) if (r.error) throw r.error;

      // Saved scores by this judge.
      let myScores = [];
      const scoreRes = await supabase
        .from('scores').select('*').eq('judge_id', auth.user.id);
      if (scoreRes.error) {
        if (isMissingTable(scoreRes.error)) setMigrationMissing(true);
        else throw scoreRes.error;
      } else {
        myScores = scoreRes.data || [];
      }
      setScores(myScores);

      const teams = (teamsRes.data || []).filter(
        (t) => !assignedNames || assignedNames.includes(t.name),
      );

      const flattened = [];
      teams.forEach((t) => {
        const members = (profilesRes.data || []).filter((p) => p.team_name === t.name);
        const sortedMembers = members
          .sort((a, b) => (a.role === 'lead' ? 0 : 1) - (b.role === 'lead' ? 0 : 1))
          .map((m) => [m.full_name || 'operative', m.role === 'lead' ? 'LEAD' : '']);
        const subs = (subsRes.data || []).filter((s) => s.team_name === t.name);

        const latestSub = subs.length > 0 ? subs[subs.length - 1] : null;
        const score = latestSub ? myScores.find((sc) => sc.submission_id === latestSub.id) : null;

        flattened.push({
          id: t.name,
          name: t.name,
          teamName: t.name,
          members: sortedMembers,
          subs: subs,
          latestSubmissionId: latestSub ? latestSub.id : null,
          updated: latestSub ? latestSub.created_at : t.created_at,
          score: score || null,
        });
      });
      setSquads(flattened);

      setStatus('ready');
    } catch (e) {
      setError(e?.message || 'Could not load judging data.');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    const init = async () => await load();
    init();
  }, [load]);

  /**
   * Persist a rubric. `values` is keyed by the UI's criterion keys (cq, fc…).
   * finalise=true locks the row; RLS then prevents the judge editing it.
   */
  const saveScore = useCallback(async ({
    teamName, submissionId, values, comments, feedback, finalise,
  }) => {
    if (!me?.id) return { ok: false, error: 'Not signed in.' };
    if (!submissionId) {
      return { ok: false, error: 'This squad has no submission to score yet.' };
    }

    const row = {
      submission_id: submissionId,
      judge_id: me.id,
      team_name: teamName,
      comments: comments || {},
      feedback: feedback || null,
      status: finalise ? 'final' : 'draft',
    };
    for (const [key, column] of Object.entries(CRITERION_COLUMNS)) {
      const v = values?.[key];
      row[column] = v === '' || v === undefined || v === null ? null : Number(v);
    }

    const { data, error: err } = await supabase
      .from('scores')
      .upsert(row, { onConflict: 'submission_id,judge_id' })
      .select()
      .single();

    if (err) {
      return {
        ok: false,
        error: isMissingTable(err)
          ? 'Scoring tables are missing — apply supabase/patch_008_judging.sql.'
          : err.message,
      };
    }

    setScores((rows) => {
      const rest = rows.filter((r) => r.id !== data.id);
      return [...rest, data];
    });
    setSquads((rows) => rows.map(
      (r) => (r.name === teamName ? { ...r, score: data } : r),
    ));

    // Mark the submission scored so admin, the leaderboard and the squad agree.
    if (finalise) {
      await supabase.from('submissions')
        .update({ status: 'scored' }).eq('id', submissionId);
    }

    return { ok: true, score: data };
  }, [me]);

  const progress = useMemo(() => ({
    assigned: squads.length,
    scored: squads.filter((s) => s.score?.status === 'final').length,
    drafts: squads.filter((s) => s.score?.status === 'draft').length,
  }), [squads]);

  return {
    me, squads, scores, progress,
    status, error, migrationMissing,
    refetch: load, saveScore,
  };
}
