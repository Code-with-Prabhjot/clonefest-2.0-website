import { useEffect, useRef, useState } from 'react';
import './CustomCursor.css';

/**
 * Nine-state custom cursor.
 *
 * State is resolved from whatever sits under the pointer. Anything can opt in
 * explicitly with data-cursor="link|button|text|image|drag|denied|busy", which
 * always wins over the tag-based fallback.
 *
 * Position is written to the DOM through a ref inside a rAF loop — this runs on
 * every mouse move, and re-rendering React that often would be wasteful. Only a
 * change of *state* re-renders.
 */

const ICE = '#B3E0F2';
const TEAL = '#5D91A6';

// States drawn from the pointer tip; the rest are centred on it.
const TIP_ANCHORED = new Set(['default', 'link']);

function resolveState(el) {
  if (!el || !el.closest) return 'default';

  const tagged = el.closest('[data-cursor]');
  if (tagged) return tagged.dataset.cursor;

  if (document.documentElement.hasAttribute('data-busy')) return 'busy';

  if (el.closest('input:disabled, button:disabled, [aria-disabled="true"], .is-disabled')) {
    return 'denied';
  }
  if (el.closest('input[type="text"], input[type="email"], input[type="password"], input[type="search"], input[type="number"], textarea, [contenteditable="true"]')) {
    return 'text';
  }
  if (el.closest('button, [role="button"], select, [type="submit"]')) return 'button';
  if (el.closest('a[href], [role="link"]')) return 'link';
  if (el.closest('img, [role="img"]')) return 'image';

  return 'default';
}

/* ---------------------------------------------------------------- shapes */

const Arrow = ({ glow }) => (
  <path
    d="M3 2 L3 19 L7.6 14.6 L10.4 21 L13.2 19.8 L10.5 13.6 L16.5 13.4 Z"
    fill={glow ? ICE : 'rgba(179,224,242,.92)'}
    stroke={ICE}
    strokeWidth="1"
    strokeLinejoin="round"
  />
);

const Brackets = ({ r = 15, len = 5, dash }) => (
  <g stroke={ICE} strokeWidth="1.4" fill="none" strokeLinecap="round" opacity=".9">
    <path d={`M${-r} ${-r + len} L${-r} ${-r} L${-r + len} ${-r}`} />
    <path d={`M${r - len} ${-r} L${r} ${-r} L${r} ${-r + len}`} />
    <path d={`M${r} ${r - len} L${r} ${r} L${r - len} ${r}`} />
    <path d={`M${-r + len} ${r} L${-r} ${r} L${-r} ${r - len}`} />
    {dash}
  </g>
);

