import { AnimatedTransition } from '../components/AnimatedTransition';
import { Settings } from 'lucide-react';

export default function MaintenancePage() {
  return (
    <AnimatedTransition className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-bg-primary">
      {/* Background decorations */}
      <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-cyan-primary/10 rounded-full blur-[100px]" />
      
      <div className="z-10 w-full max-w-md text-center">
        <div className="flex justify-center mb-6">
          <Settings size={64} className="text-cyan-primary animate-[spin_4s_linear_infinite]" />
        </div>
        <h1 className="text-3xl font-bold font-display mb-4 text-white">Maintenance Mode</h1>
        <p className="text-text-secondary text-lg mb-8">
          We're currently performing maintenance. <br/>
          Please check back shortly.
        </p>
      </div>
    </AnimatedTransition>
  );
}
