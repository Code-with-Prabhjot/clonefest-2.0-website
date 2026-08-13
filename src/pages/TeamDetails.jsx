import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import CyberGrid from '../components/ui/CyberGrid';
import CyberHeader from '../components/ui/CyberHeader';
import { supabase } from '../lib/supabase';
import { useHackerData } from '../hooks/useHackerData';


/**
 * Squad detail page.
 *
 * Submission count is real. Total points and average score have no source yet —
 * `submissions` carries only a status, no points column — so they render as
 * pending rather than as a fabricated zero. See POINTS SEAM below.
 */


const CARD = {
  background: '#0A191F',
  border: '1px solid rgba(179,224,242,0.10)',
  borderRadius: 3,
};

function Kicker({ children }) {
  return (
    <p className="font-jet text-[10px] uppercase tracking-[0.22em] text-[#5D91A6]">
      {children}
    </p>
  );
}

function Stat({ label, value, note, accent = '#E4EEF2' }) {
  return (
    <div className="px-5 py-5 sm:px-6">
      <p
        className="font-clash text-[30px] font-medium leading-none sm:text-[36px]"
        style={{ color: accent, fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </p>
      <p className="mt-2.5 font-jet text-[10px] uppercase tracking-[0.2em] text-[#B3E0F2]">
        {label}
      </p>
      {note && (
        <p className="mt-1.5 font-jet text-[9px] uppercase tracking-[0.14em] text-[#8AA5AE]">
          {note}
        </p>
      )}
    </div>
  );
}

function Row({ label, value, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="font-jet text-[10px] uppercase tracking-[0.16em] text-[#8AA5AE]">
        {label}
      </span>
      {children ?? (
        <span className="truncate text-[13.5px] text-[#E4EEF2]">{value}</span>
      )}
    </div>
  );
}

export default function TeamDetails() {
  const { profile, team, submissions, loading } = useHackerData();
  const [members, setMembers] = useState([]);
  const [rosterState, setRosterState] = useState('loading');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [copied, setCopied] = useState(false);
  const [totals, setTotals] = useState(null);   // finalised score totals
  const [isOpen, setIsOpen] = useState(null);       // null = not yet loaded
  const [togglingOpen, setTogglingOpen] = useState(false);

  useEffect(() => {
    if (!profile?.team_name) return;
    let alive = true;

    async function fetchData() {
      try {
        const { data: membersData, error: membersError } = await supabase
          .from('profiles')
          .select('id, full_name, role')
          .eq('team_name', profile.team_name);

        if (membersError) throw membersError;

        if (!alive) return;
        const order = { lead: 0, member: 1 };
        setMembers((membersData || []).sort(
          (a, b) => (order[a.role] ?? 2) - (order[b.role] ?? 2) ||
            String(a.full_name).localeCompare(String(b.full_name)),
        ));
        setRosterState('ready');

        if (profile.role === 'lead') {
          const { data: reqData, error: reqError } = await supabase
            .from('team_requests')
            .select('id, user_id, status')
            .eq('team_name', profile.team_name)
            .eq('status', 'pending');
            
          if (!reqError && alive && reqData && reqData.length > 0) {
            // Explicitly fetch requester profiles by their IDs so we
            // always get the full_name even if the FK join returns null.
            const userIds = reqData.map(r => r.user_id);
            const { data: requesterProfiles } = await supabase
              .from('profiles')
              .select('id, full_name')
              .in('id', userIds);

            const profileMap = Object.fromEntries(
              (requesterProfiles || []).map(p => [p.id, p])
            );

            setPendingRequests(
              reqData.map(r => ({
                ...r,
                profiles: profileMap[r.user_id] || null,
              }))
            );
          } else if (!reqError && alive) {
            setPendingRequests([]);
          }
        }
      } catch (err) {
        if (alive) setRosterState('error');
      }
    }

    fetchData();

    return () => { alive = false; };
  }, [profile?.team_name, profile?.role]);

  // Finalised judge scores for this squad, via public.leaderboard_totals.
  useEffect(() => {
    if (!profile?.team_name) return;
    let alive = true;
    supabase
      .from('leaderboard_totals')
      .select('points, scored_count')
      .eq('team_name', profile.team_name)
      .maybeSingle()
      .then(({ data, error }) => {
        if (alive && !error) setTotals(data || null);
      });
    return () => { alive = false; };
  }, [profile?.team_name]);

  // Sync is_open from team object once it loads
  useEffect(() => {
    const timer = setTimeout(() => {
      if (team && isOpen === null) {
        setIsOpen(!!team.is_open);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [team, isOpen]);

  const handleToggleListing = async () => {
    if (togglingOpen) return;
    const next = !isOpen;
    setIsOpen(next);
    setTogglingOpen(true);
    try {
      const { error } = await supabase
        .from('teams')
        .update({ is_open: next })
        .eq('name', profile.team_name);
      if (error) throw error;
    } catch (err) {
      // revert
      setIsOpen(!next);
      alert('Failed to update listing: ' + err.message);
    } finally {
      setTogglingOpen(false);
    }
  };

  const handleRequestAction = async (requestId, userId, action) => {
    try {
      if (action === 'accept') {
        const { error } = await supabase.rpc('accept_team_request', { p_request_id: requestId });
        if (error) throw error;
        
        const newMemberName = pendingRequests.find(r => r.id === requestId)?.profiles?.full_name;
        setMembers(prev => [...prev, { id: userId, full_name: newMemberName, role: 'member' }]);
        setPendingRequests(prev => prev.filter(r => r.id !== requestId));
      } else if (action === 'reject') {
        await supabase.from('team_requests').update({ status: 'rejected' }).eq('id', requestId);
        setPendingRequests(prev => prev.filter(r => r.id !== requestId));
      }
    } catch (err) {
      alert('Error updating request: ' + err.message);
    }
  };

  const stats = useMemo(() => {
    const subs = submissions || [];
    const scoredCount = totals?.scored_count || 0;
    const total = totals?.points ?? 0;

    return {
      submissions: subs.length,
      accepted: subs.filter((s) => ['accepted', 'scored'].includes(s.status)).length,
      hasPoints: scoredCount > 0,
      total,
      average: scoredCount ? (total / scoredCount).toFixed(1) : null,
    };
  }, [submissions, totals]);

  const copyCode = () => {
    navigator.clipboard.writeText(team?.invite_code ?? '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shell = (children) => (
    <div className="relative min-h-screen bg-[#080D0C] text-[#E4EEF2] pb-[var(--pet-lane)]">
      <CyberGrid variant="cyan" />
      <CyberHeader variant="cyan" />
      <div className="relative z-10 mx-auto max-w-[1100px] px-5 pb-16 pt-28 sm:pt-32">
        {children}
      </div>
    </div>
  );

  if (loading) {
    return shell(
      <p className="font-jet animate-pulse py-24 text-center text-[13px] uppercase tracking-[0.22em] text-[#5D91A6]">
        Fetching squad record…
      </p>,
    );
  }

  if (!profile?.team_name) {
    return <Navigate to="/portal" replace />;
  }

  const isLead = profile?.role === 'lead';

  return shell(
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <Kicker>Squad detail</Kicker>
          <h1 className="font-clash mt-3 text-[30px] font-medium leading-tight text-[#E4EEF2] sm:text-[38px]">
            {profile.team_name}
          </h1>
        </div>
        <div className="flex items-center gap-8">
          <Link
            to="/portal"
            className="font-jet text-[10px] uppercase tracking-[0.16em] text-[#5D91A6] transition-colors hover:text-[#B3E0F2]"
          >
            Challenge portal →
          </Link>
          <Link
            to="/leaderboard"
            className="font-jet text-[10px] uppercase tracking-[0.16em] text-[#5D91A6] transition-colors hover:text-[#B3E0F2]"
          >
            View leaderboard →
          </Link>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = '/';
            }}
            className="font-jet text-[10px] uppercase tracking-[0.16em] text-[#5D91A6] transition-colors hover:text-[#B3E0F2]"
          >
            Logout →
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div
        className="mt-8 grid grid-cols-1 divide-y divide-[#B3E0F2]/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0"
        style={CARD}
      >
        <Stat
          label="Total points"
          value={stats.hasPoints ? stats.total : '—'}
          note={stats.hasPoints ? null : 'Awaiting scoring'}
          accent={stats.hasPoints ? '#B3E0F2' : '#8AA5AE'}
        />
        <Stat
          label="Average score"
          value={stats.average ?? '—'}
          note={stats.average ? 'Per scored submission' : 'Awaiting scoring'}
          accent={stats.average ? '#7FB27E' : '#8AA5AE'}
        />
        <Stat
          label="Submissions"
          value={stats.submissions}
          note={`${stats.accepted} accepted`}
        />
      </div>

      <div className="mt-5 grid items-start gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
        {/* Left column: roster, then submission history directly beneath it */}
        <div className="flex flex-col gap-5">
        <div style={CARD} className="p-5 sm:p-6">
          <div className="flex items-baseline justify-between gap-3">
            <Kicker>Roster</Kicker>
            <span className="font-jet text-[10px] uppercase tracking-[0.16em] text-[#8AA5AE]">
              {rosterState === 'ready' ? `${members.length} of 4` : '—'}
            </span>
          </div>

          {rosterState === 'loading' && (
            <p className="font-jet mt-5 animate-pulse text-[11px] tracking-[0.16em] text-[#5D91A6]">
              Loading…
            </p>
          )}
          {rosterState === 'error' && (
            <p className="mt-5 text-[12.5px] leading-relaxed text-[#8AA5AE]">
              Roster unavailable right now.
            </p>
          )}

          {rosterState === 'ready' && (
            <ul className="mt-4 divide-y divide-[#B3E0F2]/[0.07] border-t border-[#B3E0F2]/[0.07]">
              {members.map((m) => {
                const you = m.id === profile?.id;
                return (
                  <li key={m.id} className="flex items-center gap-3 py-3">
                    <span
                      className="font-jet grid h-8 w-8 flex-none place-items-center rounded-[2px] border text-[10px]"
                      style={{
                        borderColor: m.role === 'lead'
                          ? 'rgba(127,178,126,0.45)' : 'rgba(179,224,242,0.14)',
                        color: m.role === 'lead' ? '#7FB27E' : '#8AA5AE',
                      }}
                    >
                      {(m.full_name || '?').slice(0, 2).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13.5px] text-[#E4EEF2]">
                      {m.full_name || 'operative'}
                      {you && (
                        <span className="font-jet ml-2 text-[9px] uppercase tracking-[0.14em] text-[#5D91A6]">
                          · you
                        </span>
                      )}
                    </span>
                    <span
                      className="font-jet flex-none text-[9px] uppercase tracking-[0.14em]"
                      style={{ color: m.role === 'lead' ? '#7FB27E' : '#8AA5AE' }}
                    >
                      {m.role}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {isLead && pendingRequests.length > 0 && (
            <div style={CARD} className="p-5 sm:p-6 mt-5">
              <Kicker>Pending Enlistments</Kicker>
              <ul className="mt-4 divide-y divide-[#B3E0F2]/[0.07] border-t border-[#B3E0F2]/[0.07]">
                {pendingRequests.map(req => (
                  <li key={req.id} className="flex items-center justify-between gap-3 py-3">
                    <span className="min-w-0 flex-1 truncate text-[13.5px] text-[#E4EEF2]">
                      {req.profiles?.full_name || (
                        <span className="font-jet text-[11px] text-[#56707B] tracking-[0.1em]">
                          uid:{req.user_id.slice(0, 8)}
                        </span>
                      )}
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => handleRequestAction(req.id, req.user_id, 'accept')} className="font-jet rounded-[2px] border border-[rgba(127,178,126,0.3)] bg-[rgba(127,178,126,0.1)] px-3 py-1 text-[9px] uppercase tracking-[0.16em] text-[#7FB27E] transition-colors hover:bg-[rgba(127,178,126,0.2)]">
                        Accept
                      </button>
                      <button onClick={() => handleRequestAction(req.id, req.user_id, 'reject')} className="font-jet rounded-[2px] border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.1)] px-3 py-1 text-[9px] uppercase tracking-[0.16em] text-red-400 transition-colors hover:bg-[rgba(239,68,68,0.2)]">
                        Reject
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>

        <div style={CARD} className="p-5 sm:p-6">
          <Kicker>Details</Kicker>
          <div className="mt-3 divide-y divide-[#B3E0F2]/[0.07] border-y border-[#B3E0F2]/[0.07]">
            <Row label="Squad" value={profile.team_name} />
            <Row label="Your role" value={(profile.role ?? '—').toUpperCase()} />
            {isLead && team?.invite_code && (
              <Row label="Invite code">
                <span className="flex items-center gap-2">
                  <span
                    className="font-jet rounded-[2px] px-2 py-1 text-[12.5px] tracking-[0.12em] text-[#E4EEF2]"
                    style={{ background: 'rgba(179,224,242,0.08)' }}
                  >
                    {team.invite_code}
                  </span>
                  <button
                    onClick={copyCode}
                    className="font-jet rounded-[2px] border px-2 py-1 text-[9px] uppercase tracking-[0.16em] transition-colors"
                    style={{
                      borderColor: copied ? 'rgba(127,178,126,0.5)' : 'rgba(179,224,242,0.2)',
                      color: copied ? '#7FB27E' : '#5D91A6',
                      background: copied ? 'rgba(127,178,126,0.1)' : 'transparent',
                    }}
                  >
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </span>
              </Row>
            )}

          </div>

          {!isLead && (
            <p className="mt-4 font-jet text-[10px] uppercase tracking-[0.14em] text-[#8AA5AE]">
              Only the squad lead can see the invite code
            </p>
          )}
        </div>
      </div>

    </>,
  );
}
