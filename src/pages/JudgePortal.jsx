export default function JudgePortal() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#FFFFFF] flex flex-col items-center justify-center p-4">
      <div className="border-2 border-white p-10 max-w-xl w-full relative overflow-hidden group">
        <div className="absolute inset-0 bg-white opacity-5 group-hover:opacity-10 transition-opacity duration-300"></div>
        <h1 className="text-4xl font-bold mb-6 text-white tracking-widest uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] text-center">
          Judge Evaluation
        </h1>
        <p className="text-gray-400 mb-8 tracking-wide text-center">
          <span className="text-[#00F0FF]">&gt;</span> AUTHENTICATE TO EVALUATE CLONES
        </p>
        <div className="space-y-6">
          <div>
            <input 
              type="password" 
              className="w-full bg-transparent border border-gray-700 focus:border-white focus:ring-1 focus:ring-white outline-none text-[#FFFFFF] px-4 py-3 font-mono placeholder-gray-600 text-center tracking-widest transition-all"
              placeholder="JUDGE_KEY"
            />
          </div>
          <button className="w-full border border-white text-white px-8 py-3 uppercase tracking-widest font-bold shadow-[0_0_10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_20px_rgba(255,255,255,0.6)] hover:bg-white hover:text-[#0A0A0A] transition-all duration-300">
            Initialize
          </button>
        </div>
      </div>
    </div>
  );
}
