import { Link } from 'react-router-dom';

/**
 * Portal top bar: RVCE mark, CLONEFEST 2.0 wordmark, Coding Club mark.
 *
 * Logo treatment matches the landing, auth and leaderboard headers:
 * image.png is black artwork on a white plate, so it is inverted and screened;
 * the club JPEG already sits on black and only needs screening.
 */

const RVCE_LOGO = '/assets/image.png';
const CLUB_LOGO = '/assets/cc-10-years-white.png';

export default function CyberHeader({ variant = 'cyan', customLogo = CLUB_LOGO }) {
  // Variants kept for call-site compatibility, remapped onto the current palette.
  const colorMap = {
    cyan: { border: 'border-[#B3E0F2]/15', text: 'text-[#B3E0F2]' },
    green: { border: 'border-[#7FB27E]/25', text: 'text-[#7FB27E]' },
    white: { border: 'border-white/15', text: 'text-[#E4EEF2]' },
  };
  const colors = colorMap[variant] || colorMap.cyan;

  return (
    <header
      className={`fixed top-0 left-0 z-50 w-full border-b ${colors.border} bg-[#080D0C]/85 px-4 py-3 backdrop-blur-md sm:px-6`}
    >
      <div className="relative mx-auto flex max-w-7xl items-center justify-between">
        <Link to="/" aria-label="CloneFest home" className="flex items-center">
          <img
            src={RVCE_LOGO}
            alt="RVCE"
            className="h-12 w-auto [filter:invert(1)] mix-blend-screen transition-transform duration-300 hover:scale-105 md:h-14"
          />
        </Link>

        <div className="pointer-events-none absolute left-1/2 w-full max-w-[200px] -translate-x-1/2 text-center sm:max-w-none">
          <span
            className={`font-clash text-base font-semibold uppercase tracking-[0.14em] md:text-2xl ${colors.text}`}
          >
            CloneFest 2.0
          </span>
        </div>

        <img
          src={customLogo}
          alt="Coding Club"
          className="h-14 w-auto object-contain mix-blend-screen transition-transform duration-300 hover:scale-105 md:h-[72px]"
        />
      </div>
    </header>
  );
}
