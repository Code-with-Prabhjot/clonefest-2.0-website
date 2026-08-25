import { useState, useEffect } from 'react';
import SubmitPRModal from './SubmitPRModal';
import { useEventSettings } from '../../hooks/useEventSettings';

/**
 * TrackGrid
 * Responsive grid of "mission cards", one per problem track fetched from Supabase.
 *
 * Props:
 *  - tracks      : Track[]  — from useHackerData
 *  - submissions : Submission[]  — team's existing submissions
 *  - profile     : Profile  — current user profile (for role check + submit)
 *  - onRefetch   : () => void
 */



const SUBMISSION_DOT = {
  none: { color: '#2E4A54', label: 'Not submitted', pulse: false },
  pending: { color: '#5D91A6', label: 'Pending review', pulse: true },
  accepted: { color: '#7FB27E', label: 'Accepted', pulse: false },
  scored: { color: '#B3E0F2', label: 'Scored', pulse: false },
  rejected: { color: '#C2564B', label: 'Rejected', pulse: false },
};


function StatusDot({ status }) {
  const cfg = SUBMISSION_DOT[status] ?? SUBMISSION_DOT.none;
  return (
    <span
      title={cfg.label}
      style={{
        display: 'inline-block',
        width: 8, height: 8,
        borderRadius: '50%',
        background: cfg.color,
        flexShrink: 0,
        boxShadow: cfg.pulse ? `0 0 0 0 ${cfg.color}` : 'none',
        animation: cfg.pulse ? 'dotPulse 1.8s ease-in-out infinite' : 'none',
      }}
    />
  );
}



