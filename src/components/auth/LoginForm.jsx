import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setError(error.message);
    else alert('Login successful!');
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md p-8 border border-[#00F0FF] bg-[#0A0A0A] rounded-sm shadow-[0_0_15px_rgba(0,240,255,0.2)]">
      <h2 className="text-2xl font-bold mb-6 text-[#00F0FF] uppercase tracking-widest flex items-center gap-2">
        <span className="w-2 h-6 bg-[#00F0FF] inline-block"></span>
        System Login
      </h2>
      
      {error && (
        <div className="mb-4 p-3 border border-red-500 text-red-500 bg-red-500/10 text-sm font-mono">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4 font-mono">
        <div>
          <label className="block text-sm text-gray-400 mb-1">EMAIL_ADDRESS</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-[#050505] border border-gray-800 text-white p-3 focus:outline-none focus:border-[#00F0FF] transition-colors"
            placeholder="operative@squad.com"
          />
        </div>
        
        <div>
          <label className="block text-sm text-gray-400 mb-1">ACCESS_CODE</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-[#050505] border border-gray-800 text-white p-3 focus:outline-none focus:border-[#00F0FF] transition-colors"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-6 bg-transparent border border-[#00FF00] text-[#00FF00] p-3 uppercase font-bold hover:bg-[#00FF00]/10 transition-colors disabled:opacity-50"
        >
          {loading ? 'AUTHENTICATING...' : 'INITIATE LOGIN'}
        </button>
      </form>
    </div>
  );
}
