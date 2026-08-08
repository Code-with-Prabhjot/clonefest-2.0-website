import TerminalCard from '../components/ui/TerminalCard';
import CyberGrid from '../components/ui/CyberGrid';
import CyberHeader from '../components/ui/CyberHeader';

export default function HackerPortal() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#FFFFFF] flex flex-col items-center justify-center p-4">
      <CyberGrid variant="cyan" />
      <CyberHeader variant="cyan" />
      <TerminalCard variant="cyan" title="Operative Dashboard" className="max-w-2xl w-full text-center mt-20">
        <p className="text-xl text-gray-400 mb-8 tracking-wide">
          <span className="text-[#00F0FF] mr-2">&gt;</span>
          WELCOME TO THE GRID. SQUAD STATUS: PENDING.
        </p>
        <div className="border border-gray-800 p-6 bg-[#050505] text-sm text-left text-gray-400 font-mono">
          <span className="text-[#00F0FF]">root@clonefest:~$</span> ./status_check.sh<br /><br />
          [!] SQUAD LINK OFFLINE<br />
          [!] NO ACTIVE MISSIONS<br /><br />
          &gt; Please return to /auth to Forge or Enlist in a Squad.
        </div>
      </TerminalCard>
    </div>
  );
}
