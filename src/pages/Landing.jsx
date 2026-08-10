import { useEffect, useState } from 'react';
import Lenis from 'lenis';
import { AnimatePresence } from 'framer-motion';
import BackgroundCanvas from '../components/landing/BackgroundCanvas';
import TerminalBoot from '../components/landing/TerminalBoot';
import Header from '../components/landing/Header';
import Hero from '../components/landing/Hero';
import Marquee from '../components/landing/Marquee';
import FAQModal from '../components/landing/FAQModal';

export default function Landing() {
  const [booted, setBooted] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);

  // The landing is a single fixed viewport: it locks body scroll and swaps the
  // cursor. Both are scoped to <html>.landing-active in styles/landing.css so
  // the Admin, Judge and Hacker portals keep normal scrolling.
  useEffect(() => {
    document.documentElement.classList.add('landing-active');
    return () => document.documentElement.classList.remove('landing-active');
  }, []);

  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.09 });
    let raf;
    const loop = (time) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#080D0C] text-[#B3E0F2]">
      <BackgroundCanvas />
      <div className="noise-overlay pointer-events-none absolute inset-0 z-10" aria-hidden="true" />
      <div className="scanlines pointer-events-none absolute inset-0 z-10" aria-hidden="true" />
      <div className="vignette pointer-events-none absolute inset-0 z-10" aria-hidden="true" />
      <Header booted={booted} onFaqClick={() => setFaqOpen(true)} />
      <Hero booted={booted} />
      <Marquee booted={booted} />
      <AnimatePresence>
        {!booted && <TerminalBoot onComplete={() => setBooted(true)} />}
      </AnimatePresence>
      <AnimatePresence>
        {faqOpen && <FAQModal isOpen={faqOpen} onClose={() => setFaqOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
