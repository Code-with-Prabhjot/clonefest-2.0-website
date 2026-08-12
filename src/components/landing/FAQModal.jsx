import { motion } from "framer-motion";

const faqs = [
  { q: "What is CloneFest?", a: "CloneFest is an intensive 10-day open-source sprint designed to elevate your skills. You and your squad will build and contribute to live, real-world codebases, gaining the kind of hands-on experience that makes recruiters take notice." },
  { q: "When is the event?", a: "The event runs from 20th to 30th August." },
  { q: "Who can participate?", a: "Students from the 2025-29 batch. You must participate in a team of 3-4 members." },
  { q: "What is the mode of the event?", a: "The event is completely ONLINE." },
  { q: "What are the main focuses?", a: ["End-to-end Open Source Development", "Production-Ready Software Architecture", "Getting a massive Portfolio Boost!"] },
  { q: "Is there a prize pool?", a: "Yes! We have a 7K Prize Pool up for grabs." },
  { q: "Who can I contact for queries?", a: "Shashwati (8618069507) or Surabhi (7892567330)." }
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
              {Array.isArray(faq.a) ? (
                <ul className="list-disc list-inside text-gray-400 text-sm leading-relaxed space-y-1">
                  {faq.a.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 text-sm leading-relaxed">{faq.a}</p>
              )}
            </div>
          ))}
        </div>

      </motion.div>
    </div>
  );
}
