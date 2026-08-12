import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const LINES = [
    { text: "CLONEFEST_v2.0 :: BOOT SEQUENCE INITIATED", tone: "ice" },
    { text: "mounting /realworld/codebases ......... OK", tone: "teal" },
    { text: "indexing open issues .................. OK", tone: "teal" },
    { text: "prize_pool.load() ..................... ₹7,000", tone: "matrix" },
    { text: "contribution.engine ................... ARMED", tone: "teal" },
    { text: "uptime: 10 days | judges: online | mercy: disabled", tone: "matrix" },
    { text: "ACCESS GRANTED — WELCOME BACK, BUILDER", tone: "ice" },
];

const TONE_CLASS = {
    ice: "text-[#B3E0F2] crt-glow",
    teal: "text-[#5D91A6]",
    matrix: "text-[#477346] crt-glow-green",
};

export default function TerminalBoot({ onComplete }) {
    const [count, setCount] = useState(0);
    const done = useRef(false);
    const finishRef = useRef(onComplete);
    
    useEffect(() => {
        finishRef.current = onComplete;
    }, [onComplete]);

    useEffect(() => {
        const iv = setInterval(
            () => setCount((c) => Math.min(c + 1, LINES.length)),
            230,
        );
        return () => clearInterval(iv);
    }, []);

    useEffect(() => {
        if (count >= LINES.length && !done.current) {
            done.current = true;
            const t = setTimeout(() => finishRef.current(), 700);
            return () => clearTimeout(t);
        }
    }, [count]);

    const skip = () => setCount(LINES.length);

    return (
        <motion.div
            data-testid="boot-sequence-overlay"
            aria-hidden="true"
            onClick={skip}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-[100] flex flex-col justify-center bg-[#080D0C] px-6 sm:px-16"
        >
            {/* One wrapping row: side by side when there is room, stacked when
                there is not. Two absolutes both pinned to top-6 collided on
                narrow screens. */}
            <div className="pointer-events-none absolute inset-x-6 top-6 flex flex-wrap justify-between gap-x-6 gap-y-1 font-mono text-[9px] tracking-[0.18em] text-[#5D91A6]/60 sm:inset-x-16 sm:text-[10px] sm:tracking-[0.3em]">
                <span>CLONEFEST BIOS v2.0.26</span>
                <span>MEM CHECK: 640K — ENOUGH FOR ANYONE</span>
            </div>

            <div className="w-full max-w-3xl">
                {LINES.slice(0, count).map((line) => (
                    <motion.p
                        key={line.text}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.18 }}
                        className={`font-mono text-[10px] leading-relaxed break-all sm:text-sm sm:break-normal ${TONE_CLASS[line.tone]}`}
                    >
                        <span className="mr-2 text-[#477346]">&gt;</span>
                        {line.text}
                    </motion.p>
                ))}
                <p className="mt-1 font-mono text-xs sm:text-sm">
                    <span className="mr-2 text-[#477346]">&gt;</span>
                    <span className="animate-caret inline-block h-4 w-2.5 translate-y-0.5 bg-[#B3E0F2]" />
                </p>

                <div className="mt-10 h-px w-full bg-[#112026]">
                    <div
                        className="h-px bg-[#477346] transition-[width] duration-200 ease-out"
                        style={{ width: `${(count / LINES.length) * 100}%` }}
                    />
                </div>
                <div className="mt-3 flex items-center justify-between font-mono text-[10px] tracking-[0.3em] text-[#5D91A6]/70">
                    <span>LOADING MODULES</span>
                    <span data-testid="boot-progress-label">
                        {Math.round((count / LINES.length) * 100)}%
                    </span>
                </div>
            </div>

            <div className="absolute inset-x-0 bottom-8 px-6 text-center font-mono text-[9px] tracking-[0.22em] text-[#5D91A6]/50 sm:text-[10px] sm:tracking-[0.35em]">
                [ CLICK ANYWHERE TO SKIP ]
            </div>
        </motion.div>
    );
}