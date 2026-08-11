import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

/**
 * Compact squad summary, shown beside the status terminal on the dashboard.
 *
 * Deliberately does not repeat the invite code — StatusCard already carries it
 * for leads. This panel exists for the one thing the dashboard was missing:
 * who is actually on your squad.
 */
export default function SquadCard({ profile }) {
  const [members, setMembers] = useState([]);
  const [state, setState] = useState('loading'); // loading | ready | error

  useEffect(() => {
    if (!profile?.team_name) return;
    let alive = true;

    supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('team_name', profile.team_name)
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) return setState('error');
        const order = { lead: 0, member: 1 };
        setMembers(
          (data || []).sort(
            (a, b) => (order[a.role] ?? 2) - (order[b.role] ?? 2) ||
              String(a.full_name).localeCompare(String(b.full_name)),
          ),
        );
        setState('ready');
      });

    return () => { alive = false; };
  }, [profile?.team_name]);

  const Row = ({ label, value }) => (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <span className="font-jet text-[10px] uppercase tracking-[0.16em] text-[#56707B]">
        {label}
      </span>
      <span className="truncate text-[13px] text-[#E4EEF2]">{value}</span>
    </div>
  );

  return (
    <div
      style={{
        background: '#0A191F',
        border: '1px solid rgba(179,224,242,0.10)',
        borderRadius: 3,
        padding: '18px 20px',
      }}
    >
      <p className="font-jet text-[10px] uppercase tracking-[0.22em] text-[#5D91A6]">
        Squad detail
      </p>

      <div className="mt-3 divide-y divide-[#B3E0F2]/[0.07] border-y border-[#B3E0F2]/[0.07]">
        <Row label="Squad" value={profile?.team_name ?? '—'} />
        <Row label="Your role" value={(profile?.role ?? '—').toUpperCase()} />
        <Row
          label="Members"
          value={state === 'ready' ? `${members.length} of 5` : '—'}
        />
      </div>

      <p className="mt-4 font-jet text-[10px] uppercase tracking-[0.16em] text-[#56707B]">
        Roster
      </p>

      {state === 'loading' && (
        <p className="mt-3 font-jet animate-pulse text-[11px] tracking-[0.16em] text-[#5D91A6]">
          Loading…
        </p>
      )}

      {state === 'error' && (
        <p className="mt-3 text-[12px] leading-relaxed text-[#8AA5AE]">
          Roster unavailable right now.
        </p>
      )}

      {state === 'ready' && (
        <ul className="mt-3 space-y-2">
          {members.map((m) => {
            const you = m.id === profile?.id;
            return (
              <li key={m.id} className="flex items-center gap-2.5">
                <span
                  className="grid h-6 w-6 flex-none place-items-center rounded-[2px] border font-jet text-[9px]"
                  style={{
                    borderColor: m.role === 'lead'
                      ? 'rgba(127,178,126,0.45)' : 'rgba(179,224,242,0.14)',
                    color: m.role === 'lead' ? '#7FB27E' : '#8AA5AE',
                  }}
                >
                  {(m.full_name || '?').slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1 truncate text-[12.5px] text-[#E4EEF2]">
                  {m.full_name || 'operative'}
                  {you && (
                    <span className="ml-1.5 font-jet text-[9px] uppercase tracking-[0.14em] text-[#5D91A6]">
                      · you
                    </span>
                  )}
                </span>
                {m.role === 'lead' && (
                  <span className="font-jet flex-none text-[9px] uppercase tracking-[0.14em] text-[#7FB27E]">
                    Lead
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
