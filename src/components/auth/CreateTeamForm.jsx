import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { FIELD, LABEL, PRIMARY, FormError, FormHead, FormSuccess } from './authStyles';

export default function CreateTeamForm({ user }) {
  const [teamName, setTeamName] = useState('');
  const [leaderName, setLeaderName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const generateInviteCode = () => {
    return Array.from({ length: 3 }, () => 
      Math.random().toString(36).substring(2, 6).toUpperCase()
    ).join('-');
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const inviteCode = generateInviteCode();

      // 1. Insert into teams table
      const { error: teamError } = await supabase
        .from('teams')
        .insert({
          name: teamName,
          invite_code: inviteCode
        });

      if (teamError) throw teamError;

      // 2. Update user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: leaderName,
          role: 'lead',
          team_name: teamName
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      setSuccess(true);
      // Give it a short delay then reload to update portal state
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setError('Transaction Failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <FormSuccess
        kicker="Squad initialized"
        title="Your squad is registered"
        body="Hold tight, rerouting to the operative dashboard..."
      />
    );
  }

  return (
    <>
      <FormHead
        kicker="Squad lead"
        title="Forge new squad"
        blurb="Register as lead and your squad is created with you at the helm."
      />

      <FormError>{error}</FormError>

      <form onSubmit={handleCreateTeam} className="space-y-5">
        <div>
          <label className={LABEL} htmlFor="create-team">Squad designation</label>
          <input
            id="create-team"
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            required
            className={FIELD}
            placeholder="e.g. NEON_SYNDICATE"
          />
        </div>

        <div>
          <label className={LABEL} htmlFor="create-lead">Leader callsign</label>
          <input
            id="create-lead"
            type="text"
            value={leaderName}
            onChange={(e) => setLeaderName(e.target.value)}
            required
            className={FIELD}
            placeholder="e.g. zerocool"
          />
        </div>

        <button type="submit" disabled={loading} className={PRIMARY}>
          {loading ? 'Initializing…' : 'Initialize squad'}
        </button>
      </form>
    </>
  );
}
