import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { FIELD, HINT, LABEL, PRIMARY, FormError, FormHead, FormSuccess } from './authStyles';

export default function JoinTeamForm({ user }) {
  const [memberName, setMemberName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleJoinTeam = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    const trimmedMemberName = memberName.trim();
    const trimmedInviteCode = inviteCode.trim();

    if (!trimmedMemberName) {
      setError('Operative callsign is required.');
      return;
    }

    if (!trimmedInviteCode) {
      setError('Squad invite code is required.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // 1. Verify the invite code exists in teams
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('name')
        .eq('invite_code', trimmedInviteCode)
        .single();

      if (teamError || !teamData) {
        throw new Error('Invalid invite code. Team not found.');
      }

      // 2. Check current squad capacity (max 4 members)
      const { count: memberCount, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('team_name', teamData.name);

      if (countError) throw countError;

      if (memberCount >= 4) {
        throw new Error('Squad is already at maximum capacity (4/4 operatives).');
      }

      // 3. Update user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: trimmedMemberName,
          role: 'member',
          team_name: teamData.name
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      setSuccess(true);
      setTimeout(() => window.location.href = '/portal/team', 1500);
    } catch (err) {
      setError('Enlistment Failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <FormSuccess
        kicker="Enlistment successful"
        title="You're on the squad"
        body="Hold tight, rerouting to the operative dashboard..."
      />
    );
  }

  return (
    <>
      <FormHead
        kicker="Squad member"
        title="Join a squad"
        blurb="Your lead has an invite code. Paste it below to join their squad."
      />

      <FormError>{error}</FormError>

      <form onSubmit={handleJoinTeam} className="space-y-5">
        <div>
          <label className={LABEL} htmlFor="join-name">Operative callsign</label>
          <input
            id="join-name"
            type="text"
            value={memberName}
            onChange={(e) => setMemberName(e.target.value)}
            required
            className={FIELD}
            placeholder="e.g. nulldiv"
          />
        </div>

        <div>
          <label className={LABEL} htmlFor="join-code">Squad invite code</label>
          <input
            id="join-code"
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            required
            className={`${FIELD} font-jet tracking-[0.18em] text-[#B3E0F2] placeholder:tracking-[0.18em]`}
            placeholder="XXXX-XXXX-XXXX"
          />
          <p className={HINT}>ASK YOUR SQUAD LEAD FOR THIS</p>
        </div>

        <button type="submit" disabled={loading} className={PRIMARY}>
          {loading ? 'Transmitting…' : 'Join squad'}
        </button>
      </form>
    </>
  );
}
