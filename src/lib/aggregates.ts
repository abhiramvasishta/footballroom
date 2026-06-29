import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from './firebase';
import type { PredictionDoc, UserData, Match } from '../types';

export const recalculateAggregates = async () => {
  const [usersSnap, predsSnap, matchesSnap] = await Promise.all([
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'predictions')),
    getDocs(collection(db, 'matches'))
  ]);

  const users = usersSnap.docs.map(d => d.data() as UserData);
  const preds = predsSnap.docs.map(d => d.data() as PredictionDoc);
  const matches = matchesSnap.docs.map(d => d.data() as Match);

  const registeredUsers = users.length;
  const predictionsSubmitted = preds.filter(p => p.submitted).length;
  const totalScore = users.reduce((sum, u) => sum + (u.score || 0), 0);
  const totalAcc = users.reduce((sum, u) => sum + (u.accuracy || 0), 0);
  const avgScore = registeredUsers > 0 ? Math.round(totalScore / registeredUsers) : 0;
  const avgAccuracy = registeredUsers > 0 ? Math.round(totalAcc / registeredUsers) : 0;

  // Global Analytics Doc
  const globalStats = {
    registeredUsers,
    predictionsSubmitted,
    avgScore,
    avgAccuracy,
    totalPredictions: preds.length,
    lastUpdated: new Date().toISOString()
  };

  // Champion Aggregates
  const champCounts: Record<string, number> = {};
  preds.forEach(p => {
    if (p.predictedChampion) {
      champCounts[p.predictedChampion] = (champCounts[p.predictedChampion] || 0) + 1;
    }
  });

  // Matches Aggregates
  const matchesAgg = matches.map(m => {
    let homeCount = 0;
    let awayCount = 0;
    let total = 0;
    preds.forEach(p => {
      if (p.picks && p.picks[m.id]) {
        total++;
        if (p.picks[m.id] === m.homeTeamId) homeCount++;
        if (p.picks[m.id] === m.awayTeamId) awayCount++;
      }
    });

    return {
      matchId: m.id,
      homeCount,
      awayCount,
      total,
      homePercent: total > 0 ? Math.round((homeCount / total) * 100) : 0,
      awayPercent: total > 0 ? Math.round((awayCount / total) * 100) : 0
    };
  });

  // Batch Write
  const batch = writeBatch(db);

  batch.set(doc(db, 'statistics', 'global'), globalStats);
  batch.set(doc(db, 'statistics', 'champions'), champCounts);
  
  matchesAgg.forEach(ma => {
    batch.set(doc(db, 'statistics', `match_${ma.matchId}`), ma);
  });

  await batch.commit();
};
