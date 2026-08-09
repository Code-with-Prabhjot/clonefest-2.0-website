import { useEffect, useRef, useState } from 'react';
import './HackerPet.css';

const QUOTES = [
  '> ACCESS GRANTED! ⚡',
  '> sudo hack_the_planet()',
  '> 01001000 01000001 01000011 01001011',
  '> SYSTEM OVERRIDE INITIATED 🖥️',
  '> SK1D DETECTED! 🚨',
  '> git push --force origin main 🔥',
  '> 0 vulnerabilities found... kidding 👾',
];

// 0-2 startup, 3 the constant walk frame, 4-7 the click reaction.
const FRAMES = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `/hacker-pet/${n}.png`);

const WALK_FRAME = 3;
const SPEED = 0.65;
const EDGE_LEFT = 20;
const EDGE_RIGHT_INSET = 80;

export default function HackerPet() {
  const containerRef = useRef(null);
  const flipRef = useRef(null);
  const timersRef = useRef([]);

  const [frame, setFrame] = useState(0);
  const [walking, setWalking] = useState(false);
  const [reacting, setReacting] = useState(false);
  const [quote, setQuote] = useState('');

  const schedule = (fn, ms) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  };

  // Preload every frame so the reaction sequence never flashes a gap.
  useEffect(() => {
    FRAMES.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // Startup: 1 -> 2 -> 3, then settle into the walk frame and start bobbing.
  useEffect(() => {
    let step = 0;
    const id = setInterval(() => {
      step += 1;
      if (step >= 3) {
        setFrame(WALK_FRAME);
        setWalking(true);
        clearInterval(id);
      } else {
        setFrame(step);
      }
    }, 300);
    return () => clearInterval(id);
  }, []);

  // Walk loop. Position is written straight to the DOM rather than held in
  // state: this runs every frame, and re-rendering React 60x/sec would be
  // wasteful and would fight the CSS bob animation.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let x = 60;
    let dir = 1;
    let raf;

    const tick = () => {
      const maxX = window.innerWidth - EDGE_RIGHT_INSET;
      x += dir * SPEED;

      if (x >= maxX) {
        x = maxX;
        dir = -1;
      } else if (x <= EDGE_LEFT) {
        x = EDGE_LEFT;
        dir = 1;
      }

      if (containerRef.current) {
        containerRef.current.style.transform = `translate3d(${x}px, 0, 0)`;
      }
      if (flipRef.current) {
        flipRef.current.style.transform = dir === -1 ? 'scaleX(-1)' : 'scaleX(1)';
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  const handleClick = (e) => {
    e.stopPropagation();
    if (reacting) return;

    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
    setWalking(false);
    setReacting(true);
    setFrame(4);

    schedule(() => setFrame(5), 320);
    schedule(() => setFrame(6), 640);
    schedule(() => setFrame(7), 960);
    schedule(() => {
      setQuote('');
      setReacting(false);
      setWalking(true);
      setFrame(WALK_FRAME);
    }, 2800);
  };

  return (
    <div className="hacker-pet" ref={containerRef} aria-hidden="true">
      <div className={`hacker-pet__speech${quote ? ' is-shown' : ''}`}>{quote}</div>
      <div className="hacker-pet__flip" ref={flipRef}>
        <img
          className={`hacker-pet__img${walking ? ' is-bobbing' : ''}${reacting ? ' is-reacting' : ''}`}
          src={FRAMES[frame]}
          alt=""
          draggable="false"
          data-cursor="button"
          onClick={handleClick}
        />
      </div>
      <div className="hacker-pet__glow" />
    </div>
  );
}
