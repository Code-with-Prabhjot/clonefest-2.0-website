import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CyberGrid from '../components/ui/CyberGrid';
import CyberHeader from '../components/ui/CyberHeader';
import { PANEL, FIELD, LABEL, PRIMARY, FormError, FormHead } from '../components/auth/authStyles';
import CreateTeamForm from '../components/auth/CreateTeamForm';
import JoinTeamForm from '../components/auth/JoinTeamForm';
import TrackGrid from '../components/hacker/TrackGrid';
import SubmissionLog from '../components/hacker/SubmissionLog';
import ProfileDetailsForm from '../components/hacker/ProfileDetailsForm';
import { supabase } from '../lib/supabase';
import { useHackerData } from '../hooks/useHackerData';

// ─── Loading screen ──────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#080D0C] flex items-center justify-center">
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 13,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: '#5D91A6',
          animation: 'pulse 1.8s ease-in-out infinite',
        }}
      >
        Fetching operative record…
      </span>
    </div>
  );
}

// ─── Find-a-Squad form — 3rd tab, matches Create/Join in structure ────────────
function FindSquadForm({ user, profile }) {
  const [name, setName] = useState(profile?.full_name || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const alreadyHasName = !!profile?.full_name;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!alreadyHasName) {
      if (trimmed.length < 2 || trimmed.length > 30) {
        return setError('Callsign must be 2–30 characters.');
      }
    }
    setLoading(true);
    setError(null);
    try {
      if (!alreadyHasName) {
        const { error: dbErr } = await supabase
          .from('profiles')
          .update({ full_name: trimmed })
          .eq('id', user.id);
        if (dbErr) throw dbErr;
      }
      navigate('/teams');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <FormHead
        kicker="Scout"
        title="Find a squad"
        blurb={
          alreadyHasName
            ? `You're browsing as ${profile.full_name}. Browse open squads and request to join one.`
            : 'Set your callsign so squads know who’s requesting, then browse open squads.'
        }
      />

      <FormError>{error}</FormError>

      <form onSubmit={handleSubmit} className="space-y-5">
        {!alreadyHasName && (
          <div>
            <label className={LABEL} htmlFor="find-callsign">Operative callsign</label>
            <input
              id="find-callsign"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={30}
              autoFocus
              className={FIELD}
              placeholder="e.g. nulldiv"
            />
          </div>
        )}
        <button type="submit" disabled={loading} className={PRIMARY}>
          {loading ? 'Saving…' : 'Find a Squad →'}
        </button>
      </form>
    </>
  );
}

// ─── Onboarding screen (no team yet) ─────────────────────────────────────────
function OnboardingScreen({ user, profile }) {
  const [activeTab, setActiveTab] = useState('create');

  const TAB_BASE = 'px-6 py-2 uppercase font-bold text-sm border transition-all font-mono';
  const TAB_ON   = 'border-[#5D91A6] bg-[#5D91A6]/10 text-[#B3E0F2] shadow-[0_0_10px_rgba(93,145,166,0.25)]';
  const TAB_OFF  = 'border-[#B3E0F2]/10 text-[#56707B] hover:border-[#B3E0F2]/25 hover:text-[#8AA5AE]';

  return (
    <div className="min-h-screen bg-[#080D0C] flex flex-col items-center justify-center p-4 relative overflow-hidden pb-[var(--pet-lane)]">
      <CyberGrid variant="cyan" />
      <CyberHeader variant="cyan" />

      <div className="z-10 w-full max-w-4xl flex flex-col items-center pt-28 sm:pt-24">
        <p
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: '#5D91A6',
            marginBottom: 12,
          }}
        >
          Operative portal
        </p>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: '#E4EEF2',
            marginBottom: 32,
            textAlign: 'center',
          }}
        >
          Awaiting squad assignment
        </h1>

        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('create')}
            className={`${TAB_BASE} ${activeTab === 'create' ? TAB_ON : TAB_OFF}`}
          >
            Forge squad
          </button>
          <button
            onClick={() => setActiveTab('join')}
            className={`${TAB_BASE} ${activeTab === 'join' ? TAB_ON : TAB_OFF}`}
          >
            Enlist
          </button>
          <button
            onClick={() => setActiveTab('find')}
            className={`${TAB_BASE} ${activeTab === 'find' ? TAB_ON : TAB_OFF}`}
          >
            Find a Squad
          </button>
        </div>

        <div className="w-full flex justify-center max-w-md">
          {activeTab === 'create' && (
            <div className={`${PANEL} p-7 sm:p-8 w-full`}>
              <CreateTeamForm user={user} />
            </div>
          )}
          {activeTab === 'join' && (
            <div className={`${PANEL} p-7 sm:p-8 w-full`}>
              <JoinTeamForm user={user} />
            </div>
          )}
          {activeTab === 'find' && (
            <div className={`${PANEL} p-7 sm:p-8 w-full`}>
              <FindSquadForm user={user} profile={profile} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Status card (existing terminal block, kept) ──────────────────────────────
function StatusCard({ profile, team }) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(team?.invite_code ?? '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        background: '#0A191F',
        border: '1px solid rgba(179,224,242,0.10)',
        borderRadius: 3,
        padding: '20px 22px',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12,
        color: '#8AA5AE',
        lineHeight: 1.9,
      }}
    >
      <span style={{ color: '#5D91A6' }}>root@clonefest:~$</span> ./status_check.sh
      <br /><br />
      [+] SQUAD LINK ONLINE: <span style={{ color: '#E4EEF2' }}>{profile?.team_name ?? 'UNKNOWN'}</span><br />
      [+] ROLE: <span style={{ color: '#E4EEF2' }}>{profile?.role?.toUpperCase() ?? 'UNKNOWN'}</span><br />
      {profile?.role === 'lead' && team?.invite_code && (
        <>
          [+] INVITE CODE:{' '}
          <span style={{ color: '#E4EEF2', background: 'rgba(179,224,242,0.08)', padding: '1px 8px', borderRadius: 2 }}>
            {team.invite_code}
          </span>
          <button
            onClick={copyCode}
            style={{
              marginLeft: 10,
              padding: '1px 8px',
              border: `1px solid ${copied ? 'rgba(127,178,126,0.5)' : 'rgba(179,224,242,0.2)'}`,
              borderRadius: 2,
              background: copied ? 'rgba(127,178,126,0.1)' : 'transparent',
              color: copied ? '#7FB27E' : '#5D91A6',
              cursor: 'pointer',
              fontSize: 9,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              transition: 'all 0.15s',
            }}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <br />
        </>
      )}
      <br />
      {'>'} Standing by for mission briefing…
    </div>
  );
}

