export default function CyberInput({ label, type = 'text', placeholder, value, onChange, variant = 'cyan', className = '', inputClassName = '' }) {
  const colorMap = {
    cyan: { label: 'text-[#00F0FF]', focus: 'focus:border-[#00F0FF] focus:ring-[#00F0FF]' },
    green: { label: 'text-[#00FF00]', focus: 'focus:border-[#00FF00] focus:ring-[#00FF00]' },
    white: { label: 'text-white', focus: 'focus:border-white focus:ring-white' }
  };
  const colors = colorMap[variant] || colorMap.cyan;

  return (
    <div className={className}>
      {label && <label className={`block mb-2 font-mono text-sm uppercase tracking-widest ${colors.label}`}>&gt; {label}</label>}
      <input 
        type={type} 
        value={value}
        onChange={onChange}
        className={`w-full bg-transparent border border-gray-700 ${colors.focus} focus:ring-1 outline-none text-[#FFFFFF] px-4 py-3 font-mono placeholder-gray-600 transition-all ${inputClassName}`}
        placeholder={placeholder}
      />
    </div>
  );
}
