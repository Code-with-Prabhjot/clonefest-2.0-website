import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function JoinTeamForm() {
  const [memberName, setMemberName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleJoinTeam = async (e) => {
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
            full_name: memberName,
            role: 'member',
            invite_code: inviteCode
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
        ? 'Enlistment Failed: ' + err.message.split('\n')[0] 
        : err.message;
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md p-8 border border-white bg-white/10 rounded-sm font-mono text-center shadow-[0_0_15px_rgba(255,255,255,0.2)]">
        <h3 className="text-xl font-bold text-white mb-2">ENLISTMENT SUCCESSFUL</h3>
        <p className="text-gray-300">Welcome to the squad. Check your COMMS_LINK (email) for verification to proceed.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-8 border border-white/20 bg-[#0A0A0A] rounded-sm shadow-[0_0_15px_rgba(255,255,255,0.1)]">
      <h2 className="text-2xl font-bold mb-6 text-white uppercase tracking-widest flex items-center gap-2">
        <span className="w-2 h-6 bg-white inline-block"></span>
        Enlist in Squad
      </h2>
      
      {error && (
        <div className="mb-4 p-3 border border-red-500 text-red-500 bg-red-500/10 text-sm font-mono shadow-[0_0_10px_rgba(239,68,68,0.2)]">
          <span className="font-bold">CRITICAL ERROR:</span> {error}
        </div>
      )}

      <form onSubmit={handleJoinTeam} className="space-y-4 font-mono">
        <div>
          <label className="block text-sm text-gray-400 mb-1">OPERATIVE_CALLSIGN</label>
          <input
            type="text"
            value={memberName}
            onChange={(e) => setMemberName(e.target.value)}
            required
            className="w-full bg-[#050505] border border-gray-800 text-white p-3 focus:outline-none focus:border-white transition-colors"
          />
        </div>
        
        <div>
          <label className="block text-sm text-gray-400 mb-1">COMMS_LINK (EMAIL)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-[#050505] border border-gray-800 text-white p-3 focus:outline-none focus:border-white transition-colors"
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
            className="w-full bg-[#050505] border border-gray-800 text-white p-3 focus:outline-none focus:border-white transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm text-[#00F0FF] mb-1">SQUAD_INVITE_CODE</label>
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            required
            className="w-full bg-[#050505] border border-[#00F0FF]/50 text-[#00F0FF] p-3 focus:outline-none focus:border-[#00F0FF] transition-colors"
            placeholder="XXXX-XXXX-XXXX"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-6 bg-transparent border border-white text-white p-3 uppercase font-bold hover:bg-white hover:text-black transition-colors disabled:opacity-50"
        >
          {loading ? 'TRANSMITTING...' : 'REQUEST ENLISTMENT'}
        </button>
      </form>
    </div>
  );
}
