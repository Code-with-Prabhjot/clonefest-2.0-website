import { motion } from "framer-motion";

const faqs = [
  { q: "What is CloneFest?", a: "CloneFest is a cyberpunk-themed hackathon where you build and break modern web tech." },
  { q: "Who can participate?", a: "The 2025-2029 batch (upcoming second-year students)." },
  { q: "How much does it cost?", a: "Zero. Participation is completely free." },
  { q: "What if I don't have a team?", a: "No problem! We'll help you find a squad." },
  { q: "Where is the event located?", a: "The event is hybrid, you can participate from anywhere." }
];

export default function FAQModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-[#080D0C]/80 backdrop-blur-sm" 
        onClick={onClose} 
      />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-2xl border border-[#5D91A6]/40 bg-[#0A0A0A] p-6 sm:p-8 shadow-[0_0_30px_rgba(93,145,166,0.15)]"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-5 text-[#5D91A6] hover:text-[#B3E0F2] font-mono text-xl transition-colors"
        >
          [x]
        </button>
        <h2 className="text-xl sm:text-2xl font-bold text-[#B3E0F2] mb-6 uppercase tracking-wider font-mono">
          &gt; Intel / FAQ
        </h2>
        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {faqs.map((faq, i) => (
            <div key={i} className="border-l-2 border-[#5D91A6]/50 pl-4 py-1">
              <h3 className="text-[#00F0FF] font-semibold mb-2">{faq.q}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>

      </motion.div>
    </div>
  );
}
