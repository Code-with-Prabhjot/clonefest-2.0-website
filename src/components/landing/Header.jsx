import { motion } from "framer-motion";

// Filenames contain spaces, so they must be URL-encoded.
const COLLEGE_LOGO_URL = "/assets/image.png";
const CLUB_LOGO_URL = "/assets/cc%20new%20logo.jpeg";

const NAV_BUTTON =
    "bg-transparent font-mono text-[11px] uppercase tracking-[0.15em] " +
    "text-[#B3E0F2]/70 transition-colors duration-300 hover:text-[#B3E0F2] sm:text-[13px] sm:tracking-[0.2em]";

export default function Header({ booted, onFaqClick, onAboutClick, onRulesClick }) {
    return (
        <motion.header
            initial={{ y: -56, opacity: 0 }}
            animate={booted ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 top-0 z-50 border-b border-[#5D91A6]/15 bg-[#080D0C]/80 backdrop-blur-md"
        >
            <div className="relative flex flex-col items-center gap-3 px-4 py-3 sm:flex-row sm:justify-between sm:gap-0 sm:px-10 sm:py-4">
                {/* On mobile: row of both logos. On desktop: only college logo on the left. */}
                <div className="flex w-full items-center justify-between sm:w-auto">
                    <img
                        data-testid="college-logo-slot"
                        src={COLLEGE_LOGO_URL}
                        alt="RVCE"
                        className="h-10 w-auto shrink-0 [filter:invert(1)] mix-blend-screen transition-transform duration-300 hover:scale-105 sm:h-14"
                    />
                    
                    <img
                        data-testid="club-logo-slot-mobile"
                        src={CLUB_LOGO_URL}
                        alt="Coding Club"
                        className="h-12 w-auto shrink-0 mix-blend-screen transition-transform duration-300 hover:scale-105 sm:hidden"
                    />
                </div>

                {/* Navigation links centered */}
                {booted && (
                    <div className="flex w-full items-center justify-center gap-4 sm:absolute sm:left-1/2 sm:-translate-x-1/2 sm:w-auto sm:gap-9">
                        <button
                            data-testid="nav-about"
                            onClick={onAboutClick}
                            className={NAV_BUTTON}
                        >
                            About Event
                        </button>
                        <button
                            data-testid="nav-rules"
                            onClick={onRulesClick}
                            className={NAV_BUTTON}
                        >
                            Rules
                        </button>
                        <button
                            data-testid="nav-faq"
                            onClick={onFaqClick}
                            className={NAV_BUTTON}
                        >
                            FAQ
                        </button>
                    </div>
                )}

                {/* Desktop: Club logo on the far right */}
                <img
                    data-testid="club-logo-slot-desktop"
                    src={CLUB_LOGO_URL}
                    alt="Coding Club"
                    className="hidden h-[72px] w-auto shrink-0 mix-blend-screen transition-transform duration-300 hover:scale-105 sm:block"
                />
            </div>
        </motion.header>
    );
}
