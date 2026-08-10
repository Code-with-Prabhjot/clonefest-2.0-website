import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import LoginForm from '../components/auth/LoginForm';
import { PANEL } from '../components/auth/authStyles';

export default function AuthPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if session already exists
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/portal'); // Route to the standard squad portal
      }
    });

    // Listen for auth state changes (crucial for OAuth redirects)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/portal'); // Route to the standard squad portal
      }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#080D0C] pb-[var(--pet-lane)]">
      {/* Background treatment carried over from the Admin and Judge portals:
          a fine dot lattice under two slowly drifting colour fields. */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: 'radial-gradient(rgba(93,145,166,.16) 1px, transparent 1px)',
          backgroundSize: '26px 26px',
          opacity: 0.5,
        }}
      />
      <div
        className="pointer-events-none fixed z-0"
        style={{
          top: '-260px', left: '-160px', width: '820px', height: '620px',
          background: 'radial-gradient(closest-side, rgba(93,145,166,.20), transparent)',
          filter: 'blur(20px)', animation: 'driftA 26s ease-in-out infinite',
        }}
      />
      <div
        className="pointer-events-none fixed z-0"
        style={{
          bottom: '-220px', right: '-200px', width: '720px', height: '560px',
          background: 'radial-gradient(closest-side, rgba(71,115,70,.20), transparent)',
          filter: 'blur(20px)', animation: 'driftB 32s ease-in-out infinite',
        }}
      />

      <header className="relative z-20 border-b border-[#B3E0F2]/10 bg-[#080D0C]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1580px] items-center gap-4 px-5 py-3.5 sm:px-8 sm:py-4">
          <img src="/assets/image.png" alt="RVCE"
               className="h-9 w-auto [filter:invert(1)] mix-blend-screen" />
          <img src="/assets/cc%20new%20logo.jpeg" alt="Coding Club"
               className="h-9 w-auto mix-blend-screen" />
          <span className="h-7 w-px bg-[#B3E0F2]/14" />
          <div>
            <p className="font-clash text-[15px] font-semibold tracking-[0.14em] text-[#B3E0F2] sm:text-[18px]">
              CLONEFEST 2.0
            </p>
            <p className="mt-1 font-jet text-[9px] uppercase tracking-[0.24em] text-[#56707B]">
              Secure access
            </p>
          </div>
          <div className="flex-1" />
          <Link
            to="/"
            className="font-jet text-[10px] uppercase tracking-[0.18em] text-[#56707B] transition-colors hover:text-[#B3E0F2]"
          >
            ← Back to site
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-md flex-col px-5 py-10 sm:py-14">
        <div style={{ animation: 'rise .5s ease-out both' }}>
          <p className="font-jet text-[10px] uppercase tracking-[0.26em] text-[#5D91A6]">
            Operative terminal
          </p>
          <h1 className="mt-3 font-clash text-[30px] font-medium leading-tight text-[#E4EEF2] sm:text-[36px]">
            Sign in, or bring a squad.
          </h1>
        </div>

        <div
          className="mt-6"
          style={{ animation: 'rise .4s ease-out both' }}
        >
          <div className={`${PANEL} p-7 sm:p-8`}><LoginForm /></div>
        </div>

        <p className="mt-7 text-center font-jet text-[10px] uppercase tracking-[0.16em] text-[#56707B]">
          One hacker, one squad
        </p>
      </main>
    </div>
  );
}
