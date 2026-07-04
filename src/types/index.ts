export interface Team {
  id: string;
  name: string;
  fifaCode: string;
  countryCode: string;
  flagUrl: string;
  confederation: string;
}

export interface Player {
  id: string;
  name: string;
  countryId: string;
  countryName: string;
  flagUrl: string;
  photoUrl: string;
}

export interface Match {
  id: string;
  round: string; // 'Round of 32', 'Round of 16', 'Quarter Finals', 'Semi Finals', 'Third Place', 'Final'
  homeTeamId: string | null;
  awayTeamId: string | null;
  date: string;
  kickoff: string;
  isLocked?: boolean;
  stadium: string;
  city: string;
  completed: boolean;
  winnerTeamId: string | null;
  nextMatchId: string | null;
  nextSlot: 'home' | 'away' | null;
  loserNextMatchId: string | null;
  loserNextSlot: 'home' | 'away' | null;
  highlightUrl?: string;
  homeScore?: number;
  awayScore?: number;
  homePenaltyScore?: number;
  awayPenaltyScore?: number;
  extraTime?: boolean;
  penalties?: boolean;
  goals?: GoalEvent[];
}

export interface GoalEvent {
  id: string;
  playerName: string;
  minute: string;
  isHomeTeam: boolean;
  isOwnGoal?: boolean;
  isPenalty?: boolean;
}

export interface UserData {
  entryId: string;
  name: string;
  avatar: string | null;
  photoURL?: string | null;
  recoveryCode: string;
  score: number;
  accuracy: number;
  correctPicks: number;
  wrongPicks: number;
  maxPossible: number;
  submittedAt: string | null;
  status: string; // e.g. 'Still Alive', 'Eliminated', 'Champion'
  rank: number;
  previousRank?: number;
  joinedAt?: string;
  goldenBallPlayerId?: string | null;
}

export interface PredictionDoc {
  entryId: string;
  picks: Record<string, string>; // matchId -> winnerTeamId
  predictedChampion: string | null;
  goldenBallPlayerId?: string | null;
  submitted: boolean;
  submittedAt: string | null;
  lastUpdated: string | null;
}

export interface TournamentSettings {
  contestName: string;
  registrationOpen: boolean;
  predictionsOpen: boolean;
  websiteStatus: 'Open' | 'Maintenance';
  leaderboardVisible: boolean;
  currentRound: string;
  actualMvpPlayerId?: string | null;
  apiFootballKey?: string | null;
  scoringSystem: {
    round32: number;
    round16: number;
    quarterFinals: number;
    semiFinals: number;
    thirdPlace: number;
    final: number;
    champion: number;
    mvp: number;
  };
}
