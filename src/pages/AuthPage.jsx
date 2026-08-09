import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import LoginForm from '../components/auth/LoginForm';
import CreateTeamForm from '../components/auth/CreateTeamForm';
import JoinTeamForm from '../components/auth/JoinTeamForm';

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState('login'); // 'login', 'create', 'join'
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
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-4 relative overflow-hidden pb-[var(--pet-lane)]">
      {/* Cyberpunk background accents */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-[20%] left-[-10%] w-96 h-96 bg-[#00F0FF] rounded-full mix-blend-screen filter blur-[100px]"></div>
        <div className="absolute bottom-[20%] right-[-10%] w-96 h-96 bg-[#00FF00] rounded-full mix-blend-screen filter blur-[100px]"></div>
      </div>

      <div className="z-10 w-full max-w-4xl flex flex-col items-center">
        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] to-[#00FF00] mb-8 tracking-tighter uppercase">
          Clonefest 2.0
        </h1>
        
        <div className="flex gap-4 mb-8 font-mono">
          <button 
            onClick={() => setActiveTab('login')}
            className={`px-6 py-2 uppercase font-bold text-sm border transition-all ${
              activeTab === 'login' 
                ? 'border-[#00F0FF] bg-[#00F0FF]/10 text-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.3)]' 
                : 'border-gray-800 text-gray-500 hover:border-gray-500 hover:text-gray-300'
            }`}
          >
            System Login
          </button>
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

        <div className="w-full flex justify-center mt-4 transition-all">
          {activeTab === 'login' && <LoginForm />}
          {activeTab === 'create' && <CreateTeamForm />}
          {activeTab === 'join' && <JoinTeamForm />}
        </div>
      </div>
    </div>
  );
}
