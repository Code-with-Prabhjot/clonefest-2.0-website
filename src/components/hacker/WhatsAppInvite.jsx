/* eslint-disable react-refresh/only-export-components */
import { useEffect } from 'react';
import { PANEL, KICKER, HEADING, GHOST } from '../auth/authStyles';

/**
 * Shown exactly once, immediately after a hacker submits their USN, branch and
 * batch — between registration and squad setup.
 *
 * "Once" is enforced two ways. The parent only mounts this on the transition
 * out of ProfileDetailsForm, and a localStorage key per user id stops it
 * reappearing if the component ever remounts. Dismissing writes the key, so a
 * refresh at the squad-setup step lands straight on squad setup.
 */

const GROUP_URL = 'https://chat.whatsapp.com/HOXqVk4TofTCUWkzYsPag1?s=cl&p=a&ilr=0';
const KEY = (userId) => `clonefest.wa-invite.${userId || 'anon'}`;

/** True when this user has never dismissed the invite. */
export function shouldShowInvite(userId) {
  try {
    return localStorage.getItem(KEY(userId)) !== 'seen';
  } catch {
    // Private mode / storage disabled: show it rather than swallow it.
    return true;
  }
}

export function markInviteSeen(userId) {
  try {
    localStorage.setItem(KEY(userId), 'seen');
  } catch {
    /* nothing to do — worst case it shows again next visit */
  }
}

export default function WhatsAppInvite({ onClose }) {
  // Escape closes, and the page behind must not scroll while this is up.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wa-invite-title"
      onClick={onClose}
      className="fixed inset-0 z-[120] grid place-items-center overflow-y-auto bg-[#080D0C]/85 p-4 backdrop-blur-md"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`${PANEL} max-w-[420px] p-7 sm:p-8`}
      >
        <p className={KICKER}>Registration complete</p>

        <h2 id="wa-invite-title" className={`${HEADING} mt-3`}>
          Join the CloneFest WhatsApp group
        </h2>

        <p className="mt-3 text-[13px] leading-relaxed text-[#8AA5AE]">
          Every announcement, deadline change and problem-statement clarification
          goes out here first. Join now so you do not miss anything during the
          sprint.
        </p>

        <a
          href={GROUP_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
          className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-[2px] bg-[#7FB27E] px-5 py-3.5 text-[13.5px] font-medium text-[#080D0C] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(127,178,126,.28)]"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px] fill-current">
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.53.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.16 0-.43.06-.65.31-.22.25-.86.84-.86 2.05s.88 2.38 1 2.54c.12.17 1.73 2.65 4.2 3.71.59.25 1.04.4 1.4.52.59.19 1.12.16 1.54.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.17-.47-.29Z" />
          </svg>
          Open WhatsApp group
        </a>

        <button type="button" onClick={onClose} className={`${GHOST} mt-3`}>
          Continue to squad setup
        </button>

        <p className="mt-4 text-center font-jet text-[10px] uppercase tracking-[0.14em] text-[#56707B]">
          Shown once — the link is also with your squad lead
        </p>
      </div>
    </div>
  );
}