// ─── Main dashboard (has a team) ─────────────────────────────────────────────
function Dashboard({ profile, team, tracks, submissions, refetch }) {
  return (
    <div
      className="min-h-screen bg-[#080D0C] text-[#E4EEF2] pb-[var(--pet-lane)]"
      style={{ position: 'relative' }}
    >
      <CyberGrid variant="cyan" />
      <CyberHeader variant="cyan" customLogo="/assets/cc%20new%20logo.jpeg" />

      <div
        style={{
          position: 'relative', zIndex: 10,
          maxWidth: 1100, margin: '0 auto',
          padding: '100px 20px 60px',
        }}
      >
        {/* ── Section: Top Links ─────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 32, marginBottom: 56 }}>
          <div className="flex items-center gap-8">
            <Link
              to="/portal/team"
              className="font-jet text-[10px] uppercase tracking-[0.16em] text-[#5D91A6] transition-colors hover:text-[#B3E0F2]"
            >
              Team portal →
            </Link>
            <Link
              to="/leaderboard"
              className="font-jet text-[10px] uppercase tracking-[0.16em] text-[#5D91A6] transition-colors hover:text-[#B3E0F2]"
            >
              View leaderboard →
            </Link>
          </div>
        </div>

        {/* ── Section: Mission dossier (track grid) ─────────────────────── */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
            <SectionLabel>&gt; Mission dossier</SectionLabel>
            {profile?.role === 'lead' && (
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: '#5D91A6',
                }}
              >
                Click any mission to submit a GitHub repository
              </span>
            )}
            {profile?.role === 'member' && (
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: '#56707B',
                }}
              >
                Leads only — contact your lead to submit
              </span>
            )}
          </div>

          <TrackGrid
            tracks={tracks}
            submissions={submissions}
            profile={profile}
            onRefetch={refetch}
          />
        </div>

        {/* ── Section: Submission log ───────────────────────────────────── */}
        <SubmissionLog submissions={submissions} />
      </div>
    </div>
  );
}

function OnboardingShell({ children }) {
  return (
    <div className="min-h-screen bg-[#080D0C] flex flex-col items-center justify-center p-4 relative overflow-hidden pb-[var(--pet-lane)]">
      <CyberGrid variant="cyan" />
      <CyberHeader variant="cyan" />
      <div className="z-10 w-full max-w-md flex flex-col items-center pt-28 sm:pt-24">
        <p
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase',
            color: '#5D91A6', marginBottom: 12,
          }}
        >
          Operative portal
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#E4EEF2', marginBottom: 32, textAlign: 'center' }}>
          Registration
        </h1>
        <div className={`${PANEL} p-7 sm:p-8 w-full`}>{children}</div>
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color: '#56707B',
        marginBottom: 14,
      }}
    >
      {children}
    </p>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────
export default function HackerPortal() {
  const { user, profile, team, tracks, submissions, loading, refetch } = useHackerData();
  const [detailsDone, setDetailsDone] = useState(false);

  if (loading) return <LoadingScreen />;

  // Registration details are collected once, before squad setup. `usn` does
  // not exist on profiles yet, so detailsDone carries it for now; once the
  // column lands this gate becomes persistent with no other change.
  if (!profile || profile.role === 'unassigned') {
    if (!profile?.usn && !detailsDone) {
      return (
        <OnboardingShell step="Step 1 of 2">
          <ProfileDetailsForm onComplete={() => setDetailsDone(true)} />
        </OnboardingShell>
      );
    }
    return <OnboardingScreen user={user} profile={profile} />;
  }

  return (
    <Dashboard
      user={user}
      profile={profile}
      team={team}
      tracks={tracks}
      submissions={submissions}
      refetch={refetch}
    />
  );
}
