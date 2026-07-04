import { motion } from 'framer-motion';
import { RotateCcw, ListVideo, StepForward } from 'lucide-react';

interface Props {
  onReplay: () => void;
  onBack?: () => void;
  onNext?: () => void;
}

export const EndedOverlay = ({ onReplay, onBack, onNext }: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md p-4"
    >
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
        
        {/* Replay */}
        <button 
          onClick={onReplay}
          className="flex flex-col items-center gap-2 group p-4"
        >
          <div className="w-14 h-14 rounded-full bg-white/5 group-hover:bg-cyan-primary/20 border border-white/10 group-hover:border-cyan-primary flex items-center justify-center transition-all duration-300">
            <RotateCcw className="w-6 h-6 text-white group-hover:text-cyan-primary transition-colors" />
          </div>
          <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">Replay Highlight</span>
        </button>

        {/* Back to Highlights */}
        {onBack && (
          <button 
            onClick={onBack}
            className="flex flex-col items-center gap-2 group p-4"
          >
            <div className="w-14 h-14 rounded-full bg-white/5 group-hover:bg-cyan-primary/20 border border-white/10 group-hover:border-cyan-primary flex items-center justify-center transition-all duration-300">
              <ListVideo className="w-6 h-6 text-white group-hover:text-cyan-primary transition-colors" />
            </div>
            <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">Back to Highlights</span>
          </button>
        )}

        {/* Next Highlight */}
        {onNext && (
          <button 
            onClick={onNext}
            className="flex flex-col items-center gap-2 group p-4"
          >
            <div className="w-14 h-14 rounded-full bg-white/5 group-hover:bg-cyan-primary/20 border border-white/10 group-hover:border-cyan-primary flex items-center justify-center transition-all duration-300">
              <StepForward className="w-6 h-6 text-white group-hover:text-cyan-primary transition-colors" />
            </div>
            <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">Next Highlight</span>
          </button>
        )}

      </div>
    </motion.div>
  );
};
