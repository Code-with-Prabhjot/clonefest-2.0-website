import { useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import { AnimatePresence } from 'framer-motion';
import BackgroundCanvas from '../components/landing/BackgroundCanvas';
import TerminalBoot from '../components/landing/TerminalBoot';
import Header from '../components/landing/Header';
import Hero from '../components/landing/Hero';
import Marquee from '../components/landing/Marquee';
import About from '../components/landing/About';
import FAQModal from '../components/landing/FAQModal';

export default function Landing() {
  const [booted, setBooted] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const lenisRef = useRef(null);

  // Swaps the cursor for the landing only; scoped to <html>.landing-active in
  // styles/landing.css so the portals are unaffected.
  useEffect(() => {
    document.documentElement.classList.add('landing-active');
    return () => document.documentElement.classList.remove('landing-active');
  }, []);

  // Hold the page still until the boot overlay clears.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('landing-booting', !booted);
    return () => root.classList.remove('landing-booting');
  }, [booted]);

  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.09 });
    lenisRef.current = lenis;
    let raf;
    const loop = (time) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Lenis owns the scroll position, so native scrollIntoView would fight it.
  const scrollToAbout = () => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo('#about', { duration: 1.2 });
    } else {
      document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative w-full bg-[#080D0C] text-[#B3E0F2]">
      {/* Fixed, so the canvas and CRT treatment stay put as the page scrolls
          rather than scrolling away above the About section. */}
      <BackgroundCanvas />
      <div className="noise-overlay pointer-events-none fixed inset-0 z-10" aria-hidden="true" />
      <div className="scanlines pointer-events-none fixed inset-0 z-10" aria-hidden="true" />
      <div className="vignette pointer-events-none fixed inset-0 z-10" aria-hidden="true" />

      <Header
        booted={booted}
        onFaqClick={() => setFaqOpen(true)}
        onAboutClick={scrollToAbout}
      />

      {/* The hero keeps its own full viewport, so About sits entirely below the
          fold and is only reachable by scrolling or the nav button. */}
      <section className="relative h-screen w-full overflow-hidden">
        <Hero booted={booted} />
      </section>

      <About />

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
