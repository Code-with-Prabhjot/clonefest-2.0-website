import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../lib/supabase';

/**
 * SubmitPRModal
 * Slide-up overlay for submitting a GitHub PR URL against a specific track.
 * Only Team Leads can actually submit; members see a locked state with guidance.
 *
 * Props:
 *  - track     : { id, title } — the selected track
 *  - profile   : full profile object (role, team_name, id)
 *  - existingSub : last submission for this track (or null)
 *  - onClose   : () => void
 *  - onSuccess : () => void  — called after a successful insert so parent can refetch
 */
export default function SubmitPRModal({ track, profile, existingSub, onClose, onSuccess }) {
  const [prUrl, setPrUrl]   = useState(existingSub?.pr_url ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);
  const [done, setDone]     = useState(false);
  const inputRef            = useRef(null);
  const isLead              = profile?.role === 'lead';

  // Focus input on open (leads only)
  useEffect(() => {
    if (isLead) setTimeout(() => inputRef.current?.focus(), 120);
  }, [isLead]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const validateUrl = (url) => {
    // Must be a github.com PR link: github.com/<owner>/<repo>/pull/<number>
    return /^https?:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+/.test(url.trim());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLead) return;
    setError(null);

    if (!validateUrl(prUrl)) {
      setError('URL must be a valid GitHub pull request link — github.com/owner/repo/pull/123');
      return;
    }

    setLoading(true);
    const { error: dbErr } = await supabase.from('submissions').insert({
      team_name:    profile.team_name,
      track_id:     track.id,
      pr_url:       prUrl.trim(),
      submitted_by: profile.id,
    });

    setLoading(false);

    if (dbErr) {
      setError(dbErr.message);
      return;
    }

    setDone(true);
    setTimeout(() => {
      onSuccess();
      onClose();
    }, 1400);
  };

  const modal = (
    // Backdrop
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      {/* Panel — stop click propagation so clicking inside doesn't close */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 560,
          background: '#0D1E24',
          border: '1px solid rgba(179,224,242,0.14)',
          borderBottom: 'none',
          borderRadius: '3px 3px 0 0',
          padding: '32px 28px 36px',
          animation: 'slideUp 0.28s cubic-bezier(0.16,1,0.3,1) both',
        }}
      >
        {/* Slide-up keyframe injected inline once */}
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0; }
            to   { transform: translateY(0);    opacity: 1; }
          }
          @keyframes popIn {
            0%   { transform: scale(0.88); opacity: 0; }
            100% { transform: scale(1);    opacity: 1; }
          }
        `}</style>

        {done ? (
          // ── Success state ────────────────────────────────────────────────
          <div style={{ animation: 'popIn .34s ease-out both', textAlign: 'center', padding: '20px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ width: 8, height: 8, background: '#7FB27E', borderRadius: 1, display: 'inline-block' }} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#7FB27E' }}>
                Mission submitted
              </span>
            </div>
            <p style={{ color: '#E4EEF2', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>PR logged to grid</p>
            <p style={{ color: '#8AA5AE', fontSize: 13, lineHeight: 1.6 }}>
              Your submission is pending review. Closing…
            </p>
          </div>
        ) : (
          <>
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#5D91A6', marginBottom: 6 }}>
                  {isLead ? 'Submit mission' : 'Mission intel'}
                </p>
                <h2 style={{ color: '#E4EEF2', fontSize: 20, fontWeight: 600, margin: 0 }}>
                  {track.id} · {track.title}
                </h2>
              </div>
              <button
                onClick={onClose}
                style={{ background: 'none', border: 'none', color: '#56707B', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 0, marginTop: 2 }}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* ── Lock notice for members ──────────────────────────────────── */}
            {!isLead && (
              <div style={{
                background: 'rgba(194,86,75,0.08)',
                border: '1px solid rgba(194,86,75,0.3)',
                borderLeft: '3px solid #C2564B',
                borderRadius: 2, padding: '12px 16px', marginBottom: 24,
              }}>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C2564B', marginBottom: 4 }}>
                  Lead access required
                </p>
                <p style={{ color: '#E6A79E', fontSize: 12.5, lineHeight: 1.6, margin: 0 }}>
                  Only your Team Lead can submit PRs. Ask your lead to open this panel.
                </p>
              </div>
            )}

            {/* ── Existing submission notice ───────────────────────────────── */}
            {existingSub && isLead && (
              <div style={{
                background: 'rgba(93,145,166,0.08)',
                border: '1px solid rgba(93,145,166,0.25)',
                borderRadius: 2, padding: '10px 14px', marginBottom: 20,
                fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#8AA5AE',
              }}>
                <span style={{ color: '#5D91A6', marginRight: 8 }}>&gt;</span>
                Previous submission on record — submitting again adds a new entry.
              </div>
            )}

            {/* ── Error ───────────────────────────────────────────────────── */}
            {error && (
              <div style={{
                background: 'rgba(194,86,75,0.1)',
                border: '1px solid rgba(194,86,75,0.45)',
                borderLeft: '2px solid #C2564B',
                borderRadius: 2, padding: '10px 14px', marginBottom: 20,
              }}>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C2564B', marginBottom: 4 }}>
                  Transaction failed
                </p>
                <p style={{ color: '#E6A79E', fontSize: 12.5, margin: 0 }}>{error}</p>
              </div>
            )}

            {/* ── Form ────────────────────────────────────────────────────── */}
            <form onSubmit={handleSubmit}>
              <label style={{ display: 'block', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#56707B', marginBottom: 8 }}>
                &gt; GitHub PR URL
              </label>
              <input
                ref={inputRef}
                type="url"
                value={prUrl}
                onChange={e => setPrUrl(e.target.value)}
                disabled={!isLead || loading}
                placeholder="https://github.com/owner/repo/pull/42"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: '#0B1519',
                  border: '1px solid rgba(179,224,242,0.15)',
                  borderRadius: 2,
                  padding: '12px 14px',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 13,
                  color: '#E4EEF2',
                  outline: 'none',
                  marginBottom: 20,
                  opacity: !isLead ? 0.45 : 1,
                  cursor: !isLead ? 'not-allowed' : 'text',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => { if (isLead) e.target.style.borderColor = '#5D91A6'; }}
                onBlur={e  => { e.target.style.borderColor = 'rgba(179,224,242,0.15)'; }}
              />

              <button
                type="submit"
                disabled={!isLead || loading}
                style={{
                  width: '100%',
                  padding: '13px 0',
                  background: isLead ? '#B3E0F2' : 'rgba(179,224,242,0.08)',
                  color: isLead ? '#080D0C' : '#56707B',
                  border: isLead ? 'none' : '1px solid rgba(179,224,242,0.15)',
                  borderRadius: 2,
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: !isLead || loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  transition: 'all 0.2s',
                  letterSpacing: '0.02em',
                }}
                onMouseEnter={e => { if (isLead && !loading) e.currentTarget.style.background = '#cceeff'; }}
                onMouseLeave={e => { if (isLead) e.currentTarget.style.background = '#B3E0F2'; }}
              >
                {!isLead
                  ? 'Lead access required'
                  : loading
                  ? 'Logging to grid…'
                  : existingSub
                  ? 'Resubmit mission'
                  : 'Submit mission'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
