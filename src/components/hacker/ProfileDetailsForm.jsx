import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  FIELD, HINT, LABEL, PRIMARY, FormError, FormHead,
} from '../auth/authStyles';

/**
 * Collected once, straight after a hacker's first sign-in and before they can
 * forge or join a squad.
 *
 * Writes usn, branch, and batch to the `profiles` table (patch_004 must be
 * applied first). onComplete() is called only after a successful DB write.
 */

const BRANCHES = ['CS', 'CD', 'CY', 'CI', 'BT', 'EC', 'ET', 'EE', 'ME', 'IE', 'CV', 'CH', 'AS'];
const BATCHES = ['2025 - 2029'];

export default function ProfileDetailsForm({ onComplete }) {
  const [usn, setUsn] = useState('');
  const [branch, setBranch] = useState('');
  const [batch, setBatch] = useState(BATCHES[0]);
  const [eligible, setEligible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const usnClean = usn.trim().toUpperCase();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!/^1R[VZ]25[A-Z]{2}\d{3}$/.test(usnClean)) {
      return setError('USN must be in the format 1RV25XX000 or 1RZ25XX000 (e.g., 1RV25CS001).');
    }
    if (!branch) return setError('Select your branch.');
    if (!eligible) return setError('Confirm you are part of the 2025 - 2029 batch.');

    setLoading(true);
    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) throw new Error('Not authenticated. Please sign in again.');

      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ usn: usnClean, branch, batch })
        .eq('id', user.id);

      if (updateErr) throw updateErr;

      onComplete({ usn: usnClean, branch, batch });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectClass = `${FIELD} appearance-none cursor-pointer`;

  return (
    <>
      <FormHead
        kicker="Step 1 of 2"
        title="Confirm your details"
        blurb="We need these once. You'll pick or create a squad next."
      />

      <FormError>{error}</FormError>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className={LABEL} htmlFor="reg-usn">USN</label>
          <input
            id="reg-usn"
            type="text"
            value={usn}
            onChange={(e) => setUsn(e.target.value.toUpperCase())}
            required
            maxLength={10}
            autoComplete="off"
            className={`${FIELD} font-jet tracking-[0.14em]`}
            placeholder="1RV25CS001"
          />
          <p className={HINT}>10 CHARACTERS, AS PRINTED ON YOUR ID CARD</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={LABEL} htmlFor="reg-branch">Branch</label>
            <div className="relative">
              <select
                id="reg-branch"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                required
                className={selectClass}
              >
                <option value="" disabled>Select</option>
                {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-[#56707B]">
                ▾
              </span>
            </div>
          </div>

          <div>
            <label className={LABEL} htmlFor="reg-batch">Batch</label>
            <div className="relative">
              <input
                id="reg-batch"
                value={batch}
                readOnly
                className={`${FIELD} text-[#8AA5AE] cursor-default bg-transparent`}
              />
            </div>
          </div>
        </div>

        <label
          htmlFor="reg-eligible"
          className={`flex cursor-pointer items-start gap-3 rounded-[2px] border p-4 transition-colors ${
            eligible
              ? 'border-[#7FB27E]/45 bg-[#7FB27E]/[0.07]'
              : 'border-[#B3E0F2]/12 bg-[#0B1519] hover:border-[#B3E0F2]/25'
          }`}
        >
          <input
            id="reg-eligible"
            type="checkbox"
            checked={eligible}
            onChange={(e) => setEligible(e.target.checked)}
            className="mt-0.5 h-4 w-4 flex-none cursor-pointer accent-[#7FB27E]"
          />
          <span className="text-[12.5px] leading-relaxed text-[#8AA5AE]">
            I confirm I belong to the{' '}
            <span className="text-[#E4EEF2]">2025 - 2029 batch</span>. Only
            students from this batch are eligible to participate.
          </span>
        </label>

        <button type="submit" disabled={loading || !eligible} className={PRIMARY}>
          {loading ? 'Saving…' : 'Continue to squad setup'}
        </button>

        {!eligible && (
          <p className="text-center font-jet text-[10px] uppercase tracking-[0.14em] text-[#56707B]">
            Tick the confirmation to continue
          </p>
        )}
      </form>
    </>
  );
}
