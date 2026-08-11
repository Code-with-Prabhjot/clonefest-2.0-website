import { useState, useEffect } from 'react';

export default function TypewriterText({ text, speed = 50, className = '' }) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let index = 0;
    let interval;
    (async () => {
      setDisplayedText('');
      interval = setInterval(() => {
        if (index < text.length) {
          setDisplayedText(text.slice(0, index + 1));
          index++;
        } else {
          clearInterval(interval);
        }
      }, speed);
    })();

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span className={className}>
      {displayedText}
      <span className="animate-pulse text-[#00F0FF] ml-1">_</span>
    </span>
  );
}
