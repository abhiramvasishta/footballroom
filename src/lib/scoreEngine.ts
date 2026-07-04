import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from './firebase';
import type { UserData, PredictionDoc, Match, TournamentSettings } from '../types';

export const recalculateAllScores = async () => {
  const settingsSnap = await getDocs(collection(db, 'settings'));
  const settings = settingsSnap.docs[0]?.data() as TournamentSettings;
  if (!settings) return;

  const points = settings.scoringSystem;
  
  const matchesSnap = await getDocs(collection(db, 'matches'));
  const allMatches = matchesSnap.docs.map(d => d.data() as Match);
  const completedMatches = allMatches.filter(m => m.completed && m.winnerTeamId);

  const usersSnap = await getDocs(collection(db, 'users'));
  const users = usersSnap.docs.map(d => d.data() as UserData);

  const predictionsSnap = await getDocs(collection(db, 'predictions'));
  const predictions = predictionsSnap.docs.map(d => d.data() as PredictionDoc);

  const maxTotalPoints = 
    16 * points.round32 + 
    8 * points.round16 + 
    4 * points.quarterFinals + 
    2 * points.semiFinals + 
    1 * points.thirdPlace + 
    1 * points.final + 
    points.champion +
    (points.mvp || 0);

  const batch = writeBatch(db);

  const updatedUsers = users.map(user => {
    const userPred = predictions.find(p => p.entryId === user.entryId);
    if (!userPred) return undefined;

    let score = 0;
    let correctPicks = 0;
    let wrongPicks = 0;
    let pointsLost = 0;

    const getRoundPoints = (roundName: string) => {
      switch (roundName) {
        case 'Round of 32': return points.round32;
        case 'Round of 16': return points.round16;
        case 'Quarter Finals': return points.quarterFinals;
        case 'Semi Finals': return points.semiFinals;
        case 'Third Place': return points.thirdPlace;
        case 'Final': return points.final;
        default: return 0;
      }
    };

    // Iterate through all user picks
    Object.entries(userPred.picks || {}).forEach(([matchId, predictedWinnerId]) => {
      const actualMatch = completedMatches.find(m => m.id === matchId);
      if (actualMatch) {
        const roundPoints = getRoundPoints(actualMatch.round);
        if (actualMatch.winnerTeamId === predictedWinnerId) {
          score += roundPoints;
          correctPicks += 1;
        } else {
          wrongPicks += 1;
          pointsLost += roundPoints;
        }
      }
    });

    if (userPred.predictedChampion) {
      const finalMatch = completedMatches.find(m => m.round === 'Final');
      if (finalMatch) {
        if (finalMatch.winnerTeamId === userPred.predictedChampion) {
          score += points.champion;
          correctPicks += 1;
        } else {
          wrongPicks += 1;
          pointsLost += points.champion;
        }
      }
    }

    // MVP (Golden Ball)
    if (settings.actualMvpPlayerId) {
      if (userPred.goldenBallPlayerId === settings.actualMvpPlayerId) {
        score += (points.mvp || 0);
        correctPicks += 1;
      } else {
        wrongPicks += 1;
        pointsLost += (points.mvp || 0);
      }
    }

    const totalResolved = correctPicks + wrongPicks;
    const accuracy = totalResolved > 0 ? Math.round((correctPicks / totalResolved) * 100) : 0;
    
    // Create a list of eliminated teams.
    const eliminatedTeams = new Set<string>();
    completedMatches.forEach(m => {
      if (m.winnerTeamId) {
        const loser = m.winnerTeamId === m.homeTeamId ? m.awayTeamId : m.homeTeamId;
        if (loser) eliminatedTeams.add(loser);
      }
    });

    let cascadingPointsLost = 0;
    // Iterate through picks again to check for cascading loss for future matches
    Object.entries(userPred.picks || {}).forEach(([matchId, predictedWinnerId]) => {
      const actualMatch = completedMatches.find(m => m.id === matchId);
      if (!actualMatch) {
        // Match not played yet. But is the predicted team already eliminated?
        if (eliminatedTeams.has(predictedWinnerId)) {
          const matchMeta = allMatches.find(m => m.id === matchId);
          if (matchMeta) {
             cascadingPointsLost += getRoundPoints(matchMeta.round);
          }
        }
      }
    });

    if (userPred.predictedChampion && eliminatedTeams.has(userPred.predictedChampion) && !completedMatches.find(m => m.round === 'Final')) {
      cascadingPointsLost += points.champion;
    }

    const maxPossible = maxTotalPoints - pointsLost - cascadingPointsLost;
    
    // Sort logic requires rank. We'll set status here.
    let status = 'Still Alive';
    if (userPred.predictedChampion && eliminatedTeams.has(userPred.predictedChampion)) {
      status = 'Eliminated';
    }
    
    // Check if champion won
    const finalMatch = completedMatches.find(m => m.round === 'Final');
    if (finalMatch && finalMatch.winnerTeamId === userPred.predictedChampion) {
      status = 'Champion';
    }

    const updatedUser = {
      ...user,
      score,
      correctPicks,
      wrongPicks,
      accuracy,
      maxPossible,
      status
    };
    
    return updatedUser;
  }).filter((u): u is UserData => u !== undefined);

  // Sort and assign ranks
  updatedUsers.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
    return a.name.localeCompare(b.name);
  });

  let currentRank = 1;
  updatedUsers.forEach((user, index) => {
    if (index > 0) {
      const prev = updatedUsers[index - 1];
      if (user.score < prev.score || user.accuracy < prev.accuracy) {
        currentRank = index + 1;
      }
    }

    const previousRank = user.rank || currentRank;

    const userRef = doc(db, 'users', user.entryId);
    const leaderboardRef = doc(db, 'leaderboard', user.entryId);
    
    const userUpdates = {
      score: user.score,
      correctPicks: user.correctPicks,
      wrongPicks: user.wrongPicks,
      accuracy: user.accuracy,
      maxPossible: user.maxPossible,
      status: user.status,
      previousRank,
      rank: currentRank
    };

    batch.update(userRef, userUpdates);

    const userPred = predictions.find(p => p.entryId === user.entryId);
    batch.set(leaderboardRef, {
      entryId: user.entryId,
      name: user.name,
      avatar: user.avatar,
      photoURL: user.photoURL || null,
      score: user.score,
      accuracy: user.accuracy,
      correctPicks: user.correctPicks,
      wrongPicks: user.wrongPicks,
      rank: currentRank,
      previousRank,
      status: user.status,
      championTeamId: userPred?.predictedChampion || null
    });
  });

  await batch.commit();
};
