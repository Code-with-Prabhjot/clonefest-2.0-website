import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import { supabase } from '../../lib/supabase';

/**
 * SubmitPRModal — v2
 *
 * Large, centered overlay card with:
 *  - Track title (big), subtitle, long description (rendered as Markdown)
 *  - GitHub PR URL field
 *  - Vercel / deployed URL field
 *  - App notes textarea (team describes what they built)
 *  - Env snapshot textarea (paste .env keys)
 *  - Admin-synced countdown timer
 *  - Submit locked when deadline passed or submissions_open = false
 *
 * Props:
 *  - track       : { id, title, subtitle?, long_description?, repo_url? }
 *  - profile     : full profile object (role, team_name, id)
 *  - existingSub : last submission for this track (or null)
 *  - isExpired   : boolean
 *  - onClose     : () => void
 *  - onSuccess   : () => void
 */


// ── Input field ───────────────────────────────────────────────────────────
function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label
        style={{
          display: 'block',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: '#56707B',
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      {children}
      {hint && (
        <p
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            color: '#2E4A54',
            letterSpacing: '0.1em',
            marginTop: 5,
          }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

const INPUT_BASE = {
  width: '100%',
  boxSizing: 'border-box',
  background: '#0B1519',
  border: '1px solid rgba(179,224,242,0.15)',
  borderRadius: 2,
  padding: '11px 14px',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 13,
  color: '#E4EEF2',
  outline: 'none',
  transition: 'border-color 0.15s',
};

// ── Markdown prose styles injected once ───────────────────────────────────
const MARKDOWN_STYLES = `
.sub-md h2 {
  font-family: 'Clash Grotesk', sans-serif;
  font-size: 15px;
  font-weight: 600;
  color: #B3E0F2;
  margin: 16px 0 8px;
  letter-spacing: 0.01em;
}
.sub-md h3 {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #5D91A6;
  margin: 14px 0 6px;
}
.sub-md p {
  color: #8AA5AE;
  font-size: 13px;
  line-height: 1.75;
  margin: 0 0 10px;
}
.sub-md ul, .sub-md ol {
  color: #8AA5AE;
  font-size: 13px;
  line-height: 1.75;
  padding-left: 18px;
  margin: 0 0 10px;
}
.sub-md li { margin-bottom: 3px; }
.sub-md strong { color: #B3E0F2; font-weight: 600; }
.sub-md code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  background: rgba(179,224,242,0.08);
  border: 1px solid rgba(179,224,242,0.12);
  padding: 1px 5px;
  border-radius: 2px;
  color: #B3E0F2;
}
@keyframes modalFadeScale {
  from { transform: scale(0.96) translateY(10px); opacity: 0; }
  to   { transform: scale(1)    translateY(0);    opacity: 1; }
}
@keyframes popIn {
  0%   { transform: scale(0.88); opacity: 0; }
  100% { transform: scale(1);    opacity: 1; }
}
`;

// ─────────────────────────────────────────────────────────────────────────
export default function SubmitPRModal({
  track,
  profile,
  existingSub,
  isExpired,
  onClose,
  onSuccess,
}) {
  const [prUrl, setPrUrl] = useState(existingSub?.pr_url ?? '');
  const [deployedUrl, setDeployedUrl] = useState(existingSub?.deployed_url ?? '');
  const [appNotes, setAppNotes] = useState(existingSub?.app_notes ?? '');
  const [envSnapshot, setEnvSnapshot] = useState(existingSub?.env_snapshot ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const prRef = useRef(null);
  const isLead = profile?.role === 'lead';
  const isScored = existingSub?.status === 'scored';
  const canSubmit = isLead && !isExpired && !isScored;

  // Focus PR input on open
  useEffect(() => {
    if (isLead) setTimeout(() => prRef.current?.focus(), 150);
  }, [isLead]);

  // Close on Escape
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const validateGitHub = (url) =>
    /^https?:\/\/github\.com\/[^/]+\/[^/]+/.test(url.trim());

  const validateUrl = (url) => {
    if (!url.trim()) return true; // optional field
    try { new URL(url.trim()); return true; } catch { return false; }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);

    if (!validateGitHub(prUrl)) {
      setError('GitHub repository link required — e.g. github.com/owner/repo');
      return;
    }
    if (!validateUrl(deployedUrl)) {
      setError('Deployed URL is not a valid URL.');
      return;
    }

    setLoading(true);
    const { error: dbErr } = await supabase.from('submissions').insert({
      team_name: profile.team_name,
      track_id: track.id,
      pr_url: prUrl.trim(),
      deployed_url: deployedUrl.trim() || null,
      app_notes: appNotes.trim() || null,
      env_snapshot: envSnapshot.trim() || null,
      submitted_by: profile.id,
    });
    setLoading(false);

    if (dbErr) { setError(dbErr.message); return; }
    setDone(true);
    setTimeout(() => { onSuccess(); onClose(); }, 1400);
  };

  const focusBorder = (e) => { e.target.style.borderColor = '#5D91A6'; };
  const blurBorder = (e) => { e.target.style.borderColor = 'rgba(179,224,242,0.15)'; };

  const modal = (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.82)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 16px',
        overflowY: 'auto',
      }}
    >
      <style>{MARKDOWN_STYLES}</style>

      {/* ── Card ── */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 960,
          background: '#0D1E24',
          border: '1px solid rgba(179,224,242,0.16)',
          borderRadius: 4,
          animation: 'modalFadeScale 0.3s cubic-bezier(0.16,1,0.3,1) both',
          position: 'relative',
          overflowY: 'auto',
          maxHeight: '92vh',
        }}
      >
        {done ? (
          // ── Success state ──────────────────────────────────────────────
          <div
            style={{
              padding: '64px 32px',
              textAlign: 'center',
              animation: 'popIn .34s ease-out both',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                marginBottom: 16,
              }}
            >
              <span
                style={{
                  width: 8, height: 8,
                  background: '#7FB27E',
                  borderRadius: 1,
                  display: 'inline-block',
                }}
              />
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: '#7FB27E',
                }}
              >
                Mission submitted
              </span>
            </div>
            <p style={{ color: '#E4EEF2', fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
              GitHub repository logged to grid
            </p>
            <p style={{ color: '#8AA5AE', fontSize: 13.5, lineHeight: 1.6 }}>
              Your submission is pending review. Closing…
            </p>
          </div>
        ) : (
          <>
            {/* ── Top bar: track ID + close + countdown ──────────────── */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                padding: '28px 32px 0',
                gap: 16,
              }}
            >
              {/* Left: kicker */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9,
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    color: '#5D91A6',
                    background: 'rgba(93,145,166,0.1)',
                    border: '1px solid rgba(93,145,166,0.3)',
                    padding: '3px 10px',
                    borderRadius: 2,
                  }}
                >
                  {track.id}
                </span>
                {isLead ? (
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 9,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: '#56707B',
                    }}
                  >
                    Submit mission
                  </span>
                ) : (
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 9,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: '#56707B',
                    }}
                  >
                    Mission intel
                  </span>
                )}
              </div>

              {/* Right: countdown + close */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>

                <button
                  onClick={onClose}
                  aria-label="Close"
                  style={{
                    background: 'none',
                    border: '1px solid rgba(179,224,242,0.1)',
                    borderRadius: 2,
                    color: '#56707B',
                    cursor: 'pointer',
                    fontSize: 18,
                    lineHeight: 1,
                    padding: '3px 8px',
                    marginTop: 2,
                    transition: 'color 0.15s, border-color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#E4EEF2';
                    e.currentTarget.style.borderColor = 'rgba(179,224,242,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#56707B';
                    e.currentTarget.style.borderColor = 'rgba(179,224,242,0.1)';
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            {/* ── Title block ────────────────────────────────────────── */}
            <div style={{ padding: '20px 32px 0' }}>
              <h2
                style={{
                  fontFamily: "'Clash Grotesk', sans-serif",
                  fontSize: 32,
                  fontWeight: 600,
                  color: '#E4EEF2',
                  margin: '0 0 8px',
                  lineHeight: 1.15,
                  letterSpacing: '-0.01em',
                }}
              >
                {track.id === 'T1' ? 'Legacy Modernisation: PrivateBin' : track.id === 'T2' ? 'Transmission 02' : track.title}
              </h2>

            </div>

            {/* ── Long description (Markdown) ────────────────────────── */}
            <div
              className="sub-md"
              style={{
                padding: '20px 32px 0',
                maxHeight: 340,
                overflowY: 'auto',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(93,145,166,0.3) transparent',
              }}
            >
              {track.id === 'T1' ? (
                <div style={{ color: '#8AA5AE', fontSize: '13px', lineHeight: '1.75' }}>
                  <p style={{ color: '#B3E0F2', fontWeight: 600, fontSize: '15px', marginBottom: '8px' }}>Problem Description</p>
                  <p style={{ marginBottom: '10px' }}>Build a modern, secure, and user-friendly platform for sharing sensitive text and information online, inspired by the core problem addressed by PrivateBin.</p>
                  <p style={{ marginBottom: '10px' }}>The goal is not to replicate PrivateBin or reproduce its existing UI/UX. Instead, participants are expected to understand the underlying problem and develop their own modern interpretation and solution using a suitable contemporary technology stack.</p>
                  <p style={{ marginBottom: '10px' }}>Your solution should cover the essential capabilities required for secure and controlled information sharing, while giving you the freedom to rethink the user experience, architecture, security model, collaboration features, usability, performance, and other aspects.</p>
                  <p style={{ marginBottom: '10px' }}>The provided PrivateBin repository is included as a reference implementation. Participants may clone and explore the repository to understand how the existing system works, but the final solution should demonstrate independent implementation and meaningful innovation.</p>
                  <p style={{ marginBottom: '10px' }}>Reference Repository:<br />
                  <a href="https://github.com/PrivateBin/PrivateBin" target="_blank" rel="noopener noreferrer" style={{ color: '#5D91A6', textDecoration: 'underline' }}>https://github.com/PrivateBin/PrivateBin</a></p>
                  <p style={{ marginBottom: '10px' }}>Core idea: Understand the problem → preserve the essential purpose → build your own modern solution → innovate beyond the reference.</p>
                  
                  <p style={{ color: '#B3E0F2', fontWeight: 600, fontSize: '15px', marginTop: '24px', marginBottom: '8px' }}>📋 Judging Rubric – 100 Marks</p>
                  <p style={{ marginBottom: '10px' }}>1️⃣ Problem Understanding & Core Functionality — 20 marks</p>
                  <p style={{ marginBottom: '10px' }}>2️⃣ Innovation & Meaningful Differentiation — 20 marks</p>
                  <p style={{ marginBottom: '10px' }}>3️⃣ Technical Implementation & Architecture — 15 marks</p>
                  <p style={{ marginBottom: '10px' }}>4️⃣ User Experience & Accessibility — 15 marks</p>
                  <p style={{ marginBottom: '10px' }}>5️⃣ Performance & Reliability/Demo Quality — 20 marks</p>
                  <p style={{ marginBottom: '10px' }}>6️⃣ Documentation & Explanation — 10 marks</p>
                  <p style={{ marginBottom: '10px' }}>Total — 100 marks</p>
                </div>
              ) : (
                track.long_description && <ReactMarkdown>{track.long_description}</ReactMarkdown>
              )}
            </div>

            {/* ── Divider ───────────────────────────────────────────── */}
            <div
              style={{
                margin: '24px 32px 0',
                borderTop: '1px solid rgba(179,224,242,0.08)',
              }}
            />

            {/* ── Repo link ─────────────────────────────────────────── */}
            <div style={{ padding: '16px 32px 0' }}>
              <a
                href="https://github.com/PrivateBin/PrivateBin"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    letterSpacing: '0.12em',
                    color: '#5D91A6',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#B3E0F2')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#5D91A6')}
                >
                  ↗ View starter repo
                </a>
              </div>

            {/* ── Lock notice (members) ──────────────────────────────── */}
            {!isLead && (
              <div
                style={{
                  margin: '20px 32px 0',
                  background: 'rgba(194,86,75,0.08)',
                  border: '1px solid rgba(194,86,75,0.3)',
                  borderLeft: '3px solid #C2564B',
                  borderRadius: 2,
                  padding: '12px 16px',
                }}
              >
                <p
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: '#C2564B',
                    marginBottom: 4,
                  }}
                >
                  Lead access required
                </p>
                <p style={{ color: '#E6A79E', fontSize: 12.5, lineHeight: 1.6, margin: 0 }}>
                  Only your Team Lead can submit. Ask your lead to open this panel.
                </p>
              </div>
            )}

            {/* ── Submissions closed notice ──────────────────────────── */}
            {isExpired && isLead && (
              <div
                style={{
                  margin: '20px 32px 0',
                  background: 'rgba(194,86,75,0.1)',
                  border: '1px solid rgba(194,86,75,0.4)',
                  borderLeft: '3px solid #C2564B',
                  borderRadius: 2,
                  padding: '12px 16px',
                }}
              >
                <p
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: '#C2564B',
                    marginBottom: 4,
                  }}
                >
                  Submissions closed
                </p>
                <p style={{ color: '#E6A79E', fontSize: 12.5, lineHeight: 1.6, margin: 0 }}>
                  The submission window has ended. No new entries can be accepted.
                </p>
              </div>
            )}

            {/* ── Existing sub notice ────────────────────────────────── */}
            {existingSub && isLead && !isExpired && (
              <div
                style={{
                  margin: '20px 32px 0',
                  background: 'rgba(93,145,166,0.08)',
                  border: '1px solid rgba(93,145,166,0.25)',
                  borderRadius: 2,
                  padding: '10px 14px',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color: '#8AA5AE',
                }}
              >
                <span style={{ color: '#5D91A6', marginRight: 8 }}>{'>'}</span>
                Previous submission on record — submitting again adds a new entry.
              </div>
            )}

            {/* ── Error ─────────────────────────────────────────────── */}
            {error && (
              <div
                style={{
                  margin: '20px 32px 0',
                  background: 'rgba(194,86,75,0.1)',
                  border: '1px solid rgba(194,86,75,0.45)',
                  borderLeft: '2px solid #C2564B',
                  borderRadius: 2,
                  padding: '10px 14px',
                }}
              >
                <p
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: '#C2564B',
                    marginBottom: 4,
                  }}
                >
                  Transaction failed
                </p>
                <p style={{ color: '#E6A79E', fontSize: 12.5, margin: 0 }}>{error}</p>
              </div>
            )}

            {/* ── Form ──────────────────────────────────────────────── */}
            <form onSubmit={handleSubmit} style={{ padding: '24px 32px 32px' }}>

              {/* GitHub PR URL */}
              <Field
                label="> GitHub URL"
                hint="Must be a valid repository link — github.com/owner/repo"
              >
                <input
                  ref={prRef}
                  type="url"
                  value={prUrl}
                  onChange={(e) => setPrUrl(e.target.value)}
                  disabled={!canSubmit || loading}
                  placeholder="https://github.com/owner/repo"
                  style={{
                    ...INPUT_BASE,
                    opacity: !canSubmit ? 0.45 : 1,
                    cursor: !canSubmit ? 'not-allowed' : 'text',
                  }}
                  onFocus={canSubmit ? focusBorder : undefined}
                  onBlur={blurBorder}
                />
              </Field>

              {/* Deployed / Vercel URL */}
              <Field
                label="> Vercel / Deployed URL"
                hint="Optional — share your live deployment"
              >
                <input
                  type="url"
                  value={deployedUrl}
                  onChange={(e) => setDeployedUrl(e.target.value)}
                  disabled={!canSubmit || loading}
                  placeholder="https://your-app.vercel.app"
                  style={{
                    ...INPUT_BASE,
                    opacity: !canSubmit ? 0.45 : 1,
                    cursor: !canSubmit ? 'not-allowed' : 'text',
                  }}
                  onFocus={canSubmit ? focusBorder : undefined}
                  onBlur={blurBorder}
                />
              </Field>

              {/* App notes */}
              <Field
                label="> Notes — describe your submission"
                hint="Explain what your app does, key decisions, and anything judges should know (max 4000 chars)"
              >
                <textarea
                  value={appNotes}
                  onChange={(e) => setAppNotes(e.target.value)}
                  disabled={!canSubmit || loading}
                  maxLength={4000}
                  rows={5}
                  placeholder={
                    'We built a headless CMS with Supabase + Next.js RSC…\n\nKey features:\n- Real-time preview\n- Drag & drop media uploads\n- Auto-generated sitemap'
                  }
                  style={{
                    ...INPUT_BASE,
                    resize: 'vertical',
                    lineHeight: 1.65,
                    opacity: !canSubmit ? 0.45 : 1,
                    cursor: !canSubmit ? 'not-allowed' : 'text',
                  }}
                  onFocus={canSubmit ? focusBorder : undefined}
                  onBlur={blurBorder}
                />
                <div
                  style={{
                    textAlign: 'right',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9,
                    color: appNotes.length > 3800 ? '#E09B4A' : '#2E4A54',
                    marginTop: 4,
                  }}
                >
                  {appNotes.length} / 4000
                </div>
              </Field>

              {/* Env snapshot */}
              <Field
                label="> Environment variables"
                hint="Paste your .env keys (redact secret values — replace values with *** or similar)"
              >
                <textarea
                  value={envSnapshot}
                  onChange={(e) => setEnvSnapshot(e.target.value)}
                  disabled={!canSubmit || loading}
                  maxLength={8000}
                  rows={4}
                  placeholder={
                    'NEXT_PUBLIC_SUPABASE_URL=***\nNEXT_PUBLIC_SUPABASE_ANON_KEY=***\nSTRIPE_SECRET_KEY=***\nDATABASE_URL=***'
                  }
                  style={{
                    ...INPUT_BASE,
                    resize: 'vertical',
                    lineHeight: 1.65,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12,
                    opacity: !canSubmit ? 0.45 : 1,
                    cursor: !canSubmit ? 'not-allowed' : 'text',
                  }}
                  onFocus={canSubmit ? focusBorder : undefined}
                  onBlur={blurBorder}
                />
              </Field>

              {/* Submit button */}
              <button
                type="submit"
                disabled={!canSubmit || loading}
                style={{
                  width: '100%',
                  padding: '15px 0',
                  background: canSubmit ? '#B3E0F2' : 'rgba(179,224,242,0.06)',
                  color: canSubmit ? '#080D0C' : '#2E4A54',
                  border: canSubmit ? 'none' : '1px solid rgba(179,224,242,0.1)',
                  borderRadius: 2,
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  cursor: !canSubmit || loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  transition: 'all 0.2s',
                  marginTop: 4,
                  fontFamily: "'Satoshi', sans-serif",
                }}
                onMouseEnter={(e) => {
                  if (canSubmit && !loading)
                    e.currentTarget.style.background = '#cceeff';
                }}
                onMouseLeave={(e) => {
                  if (canSubmit)
                    e.currentTarget.style.background = '#B3E0F2';
                }}
              >
                {!isLead
                  ? 'Lead access required'
                  : isExpired
                    ? 'Submissions closed'
                    : loading
                      ? 'Logging to grid…'
                      : existingSub
                        ? 'Resubmit mission'
                        : 'Submit mission →'}
              </button>

              {/* Disclaimer */}
              <p
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  color: '#2E4A54',
                  letterSpacing: '0.1em',
                  textAlign: 'center',
                  marginTop: 12,
                }}
              >
                {isLead
                  ? 'All squad members should review before submitting. Only leads can submit.'
                  : 'Ask your Team Lead to submit on behalf of the squad.'}
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
