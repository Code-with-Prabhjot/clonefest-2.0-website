/**
 * SubmissionLog
 * Terminal-style table showing the team's full submission history.
 * Status chips mirror the Admin / Judge portal palette.
 */

const STATUS_CONFIG = {
  pending:  { label: 'PENDING',  color: '#5D91A6', bg: 'rgba(93,145,166,0.12)',  border: 'rgba(93,145,166,0.35)'  },
  accepted: { label: 'ACCEPTED', color: '#7FB27E', bg: 'rgba(127,178,126,0.12)', border: 'rgba(127,178,126,0.35)' },
  scored:   { label: 'SCORED',   color: '#B3E0F2', bg: 'rgba(179,224,242,0.12)', border: 'rgba(179,224,242,0.35)' },
  rejected: { label: 'REJECTED', color: '#C2564B', bg: 'rgba(194,86,75,0.12)',   border: 'rgba(194,86,75,0.35)'   },
};

function StatusChip({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span
      style={{
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: 2,
        padding: '2px 8px',
        fontSize: 9,
        letterSpacing: '0.18em',
        fontFamily: "'JetBrains Mono', monospace",
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {cfg.label}
    </span>
  );
}

function truncateUrl(url, max = 42) {
  if (!url) return '—';
  return url.length > max ? url.slice(0, max) + '…' : url;
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: '2-digit',
  });
}

export default function SubmissionLog({ submissions }) {
  if (!submissions || submissions.length === 0) {
    return (
      <div
        style={{
          borderTop: '1px solid rgba(179,224,242,0.08)',
          marginTop: 40,
          paddingTop: 32,
        }}
      >
        <p
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#56707B',
            marginBottom: 16,
          }}
        >
          &gt; Mission Log
        </p>
        <p
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            color: '#2E4A54',
            letterSpacing: '0.1em',
          }}
        >
          // no submissions on record — complete a mission to populate this log.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        borderTop: '1px solid rgba(179,224,242,0.08)',
        marginTop: 40,
        paddingTop: 32,
      }}
    >
      <p
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: '#56707B',
          marginBottom: 20,
        }}
      >
        &gt; Mission Log — {submissions.length} entr{submissions.length === 1 ? 'y' : 'ies'}
      </p>

      {/* Scrollable table wrapper */}
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
          }}
        >
          <thead>
            <tr>
              {['Track', 'PR URL', 'Status', 'Date'].map(col => (
                <th
                  key={col}
                  style={{
                    textAlign: 'left',
                    color: '#56707B',
                    fontSize: 9,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    padding: '0 16px 10px 0',
                    borderBottom: '1px solid rgba(179,224,242,0.08)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {submissions.map((sub, i) => (
              <tr
                key={sub.id}
                style={{
                  background: i % 2 === 0 ? 'transparent' : 'rgba(179,224,242,0.02)',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(179,224,242,0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(179,224,242,0.02)'}
              >
                <td style={{ padding: '10px 16px 10px 0', color: '#B3E0F2', whiteSpace: 'nowrap' }}>
                  {sub.track_id}
                </td>
                <td style={{ padding: '10px 16px 10px 0', color: '#8AA5AE', maxWidth: 260 }}>
                  <a
                    href={sub.pr_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={sub.pr_url}
                    style={{ color: 'inherit', textDecoration: 'none' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#B3E0F2'}
                    onMouseLeave={e => e.currentTarget.style.color = '#8AA5AE'}
                  >
                    {truncateUrl(sub.pr_url)}
                  </a>
                </td>
                <td style={{ padding: '10px 16px 10px 0', whiteSpace: 'nowrap' }}>
                  <StatusChip status={sub.status} />
                </td>
                <td style={{ padding: '10px 0 10px 0', color: '#56707B', whiteSpace: 'nowrap' }}>
                  {fmtDate(sub.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
