export default function MainPortal() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#FFFFFF] flex flex-col items-center justify-center p-4">
      <div className="border-2 border-[#00F0FF] p-10 max-w-2xl w-full text-center relative overflow-hidden group">
        <div className="absolute inset-0 bg-[#00F0FF] opacity-5 group-hover:opacity-10 transition-opacity duration-300"></div>
        <h1 className="text-5xl font-bold mb-6 text-[#00F0FF] tracking-widest uppercase drop-shadow-[0_0_10px_rgba(0,240,255,0.8)]">
          Clonefest 2.0
        </h1>
        <p className="text-xl text-gray-400 mb-8 tracking-wide">
          <span className="text-[#00FF00]">&gt;</span> SYSTEM INITIALIZED. AWAITING HACKER INPUT...
        </p>
        <button className="border border-[#00F0FF] text-[#00F0FF] px-8 py-3 uppercase tracking-widest hover:bg-[#00F0FF] hover:text-[#0A0A0A] transition-colors duration-300 font-bold shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:shadow-[0_0_25px_rgba(0,240,255,0.6)]">
          Enter Portal
        </button>
      </div>
    </div>
  );
}
