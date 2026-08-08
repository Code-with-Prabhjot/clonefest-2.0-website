export default function AdminPortal() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#FFFFFF] flex flex-col items-center justify-center p-4">
      <div className="border-2 border-[#00FF00] p-10 max-w-xl w-full relative overflow-hidden group">
        <div className="absolute inset-0 bg-[#00FF00] opacity-5 group-hover:opacity-10 transition-opacity duration-300"></div>
        <h1 className="text-4xl font-bold mb-6 text-[#00FF00] tracking-widest uppercase drop-shadow-[0_0_10px_rgba(0,255,0,0.8)] text-center">
          Admin Override
        </h1>
        <div className="space-y-6">
          <div>
            <label className="block text-[#00FF00] mb-2 font-mono text-sm uppercase tracking-widest">&gt; Access Code</label>
            <input 
              type="password" 
              className="w-full bg-transparent border border-gray-700 focus:border-[#00FF00] focus:ring-1 focus:ring-[#00FF00] outline-none text-[#FFFFFF] px-4 py-3 font-mono placeholder-gray-600 transition-all"
              placeholder="Enter clearance code..."
            />
          </div>
          <button className="w-full bg-[#00FF00] text-[#0A0A0A] px-8 py-3 uppercase tracking-widest font-bold shadow-[0_0_15px_rgba(0,255,0,0.4)] hover:shadow-[0_0_25px_rgba(0,255,0,0.7)] hover:bg-[#33ff33] transition-all duration-300">
            Authenticate
          </button>
        </div>
      </div>
    </div>
  );
}
