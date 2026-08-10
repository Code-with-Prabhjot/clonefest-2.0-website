import { motion } from "framer-motion";

// Filenames contain spaces, so they must be URL-encoded.
const COLLEGE_LOGO_URL = "/assets/image.png";
const CLUB_LOGO_URL = "/assets/cc%20new%20logo.jpeg";

const NAV_BUTTON =
    "bg-transparent font-mono text-[13px] uppercase tracking-[0.2em] " +
    "text-[#B3E0F2]/70 transition-colors duration-300 hover:text-[#B3E0F2] sm:text-sm";

export default function Header({ booted, onFaqClick, onAboutClick }) {
    return (
        <motion.header
            initial={{ y: -56, opacity: 0 }}
            animate={booted ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 top-0 z-50 border-b border-[#5D91A6]/15 bg-[#080D0C]/80 backdrop-blur-md"
        >
            <div className="relative flex items-center justify-between px-4 py-3 sm:px-10 sm:py-4">
                {/* Black artwork on a white plate: inverting makes the plate
                    black and the mark white, and screen then drops the black
                    against the page. */}
                <img
                    data-testid="college-logo-slot"
                    src={COLLEGE_LOGO_URL}
                    alt="RVCE"
                    className="h-12 w-auto shrink-0 [filter:invert(1)] mix-blend-screen transition-transform duration-300 hover:scale-105 sm:h-14"
                />

                {/* Centred independently of the logos, so uneven logo widths
                    can't push the nav off centre. */}
                {booted && (
                    <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-6 sm:gap-9">
                        <button
                            data-testid="nav-about"
                            onClick={onAboutClick}
                            className={NAV_BUTTON}
                        >
                            About Event
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

                {/* Already sits on black, so screen alone lifts it out. */}
                <img
                    data-testid="club-logo-slot"
                    src={CLUB_LOGO_URL}
                    alt="Coding Club"
                    className="h-16 w-auto shrink-0 mix-blend-screen transition-transform duration-300 hover:scale-105 sm:h-[72px]"
                />
            </div>
        </motion.header>
    );
}
