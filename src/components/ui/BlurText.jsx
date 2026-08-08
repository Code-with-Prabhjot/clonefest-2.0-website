import { useEffect, useRef, useState, useMemo } from 'react';

const BlurText = ({
  text = '',
  delay = 200,
  className = '',
  animateBy = 'words',
  direction = 'top',
  threshold = 0.1,
  rootMargin = '0px',
  onAnimationComplete,
  stepDuration = 0.35,
}) => {
  const elements = animateBy === 'words' ? text.split(' ') : text.split('');
  const [inView, setInView] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(ref.current);
        }
      },
      { threshold, rootMargin }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  useEffect(() => {
    if (inView && onAnimationComplete) {
      const totalDelay = elements.length * delay + stepDuration * 1000;
      const timer = setTimeout(() => {
        onAnimationComplete();
      }, totalDelay);
      return () => clearTimeout(timer);
    }
  }, [inView, elements.length, delay, stepDuration, onAnimationComplete]);

  const keyframes = useMemo(() => {
    const transformY = direction === 'top' ? '-50px' : '50px';
    return `
      @keyframes blur-in-${direction} {
        0% {
          filter: blur(10px);
          opacity: 0;
          transform: translateY(${transformY});
        }
        50% {
          filter: blur(5px);
          opacity: 0.5;
          transform: translateY(${direction === 'top' ? '5px' : '-5px'});
        }
        100% {
          filter: blur(0px);
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;
  }, [direction]);

  return (
    <>
      <style>{keyframes}</style>
      <div
        ref={ref}
        className={className}
        style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}
      >
        {animateBy === 'words' ? (
          text.split(' ').map((segment, index) => {
            const animationDelay = `${(index * delay) / 1000}s`;
            const animationDuration = `${stepDuration}s`;
            
            return (
              <span
                key={index}
                style={{
                  display: 'inline-block',
                  willChange: 'transform, filter, opacity',
                  animation: inView 
                    ? `blur-in-${direction} ${animationDuration} ease-out ${animationDelay} forwards`
                    : 'none',
                  filter: inView ? undefined : 'blur(10px)',
                  opacity: inView ? undefined : 0,
                  transform: inView ? undefined : `translateY(${direction === 'top' ? '-50px' : '50px'})`,
                }}
              >
                {segment === ' ' ? '\u00A0' : segment}
                {index < text.split(' ').length - 1 && '\u00A0'}
              </span>
            );
          })
        ) : (
          text.split(' ').map((word, wordIndex) => (
            <span key={wordIndex} style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
              {word.split('').map((char, charIndex) => {
                // Calculate absolute index for delay across all words
                const prevWords = text.split(' ').slice(0, wordIndex);
                const absoluteIndex = prevWords.reduce((acc, w) => acc + w.length + 1, 0) + charIndex;
                
                const animationDelay = `${(absoluteIndex * delay) / 1000}s`;
                const animationDuration = `${stepDuration}s`;

                return (
                  <span
                    key={charIndex}
                    style={{
                      display: 'inline-block',
                      willChange: 'transform, filter, opacity',
                      animation: inView 
                        ? `blur-in-${direction} ${animationDuration} ease-out ${animationDelay} forwards`
                        : 'none',
                      filter: inView ? undefined : 'blur(10px)',
                      opacity: inView ? undefined : 0,
                      transform: inView ? undefined : `translateY(${direction === 'top' ? '-50px' : '50px'})`,
                    }}
                  >
                    {char}
                  </span>
                );
              })}
              {wordIndex < text.split(' ').length - 1 && '\u00A0'}
            </span>
          ))
        )}
      </div>
    </>
  );
};

export default BlurText;
