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
          className="absolute inset-0 z-20 bg-black/40 backdrop-blur-[2px] pointer-events-none"
        >
          {/* Text at the top */}
          <motion.div 
            className="absolute top-10 left-0 w-full flex justify-center px-4"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="text-white text-sm md:text-base font-medium tracking-widest uppercase opacity-80 text-center drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]">
              thiruguthundi aagu mowa 😭
            </span>
          </motion.div>

          {/* Spinner at the center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
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
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
