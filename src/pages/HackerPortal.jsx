import { useState } from 'react';
import { Link } from 'react-router-dom';
import CyberGrid from '../components/ui/CyberGrid';
import CyberHeader from '../components/ui/CyberHeader';
import { PANEL } from '../components/auth/authStyles';
import CreateTeamForm from '../components/auth/CreateTeamForm';
import JoinTeamForm from '../components/auth/JoinTeamForm';
import TrackGrid from '../components/hacker/TrackGrid';
import SubmissionLog from '../components/hacker/SubmissionLog';
import Announcements from '../components/hacker/Announcements';
import ProfileDetailsForm from '../components/hacker/ProfileDetailsForm';
import WhatsAppInvite, { shouldShowInvite, markInviteSeen } from '../components/hacker/WhatsAppInvite';
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


// ─── Onboarding screen (no team yet) ─────────────────────────────────────────
function OnboardingScreen({ user }) {
  const [activeTab, setActiveTab] = useState('create');

  const TAB_BASE = 'px-6 py-2 uppercase font-bold text-sm border transition-all font-mono';
  const TAB_ON = 'border-[#5D91A6] bg-[#5D91A6]/10 text-[#B3E0F2] shadow-[0_0_10px_rgba(93,145,166,0.25)]';
  const TAB_OFF = 'border-[#B3E0F2]/10 text-[#56707B] hover:border-[#B3E0F2]/25 hover:text-[#8AA5AE]';

  return (
    <div className="min-h-screen bg-[#080D0C] flex flex-col items-center justify-center p-4 relative overflow-hidden pb-[var(--pet-lane)]">
      <CyberGrid variant="cyan" />
      <CyberHeader variant="cyan" />

      <div className="absolute top-6 right-6 z-20 sm:top-8 sm:right-10">
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = '/';
          }}
          className="font-jet text-[10px] uppercase tracking-[0.16em] text-[#5D91A6] transition-colors hover:text-[#B3E0F2]"
        >
          Logout →
        </button>
      </div>

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
            Create squad
          </button>
          <button
            onClick={() => setActiveTab('join')}
            className={`${TAB_BASE} ${activeTab === 'join' ? TAB_ON : TAB_OFF}`}
          >
            Join squad
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

        </div>
      </div>
    </div>
  );
}

// StatusCard removed because it is no longer used

// ─── Main dashboard (has a team) ─────────────────────────────────────────────
function Dashboard({ profile, tracks, submissions, refetch }) {
  return (
    <div
      className="min-h-screen bg-[#080D0C] text-[#E4EEF2] pb-[var(--pet-lane)]"
      style={{ position: 'relative' }}
    >
      <CyberGrid variant="cyan" />
      <CyberHeader variant="cyan" customLogo="/assets/cc-transparent.png" />

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

        {/* ── Section: Announcements ────────────────────────────────────── */}
        <div style={{ marginBottom: 48 }}>
          <SectionLabel>&gt; Announcements</SectionLabel>
          <Announcements role={profile?.role} />
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
  const { user, profile, tracks, submissions, loading, refetch } = useHackerData();
  const [detailsDone, setDetailsDone] = useState(false);
  // Raised on the transition out of ProfileDetailsForm, then never again.
  const [showInvite, setShowInvite] = useState(false);

  if (loading) return <LoadingScreen />;

  // Registration details are collected once, before squad setup. `usn` does
  // not exist on profiles yet, so detailsDone carries it for now; once the
  // column lands this gate becomes persistent with no other change.
  if (!profile || profile.role === 'unassigned') {
    if (!profile?.usn && !detailsDone) {
      return (
        <OnboardingShell step="Step 1 of 2">
          <ProfileDetailsForm
            onComplete={() => {
              setDetailsDone(true);
              setShowInvite(shouldShowInvite(user?.id));
            }}
          />
        </OnboardingShell>
      );
    }
    return (
      <>
        <OnboardingScreen user={user} profile={profile} refetch={refetch} />
        {showInvite && (
          <WhatsAppInvite
            userId={user?.id}
            onClose={() => { markInviteSeen(user?.id); setShowInvite(false); }}
          />
        )}
      </>
    );
  }

  return (
    <Dashboard
      profile={profile}
      tracks={tracks}
      submissions={submissions}
      refetch={refetch}
    />
  );
}
