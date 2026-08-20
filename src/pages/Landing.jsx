import { useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import BackgroundCanvas from '../components/landing/BackgroundCanvas';
import { AnimatePresence } from 'framer-motion';
import TerminalBoot from '../components/landing/TerminalBoot';
import Header from '../components/landing/Header';
import Hero from '../components/landing/Hero';
import Marquee from '../components/landing/Marquee';
import About from '../components/landing/About';
import SurvivalGuide from '../components/landing/SurvivalGuide';
import FAQModal from '../components/landing/FAQModal';
import JudgingRubric from '../components/landing/JudgingRubric';

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

  const scrollToRules = () => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo('#rules', { duration: 1.2 });
    } else {
      document.getElementById('rules')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToRubric = () => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo('#rubric', { duration: 1.2 });
    } else {
      document.getElementById('rubric')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative w-full bg-[#080D0C] text-[#B3E0F2]">
      {/* Restored from before 0969970. Canvas sits at z-0 and the CRT layers
          at z-10, all below the hero and About (z-20), marquee (z-40) and
          header (z-50), so nothing above them shifts or becomes unclickable. */}
      <BackgroundCanvas />
      <div className="noise-overlay pointer-events-none fixed inset-0 z-10" aria-hidden="true" />
      <div className="scanlines pointer-events-none fixed inset-0 z-10" aria-hidden="true" />
      <div className="vignette pointer-events-none fixed inset-0 z-10" aria-hidden="true" />

      <Header
        booted={booted}
        onFaqClick={() => setFaqOpen(true)}
        onAboutClick={scrollToAbout}
        onRulesClick={scrollToRules}
        onRubricClick={scrollToRubric}
      />

      {/* The hero keeps its own full viewport, so About sits entirely below the
          fold and is only reachable by scrolling or the nav button. */}
      <section className="relative h-screen w-full overflow-hidden">
        <Hero booted={booted} />
      </section>

      <About />
      <SurvivalGuide />
      <JudgingRubric />

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
