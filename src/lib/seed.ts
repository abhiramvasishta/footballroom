import { writeBatch, collection, doc, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import type { TournamentSettings } from '../types';
import { officialTeams, officialMatches } from '../data/worldcup2026-fixtures';

export const seedTournament = async () => {
  const batch = writeBatch(db);

  // 1. Seed Teams
  officialTeams.forEach(team => {
    const ref = doc(db, 'teams', team.id);
    batch.set(ref, team);
  });

  // 2. Seed Matches
  officialMatches.forEach(match => {
    const matchRef = doc(db, 'matches', match.id);
    batch.set(matchRef, { 
      stadium: match.stadium, 
      city: match.city,
      kickoff: match.kickoff,
      date: match.date
    }, { merge: true });
  });

  // 3. Seed Settings
  const defaultSettings: TournamentSettings = {
    contestName: 'THE FOOTBALL ROOM - World Cup 2026 Predictor',
    contestStatus: 'Registration Open',
    predictionLocked: false,
    leaderboardVisible: true,
    currentRound: 'Round of 32',
    scoringSystem: {
      round32: 1,
      round16: 2,
      quarterFinals: 4,
      semiFinals: 8,
      thirdPlace: 8,
      final: 16,
      champion: 32
    }
  };
  
  const settingsRef = doc(db, 'settings', 'global');
  batch.set(settingsRef, defaultSettings);

  await batch.commit();
};

export const clearTournament = async () => {
  const batch = writeBatch(db);

  const collectionsToClear = ['teams', 'matches'];
  
  for (const collName of collectionsToClear) {
    const snap = await getDocs(collection(db, collName));
    snap.forEach(document => {
      batch.delete(doc(db, collName, document.id));
    });
  }

  await batch.commit();
};
