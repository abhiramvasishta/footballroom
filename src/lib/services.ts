import { doc, getDoc, setDoc, collection, query, where, getDocs, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import type { UserData, Team, Match, TournamentSettings, PredictionDoc } from '../types';

// USER SERVICES
export const saveUserToFirebase = async (userData: UserData) => {
  const userRef = doc(db, 'users', userData.entryId);
  await setDoc(userRef, userData, { merge: true });
};

export const getUserData = async (entryId: string): Promise<UserData | null> => {
  const userRef = doc(db, 'users', entryId);
  const snap = await getDoc(userRef);
  return snap.exists() ? (snap.data() as UserData) : null;
};

export const updateUserPhoto = async (entryId: string, photoURL: string | null) => {
  const userRef = doc(db, 'users', entryId);
  const leaderboardRef = doc(db, 'leaderboard', entryId);
  
  const batch = writeBatch(db);
  batch.set(userRef, { photoURL }, { merge: true });
  batch.set(leaderboardRef, { photoURL }, { merge: true });
  
  await batch.commit();
};

export const recoverUser = async (recoveryCode: string): Promise<UserData | null> => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('recoveryCode', '==', recoveryCode));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    return querySnapshot.docs[0].data() as UserData;
  }
  return null;
};

export const fetchAllUsers = async (): Promise<UserData[]> => {
  const usersRef = collection(db, 'users');
  const snap = await getDocs(usersRef);
  return snap.docs.map(doc => doc.data() as UserData);
};

// PREDICTION SERVICES
export const savePredictionToFirebase = async (predictionData: PredictionDoc) => {
  const predRef = doc(db, 'predictions', predictionData.entryId);
  await setDoc(predRef, predictionData, { merge: true });
};

export const getPredictionData = async (entryId: string): Promise<PredictionDoc | null> => {
  const predRef = doc(db, 'predictions', entryId);
  const snap = await getDoc(predRef);
  return snap.exists() ? (snap.data() as PredictionDoc) : null;
};

export const fetchAllPredictions = async (): Promise<PredictionDoc[]> => {
  const predictionsRef = collection(db, 'predictions');
  const snap = await getDocs(predictionsRef);
  return snap.docs.map(doc => doc.data() as PredictionDoc);
};

// TOURNAMENT SERVICES (TEAMS, MATCHES, SETTINGS)
export const fetchTeams = async (): Promise<Team[]> => {
  const teamsRef = collection(db, 'teams');
  const snap = await getDocs(teamsRef);
  return snap.docs.map(doc => doc.data() as Team);
};

export const fetchMatches = async (): Promise<Match[]> => {
  const matchesRef = collection(db, 'matches');
  const snap = await getDocs(matchesRef);
  return snap.docs.map(doc => doc.data() as Match);
};

export const fetchSettings = async (): Promise<TournamentSettings | null> => {
  const settingsRef = doc(db, 'settings', 'global');
  const snap = await getDoc(settingsRef);
  return snap.exists() ? (snap.data() as TournamentSettings) : null;
};

// ADMIN CRUD
export const saveTeam = async (team: Team) => {
  await setDoc(doc(db, 'teams', team.id), team);
};

export const deleteTeam = async (teamId: string) => {
  await deleteDoc(doc(db, 'teams', teamId));
};

export const saveMatch = async (match: Match) => {
  await setDoc(doc(db, 'matches', match.id), match);
};

export const deleteMatch = async (matchId: string) => {
  await deleteDoc(doc(db, 'matches', matchId));
};

export const saveSettings = async (settings: TournamentSettings) => {
  await setDoc(doc(db, 'settings', 'global'), settings);
};

export const clearTestData = async () => {
  const usersRef = collection(db, 'users');
  const predictionsRef = collection(db, 'predictions');

  const [usersSnap, predsSnap] = await Promise.all([
    getDocs(usersRef),
    getDocs(predictionsRef)
  ]);

  const allDocs = [...usersSnap.docs, ...predsSnap.docs];
  
  // Firestore batch limit is 500
  for (let i = 0; i < allDocs.length; i += 500) {
    const chunk = allDocs.slice(i, i + 500);
    const batch = writeBatch(db);
    chunk.forEach(d => {
      batch.delete(d.ref);
    });
    await batch.commit();
  }
};
