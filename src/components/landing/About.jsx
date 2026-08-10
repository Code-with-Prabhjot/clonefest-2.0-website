import { motion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1];

const TIMELINE = [
    {
        date: "20 AUG 2026",
        time: "18:00",
        events: [{ label: "Challenge 01 released", kind: "release" }],
    },
    {
        date: "25 AUG 2026",
        time: "23:59",
        events: [
            { label: "Challenge 01 deadline", kind: "deadline" },
            { label: "Challenge 02 released", kind: "release" },
        ],
    },
    {
        date: "30 AUG 2026",
        time: "23:59",
        events: [{ label: "Challenge 02 deadline", kind: "deadline" }],
        last: true,
    },
];

function Panel({ kicker, children, className = "" }) {
    return (
        <div
            className={`border border-[#5D91A6]/25 bg-[#112026]/40 p-6 backdrop-blur-sm sm:p-8 ${className}`}
        >
            <p className="font-mono text-[10px] tracking-[0.28em] text-[#5D91A6]">
                {kicker}
            </p>
            {children}
        </div>
    );
}

function Timeline() {
    const last = TIMELINE.length - 1;

    return (
        <ol className="mt-6">
            {TIMELINE.map((item, i) => (
                <li
                    key={item.date}
                    className={`relative pl-6 ${i === last ? "" : "pb-7"}`}
                >
                    {/* Node and connector share one axis at x=6px: each is
                        placed at left-[6px] and pulled back by half its own
                        width, so their centres coincide exactly. */}
                    {i !== last && (
                        <span
                            className="absolute -bottom-px left-[6px] top-[15px] w-px -translate-x-1/2 bg-[#5D91A6]/25"
                            aria-hidden="true"
                        />
                    )}

                    <span
                        className={`absolute left-[6px] top-[3px] h-2.5 w-2.5 -translate-x-1/2 rotate-45 border ${
                            item.last
                                ? "border-[#477346] bg-[#477346]"
                                : "border-[#5D91A6] bg-[#080D0C]"
                        }`}
                        aria-hidden="true"
                    />

                    <p className="crt-glow font-mono text-[11.5px] tracking-[0.16em] text-[#B3E0F2]">
                        {item.date}
                        <span className="mx-1.5 text-[#5D91A6]/60">·</span>
                        {item.time}
                    </p>

                    <ul className="mt-2 space-y-1.5">
                        {item.events.map((e) => (
                            <li
                                key={e.label}
                                className="flex items-start font-mono text-[11.5px] leading-relaxed text-[#5D91A6]"
                            >
                                <span
                                    className={`mr-2 ${
                                        e.kind === "deadline"
                                            ? "text-[#B3E0F2]"
                                            : "text-[#477346]"
                                    }`}
                                    aria-hidden="true"
                                >
                                    {e.kind === "deadline" ? "!" : ">"}
                                </span>
                                {e.label}
                            </li>
                        ))}
                    </ul>
                </li>
            ))}
        </ol>
    );
}

export default function About() {
    return (
        <section
            id="about"
            data-testid="about-section"
            // pb clears the fixed marquee and the mascot's lane at the bottom.
            className="relative z-20 mx-auto w-full max-w-5xl px-6 pb-40 pt-24 sm:pt-32"
        >
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.7, ease: EASE }}
            >
                <p className="font-mono text-[10px] tracking-[0.35em] text-[#5D91A6] sm:text-[11px]">
                    <span className="mr-2 text-[#477346]">&gt;_</span>
                    ABOUT THE EVENT
                </p>

                <h2 className="font-display crt-glow mt-4 text-[clamp(1.75rem,4.5vw,3rem)] font-black leading-tight tracking-tight text-[#B3E0F2]">
                    WHAT IS CLONEFEST 2.0?
                </h2>

                <div className="mt-8 grid gap-5 md:grid-cols-2">
                    <Panel kicker="THE SPRINT">
                        <p className="mt-4 font-mono text-sm leading-relaxed text-[#B3E0F2]/90">
                            A 10-day open-source sprint to build, improve, and
                            contribute to real-world codebases.
                        </p>
                        <p className="mt-4 font-mono text-sm leading-relaxed text-[#B3E0F2]/90">
                            Win from a{" "}
                            <span className="crt-glow font-bold text-[#B3E0F2]">
                                ₹7,000 prize pool
                            </span>{" "}
                            - gain hands-on open-source experience for your resume.
                        </p>
                    </Panel>

                    <Panel kicker="TIMELINE">
                        <Timeline />
                    </Panel>
                </div>
            </motion.div>
        </section>
    );
}
