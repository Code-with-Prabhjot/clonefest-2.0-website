import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  FIELD, HINT, LABEL, PRIMARY, FormError, FormHead,
} from '../auth/authStyles';

/**
 * Collected once, straight after a hacker's first sign-in and before they can
 * forge or join a squad.
 *
 * Writes usn, branch, batch, and college to the `profiles` table.
 * onComplete() is called only after a successful DB write.
 */

const COLLEGES = ['RVCE', 'PESU', 'BMSCE', 'MSRIT', 'Other'];
const BATCHES = ['2025 - 2029'];

export default function ProfileDetailsForm({ onComplete }) {
  const [usn, setUsn] = useState('');
  const [college, setCollege] = useState('');
  const [customCollege, setCustomCollege] = useState('');
  const [branch, setBranch] = useState('');
  const [batch, setBatch] = useState(BATCHES[0]);
  const [eligible, setEligible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const usnClean = usn.trim().toUpperCase();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!usnClean) {
      return setError('Student ID / USN is required.');
    }

    const finalCollege = college === 'Other' ? customCollege.trim() : college;
    if (!finalCollege) return setError('Please specify your college.');
    if (!branch.trim()) return setError('Please specify your branch.');
    if (!eligible) return setError('Confirm you are part of the 2025 - 2029 batch.');

    setLoading(true);
    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) throw new Error('Not authenticated. Please sign in again.');

      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ usn: usnClean, branch: branch.trim(), batch, college: finalCollege })
        .eq('id', user.id);

      if (updateErr) throw updateErr;

      onComplete({ usn: usnClean, branch: branch.trim(), batch, college: finalCollege });
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
          <label className={LABEL} htmlFor="reg-usn">Student ID / USN</label>
          <input
            id="reg-usn"
            type="text"
            value={usn}
            onChange={(e) => setUsn(e.target.value.toUpperCase())}
            required
            autoComplete="off"
            className={`${FIELD} font-jet tracking-[0.14em]`}
            placeholder="e.g. 1RV25CS001"
          />
          <p className={HINT}>AS PRINTED ON YOUR ID CARD</p>
        </div>

        <div>
          <label className={LABEL} htmlFor="reg-college">College</label>
          <div className="relative">
            <select
              id="reg-college"
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              required
              className={selectClass}
            >
              <option value="" disabled>Select College</option>
              {COLLEGES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-[#56707B]">
              ▾
            </span>
          </div>
        </div>

        {college === 'Other' && (
          <div>
            <label className={LABEL} htmlFor="reg-custom-college">Enter your College</label>
            <input
              id="reg-custom-college"
              type="text"
              value={customCollege}
              onChange={(e) => setCustomCollege(e.target.value)}
              required
              className={FIELD}
              placeholder="Full college name"
            />
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={LABEL} htmlFor="reg-branch">Branch / Course</label>
            <div className="relative">
              <input
                id="reg-branch"
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value.toUpperCase())}
                required
                className={`${FIELD} font-jet tracking-[0.14em]`}
                placeholder="e.g. CS"
              />
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
          className={`flex cursor-pointer items-start gap-3 rounded-[2px] border p-4 transition-colors ${eligible
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
