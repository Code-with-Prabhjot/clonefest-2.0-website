import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { FIELD, GHOST, LABEL, PRIMARY, FormError, FormHead } from './authStyles';

export default function LoginForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [emailSent, setEmailSent] = useState(false);

  // ── Email validation ────────────────────────────────────────────────
  const validateEmail = (addr) => {
    if (!addr || !addr.includes('@')) return 'Enter a valid email address';
    return null; // valid
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (isSignUp) {
      const emailErr = validateEmail(email);
      if (emailErr) {
        setError(emailErr);
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        setError('Access code must be at least 6 characters.');
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else if (data.user && data.user.identities && data.user.identities.length === 0) {
        // Supabase returns an empty identities array when the email is already registered
        setError('An account with this email already exists.');
      } else if (data.session === null) {
        // session is null → Supabase sent a confirmation email, user must click link
        setEmailSent(true);
      }
      // If session is non-null, email confirmation is disabled in Supabase settings
      // and AuthPage's onAuthStateChange listener will redirect automatically.
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError(error.message);
    }
    
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

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth`
      }
    });
    if (error) setError(error.message);
    setLoading(false);
  };

  // ── Email-sent confirmation screen ─────────────────────────────────────────
  if (emailSent) {
    return (
      <div className="py-2">
        <div className="flex items-center gap-2.5 mb-4">
          <span className="h-[7px] w-[7px] flex-none border border-[#7FB27E] bg-[#7FB27E]" />
          <p className="font-jet text-[10px] uppercase tracking-[0.24em] text-[#7FB27E]">
            Confirmation transmitted
          </p>
        </div>
        <h2 className="font-clash text-[21px] font-medium text-[#E4EEF2] mt-1">
          Check your inbox
        </h2>
        <p className="mt-3 text-[13px] leading-relaxed text-[#8AA5AE]">
          We sent a confirmation link to{' '}
          <span className="text-[#B3E0F2]">{email}</span>.
          Click it to activate your account, then return here to sign in.
        </p>
        <button
          type="button"
          onClick={() => { setEmailSent(false); setIsSignUp(false); setPassword(''); }}
          className={`${PRIMARY} mt-6`}
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <>
      <FormHead
        kicker={isSignUp ? "New operative" : "Returning operative"}
        title={isSignUp ? "Initialize access" : "System login"}
        blurb={isSignUp ? "Register your credentials to enter the grid, or continue with GitHub." : "Sign in with the address you registered, or continue with GitHub."}
      />

      <FormError>{error}</FormError>

      <form onSubmit={handleAuth} className="space-y-5">
        <div>
          <label className={LABEL} htmlFor="login-email">Email address</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={FIELD}
            placeholder="jane@college.edu"
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
          {loading ? 'Authenticating…' : (isSignUp ? 'Register operative' : 'Initiate login')}
        </button>

        {/* Register toggle removed */}

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

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className={GHOST}
        >
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>
      </form>
    </>
  );
}
