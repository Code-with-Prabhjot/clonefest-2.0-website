import { useRef, useState } from "react";
import { motion } from "framer-motion";

const CHARS = "01<>/{}[]#$%&*+=@XKF";

// The three known facts about the event. Formerly the Week 1/2/3 chips.
const CHIPS = [
    { id: "chip-fork", label: "FORK // COMMIT // PUSH" },
    { id: "chip-public", label: "BUILD IN PUBLIC" },
    { id: "chip-ship", label: "SHIP IT" },
];

function Chip({ id, label, delay, booted, accent }) {
    const [text, setText] = useState(label);
    const busy = useRef(false);

    const scramble = () => {
        if (busy.current) return;
        busy.current = true;
        let step = 0;
        const iv = setInterval(() => {
            step++;
            setText(
                label
                    .split("")
                    .map((ch, i) => {
                        if (ch === " " || ch === "/" || i < step) return ch;
                        return CHARS[(Math.random() * CHARS.length) | 0];
                    })
                    .join(""),
            );
            if (step >= label.length) {
                clearInterval(iv);
                setText(label);
                busy.current = false;
            }
        }, 26);
    };

    const base =
        "border px-5 py-2.5 font-mono text-[11px] tracking-[0.22em] backdrop-blur-sm " +
        "transition-[border-color,color,box-shadow] duration-300";

    const tone = accent
        ? "border-[#477346] bg-[#477346]/15 text-[#B3E0F2] crt-glow " +
          "shadow-[0_0_20px_rgba(71,115,70,0.3)] hover:border-[#B3E0F2] " +
          "hover:shadow-[0_0_28px_rgba(71,115,70,0.5)]"
        : "border-[#5D91A6]/40 bg-[#112026]/40 text-[#B3E0F2] crt-glow " +
          "hover:border-[#477346] hover:shadow-[0_0_18px_rgba(71,115,70,0.25)]";

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
