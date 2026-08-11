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

export default function SurvivalGuide() {
    return (
        <section
            id="rules"
            data-testid="survival-guide-section"
            className="relative z-20 mx-auto w-full max-w-5xl px-6 pb-24 pt-12 sm:pt-16 scroll-mt-28"
        >
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.7, ease: EASE }}
            >
                <p className="font-mono text-[10px] tracking-[0.35em] text-[#5D91A6] sm:text-[11px]">
                    <span className="mr-2 text-[#477346]">&gt;_</span>
                    HACKER SURVIVAL GUIDE
                </p>

                <h2 className="font-display crt-glow mt-4 text-[clamp(1.75rem,4.5vw,3rem)] font-black leading-tight tracking-tight text-[#B3E0F2]">
                    RULES OF ENGAGEMENT
                </h2>

                <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    <Panel kicker="ELIGIBILITY">
                        <ul className="mt-4 space-y-2 font-mono text-sm leading-relaxed text-[#B3E0F2]/90">
                            <li><span className="text-[#477346] mr-2">&gt;</span>2025-2029 batch only.</li>
                        </ul>
                    </Panel>

                    <Panel kicker="SQUAD FORMATION">
                        <ul className="mt-4 space-y-2 font-mono text-sm leading-relaxed text-[#B3E0F2]/90">
                            <li><span className="text-[#477346] mr-2">&gt;</span>3 to 4 operatives per team.</li>
                            <li><span className="text-[#477346] mr-2">&gt;</span>Form your squad before registering.</li>
                        </ul>
                    </Panel>

                    <Panel kicker="COMMS">
                        <ul className="mt-4 space-y-2 font-mono text-sm leading-relaxed text-[#B3E0F2]/90">
                            <li><span className="text-[#477346] mr-2">&gt;</span>Keep a close eye on your Hacker Portal for real-time announcements and mission drops.</li>
                        </ul>
                    </Panel>
                    
                    <Panel kicker="REGISTRATION PROTOCOL" className="md:col-span-2 lg:col-span-3">
                        <ul className="mt-4 grid gap-4 md:grid-cols-3 font-mono text-sm leading-relaxed text-[#B3E0F2]/90">
                            <li><span className="text-[#477346] mr-2">01.</span>Leader logs in & clicks 'Forge a Squad'.</li>
                            <li><span className="text-[#477346] mr-2">02.</span>Leader copies generated 3-part hex Invite Code.</li>
                            <li><span className="text-[#477346] mr-2">03.</span>Teammates log in, click 'Enlist' & paste code.</li>
                        </ul>
                    </Panel>

                    <Panel kicker="THE SPRINT" className="md:col-span-2">
                        <ul className="mt-4 space-y-2 font-mono text-sm leading-relaxed text-[#B3E0F2]/90">
                            <li><span className="text-[#477346] mr-2">&gt;</span>Aug 20: Mission 01 Drops.</li>
                            <li><span className="text-[#477346] mr-2">&gt;</span>Aug 25: Mission 01 Ends / Mission 02 Drops.</li>
                            <li><span className="text-[#477346] mr-2">&gt;</span>Aug 30: Mission 02 Ends.</li>
                            <li className="text-[#C2564B] mt-2"><span className="mr-2">!</span>Strict 23:59 deadlines. No late GitHub repositories.</li>
                        </ul>
                    </Panel>

                    <Panel kicker="ENFORCEMENT" className="md:col-span-1">
                        <ul className="mt-4 space-y-2 font-mono text-sm leading-relaxed text-[#B3E0F2]/90">
                            <li><span className="text-[#477346] mr-2">&gt;</span>Only Team Leads can submit GitHub repositories.</li>
                            <li className="text-[#C2564B]"><span className="text-[#477346] mr-2">&gt;</span>Plagiarism = immediate disqualification.</li>
                        </ul>
                    </Panel>
                </div>
            </motion.div>
        </section>
    );
}
