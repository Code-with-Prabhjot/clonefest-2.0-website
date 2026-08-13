import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useEventData, rankSquads } from '../hooks/useEventData';

/**
 * Public leaderboard.
 *
 * The schema has no score or points column, so standings are derived from
 * submissions.status: 'accepted' and 'scored' count as cleared, and squads are
 * ranked by cleared count, then by who got there first. If a points column
 * lands later, only `rank()` below needs to change.
 */

const PANEL = 'rounded-[3px] border border-[#B3E0F2]/10 bg-[#112026]';
const KICKER = 'font-jet text-[10px] uppercase tracking-[0.26em] text-[#5D91A6]';

const fmt = (iso) =>
  iso ? new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  }).toUpperCase() : '—';

const PLACE_COLOR = { 1: '#B3E0F2', 2: '#8AA5AE', 3: '#7FB27E' };

export default function Leaderboard() {
  // Same source as the admin console, so standings can never disagree.
  const { squads, stats, status, error, fetchedAt, refetch } = useEventData();
  const [myTeam, setMyTeam] = useState(null);
  const [query, setQuery] = useState('');

  const rows = useMemo(() => rankSquads(squads), [squads]);
  const load = refetch;
  const updatedAt = fetchedAt;

  useEffect(() => {
    // Highlighting your own squad is a nicety — never block the board on it.
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data?.user) return;
      const { data: me } = await supabase
        .from('profiles').select('team_name').eq('id', data.user.id).single();
      if (me?.team_name) setMyTeam(me.team_name);
    }).catch(() => {});
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? rows.filter((r) => r.name.toLowerCase().includes(q)) : rows;
  }, [rows, query]);

  const totals = {
    squads: stats.squads,
    points: stats.totalPoints,
    cleared: stats.cleared,
    submissions: stats.submissions,
  };

  const cols = 'grid grid-cols-[46px_1fr_74px_84px] sm:grid-cols-[64px_1fr_92px_100px_104px_150px]';

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#080D0C] pb-[var(--pet-lane)]">
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        backgroundImage: 'radial-gradient(rgba(93,145,166,.16) 1px, transparent 1px)',
        backgroundSize: '26px 26px', opacity: 0.5,
      }} />
      <div className="pointer-events-none fixed z-0" style={{
        top: '-260px', left: '-160px', width: '820px', height: '620px',
        background: 'radial-gradient(closest-side, rgba(93,145,166,.20), transparent)',
        filter: 'blur(20px)', animation: 'driftA 26s ease-in-out infinite',
      }} />
      <div className="pointer-events-none fixed z-0" style={{
        bottom: '-220px', right: '-200px', width: '720px', height: '560px',
        background: 'radial-gradient(closest-side, rgba(71,115,70,.20), transparent)',
        filter: 'blur(20px)', animation: 'driftB 32s ease-in-out infinite',
      }} />

      <header className="relative z-20 border-b border-[#B3E0F2]/10 bg-[#080D0C]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1180px] items-center gap-4 px-5 py-3.5 sm:px-8 sm:py-4">
          <img src="/assets/rvce-transparent.png" alt="RVCE"
               className="h-9 w-auto " />
          <img src="/assets/cc-transparent.png" alt="Coding Club"
               className="h-14 w-auto shrink-0 sm:h-16" />
          <span className="h-7 w-px bg-[#B3E0F2]/15" />
          <div>
            <p className="font-clash text-[15px] font-semibold tracking-[0.14em] text-[#B3E0F2] sm:text-[18px]">
              CLONEFEST 2.0
            </p>
            <p className="mt-1 font-jet text-[9px] uppercase tracking-[0.24em] text-[#56707B]">
              Standings
            </p>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-[1180px] px-5 py-10 sm:px-8 sm:py-14">
        <div className="flex flex-wrap items-baseline justify-between gap-3" style={{ animation: 'rise .5s ease-out both' }}>
          <div>
            <p className={KICKER}>Live standings</p>
          <h1 className="mt-3 font-clash text-[30px] font-medium leading-tight text-[#E4EEF2] sm:text-[40px]">
            Leaderboard
          </h1>
          <p className="mt-3 max-w-2xl text-[13.5px] leading-relaxed text-[#8AA5AE]">
            Ranked by points from finalised judge scores. Squads without a
            final score yet are ordered by cleared submissions.
          </p>
          </div>
          <div className="flex items-center gap-8">
            <Link to="/portal/team" className="font-jet text-[10px] uppercase tracking-[0.16em] text-[#5D91A6] transition-colors hover:text-[#B3E0F2]">
              Team portal →
            </Link>
            <Link to="/portal" className="font-jet text-[10px] uppercase tracking-[0.16em] text-[#5D91A6] transition-colors hover:text-[#B3E0F2]">
              Challenge portal →
            </Link>
          </div>
        </div>

        {status === 'ready' && (
          <div className="mt-8 grid grid-cols-3 border-y border-[#B3E0F2]/12"
               style={{ animation: 'rise .5s ease-out .08s both' }}>
            {[['Squads', totals.squads], ['Points awarded', totals.points], ['Submissions', totals.submissions]].map(
              ([label, value], i) => (
                <div key={label} className={`px-4 py-5 sm:px-6 ${i < 2 ? 'border-r border-[#B3E0F2]/12' : ''}`}>
                  <p className="font-clash text-[28px] font-medium leading-none text-[#E4EEF2] sm:text-[34px]"
                     style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</p>
                  <p className="mt-2 font-jet text-[10px] uppercase tracking-[0.2em] text-[#56707B]">{label}</p>
                </div>
              ))}
          </div>
        )}

        <div className={`${PANEL} mt-6 overflow-hidden`} style={{ animation: 'rise .5s ease-out .16s both' }}>
          <div className="flex flex-wrap items-center gap-3 border-b border-[#B3E0F2]/8 px-4 py-4 sm:px-5">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search squad"
              className="min-w-[180px] flex-1 rounded-[2px] border border-[#B3E0F2]/15 bg-[#0B1519] px-3.5 py-2.5 text-[13px] text-[#E4EEF2] outline-none transition-colors placeholder:text-[#56707B] focus:border-[#5D91A6]"
            />
            <span className="font-jet text-[10px] uppercase tracking-[0.16em] text-[#56707B]">
              {updatedAt ? `Updated ${fmt(updatedAt.toISOString())}` : '—'}
            </span>
            <button
              onClick={load}
              className="rounded-[2px] border border-[#B3E0F2]/20 px-3.5 py-2 font-jet text-[10px] uppercase tracking-[0.16em] text-[#8AA5AE] transition-colors hover:border-[#B3E0F2]/45 hover:text-[#E4EEF2]"
            >
              Refresh
            </button>
          </div>

          <div className={`${cols} border-b border-[#B3E0F2]/8 px-4 sm:px-5`}>
            {[['#', ''], ['Squad', ''], ['Points', 'text-right'],
              ['Cleared', 'hidden sm:block text-right'], ['Total', 'hidden sm:block text-right'],
              ['Last activity', 'hidden sm:block']].map(([label, cls]) => (
              <div key={label} className={`py-3.5 font-jet text-[10px] uppercase tracking-[0.16em] text-[#56707B] ${cls}`}>
                {label}
              </div>
            ))}
          </div>

          {status === 'loading' && (
            <div className="px-4 py-16 text-center sm:px-5">
              <p className="font-jet animate-pulse text-[11px] uppercase tracking-[0.24em] text-[#5D91A6]">
                Compiling standings…
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="px-4 py-14 text-center sm:px-5">
              <p className="font-jet text-[10px] uppercase tracking-[0.22em] text-[#C2564B]">
                Standings unavailable
              </p>
              <p className="mx-auto mt-3 max-w-md text-[13px] leading-relaxed text-[#8AA5AE]">{error}</p>
              <button onClick={load}
                      className="mt-5 rounded-[2px] border border-[#B3E0F2]/24 px-4 py-2.5 font-jet text-[10px] uppercase tracking-[0.16em] text-[#8AA5AE] transition-colors hover:border-[#B3E0F2]/45 hover:text-[#E4EEF2]">
                Try again
              </button>
            </div>
          )}

          {status === 'ready' && visible.length === 0 && (
            <div className="px-4 py-14 text-center sm:px-5">
              <p className="font-jet text-[10px] uppercase tracking-[0.22em] text-[#5D91A6]">
                {rows.length === 0 ? 'No squads yet' : 'No match'}
              </p>
              <p className="mx-auto mt-3 max-w-md text-[13px] leading-relaxed text-[#8AA5AE]">
                {rows.length === 0
                  ? 'Standings appear here once squads register and start submitting.'
                  : `Nothing matches “${query}”.`}
              </p>
            </div>
          )}

          {status === 'ready' && visible.map((r, i) => {
            const mine = r.name === myTeam;
            return (
              <div
                key={r.name}
                className={`${cols} items-center border-b border-[#B3E0F2]/6 px-4 transition-colors last:border-b-0 hover:bg-[#B3E0F2]/[0.03] sm:px-5 ${
                  mine ? 'bg-[#5D91A6]/10' : ''
                }`}
                style={{ animation: `rise .4s ease-out ${Math.min(i, 12) * 0.03}s both` }}
              >
                <div className="py-4 font-clash text-[17px] font-medium"
                     style={{ color: PLACE_COLOR[r.place] || '#56707B', fontVariantNumeric: 'tabular-nums' }}>
                  {String(r.place).padStart(2, '0')}
                </div>

                <div className="py-4 pr-3">
                  <p className="truncate text-[14px] font-medium text-[#E4EEF2]">
                    {r.name}
                    {mine && (
                      <span className="ml-2 font-jet text-[9px] uppercase tracking-[0.16em] text-[#B3E0F2]">
                        · you
                      </span>
                    )}
                  </p>
                  <p className="mt-1 font-jet text-[10px] uppercase tracking-[0.1em] text-[#56707B]">
                    {r.members} {r.members === 1 ? 'member' : 'members'}
                    <span className="sm:hidden"> · {r.cleared} cleared · {r.total} total</span>
                  </p>
                </div>

                <div className="py-4 text-right font-clash text-[19px] font-medium"
                     style={{ fontVariantNumeric: 'tabular-nums',
                              color: r.points == null ? '#56707B' : '#B3E0F2' }}>
                  {r.points == null ? '—' : r.points}
                </div>
                <div className="hidden py-4 text-right font-jet text-[13px] text-[#8AA5AE] sm:block">{r.cleared}</div>
                <div className="hidden py-4 text-right font-jet text-[13px] text-[#56707B] sm:block">{r.total}</div>
                <div className="hidden py-4 font-jet text-[11px] text-[#56707B] sm:block">{fmt(r.lastAt)}</div>
              </div>
            );
          })}
        </div>

        <p className="mt-6 font-jet text-[10px] uppercase tracking-[0.14em] text-[#56707B]">
          Rankings recalculate from submissions on every load
        </p>
      </main>
    </div>
  );
}
