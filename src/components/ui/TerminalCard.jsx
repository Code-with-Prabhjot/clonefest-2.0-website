import BlurText from './BlurText';

export default function TerminalCard({ children, title, variant = 'cyan', className = '' }) {
  const colorMap = {
    cyan: { border: 'border-[#00F0FF]', bgHover: 'bg-[#00F0FF]', title: 'text-[#00F0FF] drop-shadow-[0_0_10px_rgba(0,240,255,0.8)]' },
    green: { border: 'border-[#00FF00]', bgHover: 'bg-[#00FF00]', title: 'text-[#00FF00] drop-shadow-[0_0_10px_rgba(0,255,0,0.8)]' },
    white: { border: 'border-white', bgHover: 'bg-white', title: 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]' }
  };
  const colors = colorMap[variant] || colorMap.cyan;

  return (
    <div className={`border-2 ${colors.border} p-6 md:p-10 relative overflow-hidden group ${className}`}>
      <div className={`absolute inset-0 ${colors.bgHover} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
      <div className="relative z-10">
        {title && (
          <h1 className={`text-4xl md:text-5xl font-bold mb-6 tracking-widest uppercase text-center ${colors.title}`}>
            <BlurText 
              text={title} 
              delay={150} 
              animateBy="letters" 
              direction="top" 
            />
          </h1>
        )}
        {children}
      </div>
    </div>
  );
}
