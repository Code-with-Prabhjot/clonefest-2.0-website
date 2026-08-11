import { useState } from 'react';
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

// ── Compact countdown banner shown above the track grid ───────────────────
function CountdownBanner({ secondsLeft, isExpired, deadline }) {
  if (!deadline && !isExpired) return null;

  const formatCountdown = (secs) => {
    if (secs == null || secs < 0) return '00:00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return [h, m, s].map(n => String(n).padStart(2, '0')).join(':');
  };

  const critical = isExpired || (secondsLeft != null && secondsLeft < 300);
  const warn     = !critical && secondsLeft != null && secondsLeft < 1800;

  const bgColor     = isExpired ? 'rgba(194,86,75,0.1)'   : warn ? 'rgba(224,155,74,0.08)' : 'rgba(93,145,166,0.06)';
  const borderColor = isExpired ? 'rgba(194,86,75,0.4)'   : warn ? 'rgba(224,155,74,0.35)' : 'rgba(93,145,166,0.25)';
  const textColor   = isExpired ? '#C2564B'                : warn ? '#E09B4A'               : '#5D91A6';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 20,
        padding: '10px 16px',
        background: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: 3,
        animation: 'rise .4s ease-out both',
      }}
    >
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: textColor,
        }}
      >
        {isExpired ? '✕ Submissions closed' : '⏱ Submission window'}
      </span>
      {!isExpired && (
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 18,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '0.06em',
            color: textColor,
            textShadow: critical
              ? '0 0 12px rgba(194,86,75,0.4)'
              : warn
              ? '0 0 12px rgba(224,155,74,0.3)'
              : 'none',
          }}
        >
          {formatCountdown(secondsLeft)}
        </span>
      )}
    </div>
  );
}

function MissionCard({ track, latestSub, profile, onCardClick, isExpired }) {
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
          margin: '0 0 4px 0', lineHeight: 1.3,
        }}>
          {track.title}
        </h3>

        {/* Subtitle */}
        {track.subtitle && (
          <p style={{
            color: '#5D91A6', fontSize: 11.5, margin: '0 0 10px', lineHeight: 1.4,
            fontStyle: 'italic',
          }}>
            {track.subtitle}
          </p>
        )}

        {/* Short description (fallback if no subtitle) */}
        {!track.subtitle && track.description && (
          <p style={{
            color: '#8AA5AE', fontSize: 12.5, lineHeight: 1.6, margin: '0 0 14px 0',
          }}>
            {track.description}
          </p>
        )}

        {/* Footer: difficulty chip + repo link */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          <DifficultyChip difficulty={track.difficulty} />
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
        <div style={{ marginTop: 16 }}>
          <button
            style={{
              width: '100%',
              padding: '9px 0',
              background: 'transparent',
              border: `1px solid ${
                isExpired
                  ? 'rgba(194,86,75,0.2)'
                  : hovered
                  ? 'rgba(179,224,242,0.3)'
                  : 'rgba(179,224,242,0.12)'
              }`,
              borderRadius: 2,
              color: isExpired ? '#56707B' : hovered ? '#B3E0F2' : '#5D91A6',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10, letterSpacing: '0.2em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {profile?.role === 'lead'
              ? isExpired
                ? 'View details'
                : latestSub ? 'Resubmit / View' : 'Submit mission'
              : 'View details'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TrackGrid({ tracks, submissions, profile, onRefetch }) {
  const [activeTrack, setActiveTrack] = useState(null);
  const { deadline, secondsLeft, isExpired } = useEventSettings();

  // Map track_id → latest submission for that track
  const subByTrack = {};
  submissions.forEach(s => {
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
        @keyframes rise {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Countdown banner */}
      <CountdownBanner
        secondsLeft={secondsLeft}
        isExpired={isExpired}
        deadline={deadline}
      />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 16,
      }}>
        {tracks.map(track => (
          <MissionCard
            key={track.id}
            track={track}
            latestSub={subByTrack[track.id] ?? null}
            profile={profile}
            onCardClick={handleCardClick}
            isExpired={isExpired}
          />
        ))}
      </div>

      {activeTrack && (
        <SubmitPRModal
          track={activeTrack}
          profile={profile}
          existingSub={subByTrack[activeTrack.id] ?? null}
          deadline={deadline}
          secondsLeft={secondsLeft}
          isExpired={isExpired}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
