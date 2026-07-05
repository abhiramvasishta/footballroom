import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Navigation } from './Navigation';
import { LeaderboardOverlay } from './LeaderboardOverlay';
import { useUserStore } from '../store/useUserStore';
import { AnimatePresence } from 'framer-motion';

export const AppLayout = () => {
  const { entryId } = useUserStore();
  
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  useEffect(() => {
    if (!entryId) return;

    const onOpenLeaderboard = () => setIsLeaderboardOpen(true);
    window.addEventListener('openLeaderboard', onOpenLeaderboard);

    return () => {
      window.removeEventListener('openLeaderboard', onOpenLeaderboard);
    };
  }, [entryId]);

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col md:flex-row relative">
      <Navigation 
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
      />
      
      {/* Main Content Area */}
      <main className="flex-1 md:ml-24 pb-16 md:pb-0 min-h-screen relative overflow-x-hidden">
        <Outlet />
      </main>

      {/* Global Modals */}
      <AnimatePresence>
        {isLeaderboardOpen && (
          <LeaderboardOverlay 
            currentEntryId={entryId || undefined}
            onClose={() => setIsLeaderboardOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
