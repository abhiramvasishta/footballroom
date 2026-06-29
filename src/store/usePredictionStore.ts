import { create } from 'zustand';
import { fetchTeams, fetchMatches, savePredictionToFirebase, getPredictionData } from '../lib/services';
import type { Team, Match, PredictionDoc } from '../types';

interface PredictionState {
  currentRound: number; // 32, 16, 8, 4, 2 (Final), 3 (Third place)
  teams: Team[];
  matches: Match[];
  
  // Storing predicted winners (matchId -> teamId)
  picks: Record<string, string>;
  champion: string | null;
  goldenBallPlayerId: string | null;
  isSelectingGoldenBall: boolean;

  isSubmitting: boolean;
  isLoading: boolean;
  
  initialize: (entryId?: string) => Promise<void>;
  setWinner: (matchId: string, teamId: string) => void;
  setGoldenBallPlayerId: (playerId: string) => void;
  setSelectingGoldenBall: (isSelecting: boolean) => void;
  advanceRound: () => void;
  goBackRound: () => void;
  submitBracket: (entryId: string) => Promise<void>;
  autoSave: (entryId: string) => Promise<void>;
}

export const usePredictionStore = create<PredictionState>((set, get) => ({
  currentRound: 32,
  teams: [],
  matches: [],
  
  picks: {},
  champion: null,
  goldenBallPlayerId: null,
  isSelectingGoldenBall: false,

  isSubmitting: false,
  isLoading: true,

  initialize: async (entryId?: string) => {
    set({ isLoading: true });
    try {
      const [teams, matches, existingPred] = await Promise.all([
        fetchTeams(), 
        fetchMatches(),
        entryId ? getPredictionData(entryId) : Promise.resolve(null)
      ]);

      if (existingPred) {
        set({ 
          teams, 
          matches, 
          picks: existingPred.picks || {},
          champion: existingPred.predictedChampion || null,
          goldenBallPlayerId: existingPred.goldenBallPlayerId || null,
          isLoading: false 
        });
      } else {
        set({ teams, matches, isLoading: false });
      }
    } catch (err) {
      console.error('Failed to load tournament data', err);
      set({ isLoading: false });
    }
  },

  setWinner: (matchId: string, teamId: string) => {
    const { currentRound, matches } = get();
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    set((state) => ({
      picks: { ...state.picks, [matchId]: teamId }
    }));

    if (currentRound === 2) {
       set({ champion: teamId });
    }
  },

  setGoldenBallPlayerId: (playerId: string) => {
    set({ goldenBallPlayerId: playerId });
  },

  setSelectingGoldenBall: (isSelecting: boolean) => {
    set({ isSelectingGoldenBall: isSelecting });
  },

  advanceRound: () => {
    const { currentRound } = get();
    if (currentRound === 32) set({ currentRound: 16 });
    else if (currentRound === 16) set({ currentRound: 8 });
    else if (currentRound === 8) set({ currentRound: 4 });
    else if (currentRound === 4) set({ currentRound: 3 }); // Third place after semis
    else if (currentRound === 3) set({ currentRound: 2 }); // Final
  },

  goBackRound: () => {
    const { currentRound } = get();
    if (currentRound === 16) set({ currentRound: 32 });
    else if (currentRound === 8) set({ currentRound: 16 });
    else if (currentRound === 4) set({ currentRound: 8 });
    else if (currentRound === 3) set({ currentRound: 4 });
    else if (currentRound === 2) set({ currentRound: 3 });
  },

  submitBracket: async (entryId: string) => {
    const state = get();
    set({ isSubmitting: true });

    const predictionDoc: PredictionDoc = {
      entryId,
      picks: state.picks,
      predictedChampion: state.champion,
      goldenBallPlayerId: state.goldenBallPlayerId,
      submitted: true,
      submittedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    try {
      await savePredictionToFirebase(predictionDoc);
    } catch (err) {
      console.error("Failed to save predictions", err);
      throw err;
    } finally {
      set({ isSubmitting: false });
    }
  },

  autoSave: async (entryId: string) => {
    const state = get();
    // Do not alter 'isSubmitting' state as it blocks the UI, just quietly save in the background
    const predictionDoc: PredictionDoc = {
      entryId,
      picks: state.picks,
      predictedChampion: state.champion,
      goldenBallPlayerId: state.goldenBallPlayerId,
      submitted: false,
      submittedAt: null,
      lastUpdated: new Date().toISOString()
    };
    try {
      await savePredictionToFirebase(predictionDoc);
    } catch (err) {
      console.error("Auto-save failed", err);
    }
  }
}));
