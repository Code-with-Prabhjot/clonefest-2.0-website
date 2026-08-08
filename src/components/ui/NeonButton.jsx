export default function NeonButton({ children, onClick, variant = 'cyan', className = '', type = 'button', styleType = 'outline' }) {
  const colorMap = {
    cyan: { 
      outline: 'border border-[#00F0FF] text-[#00F0FF] hover:bg-[#00F0FF] hover:text-[#0A0A0A] shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:shadow-[0_0_25px_rgba(0,240,255,0.6)]',
      solid: 'bg-[#00F0FF] text-[#0A0A0A] hover:bg-[#33ffff] shadow-[0_0_15px_rgba(0,240,255,0.4)] hover:shadow-[0_0_25px_rgba(0,240,255,0.7)]'
    },
    green: { 
      outline: 'border border-[#00FF00] text-[#00FF00] hover:bg-[#00FF00] hover:text-[#0A0A0A] shadow-[0_0_15px_rgba(0,255,0,0.3)] hover:shadow-[0_0_25px_rgba(0,255,0,0.6)]',
      solid: 'bg-[#00FF00] text-[#0A0A0A] hover:bg-[#33ff33] shadow-[0_0_15px_rgba(0,255,0,0.4)] hover:shadow-[0_0_25px_rgba(0,255,0,0.7)]'
    },
    white: { 
      outline: 'border border-white text-white hover:bg-white hover:text-[#0A0A0A] shadow-[0_0_10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_20px_rgba(255,255,255,0.6)]',
      solid: 'bg-white text-[#0A0A0A] hover:bg-gray-200 shadow-[0_0_10px_rgba(255,255,255,0.4)] hover:shadow-[0_0_20px_rgba(255,255,255,0.7)]'
    }
  };

  const styleClasses = colorMap[variant]?.[styleType] || colorMap.cyan.outline;
  
  return (
    <button 
      type={type}
      onClick={onClick}
      className={`px-8 py-3 uppercase tracking-widest transition-all duration-300 font-bold ${styleClasses} ${className}`}
    >
      {children}
    </button>
  );
}
