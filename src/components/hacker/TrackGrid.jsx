import { useState } from 'react';
import SubmitPRModal from './SubmitPRModal';

/**
 * TrackGrid
 * Responsive grid of "mission cards", one per problem track fetched from Supabase.
 *
 * Props:
 *  - tracks      : Track[]  — from useHackerData
 *  - submissions : Submission[]  — team's existing submissions
 *  - profile     : Profile  — current user profile (for role check + submit)
 */

const DIFFICULTY_CONFIG = {
  Easy:   { color: '#7FB27E', bg: 'rgba(127,178,126,0.12)', border: 'rgba(127,178,126,0.35)' },
  Medium: { color: '#B3E0F2', bg: 'rgba(179,224,242,0.12)', border: 'rgba(179,224,242,0.35)' },
  Hard:   { color: '#C2564B', bg: 'rgba(194,86,75,0.12)',   border: 'rgba(194,86,75,0.35)'   },
};

const SUBMISSION_DOT = {
  none:     { color: '#2E4A54', label: 'Not submitted', pulse: false },
  pending:  { color: '#5D91A6', label: 'Pending review', pulse: true  },
  accepted: { color: '#7FB27E', label: 'Accepted',       pulse: false },
  scored:   { color: '#B3E0F2', label: 'Scored',         pulse: false },
  rejected: { color: '#C2564B', label: 'Rejected',       pulse: false },
};

function DifficultyChip({ difficulty }) {
  const cfg = DIFFICULTY_CONFIG[difficulty] ?? DIFFICULTY_CONFIG.Medium;
  return (
    <span style={{
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
      borderRadius: 2, padding: '2px 8px',
      fontSize: 9, letterSpacing: '0.18em',
      fontFamily: "'JetBrains Mono', monospace",
      textTransform: 'uppercase', whiteSpace: 'nowrap',
    }}>
      {difficulty ?? 'Medium'}
    </span>
  );
}

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

function MissionCard({ track, latestSub, profile, onCardClick }) {
  const [hovered, setHovered] = useState(false);
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
      }}
    >
      {/* Scanline hover overlay */}
      {hovered && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(179,224,242,0.015) 2px, rgba(179,224,242,0.015) 4px)',
        }} />
      )}

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Top row: Track ID badge + status dot */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
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
          margin: '0 0 8px 0', lineHeight: 1.3,
        }}>
          {track.title}
        </h3>

        {/* Description */}
        <p style={{
          color: '#8AA5AE', fontSize: 12.5, lineHeight: 1.6, margin: '0 0 14px 0',
        }}>
          {track.description ?? 'No description available.'}
        </p>

        {/* Footer: difficulty chip + repo link */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <DifficultyChip difficulty={track.difficulty} />
          {track.repo_url && (
            <a
              href={track.repo_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()} // don't open modal on repo link click
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

        {/* Submit / View button */}
        <div style={{ marginTop: 16 }}>
          <button
            style={{
              width: '100%',
              padding: '9px 0',
              background: 'transparent',
              border: `1px solid ${hovered ? 'rgba(179,224,242,0.3)' : 'rgba(179,224,242,0.12)'}`,
              borderRadius: 2,
              color: hovered ? '#B3E0F2' : '#5D91A6',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10, letterSpacing: '0.2em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {profile?.role === 'lead'
              ? (latestSub ? 'Resubmit / View' : 'Submit mission')
              : 'View details'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TrackGrid({ tracks, submissions, profile, onRefetch }) {
  const [activeTrack, setActiveTrack] = useState(null);

  // Map track_id → latest submission for that track
  const subByTrack = {};
  submissions.forEach(s => {
    // Keep the most recent one per track
    if (!subByTrack[s.track_id] || new Date(s.created_at) > new Date(subByTrack[s.track_id].created_at)) {
      subByTrack[s.track_id] = s;
    }
  });

  const handleCardClick = (track) => setActiveTrack(track);
  const handleClose     = ()      => setActiveTrack(null);
  const handleSuccess   = ()      => { onRefetch(); };

  if (!tracks || tracks.length === 0) {
    return (
      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#2E4A54', letterSpacing: '0.1em', padding: '20px 0' }}>
        // no tracks loaded — check Supabase connection.
      </p>
    );
  }

  return (
    <>
      {/* Pulse animation for status dots */}
      <style>{`
        @keyframes dotPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(93,145,166,0.6); }
          50%       { box-shadow: 0 0 0 6px rgba(93,145,166,0); }
        }
      `}</style>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: 16,
      }}>
        {tracks.map(track => (
          <MissionCard
            key={track.id}
            track={track}
            latestSub={subByTrack[track.id] ?? null}
            profile={profile}
            onCardClick={handleCardClick}
          />
        ))}
      </div>

      {activeTrack && (
        <SubmitPRModal
          track={activeTrack}
          profile={profile}
          existingSub={subByTrack[activeTrack.id] ?? null}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
