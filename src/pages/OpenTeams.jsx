import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CyberGrid from '../components/ui/CyberGrid';
import CyberHeader from '../components/ui/CyberHeader';
import { supabase } from '../lib/supabase';
import { useHackerData } from '../hooks/useHackerData';
import { PANEL, PRIMARY, FIELD, LABEL, FormHead, FormError } from '../components/auth/authStyles';

export default function OpenTeams() {
  const { user, profile, loading: hackerLoading } = useHackerData();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requestStatus, setRequestStatus] = useState({});
  // Callsign dialog state
  const [nameModalTeam, setNameModalTeam] = useState(null);
  const [nameInput, setNameInput] = useState('');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;

    async function fetchTeams() {
      try {
        // Fetch all teams and their profiles
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('name, created_at, profiles(id)')
          .eq('is_open', true);

        if (teamsError) throw teamsError;

        // Fetch user's existing requests
        let userRequests = [];
        if (user) {
          const { data: requestsData } = await supabase
            .from('team_requests')
            .select('team_name, status')
            .eq('user_id', user.id);
          userRequests = requestsData || [];
        }

        if (!alive) return;

        const initialRequestStatus = {};
        userRequests.forEach(req => {
          initialRequestStatus[req.team_name] = req.status; // 'pending', 'accepted', 'rejected'
        });
        setRequestStatus(initialRequestStatus);

        // Filter for open teams (less than 4 members)
        const openTeams = teamsData
          .map(team => ({
            name: team.name,
            memberCount: team.profiles ? team.profiles.length : 0,
            createdAt: team.created_at,
          }))
          .filter(team => team.memberCount < 4)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        setTeams(openTeams);
      } catch (err) {
        if (alive) setError(err.message);
      } finally {
        if (alive) setLoading(false);
      }
    }

    fetchTeams();

    return () => { alive = false; };
  }, [user]);

  // Always show the callsign dialog when clicking Request Enlistment
  // so the lead always sees a confirmed real name
  const handleRequestJoin = (teamName) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setNameModalTeam(teamName);
    setNameInput('');
    setNameError(null);
  };

  const submitRequest = async (teamName) => {
    setRequestStatus(prev => ({ ...prev, [teamName]: 'loading' }));
    
    try {
      const { error } = await supabase
        .from('team_requests')
        .insert({
          team_name: teamName,
          user_id: user.id,
          status: 'pending'
        });

      if (error) {
        if (error.code === '23505') {
          throw new Error('Request already sent.');
        }
        throw error;
      }

      setRequestStatus(prev => ({ ...prev, [teamName]: 'pending' }));
    } catch (err) {
      console.error('Request join error:', err);
      setRequestStatus(prev => ({ ...prev, [teamName]: 'error' }));
      alert(err.message);
    }
  };

  const handleSaveNameAndRequest = async (e) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (trimmed.length < 2 || trimmed.length > 30) {
      return setNameError('Callsign must be 2–30 characters.');
    }
    setNameSaving(true);
    setNameError(null);
    try {
      const { error: dbErr } = await supabase
        .from('profiles')
        .update({ full_name: trimmed })
        .eq('id', user.id);
      if (dbErr) throw dbErr;
      // Update local profile reference so the gate doesn't re-trigger
      profile.full_name = trimmed;
      const targetTeam = nameModalTeam;
      setNameModalTeam(null);
      await submitRequest(targetTeam);
    } catch (err) {
      setNameError(err.message);
    } finally {
      setNameSaving(false);
    }
  };

  if (hackerLoading || loading) {
    return (
      <div className="min-h-screen bg-[#080D0C] flex items-center justify-center">
        <span className="font-jet text-[13px] uppercase tracking-[0.22em] text-[#5D91A6] animate-pulse">
          Scanning for open squads…
        </span>
      </div>
    );
  }

  const alreadyInTeam = profile && profile.team_name;

  return (
    <div className="min-h-screen bg-[#080D0C] text-[#E4EEF2] pb-[var(--pet-lane)] relative">
      <CyberGrid variant="cyan" />
      <CyberHeader variant="cyan" />

      {/* ── Callsign dialog overlay ─────────────────────────────────────── */}
      {nameModalTeam && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(8,13,12,0.85)', backdropFilter: 'blur(8px)' }}
        >
          {/* Click backdrop to dismiss */}
          <div className="absolute inset-0" onClick={() => setNameModalTeam(null)} />

          {/* Dialog */}
          <div
            className="relative w-full max-w-md animate-[fadeInUp_0.22s_ease-out]"
            style={{
              background: '#0E1D23',
              border: '1px solid rgba(179,224,242,0.18)',
              borderRadius: 4,
              boxShadow: '0 0 0 1px rgba(93,145,166,0.08), 0 32px 64px rgba(0,0,0,0.7)',
            }}
          >
            {/* Cyan top bar */}
            <div style={{
              height: 2,
              borderRadius: '4px 4px 0 0',
              background: 'linear-gradient(90deg, #5D91A6 0%, rgba(93,145,166,0) 100%)',
            }} />

            <div className="p-7 sm:p-8">
              <FormHead
                kicker="Operative ID required"
                title="Set your callsign"
                blurb={`The squad lead of ${nameModalTeam} needs to know who's knocking. Your name will appear in their pending enlistments.`}
              />

              <FormError>{nameError}</FormError>

              <form onSubmit={handleSaveNameAndRequest} className="space-y-4 mt-1">
                <div>
                  <label className={LABEL} htmlFor="modal-callsign">Operative callsign</label>
                  <input
                    id="modal-callsign"
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    required
                    maxLength={30}
                    autoFocus
                    className={FIELD}
                    placeholder="e.g. nulldiv"
                  />
                </div>

                <button type="submit" disabled={nameSaving} className={PRIMARY}>
                  {nameSaving ? 'Transmitting…' : 'Confirm & Request Enlistment'}
                </button>

                <button
                  type="button"
                  onClick={() => setNameModalTeam(null)}
                  className="w-full rounded-[2px] border border-[#B3E0F2]/10 py-3 font-jet text-[10px] uppercase tracking-[0.18em] text-[#56707B] transition-colors hover:border-[#B3E0F2]/22 hover:text-[#8AA5AE]"
                >
                  Cancel
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 mx-auto max-w-[900px] px-5 pb-16 pt-28 sm:pt-32">
        <div className="flex flex-wrap items-baseline justify-between gap-3 mb-10">
          <div>
            <p className="font-jet text-[10px] uppercase tracking-[0.22em] text-[#5D91A6]">Squad Directory</p>
            <h1 className="font-clash mt-3 text-[30px] font-medium leading-tight text-[#E4EEF2] sm:text-[38px]">
              Open Squads
            </h1>
          </div>
          <Link
            to="/portal"
            className="font-jet text-[10px] uppercase tracking-[0.16em] text-[#5D91A6] transition-colors hover:text-[#B3E0F2]"
          >
            Return to portal →
          </Link>
        </div>

        {alreadyInTeam && (
          <div className={`${PANEL} p-5 mb-8 border-l-4 border-l-[#7FB27E]`}>
            <p className="font-jet text-[12px] text-[#7FB27E] uppercase tracking-wider">
              You are already enlisted in a squad ({profile.team_name}).
            </p>
          </div>
        )}

        {error && (
          <div className={`${PANEL} p-5 mb-8 border-l-4 border-l-red-500`}>
            <p className="font-jet text-[12px] text-red-400 uppercase tracking-wider">
              Error fetching squads: {error}
            </p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {teams.length === 0 ? (
            <div className={`${PANEL} p-8 col-span-full text-center`}>
              <p className="font-jet text-[12px] uppercase tracking-[0.2em] text-[#8AA5AE]">
                No open squads found. Time to forge your own?
              </p>
            </div>
          ) : (
            teams.map((team) => {
              const status = requestStatus[team.name];
              
              return (
                <div key={team.name} className={`${PANEL} p-6 flex flex-col justify-between`}>
                  <div>
                    <h3 className="font-clash text-[22px] font-medium text-[#E4EEF2] truncate">
                      {team.name}
                    </h3>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="font-jet text-[10px] uppercase tracking-[0.16em] text-[#8AA5AE]">
                        Operatives:
                      </span>
                      <span className="font-jet text-[12px] text-[#B3E0F2]">
                        {team.memberCount} / 4
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    {!user ? (
                      <button onClick={() => navigate('/auth')} className={PRIMARY + " w-full"}>
                        Login to Enlist
                      </button>
                    ) : alreadyInTeam ? (
                      <button disabled className={`${PRIMARY} w-full opacity-50 cursor-not-allowed grayscale`}>
                        Already Enlisted
                      </button>
                    ) : status === 'loading' ? (
                      <button disabled className={`${PRIMARY} w-full opacity-70 cursor-wait`}>
                        Transmitting…
                      </button>
                    ) : status === 'pending' ? (
                      <button disabled className="w-full bg-[#5D91A6]/20 border border-[#5D91A6]/50 text-[#5D91A6] font-jet text-[11px] uppercase tracking-[0.2em] py-3 rounded-[2px]">
                        Request Sent
                      </button>
                    ) : status === 'accepted' ? (
                      <button disabled className="w-full bg-[#7FB27E]/20 border border-[#7FB27E]/50 text-[#7FB27E] font-jet text-[11px] uppercase tracking-[0.2em] py-3 rounded-[2px]">
                        Accepted
                      </button>
                    ) : status === 'rejected' ? (
                      <button onClick={() => handleRequestJoin(team.name)} className={`${PRIMARY} w-full !bg-red-500/10 !border-red-500/30 !text-red-400 hover:!bg-red-500/20`}>
                        Rejected (Try Again)
                      </button>
                    ) : (
                      <button onClick={() => handleRequestJoin(team.name)} className={PRIMARY + " w-full"}>
                        Request Enlistment
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
