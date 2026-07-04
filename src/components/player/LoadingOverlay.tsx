import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isBuffering: boolean;
}

export const LoadingOverlay = ({ isBuffering }: Props) => {
  return (
    <AnimatePresence>
      {isBuffering && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-[2px] pointer-events-none"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <motion.div 
                className="absolute inset-0 border-4 border-transparent border-t-cyan-primary rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <motion.div 
                className="absolute inset-2 border-4 border-transparent border-t-cyan-secondary border-b-cyan-secondary rounded-full opacity-60"
                animate={{ rotate: -360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
              <div className="w-2 h-2 bg-cyan-primary rounded-full shadow-[0_0_10px_#00d9ff]" />
            </div>
            <motion.span 
              className="text-white text-sm font-medium tracking-widest uppercase opacity-80"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              Loading Highlight
            </motion.span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
