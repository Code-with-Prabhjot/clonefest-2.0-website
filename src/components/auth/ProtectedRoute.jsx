import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function ProtectedRoute({ children, allowedRoles }) {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        if (active) {
          setSession(null);
          setLoading(false);
        }
        return;
      }
      
      // Fetch profile to get role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
        
      if (active) {
        setSession(session);
        setRole(profile?.role || 'unassigned');
        setLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setSession(null);
        setRole(null);
        setLoading(false);
      } else {
        // Re-fetch on sign in if needed, but usually getSession catches it initially
        checkAuth();
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <span className="text-[#00F0FF] font-mono animate-pulse uppercase tracking-widest text-xl">
          VERIFYING CLEARANCE...
        </span>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/portal" replace />;
  }

  return children;
}
