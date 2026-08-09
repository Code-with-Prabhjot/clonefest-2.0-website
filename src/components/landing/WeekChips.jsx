import { useRef, useState } from "react";
import { motion } from "framer-motion";

const CHARS = "01<>/{}[]#$%&*+=@XKF";
const CHIPS = [
    { id: "week-chip-alpha", label: "W01 // PROJECT ALPHA" },
    { id: "week-chip-beta", label: "W02 // PROJECT BETA" },
    { id: "week-chip-gamma", label: "W03 // GAMMA + DEPLOY" },
];

function Chip({ id, label, delay, booted }) {
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

    return (
        <motion.button
            type="button"
            data-testid={id}
            onMouseEnter={scramble}
            onFocus={scramble}
            initial={{ opacity: 0, y: 14 }}
            animate={booted ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
            className="border border-[#5D91A6]/30 bg-[#112026]/40 px-4 py-2 font-mono text-[10px] tracking-[0.22em] text-[#5D91A6] backdrop-blur-sm transition-[border-color,color,box-shadow] duration-300 hover:border-[#477346] hover:text-[#B3E0F2] hover:shadow-[0_0_18px_rgba(71,115,70,0.25)]"
        >
            {text}
        </motion.button>
    );
}

export default function WeekChips({ booted }) {
    return (
        <div
            data-testid="week-chips"
            className="mb-10 flex flex-wrap items-center justify-center gap-3"
        >
            {CHIPS.map((chip, i) => (
                <Chip
                    key={chip.id}
                    id={chip.id}
                    label={chip.label}
                    delay={0.95 + i * 0.1}
                    booted={booted}
                />
            ))}
        </div>
    );
}