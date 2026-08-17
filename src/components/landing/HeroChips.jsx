import { useRef, useState } from "react";
import { motion } from "framer-motion";

const CHARS = "01<>/{}[]#$%&*+=@XKF";

// The three known facts about the event. Formerly the Week 1/2/3 chips.
const CHIPS = [
    { id: "chip-prize", label: "7K PRIZE POOL" },
    { id: "chip-year", label: "10TH YEAR OF CODING CLUB" },
    { id: "chip-batch", label: "2025-2029 BATCH" },
    { id: "chip-remote", label: "100% REMOTE" },
];

function Chip({ id, label, delay, booted, accent }) {
    const [text, setText] = useState(label);
    const busy = useRef(false);

    const scramble = () => {
        if (busy.current) return;
        busy.current = true;
        let step = 0;
        
        // Use spread syntax [...label] to properly handle multi-byte emojis
        const charsArray = [...label];
        
        const iv = setInterval(() => {
            step++;
            setText(
                charsArray
                    .map((ch, i) => {
                        if (ch === " " || ch === "/" || i < step) return ch;
                        return CHARS[(Math.random() * CHARS.length) | 0];
                    })
                    .join(""),
            );
            if (step >= charsArray.length) {
                clearInterval(iv);
                setText(label);
                busy.current = false;
            }
        }, 26);
    };

    const base =
        "border px-5 py-2.5 font-mono text-[12px] font-semibold tracking-[0.22em] backdrop-blur-sm " +
        "transition-[border-color,color,box-shadow,transform] duration-300 hover:scale-[1.03]";

    const tone = accent
        ? "border-[#7FB27E]/80 bg-[#477346]/25 text-[#E4EEF2] crt-glow " +
          "shadow-[0_0_20px_rgba(127,178,126,0.4)] hover:border-[#B3E0F2] " +
          "hover:shadow-[0_0_30px_rgba(127,178,126,0.6)]"
        : "border-[#5D91A6]/70 bg-[#112026]/60 text-[#E4EEF2] crt-glow " +
          "shadow-[0_0_10px_rgba(93,145,166,0.2)] hover:border-[#7FB27E]/80 hover:shadow-[0_0_20px_rgba(127,178,126,0.4)]";

    return (
        <motion.button
            type="button"
            data-testid={id}
            onMouseEnter={scramble}
            onFocus={scramble}
            initial={{ opacity: 0, y: 14 }}
            animate={booted ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
            className={`${base} ${tone}`}
        >
            {text}
        </motion.button>
    );
}

export default function HeroChips({ booted }) {
    return (
        <div
            data-testid="hero-chips"
            className="mb-10 flex flex-wrap items-center justify-center gap-3"
        >
            {CHIPS.map((chip, i) => (
                <Chip
                    key={chip.id}
                    id={chip.id}
                    label={chip.label}
                    accent={chip.accent}
                    delay={0.95 + i * 0.1}
                    booted={booted}
                />
            ))}
        </div>
    );
}
