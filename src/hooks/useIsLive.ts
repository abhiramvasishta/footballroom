import { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Match, TournamentSettings } from '../types';

export const useIsLive = () => {
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const settingsRef = doc(db, 'settings', 'global');
    const matchesRef = collection(db, 'matches');
    const q = query(matchesRef);

    let currentSettings: TournamentSettings | null = null;
    let currentMatches: Match[] = [];

    const checkLive = () => {
      if (!currentSettings) return;
      const mode = currentSettings.liveStream?.mode || 'Auto';
      
      if (mode === 'Live Now') {
        setIsLive(true);
        return;
      }
      if (mode === 'Offline' || mode === 'Countdown') {
        setIsLive(false);
        return;
      }

      if (mode === 'Auto') {
        const now = new Date().getTime();
        const isAnyLive = currentMatches.some(m => !m.completed && new Date(m.kickoff).getTime() <= now);
        setIsLive(isAnyLive);
      }
    };

    const unsubSettings = onSnapshot(settingsRef, (doc) => {
      currentSettings = doc.data() as TournamentSettings;
      checkLive();
    });

    const unsubMatches = onSnapshot(q, (snapshot) => {
      currentMatches = snapshot.docs.map(doc => doc.data() as Match);
      checkLive();
    });

    return () => {
      unsubSettings();
      unsubMatches();
    };
  }, []);

  return isLive;
};
