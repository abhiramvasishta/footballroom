import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const OfflineIndicator = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[999] flex justify-center pointer-events-none p-4"
        >
          <div className="bg-red-500/90 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 font-bold backdrop-blur-sm pointer-events-auto border border-red-400">
            <WifiOff size={18} />
            <span>Offline. Changes will sync when connected.</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
