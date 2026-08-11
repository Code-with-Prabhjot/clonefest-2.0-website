import { Link } from 'react-router-dom';

export default function CyberHeader({ variant = 'cyan', customLogo = '/logos/coding-club.png' }) {
  const colorMap = {
    cyan: { border: 'border-[#00F0FF]', shadow: 'shadow-[0_0_15px_rgba(0,240,255,0.2)]', text: 'text-[#00F0FF] drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]' },
    green: { border: 'border-[#00FF00]', shadow: 'shadow-[0_0_15px_rgba(0,255,0,0.2)]', text: 'text-[#00FF00] drop-shadow-[0_0_8px_rgba(0,255,0,0.8)]' },
    white: { border: 'border-white', shadow: 'shadow-[0_0_15px_rgba(255,255,255,0.2)]', text: 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' }
  };
  const colors = colorMap[variant] || colorMap.cyan;

  return (
    <header className={`fixed top-0 left-0 w-full z-50 backdrop-blur-md bg-[#0A0A0A]/90 border-b ${colors.border} ${colors.shadow} p-4 transition-colors duration-500`}>
      <div className="max-w-7xl mx-auto flex justify-between items-center relative">
        {/* Left Logo */}
        <div className="flex items-center">
          <img
            src="/logos/rvce.png"
            alt="RVCE Logo"
            className="h-10 w-10 md:h-12 md:w-12 filter drop-shadow-[0_0_5px_rgba(255,255,255,0.5)] hover:scale-110 transition-transform duration-300"
          />
        </div>

        {/* Center Title */}
        <div className="absolute left-1/2 transform -translate-x-1/2 text-center w-full max-w-[200px] sm:max-w-none pointer-events-none">
          <span className={`text-xl md:text-3xl font-bold tracking-widest uppercase ${colors.text}`}>
            CLONEFEST 2.0
          </span>
        </div>

        {/* Right Logo */}
        <div className="flex items-center">
          <img
            src={customLogo}
            alt="Coding Club Logo"
            className="h-10 w-auto md:h-12 md:w-auto object-contain filter drop-shadow-[0_0_5px_rgba(255,255,255,0.5)] hover:scale-110 transition-transform duration-300"
          />
        </div>
      </div>
    </header>
  );
}
