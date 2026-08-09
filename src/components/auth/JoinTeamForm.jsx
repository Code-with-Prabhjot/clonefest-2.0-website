import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { FIELD, HINT, LABEL, PRIMARY, FormError, FormHead, FormSuccess } from './authStyles';

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
      <FormSuccess
        kicker="Enlistment successful"
        title="You're on the squad"
        body="Check your comms link to verify the address, then sign in from System login to see your squad and this week's challenge."
      />
    );
  }

  return (
    <>
      <FormHead
        kicker="Squad member"
        title="Enlist in a squad"
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
          <label className={LABEL} htmlFor="join-email">Comms link (email)</label>
          <input
            id="join-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={FIELD}
            placeholder="operative@rvce.edu.in"
          />
        </div>

        <div>
          <label className={LABEL} htmlFor="join-password">Encryption key (password)</label>
          <input
            id="join-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className={FIELD}
            placeholder="••••••••"
          />
          <p className={HINT}>MINIMUM 6 CHARACTERS</p>
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
          {loading ? 'Transmitting…' : 'Request enlistment'}
        </button>
      </form>
    </>
  );
}