const SHAPES = {
  // 1. Glitchy pointer
  default: (
    <svg width="34" height="34" viewBox="0 0 34 34">
      <g className="cur-glitch-b"><Arrow /></g>
      <g className="cur-glitch-a"><Arrow /></g>
      <Arrow />
      <g className="cur-shards" fill={TEAL}>
        <rect x="19" y="5" width="3" height="1.4" />
        <rect x="22" y="9" width="1.6" height="1.4" />
        <rect x="17" y="23" width="4" height="1.4" />
        <rect x="1" y="12" width="2" height="1.4" />
      </g>
    </svg>
  ),

  // 2. Neon glow + viewfinder brackets
  link: (
    <svg width="46" height="46" viewBox="0 0 46 46" className="cur-lit">
      <g transform="translate(14,12)"><Arrow glow /></g>
      <g transform="translate(23,23)"><Brackets r={19} len={6} /></g>
    </svg>
  ),

  // 7. Expanding ring with a core dot
  button: (
    <svg width="52" height="52" viewBox="-26 -26 52 52" className="cur-lit">
      <circle r="17" fill="none" stroke={TEAL} strokeWidth="1.2"
              strokeDasharray="5 6" opacity=".85" />
      <circle r="11" fill="none" stroke={ICE} strokeWidth="1.4" className="cur-ring-breathe" />
      <circle r="3" fill={ICE} />
    </svg>
  ),

  // 4. Terminal I-beam
  text: (
    <svg width="24" height="34" viewBox="-12 -17 24 34" className="cur-lit">
      <g stroke={ICE} strokeWidth="1.6" strokeLinecap="round">
        <line x1="0" y1="-12" x2="0" y2="12" />
        <line x1="-5" y1="-13" x2="5" y2="-13" />
        <line x1="-5" y1="13" x2="5" y2="13" />
      </g>
    </svg>
  ),

  // 8. Viewfinder with centre cross
  image: (
    <svg width="56" height="56" viewBox="-28 -28 56 56" className="cur-lit">
      <Brackets r={20} len={7} />
      <g stroke={ICE} strokeWidth="1.3" strokeLinecap="round">
        <line x1="-5" y1="0" x2="5" y2="0" />
        <line x1="0" y1="-5" x2="0" y2="5" />
      </g>
      <circle r="12" fill="none" stroke={TEAL} strokeWidth="1" strokeDasharray="3 5" opacity=".7" />
    </svg>
  ),

  // 5. Scanning
  busy: (
    <svg width="52" height="52" viewBox="-26 -26 52 52" className="cur-lit">
      <g className="cur-spin"><Brackets r={17} len={6} /></g>
      <rect x="-3" y="-3" width="6" height="6" fill={ICE} className="cur-pulse-soft" />
      <circle r="11" fill="none" stroke={TEAL} strokeWidth="1"
              strokeDasharray="2 6" className="cur-spin-rev" opacity=".8" />
    </svg>
  ),

  // 6. Move node
  drag: (
    <svg width="52" height="52" viewBox="-26 -26 52 52" className="cur-lit">
      <g stroke={ICE} strokeWidth="1.3" strokeLinecap="round" strokeDasharray="4 4">
        <line x1="-18" y1="0" x2="18" y2="0" />
        <line x1="0" y1="-18" x2="0" y2="18" />
      </g>
      <g fill={ICE}>
        <rect x="-21" y="-3" width="6" height="6" />
        <rect x="15" y="-3" width="6" height="6" />
        <rect x="-3" y="-21" width="6" height="6" />
        <rect x="-3" y="15" width="6" height="6" />
      </g>
      <rect x="-3.5" y="-3.5" width="7" height="7" fill="none" stroke={ICE} strokeWidth="1.3" />
    </svg>
  ),

  // 9. Access denied
  denied: (
    <svg width="46" height="46" viewBox="-23 -23 46 46" className="cur-denied">
      <path d="M0 -18 L15.6 -9 L15.6 9 L0 18 L-15.6 9 L-15.6 -9 Z"
            fill="rgba(194,86,75,.10)" stroke="#C2564B" strokeWidth="1.5" strokeLinejoin="round" />
      <g stroke="#C2564B" strokeWidth="1.8" strokeLinecap="round">
        <line x1="-6" y1="-6" x2="6" y2="6" />
        <line x1="6" y1="-6" x2="-6" y2="6" />
      </g>
    </svg>
  ),
};

export default function CustomCursor() {
  const rootRef = useRef(null);
  // Mirrors of the React state, so the hot path can skip redundant setState
  // calls and the expensive hit-test entirely.
  const lastTargetRef = useRef(null);
  const stateRef = useRef('default');
  const visibleRef = useRef(false);

  const [state, setState] = useState('default');
  const [pressed, setPressed] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Touch and pen devices keep their native behaviour.
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    document.documentElement.classList.add('has-custom-cursor');

    // Position only. Kept as small as possible: this runs at the pointer's
    // full polling rate, which on a gaming mouse can be 1000Hz.
    const onPos = (e) => {
      const el = rootRef.current;
      if (el) {
        el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }
    };

    const onMove = (e) => {
      onPos(e);

      if (!visibleRef.current) {
        visibleRef.current = true;
        setVisible(true);
      }

      // resolveState walks the DOM with several closest() calls. On a dense
      // page that is not free, and the answer only changes when the pointer
      // crosses into a different element.
      if (e.target === lastTargetRef.current) return;
      lastTargetRef.current = e.target;

      const next = resolveState(e.target);
      if (next !== stateRef.current) {
        stateRef.current = next;
        setState(next);
      }
    };
    const onDown = () => setPressed(true);
    const onUp = () => setPressed(false);
    const onLeave = () => { visibleRef.current = false; setVisible(false); };
    const onEnter = () => { visibleRef.current = true; setVisible(true); };

    const hasRaw = 'onpointerrawupdate' in window;
    if (hasRaw) window.addEventListener('pointerrawupdate', onPos, { passive: true });
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseenter', onEnter);

    return () => {
      if (hasRaw) window.removeEventListener('pointerrawupdate', onPos);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mouseenter', onEnter);
      document.documentElement.classList.remove('has-custom-cursor');
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={`cursor${visible ? ' is-visible' : ''}${pressed ? ' is-pressed' : ''}`}
      aria-hidden="true"
    >
      <div className={`cursor__core${TIP_ANCHORED.has(state) ? '' : ' is-centered'}`}>
        {SHAPES[state] || SHAPES.default}
      </div>
      {/* 3. Click pulse — rides on top of whichever state is active. */}
      <span className="cursor__pulse" />
      <span className="cursor__pulse cursor__pulse--late" />
    </div>
  );
}
