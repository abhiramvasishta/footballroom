import { AnimatedTransition } from '../components/AnimatedTransition';
import { GlobalAnalytics } from '../components/GlobalAnalytics';
import { BarChart3 } from 'lucide-react';

export default function AnalysisPage() {
  return (
    <AnimatedTransition className="min-h-screen bg-bg-primary p-4 md:p-8 pt-12 pb-24">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <BarChart3 className="text-cyan-primary" size={32} />
          <h1 className="text-3xl font-display font-bold text-white tracking-wide">Platform Analysis</h1>
        </div>
        <p className="text-text-secondary uppercase tracking-widest text-xs border-b border-[rgba(0,217,255,0.18)] pb-4 -mt-4">Global prediction statistics</p>

        <GlobalAnalytics />
      </div>
    </AnimatedTransition>
  );
}
