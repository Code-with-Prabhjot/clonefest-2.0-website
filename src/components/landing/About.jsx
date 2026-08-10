import { motion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1];

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

                    {/* Deliberately empty — content to be supplied. */}
                    <Panel kicker="TIMELINE">
                        <div className="mt-4 flex min-h-[180px] items-center justify-center border border-dashed border-[#5D91A6]/25">
                            <p className="font-mono text-[11px] tracking-[0.22em] text-[#5D91A6]/70">
                                &gt; TO BE ANNOUNCED
                                <span className="animate-caret ml-1 inline-block h-3 w-1.5 translate-y-0.5 bg-[#477346]" />
                            </p>
                        </div>
                    </Panel>
                </div>
            </motion.div>
        </section>
    );
}
