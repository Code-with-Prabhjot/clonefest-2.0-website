import TerminalCard from '../components/ui/TerminalCard';
import NeonButton from '../components/ui/NeonButton';
import CyberGrid from '../components/ui/CyberGrid';
import CyberHeader from '../components/ui/CyberHeader';
import CyberInput from '../components/ui/CyberInput';

export default function JudgePortal() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#FFFFFF] flex flex-col items-center justify-center p-4">
      <CyberGrid variant="white" />
      <CyberHeader variant="white" />
      <TerminalCard variant="white" title="Judge Evaluation" className="max-w-xl w-full mt-20">
        <p className="text-gray-400 mb-8 tracking-wide text-center">
          <span className="text-[#00F0FF]">&gt;</span> AUTHENTICATE TO EVALUATE CLONES
        </p>
        <div className="space-y-6">
          <CyberInput 
            variant="white"
            type="password"
            placeholder="JUDGE_KEY"
            inputClassName="text-center"
          />
          <NeonButton variant="white" styleType="outline" className="w-full">
            Initialize
          </NeonButton>
        </div>
      </TerminalCard>
    </div>
  );
}
