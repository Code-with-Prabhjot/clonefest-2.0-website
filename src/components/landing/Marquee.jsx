import { motion } from "framer-motion";

const ITEMS = [
    "CLONEFEST 2.0",
    "RVCE CODING CLUB",
    "MERGE OR BE MERGED",
    "OPEN SOURCE // OPEN SEASON",
    "READ THE SOURCE",
];

function Strip({ hidden }) {
    return (
        <div className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
            {ITEMS.map((item) => (
                <span
                    key={item}
                    className="flex items-center whitespace-nowrap font-mono text-[10px] tracking-[0.35em] text-[#5D91A6] sm:text-[11px]"
                >
                    <span className="px-6">{item}</span>
                    <span className="text-[#477346]">///</span>
                </span>
            ))}
        </div>
    );
}

export default function Marquee({ booted }) {
    return (
        <motion.div
            data-testid="marquee-strip"
            initial={{ y: 48, opacity: 0 }}
            animate={booted ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.7, delay: 1.15, ease: [0.22, 1, 0.36, 1] }}
            className="marquee-hover fixed inset-x-0 bottom-0 z-40 overflow-hidden border-t border-[#5D91A6]/15 bg-[#080D0C]/80 py-3 backdrop-blur-md"
        >
            <div className="animate-marquee flex w-max">
                <Strip />
                <Strip hidden />
            </div>
        </motion.div>
    );
}