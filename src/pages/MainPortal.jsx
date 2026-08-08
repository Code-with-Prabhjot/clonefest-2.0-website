import TerminalCard from '../components/ui/TerminalCard';
import NeonButton from '../components/ui/NeonButton';
import CyberGrid from '../components/ui/CyberGrid';
import TypewriterText from '../components/ui/TypewriterText';
import CyberHeader from '../components/ui/CyberHeader';

export default function MainPortal() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#FFFFFF] flex flex-col items-center justify-center p-4">
      <CyberGrid variant="cyan" />
      <CyberHeader variant="cyan" />
      <TerminalCard variant="cyan" title="Clonefest 2.0" className="max-w-2xl w-full text-center mt-20">
        <p className="text-xl text-gray-400 mb-8 tracking-wide min-h-[30px]">
          <span className="text-[#00FF00] mr-2">&gt;</span>
          <TypewriterText text="SYSTEM INITIALIZED. AWAITING HACKER INPUT..." speed={40} />
        </p>
        <NeonButton variant="cyan" styleType="outline">
          Enter Portal
        </NeonButton>
      </TerminalCard>
    </div>
  );
}
