import { Link } from 'react-router-dom';
import ShinyText from './ShinyText/ShinyText.jsx';

/**
 * Portal top bar: RVCE mark, CLONEFEST 2.0 wordmark, Coding Club mark.
 *
 * Both logos are transparent PNGs with light artwork, so neither needs an
 * invert or a blend mode.
 *
 * The wordmark used to be absolutely centred across the full row, which
 * overlapped the two marks once they grew — that was the alignment drift on
 * the participants page. It now occupies a flex track of its own and simply
 * drops out on the narrowest screens rather than squeezing the logos.
 */

const RVCE_LOGO = '/assets/rvce-transparent.png';
const CLUB_LOGO = '/assets/cc-transparent.png';

export default function CyberHeader({ variant = 'cyan', customLogo = CLUB_LOGO }) {
  // Variants kept for call-site compatibility, remapped onto the current palette.
  const colorMap = {
    cyan: { border: 'border-[#B3E0F2]/15', text: 'text-[#B3E0F2]' },
    green: { border: 'border-[#7FB27E]/25', text: 'text-[#7FB27E]' },
    white: { border: 'border-white/15', text: 'text-[#E4EEF2]' },
  };
  const hexMap = {
    cyan: '#B3E0F2',
    green: '#7FB27E',
    white: '#E4EEF2',
  };
  const colors = colorMap[variant] || colorMap.cyan;
  const baseColor = hexMap[variant] || hexMap.cyan;

  return (
    <header
      className={`fixed top-0 left-0 z-50 w-full border-b ${colors.border} bg-[#080D0C]/85 px-3 py-2 backdrop-blur-md sm:px-6 sm:py-3`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 sm:gap-6">
        <Link to="/" aria-label="CloneFest home" className="flex shrink-0 items-center">
          <img
            src={RVCE_LOGO}
            alt="RVCE"
            className="h-12 w-auto transition-transform duration-300 hover:scale-105 md:h-16"
          />
        </Link>

        <span
          className={`hidden min-w-0 flex-1 truncate text-center font-['Audiowide'] text-2xl font-normal uppercase tracking-[0.08em] sm:block md:text-4xl`}
        >
          <ShinyText text="CloneFest 2.0" color={baseColor} shineColor="#ffffff" speed={2} />
        </span>

        <img
          src={customLogo}
          alt="Coding Club"
          className="h-20 w-auto shrink-0 object-contain transition-transform duration-300 hover:scale-105 md:h-24"
        />
      </div>
    </header>
  );
}
