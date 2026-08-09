import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { FIELD, GHOST, LABEL, PRIMARY, FormError, FormHead } from './authStyles';

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
    // On success AuthPage's onAuthStateChange listener handles the redirect.
    setLoading(false);
  };

  const handleGithubLogin = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth`
      }
    });
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <>
      <FormHead
        kicker="Returning operative"
        title="System login"
        blurb="Sign in with the address you registered, or continue with GitHub."
      />

      <FormError>{error}</FormError>

      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label className={LABEL} htmlFor="login-email">Email address</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={FIELD}
            placeholder="operative@rvce.edu.in"
          />
        </div>

        <div>
          <label className={LABEL} htmlFor="login-password">Access code</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={FIELD}
            placeholder="••••••••"
          />
        </div>

        <button type="submit" disabled={loading} className={PRIMARY}>
          {loading ? 'Authenticating…' : 'Initiate login'}
        </button>

        <div className="flex items-center gap-4 py-1">
          <span className="h-px flex-1 bg-[#B3E0F2]/10" />
          <span className="font-jet text-[9px] uppercase tracking-[0.24em] text-[#56707B]">or</span>
          <span className="h-px flex-1 bg-[#B3E0F2]/10" />
        </div>

        <button
          type="button"
          onClick={handleGithubLogin}
          disabled={loading}
          className={GHOST}
        >
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current" aria-hidden="true">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
          Continue with GitHub
        </button>
      </form>
    </>
  );
}
