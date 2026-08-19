import { motion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1];

function RubricItem({ number, text, marks }) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#5D91A6]/20 py-4 last:border-0 gap-2 md:gap-4">
            <div className="flex items-start md:items-center gap-3">
                <span className="font-mono text-lg md:text-xl shrink-0">{number}</span>
                <span className="font-mono text-sm md:text-base leading-relaxed text-[#B3E0F2]/90">
                    {text}
                </span>
            </div>
            <div className="font-mono text-sm md:text-base text-[#5D91A6] whitespace-nowrap pl-9 md:pl-0">
                {marks}
            </div>
        </div>
    );
}

export default function JudgingRubric() {
    return (
        <section
            id="rubric"
            className="relative z-20 mx-auto w-full max-w-4xl px-6 pb-24 pt-12 sm:pt-16 scroll-mt-28"
        >
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.7, ease: EASE }}
            >
                <div className="border border-[#5D91A6]/25 bg-[#112026]/40 p-4 md:p-8 lg:p-10 backdrop-blur-sm">
                    <h2 className="font-display crt-glow mb-6 md:mb-8 text-[clamp(1.5rem,3.5vw,2.25rem)] font-black leading-tight tracking-tight text-[#B3E0F2]">
                        📋 Judging Rubric – 100 Marks
                    </h2>

                    <div className="flex flex-col">
                        <RubricItem number="1️⃣" text="Problem Understanding & Core Functionality" marks="— 20 marks" />
                        <RubricItem number="2️⃣" text="Innovation & Meaningful Differentiation" marks="— 20 marks" />
                        <RubricItem number="3️⃣" text="Technical Implementation & Architecture" marks="— 15 marks" />
                        <RubricItem number="4️⃣" text="User Experience & Accessibility" marks="— 15 marks" />
                        <RubricItem number="5️⃣" text="Performance & Reliability/Demo Quality" marks="— 20 marks" />
                        <RubricItem number="6️⃣" text="Documentation & Explanation" marks="— 10 marks" />
                    </div>

                    <div className="mt-6 md:mt-8 flex justify-end">
                        <div className="font-mono font-bold text-base md:text-lg text-[#B3E0F2]">
                            Total — 100 marks
                        </div>
                    </div>
                </div>
            </motion.div>
        </section>
    );
}
