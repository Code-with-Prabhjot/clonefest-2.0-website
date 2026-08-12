import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

/**
 * Announcements broadcast from the admin console.
 *
 * Pinned entries sort first, then newest. Long bodies collapse behind a
 * "Read more" toggle so one long notice cannot push the rest of the dashboard
 * off the screen.
 */

const CARD = {
  background: '#0A191F',
  border: '1px solid rgba(179,224,242,0.10)',
  borderRadius: 3,
};

const AUDIENCE = { all: 'ALL HACKERS', leads: 'SQUAD LEADS', judges: 'JUDGES' };

const fmt = (iso) =>
  new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  }).toUpperCase();

export default function Announcements({ role }) {
  const [rows, setRows] = useState([]);
  const [state, setState] = useState('loading');
  const [open, setOpen] = useState({});

  useEffect(() => {
    let alive = true;
    supabase
      .from('announcements')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) return setState('error');
        // Leads-only notices stay hidden from members.
        const visible = (data || []).filter(
          (a) => a.audience === 'all'
            || (a.audience === 'leads' && role === 'lead')
            || (a.audience === 'judges' && ['judge', 'admin'].includes(role)),
        );
        setRows(visible);
        setState('ready');
      });
    return () => { alive = false; };
  }, [role]);

  if (state === 'error') return null;          // never block the dashboard

  return (
    <div style={CARD} className="overflow-hidden">
      {state === 'loading' && (
        <p className="font-jet animate-pulse px-5 py-6 text-[11px] uppercase tracking-[0.2em] text-[#5D91A6]">
          Loading announcements…
        </p>
      )}

      {state === 'ready' && rows.length === 0 && (
        <p className="px-5 py-6 text-[12.5px] leading-relaxed text-[#8AA5AE]">
          Nothing announced yet. Updates from the organisers appear here.
        </p>
      )}

      {state === 'ready' && rows.map((a, i) => {
        const isOpen = !!open[a.id];
        const long = (a.body || '').length > 220;
        return (
          <article
            key={a.id}
            className="px-5 py-4 sm:px-6"
            style={{
              borderTop: i === 0 ? 'none' : '1px solid rgba(179,224,242,0.06)',
              borderLeft: a.is_pinned ? '2px solid #B3E0F2' : '2px solid transparent',
            }}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <p className="min-w-0 flex-1 text-[13.5px] font-medium text-[#E4EEF2]">
                {a.is_pinned && (
                  <span className="font-jet mr-2 text-[9px] uppercase tracking-[0.16em] text-[#B3E0F2]">
                    Pinned
                  </span>
                )}
                {a.title}
              </p>
              <span className="font-jet shrink-0 text-[9.5px] uppercase tracking-[0.14em] text-[#56707B]">
                {fmt(a.created_at)}
              </span>
            </div>

            <p
              className="mt-2 whitespace-pre-line text-[12.5px] leading-relaxed text-[#8AA5AE]"
              style={isOpen || !long ? undefined : {
                display: '-webkit-box', WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}
            >
              {a.body}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="font-jet text-[9px] uppercase tracking-[0.16em] text-[#56707B]">
                {AUDIENCE[a.audience] || 'ALL HACKERS'}
              </span>
              {long && (
                <button
                  onClick={() => setOpen((o) => ({ ...o, [a.id]: !isOpen }))}
                  className="font-jet text-[9px] uppercase tracking-[0.16em] text-[#5D91A6] transition-colors hover:text-[#B3E0F2]"
                >
                  {isOpen ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
