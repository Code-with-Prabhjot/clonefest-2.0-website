import { useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function GlitchButton({ booted }) {
    const ref = useRef(null);
    const mx = useMotionValue(0);
    const my = useMotionValue(0);
    const x = useSpring(mx, { stiffness: 180, damping: 14, mass: 0.4 });
    const y = useSpring(my, { stiffness: 180, damping: 14, mass: 0.4 });

    const onMove = (e) => {
        const r = ref.current.getBoundingClientRect();
        mx.set((e.clientX - (r.left + r.width / 2)) * 0.28);
        my.set((e.clientY - (r.top + r.height / 2)) * 0.38);
    };
    const onLeave = () => {
        mx.set(0);
        my.set(0);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 26 }}
            animate={booted ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 1, ease: [0.22, 1, 0.36, 1] }}
        >
            <motion.div
                ref={ref}
                onMouseMove={onMove}
                onMouseLeave={onLeave}
                style={{ x, y }}
                className="inline-block"
            >
                <Link
                    to="/auth"
                    data-testid="enter-portal-button"
                    className="glitch-btn group relative inline-flex items-center gap-4 border border-[#B3E0F2]/40 bg-[#080D0C]/60 px-10 py-4 font-mono text-sm font-bold tracking-[0.3em] text-[#B3E0F2] backdrop-blur-sm transition-[background-color,color,border-color,box-shadow] duration-300 hover:border-[#B3E0F2] hover:bg-[#B3E0F2] hover:text-[#080D0C] hover:shadow-[0_0_36px_rgba(179,224,242,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B3E0F2] sm:px-14 sm:py-5"
                >
                    <span className="btn-sweep" aria-hidden="true" />
                    <span
                        className="absolute left-0 top-0 h-2.5 w-2.5 border-l-2 border-t-2 border-[#477346] transition-transform duration-300 group-hover:-translate-x-1 group-hover:-translate-y-1"
                        aria-hidden="true"
                    />
                    <span
                        className="absolute bottom-0 right-0 h-2.5 w-2.5 border-b-2 border-r-2 border-[#477346] transition-transform duration-300 group-hover:translate-x-1 group-hover:translate-y-1"
                        aria-hidden="true"
                    />
                    <span className="glitch-btn-text" data-text="ENTER PORTAL">
                        ENTER PORTAL
                    </span>
                    <ArrowRight
                        className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5"
                        strokeWidth={2.5}
                    />
                </Link>
            </motion.div>
        </motion.div>
    );
}