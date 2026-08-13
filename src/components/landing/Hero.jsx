import { useEffect, useRef, useState } from "react";
import {
    motion,
    useMotionValue,
    useSpring,
    useTransform,
} from "framer-motion";
import GlitchButton from "./GlitchButton";
import HeroChips from "./HeroChips";

const EASE = [0.22, 1, 0.36, 1];

function MaskedLine({ booted, delay, children, testId }) {
    return (
        <div className="overflow-hidden">
            <motion.div
                data-testid={testId}
                initial={{ y: "115%" }}
                animate={booted ? { y: "0%" } : {}}
                transition={{ duration: 0.9, delay, ease: EASE }}
            >
                {children}
            </motion.div>
        </div>
    );
}

function TypedTagline({ booted }) {
    const TEXT = "system initialized. awaiting hacker input..";
    const [n, setN] = useState(0);
    const ivRef = useRef(null);

    useEffect(() => {
        if (!booted) return;
        let i = 0;
        const start = setTimeout(() => {
            ivRef.current = setInterval(() => {
                i++;
                setN(i);
                if (i >= TEXT.length) clearInterval(ivRef.current);
            }, 42);
        }, 500);
        return () => {
            clearTimeout(start);
            if (ivRef.current) clearInterval(ivRef.current);
        };
    }, [booted]);

    return (
        <p
            data-testid="hero-tagline"
            className="mb-10 mt-8 font-mono text-xs tracking-[0.2em] text-[#5D91A6] sm:text-sm"
        >
            <span className="mr-1 text-[#477346]">&gt;_</span>
            {TEXT.slice(0, n)}
            <span className="animate-caret ml-0.5 inline-block h-3.5 w-2 translate-y-0.5 bg-[#477346]" />
        </p>
    );
}

export default function Hero({ booted }) {
    const mx = useMotionValue(0);
    const my = useMotionValue(0);
    const sx = useSpring(mx, { stiffness: 60, damping: 18 });
    const sy = useSpring(my, { stiffness: 60, damping: 18 });
    const heroX = useTransform(sx, [-1, 1], [14, -14]);
    const heroY = useTransform(sy, [-1, 1], [10, -10]);

    useEffect(() => {
        const onMove = (e) => {
            mx.set((e.clientX / window.innerWidth) * 2 - 1);
            my.set((e.clientY / window.innerHeight) * 2 - 1);
        };
        window.addEventListener("mousemove", onMove);
        return () => window.removeEventListener("mousemove", onMove);
    }, [mx, my]);

    return (
        <main className="absolute inset-0 z-20 flex items-center justify-center px-6">
            <motion.div
                style={{ x: heroX, y: heroY }}
                className="flex w-full max-w-6xl flex-col items-center text-center"
            >
                <MaskedLine booted={booted} delay={0.4} testId="hero-eyebrow">
                    <p className="mb-6 font-mono text-[11px] tracking-[0.45em] text-[#5D91A6] sm:text-xs">
                        <span className="mr-2 text-[#477346]">&gt;_</span>
                        RVCE CODING CLUB PRESENTS
                    </p>
                </MaskedLine>

                <h1 className="font-display font-black leading-[0.95] tracking-tighter">
                    <MaskedLine booted={booted} delay={0.52} testId="hero-title-line-1">
                        <span
                            className="glitch crt-glow block text-[clamp(2.4rem,7.5vw,6.5rem)] text-[#B3E0F2]"
                            data-text="CLONEFEST"
                            data-testid="hero-title"
                        >
                            CLONEFEST
                        </span>
                    </MaskedLine>
                    <MaskedLine booted={booted} delay={0.64} testId="hero-title-line-2">
                        <span className="text-outline block text-[clamp(2rem,6vw,5.25rem)]">
                            2.0
                        </span>
                    </MaskedLine>
                </h1>

                <MaskedLine booted={booted} delay={0.82} testId="hero-tagline-row">
                    <TypedTagline booted={booted} />
                </MaskedLine>

                <HeroChips booted={booted} />

                <GlitchButton booted={booted} />
            </motion.div>
        </main>
    );
}