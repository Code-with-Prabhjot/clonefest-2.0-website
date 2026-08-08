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

  const handleGithubLogin = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.origin + '/auth'
      }
    });
    if (error) setError(error.message);
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

        <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-gray-800"></div>
            <span className="flex-shrink-0 mx-4 text-gray-500 text-xs uppercase">OR</span>
            <div className="flex-grow border-t border-gray-800"></div>
        </div>

        <button
          type="button"
          onClick={handleGithubLogin}
          disabled={loading}
          className="w-full bg-transparent border border-gray-500 text-gray-300 p-3 uppercase font-bold hover:bg-gray-800 hover:text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
          GITHUB OAUTH
        </button>
      </form>
    </div>
  );
}
