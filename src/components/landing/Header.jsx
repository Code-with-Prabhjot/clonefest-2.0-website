import { motion } from "framer-motion";

const COLLEGE_LOGO_URL = "/assets/college-logo.png";
const CLUB_LOGO_URL = "/assets/club-logo.png";

function LogoSlot({ label, url, round, testId }) {
    return (
        <img
            data-testid={testId}
            src={url}
            alt={label}
            className={`${
                round
                    ? "h-14 w-14 rounded-full object-cover"
                    : "h-14 w-auto rounded-sm"
            } border border-[#5D91A6]/40 mix-blend-screen transition-transform duration-300 hover:scale-105`}
        />
    );
}

export default function Header({ booted, onFaqClick }) {
    return (
        <motion.header
            initial={{ y: -56, opacity: 0 }}
            animate={booted ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 top-0 z-50 border-b border-[#5D91A6]/15 bg-[#080D0C]/80 backdrop-blur-md"
        >
            <div className="flex items-center justify-between px-4 py-3 sm:px-10 sm:py-4">
                <LogoSlot
                    label="RVCE"
                    url={COLLEGE_LOGO_URL}
                    round
                    testId="college-logo-slot"
                />

                {booted && (
                  <button 
                    onClick={onFaqClick}
                    className="ml-auto mr-4 border border-[#5D91A6]/40 px-4 py-1.5 text-xs uppercase tracking-widest text-[#5D91A6] hover:bg-[#5D91A6]/10 hover:text-[#B3E0F2] transition-all font-mono shadow-[0_0_10px_rgba(93,145,166,0)] hover:shadow-[0_0_10px_rgba(93,145,166,0.3)]"
                  >
                    FAQ
                  </button>
                )}

                <LogoSlot
                    label="CODING CLUB"
                    url={CLUB_LOGO_URL}
                    testId="club-logo-slot"
                />
            </div>
        </motion.header>
    );
}
