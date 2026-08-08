import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function CreateTeamForm() {
  const [teamName, setTeamName] = useState('');
  const [leaderName, setLeaderName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: leaderName,
            role: 'lead',
            team_name: teamName
          }
        }
      });
      
      if (authError) throw authError;
      
      // If sign-up requires email confirmation, the user is created but session might be null.
      if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
          throw new Error('An account with this email already exists. One Hacker, One Squad.');
      }

      setSuccess(true);
    } catch (err) {
      // Clean up Supabase's trigger exception messages if present
      const message = err.message.includes('Database error saving new user') 
        ? 'Transaction Failed: ' + err.message.split('\n')[0] 
        : err.message;
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md p-8 border border-[#00FF00] bg-[#00FF00]/10 rounded-sm font-mono text-center shadow-[0_0_15px_rgba(0,255,0,0.2)]">
        <h3 className="text-xl font-bold text-[#00FF00] mb-2">SQUAD INITIALIZED</h3>
        <p className="text-gray-300">Squad Initialized! Proceed to System Login.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-8 border border-[#00FF00] bg-[#0A0A0A] rounded-sm shadow-[0_0_15px_rgba(0,255,0,0.2)]">
      <h2 className="text-2xl font-bold mb-6 text-[#00FF00] uppercase tracking-widest flex items-center gap-2">
        <span className="w-2 h-6 bg-[#00FF00] inline-block animate-pulse"></span>
        Forge New Squad
      </h2>
      
      {error && (
        <div className="mb-4 p-3 border border-red-500 text-red-500 bg-red-500/10 text-sm font-mono shadow-[0_0_10px_rgba(239,68,68,0.2)]">
          <span className="font-bold">CRITICAL ERROR:</span> {error}
        </div>
      )}

      <form onSubmit={handleCreateTeam} className="space-y-4 font-mono">
        <div>
          <label className="block text-sm text-gray-400 mb-1">SQUAD_DESIGNATION</label>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            required
            className="w-full bg-[#050505] border border-gray-800 text-white p-3 focus:outline-none focus:border-[#00FF00] transition-colors"
            placeholder="e.g. Neon Syndicate"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">LEADER_CALLSIGN</label>
          <input
            type="text"
            value={leaderName}
            onChange={(e) => setLeaderName(e.target.value)}
            required
            className="w-full bg-[#050505] border border-gray-800 text-white p-3 focus:outline-none focus:border-[#00FF00] transition-colors"
            placeholder="e.g. ZeroCool"
          />
        </div>
        
        <div>
          <label className="block text-sm text-gray-400 mb-1">COMMS_LINK (EMAIL)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-[#050505] border border-gray-800 text-white p-3 focus:outline-none focus:border-[#00FF00] transition-colors"
          />
        </div>
        
        <div>
          <label className="block text-sm text-gray-400 mb-1">ENCRYPTION_KEY (PASSWORD)</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full bg-[#050505] border border-gray-800 text-white p-3 focus:outline-none focus:border-[#00FF00] transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-6 bg-[#00FF00]/10 border border-[#00FF00] text-[#00FF00] p-3 uppercase font-bold hover:bg-[#00FF00] hover:text-black transition-colors disabled:opacity-50"
        >
          {loading ? 'INITIALIZING...' : 'INITIALIZE SQUAD'}
        </button>
      </form>
    </div>
  );
}
