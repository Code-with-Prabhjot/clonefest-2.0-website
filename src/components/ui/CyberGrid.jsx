import { useEffect, useRef } from 'react';

export default function CyberGrid({ variant = 'cyan' }) {
  const gridRef = useRef(null);

  const colorMap = {
    cyan: '#00F0FF',
    green: '#00FF00',
    white: '#FFFFFF'
  };
  const color = colorMap[variant] || colorMap.cyan;

  useEffect(() => {
    const handleMouseMove = (event) => {
      if (gridRef.current) {
        const x = event.clientX;
        const y = event.clientY;
        gridRef.current.style.setProperty('--mouse-x', `${x}px`);
        gridRef.current.style.setProperty('--mouse-y', `${y}px`);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Base faint grid */}
      <div 
        className="absolute inset-0 bg-[size:4rem_4rem] opacity-5"
        style={{
          backgroundImage: `linear-gradient(to right, ${color} 1px, transparent 1px), linear-gradient(to bottom, ${color} 1px, transparent 1px)`,
        }}
      />
      {/* Interactive mouse grid */}
      <div 
        ref={gridRef}
        className="absolute inset-0 bg-[size:4rem_4rem] opacity-30 transition-opacity duration-300"
        style={{
          backgroundImage: `linear-gradient(to right, ${color} 1px, transparent 1px), linear-gradient(to bottom, ${color} 1px, transparent 1px)`,
          maskImage: `radial-gradient(circle 400px at var(--mouse-x, -500px) var(--mouse-y, -500px), black, transparent)`,
          WebkitMaskImage: `radial-gradient(circle 400px at var(--mouse-x, -500px) var(--mouse-y, -500px), black, transparent)`,
        }}
      />
    </div>
  );
}