function MissionCard({ track, latestSub, profile, onCardClick, isExpired, serverTimeOffset }) {
  const [hovered, setHovered] = useState(false);
  const [now, setNow] = useState(() => Date.now() + (serverTimeOffset || 0));

  const getUnlockDate = (id) => {
    if (id === 'T1') return new Date('2026-08-20T18:00:00+05:30').getTime();
    if (id === 'T2') return new Date('2026-08-25T23:59:59+05:30').getTime();
    return 0;
  };

  const unlockTime = getUnlockDate(track.id);
  const isLocked = now < unlockTime;
  const trackIsExpired = track.id === 'T1' ? now >= new Date('2026-08-26T03:00:00+05:30').getTime() : isExpired;

  useEffect(() => {
    if (isLocked || (track.id === 'T1' && !trackIsExpired)) {
      const interval = setInterval(() => {
        setNow(Date.now() + (serverTimeOffset || 0));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isLocked, serverTimeOffset, track.id, trackIsExpired]);

  if (isLocked) {
    const timeLeft = Math.floor((unlockTime - now) / 1000);
    const d = Math.floor(timeLeft / (3600 * 24));
    const h = Math.floor((timeLeft % (3600 * 24)) / 3600);
    const m = Math.floor((timeLeft % 3600) / 60);
    const s = timeLeft % 60;

    const pad = (n) => String(n).padStart(2, '0');
    const timeString = `${d}d ${pad(h)}h ${pad(m)}m ${pad(s)}s`;

    return (
      <div
        style={{
          position: 'relative',
          background: '#071013',
          border: '1px dashed rgba(194,86,75,0.4)',
          borderRadius: 3,
          padding: '22px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          minHeight: '220px',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.1,
          background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #C2564B 10px, #C2564B 20px)'
        }} />

        <div style={{
          position: 'relative', zIndex: 1, textAlign: 'center',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          <div style={{
            fontSize: 18, color: '#E4EEF2', letterSpacing: '0.05em',
            background: 'rgba(194,86,75,0.15)', padding: '8px 16px', borderRadius: 4,
            border: '1px solid rgba(194,86,75,0.3)'
          }}>
            {timeString}
          </div>
          <div style={{
            fontSize: 10, color: '#56707B', marginTop: 12, letterSpacing: '0.1em', textTransform: 'uppercase'
          }}>
            Time until transmission unlocks
          </div>
        </div>
      </div>
    );
  }

  const subStatus = latestSub?.status ?? 'none';
  const dotCfg = SUBMISSION_DOT[subStatus] ?? SUBMISSION_DOT.none;

  return (
    <div
      onClick={() => onCardClick(track)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        background: hovered ? '#0D1E24' : '#0A191F',
        border: `1px solid ${hovered ? 'rgba(179,224,242,0.25)' : 'rgba(179,224,242,0.10)'}`,
        borderRadius: 3,
        padding: '22px 20px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: hovered ? '0 0 24px rgba(179,224,242,0.06)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        overflow: 'hidden',
        height: '100%',
        minHeight: '220px',
      }}
    >
      {/* Scanline hover overlay */}
      {hovered && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(179,224,242,0.015) 2px, rgba(179,224,242,0.015) 4px)',
        }} />
      )}

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Top row: Track ID badge + status dot */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11, letterSpacing: '0.22em',
            textTransform: 'uppercase', color: '#5D91A6',
          }}>
            {track.id}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <StatusDot status={subStatus} />
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9, letterSpacing: '0.15em',
              textTransform: 'uppercase', color: dotCfg.color,
            }}>
              {dotCfg.label}
            </span>
          </span>
        </div>

        {/* Track title */}
        <h3 style={{
          color: '#E4EEF2', fontSize: 16, fontWeight: 600,
          margin: '0 0 4px 0', lineHeight: 1.3,
        }}>
          {track.id === 'T1' ? 'Legacy Modernisation: PrivateBin' : track.id === 'T2' ? 'Developer Tool Reconstruction – Bugzilla' : track.title}
        </h3>

        {/* Footer: repo link */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {track.repo_url && (
            <a
              href={track.repo_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10, letterSpacing: '0.12em',
                color: '#5D91A6', textDecoration: 'none',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#B3E0F2'}
              onMouseLeave={e => e.currentTarget.style.color = '#5D91A6'}
            >
              View repo →
            </a>
          )}
        </div>

        {/* Action button */}
        <div>
          <button
            style={{
              width: '100%',
              padding: '9px 0',
              background: 'transparent',
              border: `1px solid ${trackIsExpired
                ? 'rgba(194,86,75,0.2)'
                : hovered
                  ? 'rgba(179,224,242,0.3)'
                  : 'rgba(179,224,242,0.12)'
                }`,
              borderRadius: 2,
              color: trackIsExpired ? '#56707B' : hovered ? '#B3E0F2' : '#5D91A6',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10, letterSpacing: '0.2em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {profile?.role === 'lead'
              ? trackIsExpired
                ? 'View details'
                : latestSub
                  ? (latestSub.status === 'scored' ? 'View details' : 'Resubmit / View')
                  : 'Submit mission'
              : 'View details'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TrackGrid({ tracks, submissions, profile, onRefetch }) {
  const [activeTrack, setActiveTrack] = useState(null);
  const { isExpired: globalIsExpired, serverTimeOffset } = useEventSettings();

  // Map track_id → latest submission for that track
  const subByTrack = {};
  submissions.forEach(s => {
    if (!subByTrack[s.track_id] || new Date(s.created_at) > new Date(subByTrack[s.track_id].created_at)) {
      subByTrack[s.track_id] = s;
    }
  });

  const handleCardClick = (track) => setActiveTrack(track);
  const handleClose = () => setActiveTrack(null);
  const handleSuccess = () => { onRefetch(); };

  if (!tracks || tracks.length === 0) {
    return (
      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#2E4A54', letterSpacing: '0.1em', padding: '20px 0' }}>
        // no tracks loaded — check Supabase connection.
      </p>
    );
  }

  const visibleTracks = tracks.filter(t => t.id === 'T1' || t.id === 'T2');

  return (
    <>
      {/* Pulse animation for status dots */}
      <style>{`
        @keyframes dotPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(93,145,166,0.6); }
          50%       { box-shadow: 0 0 0 6px rgba(93,145,166,0); }
        }
        @keyframes rise {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 16,
      }}>
        {visibleTracks.map(track => {
          return (
            <MissionCard
              key={track.id}
              track={track}
              latestSub={subByTrack[track.id] ?? null}
              profile={profile}
              onCardClick={handleCardClick}
              isExpired={globalIsExpired}
              serverTimeOffset={serverTimeOffset}
            />
          );
        })}
      </div>

      {activeTrack && (
        <SubmitPRModal
          track={activeTrack}
          profile={profile}
          existingSub={subByTrack[activeTrack.id] ?? null}
          isExpired={globalIsExpired}
          serverTimeOffset={serverTimeOffset}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
