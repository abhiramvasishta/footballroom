import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Props {
  isPlaying: boolean;
}

export const PlayerOverlay = ({ isPlaying }: Props) => {
  const [showIcon, setShowIcon] = useState<{ type: 'play' | 'pause', id: number } | null>(null);

  useEffect(() => {
    // Show the icon briefly when state changes
    setShowIcon({ type: isPlaying ? 'play' : 'pause', id: Date.now() });
    
    const timer = setTimeout(() => {
      setShowIcon(null);
    }, 500);

    return () => clearTimeout(timer);
  }, [isPlaying]);

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
      <AnimatePresence>
        {showIcon && (
          <motion.div
            key={showIcon.id}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1.5 }}
            exit={{ opacity: 0, scale: 2 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-20 h-20 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white"
          >
            {showIcon.type === 'play' ? (
              <Play className="w-10 h-10 ml-1 fill-white" />
            ) : (
              <Pause className="w-10 h-10 fill-white" />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
