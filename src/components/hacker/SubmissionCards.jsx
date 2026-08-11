/**
 * Submission history as cards.
 *
 * Card-per-entry rather than the terminal table used on the dashboard: this
 * page shows them in a narrower column, where a wide table would either
 * squeeze or scroll sideways.
 */

const STATUS = {
  pending:  { label: 'PENDING',  color: '#5D91A6', bg: 'rgba(93,145,166,0.12)',  border: 'rgba(93,145,166,0.35)'  },
  accepted: { label: 'ACCEPTED', color: '#7FB27E', bg: 'rgba(127,178,126,0.12)', border: 'rgba(127,178,126,0.35)' },
  scored:   { label: 'SCORED',   color: '#B3E0F2', bg: 'rgba(179,224,242,0.12)', border: 'rgba(179,224,242,0.35)' },
  rejected: { label: 'REJECTED', color: '#C2564B', bg: 'rgba(194,86,75,0.12)',   border: 'rgba(194,86,75,0.35)'   },
};

function prLabel(url) {
  if (!url) return '—';
  const m = String(url).match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/i);
  return m ? `${m[2]} #${m[3]}` : String(url).replace(/^https?:\/\//, '').slice(0, 40);
}

const fmt = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).toUpperCase() : '—';

export default function SubmissionCards({ submissions }) {
  const rows = submissions || [];

  if (rows.length === 0) {
    return (
      <div
        className="px-5 py-10 text-center"
        style={{ background: '#0A191F', border: '1px solid rgba(179,224,242,0.10)', borderRadius: 3 }}
      >
        <p className="font-jet text-[10px] uppercase tracking-[0.22em] text-[#5D91A6]">
          No submissions yet
        </p>
        <p className="mt-3 text-[12.5px] leading-relaxed text-[#8AA5AE]">
          Entries appear here once your squad submits a pull request.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {rows.map((s) => {
        const cfg = STATUS[s.status] ?? STATUS.pending;
        return (
          <article
            key={s.id}
            className="flex flex-col p-4 transition-colors hover:border-[#B3E0F2]/25"
            style={{
              background: '#0A191F',
              border: '1px solid rgba(179,224,242,0.10)',
              borderRadius: 3,
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <span
                className="font-jet rounded-[2px] border px-2 py-1 text-[9px] uppercase tracking-[0.16em]"
                style={{ borderColor: 'rgba(179,224,242,0.16)', color: '#8AA5AE' }}
              >
                {s.track_id ?? '—'}
              </span>
              <span
                className="font-jet rounded-[2px] border px-2 py-1 text-[9px] uppercase tracking-[0.18em]"
                style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
              >
                {cfg.label}
              </span>
            </div>

            {s.pr_url ? (
              <a
                href={s.pr_url}
                target="_blank"
                rel="noreferrer"
                className="font-jet mt-3 block truncate text-[12.5px] text-[#B3E0F2] transition-colors hover:text-[#E4EEF2]"
                title={s.pr_url}
              >
                {prLabel(s.pr_url)} ↗
              </a>
            ) : (
              <span className="font-jet mt-3 text-[12.5px] text-[#8AA5AE]">No link</span>
            )}

            {s.notes && (
              <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-[#8AA5AE]">
                {s.notes}
              </p>
            )}

            <div className="mt-auto flex items-center justify-between gap-3 pt-3">
              <span className="font-jet text-[9.5px] uppercase tracking-[0.14em] text-[#8AA5AE]">
                {fmt(s.created_at)}
              </span>
              {typeof s.points === 'number' && (
                <span className="font-clash text-[15px] font-medium text-[#7FB27E]"
                      style={{ fontVariantNumeric: 'tabular-nums' }}>
                  +{s.points}
                </span>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
