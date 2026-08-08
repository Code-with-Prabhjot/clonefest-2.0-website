import TerminalCard from '../components/ui/TerminalCard';
import NeonButton from '../components/ui/NeonButton';
import CyberGrid from '../components/ui/CyberGrid';
import CyberHeader from '../components/ui/CyberHeader';
import CyberInput from '../components/ui/CyberInput';

export default function AdminPortal() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#FFFFFF] flex flex-col items-center justify-center p-4">
      <CyberGrid variant="green" />
      <CyberHeader variant="green" />
      <TerminalCard variant="green" title="Admin Override" className="max-w-xl w-full mt-20">
        <div className="space-y-6">
          <CyberInput 
            variant="green"
            label="Access Code"
            type="password"
            placeholder="Enter clearance code..."
          />
          <NeonButton variant="green" styleType="solid" className="w-full">
            Authenticate
          </NeonButton>
        </div>
      </TerminalCard>
    </div>
  );
}
