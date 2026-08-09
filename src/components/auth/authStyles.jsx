/**
 * Shared presentation tokens for the auth screens.
 *
 * Values mirror the Admin and Judge portals so the three surfaces read as one
 * system: #112026 panels on #080D0C, #0B1519 input wells, a #5D91A6 focus
 * border, #B3E0F2 primary action and #C2564B for errors.
 */

export const PANEL =
  'w-full rounded-[3px] border border-[#B3E0F2]/10 bg-[#112026]';

export const LABEL =
  'font-jet mb-2 block text-[10px] uppercase tracking-[0.22em] text-[#56707B]';

export const FIELD =
  'w-full rounded-[2px] border border-[#B3E0F2]/15 bg-[#0B1519] px-4 py-3 ' +
  'text-sm text-[#E4EEF2] outline-none transition-colors duration-200 ' +
  'placeholder:text-[#56707B] focus:border-[#5D91A6]';

export const PRIMARY =
  'w-full rounded-[2px] bg-[#B3E0F2] px-5 py-3.5 text-[13.5px] font-medium ' +
  'text-[#080D0C] transition-all duration-200 hover:-translate-y-0.5 ' +
  'hover:shadow-[0_8px_24px_rgba(179,224,242,.25)] disabled:cursor-not-allowed ' +
  'disabled:opacity-45 disabled:hover:translate-y-0 disabled:hover:shadow-none';

export const GHOST =
  'flex w-full items-center justify-center gap-2.5 rounded-[2px] border ' +
  'border-[#B3E0F2]/20 bg-transparent px-5 py-3 text-[13px] font-medium ' +
  'text-[#8AA5AE] transition-colors duration-200 hover:border-[#B3E0F2]/45 ' +
  'hover:text-[#E4EEF2] disabled:cursor-not-allowed disabled:opacity-45';

export const HEADING = 'font-clash text-[21px] font-medium text-[#E4EEF2]';

export const KICKER =
  'font-jet text-[10px] uppercase tracking-[0.24em] text-[#5D91A6]';

export const HINT = 'mt-2 font-jet text-[10px] tracking-[0.1em] text-[#56707B]';

/** Panel header: kicker line above a Clash Grotesk title. */
export function FormHead({ kicker, title, blurb }) {
  return (
    <div className="mb-6">
      <p className={KICKER}>{kicker}</p>
      <h2 className={`${HEADING} mt-2.5`}>{title}</h2>
      {blurb && (
        <p className="mt-2.5 text-[13px] leading-relaxed text-[#8AA5AE]">{blurb}</p>
      )}
    </div>
  );
}

/** Inline error, styled as the portals' destructive state. */
export function FormError({ children }) {
  if (!children) return null;
  return (
    <div className="mb-5 rounded-[2px] border border-[#C2564B]/45 border-l-2 border-l-[#C2564B] bg-[#C2564B]/10 px-4 py-3">
      <p className="font-jet text-[9px] uppercase tracking-[0.2em] text-[#C2564B]">
        Transaction failed
      </p>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#E6A79E]">{children}</p>
    </div>
  );
}

/** Terminal success panel shared by the two sign-up flows. */
export function FormSuccess({ kicker, title, body }) {
  return (
    <div style={{ animation: 'pop .34s ease-out both' }}>
      <div className="flex items-center gap-2.5">
        <span className="h-[7px] w-[7px] flex-none border border-[#7FB27E] bg-[#7FB27E]" />
        <p className="font-jet text-[10px] uppercase tracking-[0.24em] text-[#7FB27E]">
          {kicker}
        </p>
      </div>
      <h3 className={`${HEADING} mt-3`}>{title}</h3>
      <p className="mt-3 text-[13px] leading-relaxed text-[#8AA5AE]">{body}</p>
    </div>
  );
}
