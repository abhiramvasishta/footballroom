import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navigation } from './Navigation';
import { LeaderboardOverlay } from './LeaderboardOverlay';
import { ProfileModal } from './ProfileModal';
import { useUserStore } from '../store/useUserStore';
import { getUserData, fetchTeams, fetchMatches } from '../lib/services';
import type { UserData, Team, Match } from '../types';
import { AnimatePresence } from 'framer-motion';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const AppLayout = () => {
  const { entryId } = useUserStore();
  const location = useLocation();
  
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // State needed for ProfileModal
  const [userData, setUserData] = useState<UserData | null>(null);
  const [predictionsCount, setPredictionsCount] = useState(0);
  const [championTeam, setChampionTeam] = useState<Team | null>(null);

  useEffect(() => {
    if (!entryId) return;

    // We fetch user data globally here so modals have access
    const unsubscribe = onSnapshot(doc(db, 'users', entryId), (docSnap) => {
      if (docSnap.exists()) {
        setUserData(docSnap.data() as UserData);
      }
    });

    const loadStaticData = async () => {
      try {
        const [teams, matches] = await Promise.all([
          fetchTeams(),
          fetchMatches()
        ]);
        
        // Let's get predictions to know the count and champion for the profile
        import('../lib/services').then(({ getPredictionData }) => {
          getPredictionData(entryId).then((pred) => {
            if (pred) {
              setPredictionsCount(Object.keys(pred.picks).length);
              if (pred.predictedChampion) {
                setChampionTeam(teams.find(t => t.id === pred.predictedChampion) || null);
              }
            }
          });
        });
      } catch (err) {
        console.error("Failed to load AppLayout data", err);
      }
    };
    
    loadStaticData();

    const onOpenLeaderboard = () => setIsLeaderboardOpen(true);
    const onOpenProfile = () => setIsProfileOpen(true);
    window.addEventListener('openLeaderboard', onOpenLeaderboard);
    window.addEventListener('openProfile', onOpenProfile);

    return () => {
      unsubscribe();
      window.removeEventListener('openLeaderboard', onOpenLeaderboard);
      window.removeEventListener('openProfile', onOpenProfile);
    };
  }, [entryId]);

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col md:flex-row relative">
      <Navigation 
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
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
        {isProfileOpen && userData && (
          <ProfileModal 
            user={userData}
            predictionsCount={predictionsCount}
            totalMatches={32}
            championTeam={championTeam}
            onClose={() => setIsProfileOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
