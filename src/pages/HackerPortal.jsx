import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import TerminalCard from '../components/ui/TerminalCard';
import CyberGrid from '../components/ui/CyberGrid';
import CyberHeader from '../components/ui/CyberHeader';
import CreateTeamForm from '../components/auth/CreateTeamForm';
import JoinTeamForm from '../components/auth/JoinTeamForm';
import { PANEL } from '../components/auth/authStyles';

export default function HackerPortal() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('create');
  const [team, setTeam] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUser(user);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setProfile(profileData);

      if (profileData?.team_name) {
        const { data: teamData } = await supabase
          .from('teams')
          .select('*')
          .eq('name', profileData.team_name)
          .single();
        setTeam(teamData);
      }

      setLoading(false);
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <span className="text-[#00F0FF] font-mono animate-pulse uppercase tracking-widest text-xl">
          FETCHING OPERATIVE RECORD...
        </span>
      </div>
    );
  }

  // If they don't have a team yet (role is unassigned)
  if (profile?.role === 'unassigned') {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-4 relative overflow-hidden pb-[var(--pet-lane)]">
        <CyberGrid variant="cyan" />
        
        <div className="z-10 w-full max-w-4xl flex flex-col items-center mt-10">
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] to-[#00FF00] mb-8 tracking-tighter uppercase">
            Awaiting Squad Assignment
          </h1>

          <div className="flex gap-4 mb-8 font-mono">
            <button 
              onClick={() => setActiveTab('create')}
              className={`px-6 py-2 uppercase font-bold text-sm border transition-all ${
                activeTab === 'create' 
                  ? 'border-[#00FF00] bg-[#00FF00]/10 text-[#00FF00] shadow-[0_0_10px_rgba(0,255,0,0.3)]' 
                  : 'border-gray-800 text-gray-500 hover:border-gray-500 hover:text-gray-300'
              }`}
            >
              Forge Squad
            </button>
            <button 
              onClick={() => setActiveTab('join')}
              className={`px-6 py-2 uppercase font-bold text-sm border transition-all ${
                activeTab === 'join' 
                  ? 'border-white bg-white/10 text-white shadow-[0_0_10px_rgba(255,255,255,0.3)]' 
                  : 'border-gray-800 text-gray-500 hover:border-gray-500 hover:text-gray-300'
              }`}
            >
              Enlist
            </button>
          </div>

          <div className="w-full flex justify-center mt-4 transition-all max-w-md">
            {activeTab === 'create' && <div className={`${PANEL} p-7 sm:p-8 w-full`}><CreateTeamForm user={user} /></div>}
            {activeTab === 'join' && <div className={`${PANEL} p-7 sm:p-8 w-full`}><JoinTeamForm user={user} /></div>}
          </div>
        </div>
      </div>
    );
  }

  // Dashboard for members and leads
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#FFFFFF] flex flex-col items-center p-4 pb-[var(--pet-lane)]">
      <CyberGrid variant="cyan" />
      <CyberHeader variant="cyan" />
      <TerminalCard variant="cyan" title="Operative Dashboard" className="max-w-2xl w-full text-center mt-20 z-10">
        <p className="text-xl text-gray-400 mb-8 tracking-wide">
          <span className="text-[#00F0FF] mr-2">&gt;</span>
          WELCOME TO THE GRID, {profile?.full_name?.toUpperCase() || 'OPERATIVE'}.
        </p>
        <div className="border border-gray-800 p-6 bg-[#050505] text-sm text-left text-gray-400 font-mono">
          <span className="text-[#00F0FF]">root@clonefest:~$</span> ./status_check.sh<br /><br />
          [+] SQUAD LINK ONLINE: {profile?.team_name || 'UNKNOWN'}<br />
          [+] ROLE: {profile?.role?.toUpperCase() || 'UNKNOWN'}<br />
          {profile?.role === 'lead' && team?.invite_code && (
            <>
              [+] SQUAD INVITE CODE: <span className="text-white bg-white/10 px-1 rounded">{team.invite_code}</span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(team.invite_code);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className={`ml-3 px-2 py-0.5 border ${copied ? 'border-[#00FF00] text-[#00FF00] bg-[#00FF00]/10' : 'border-[#00F0FF]/30 text-[#00F0FF] hover:bg-[#00F0FF]/10'} rounded text-xs transition-all tracking-wider`}
              >
                {copied ? 'COPIED!' : 'COPY'}
              </button>
              <br />
            </>
          )}
          <br />
          &gt; Standing by for mission briefing...
        </div>
      </TerminalCard>
    </div>
  );
}
