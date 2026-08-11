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
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!profile?.team_name) return;
    let alive = true;

    supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('team_name', profile.team_name)
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) return setRosterState('error');
        const order = { lead: 0, member: 1 };
        setMembers((data || []).sort(
          (a, b) => (order[a.role] ?? 2) - (order[b.role] ?? 2) ||
            String(a.full_name).localeCompare(String(b.full_name)),
        ));
        setRosterState('ready');
      });

    return () => { alive = false; };
  }, [profile?.team_name]);

  const stats = useMemo(() => {
    const subs = submissions || [];
    // ── POINTS SEAM ───────────────────────────────────────────────────────
    // `submissions` has no points column yet. Once one exists, these two
    // reduce over it and the pending state below disappears on its own.
    const scored = subs.filter((s) => typeof s.points === 'number');
    const total = scored.reduce((n, s) => n + s.points, 0);

    return {
      submissions: subs.length,
      accepted: subs.filter((s) => ['accepted', 'scored'].includes(s.status)).length,
      hasPoints: scored.length > 0,
      total,
      average: scored.length ? (total / scored.length).toFixed(1) : null,
    };
  }, [submissions]);

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
        <Link
          to="/portal"
          className="font-jet text-[10px] uppercase tracking-[0.16em] text-[#5D91A6] transition-colors hover:text-[#B3E0F2]"
        >
          Challenge portal →
        </Link>
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
              {rosterState === 'ready' ? `${members.length} of 5` : '—'}
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


        </div>

        {/* Identity */}
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

          <Link
            to="/leaderboard"
            className="mt-5 block rounded-[2px] border border-[#B3E0F2]/20 px-4 py-2.5 text-center font-jet text-[10px] uppercase tracking-[0.16em] text-[#8AA5AE] transition-colors hover:border-[#B3E0F2]/45 hover:text-[#E4EEF2]"
          >
            View leaderboard →
          </Link>
        </div>
      </div>

    </>,
  );
}
