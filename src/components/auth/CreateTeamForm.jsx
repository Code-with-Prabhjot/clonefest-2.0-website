import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { FIELD, HINT, LABEL, PRIMARY, FormError, FormHead, FormSuccess } from './authStyles';

export default function CreateTeamForm() {
  const [teamName, setTeamName] = useState('');
  const [leaderName, setLeaderName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleCreateTeam = async (e) => {
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
            full_name: leaderName,
            role: 'lead',
            team_name: teamName
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
        ? 'Transaction Failed: ' + err.message.split('\n')[0]
        : err.message;
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <FormSuccess
        kicker="Squad initialized"
        title="Your squad is registered"
        body="Check your inbox to verify the address, then sign in from System login. Your invite code is waiting in the squad panel — share it with your members."
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

        <div>
          <label className={LABEL} htmlFor="create-email">Comms link (email)</label>
          <input
            id="create-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={FIELD}
            placeholder="lead@rvce.edu.in"
          />
        </div>

        <div>
          <label className={LABEL} htmlFor="create-password">Encryption key (password)</label>
          <input
            id="create-password"
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

        <button type="submit" disabled={loading} className={PRIMARY}>
          {loading ? 'Initializing…' : 'Initialize squad'}
        </button>
      </form>
    </>
  );
}
