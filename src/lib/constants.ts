export interface Team {
  id: string;
  name: string;
  flag: string; // URL or emoji
}

export interface Match {
  id: string;
  round: number; // 32, 16, 8, 4, 2 (Final), 3 (Third place)
  matchNumber: number; // For ordering within a round
  teamA: Team | null;
  teamB: Team | null;
  winnerId?: string | null;
}

// 32 Teams placeholder for 2026 World Cup
export const TEAMS: Record<string, Team> = {
  ARG: { id: 'ARG', name: 'Argentina', flag: '🇦🇷' },
  BRA: { id: 'BRA', name: 'Brazil', flag: '🇧🇷' },
  FRA: { id: 'FRA', name: 'France', flag: '🇫🇷' },
  ENG: { id: 'ENG', name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  ESP: { id: 'ESP', name: 'Spain', flag: '🇪🇸' },
  GER: { id: 'GER', name: 'Germany', flag: '🇩🇪' },
  POR: { id: 'POR', name: 'Portugal', flag: '🇵🇹' },
  NED: { id: 'NED', name: 'Netherlands', flag: '🇳🇱' },
  ITA: { id: 'ITA', name: 'Italy', flag: '🇮🇹' },
  BEL: { id: 'BEL', name: 'Belgium', flag: '🇧🇪' },
  CRO: { id: 'CRO', name: 'Croatia', flag: '🇭🇷' },
  URU: { id: 'URU', name: 'Uruguay', flag: '🇺🇾' },
  USA: { id: 'USA', name: 'USA', flag: '🇺🇸' },
  MEX: { id: 'MEX', name: 'Mexico', flag: '🇲🇽' },
  SEN: { id: 'SEN', name: 'Senegal', flag: '🇸🇳' },
  MAR: { id: 'MAR', name: 'Morocco', flag: '🇲🇦' },
  JPN: { id: 'JPN', name: 'Japan', flag: '🇯🇵' },
  KOR: { id: 'KOR', name: 'South Korea', flag: '🇰🇷' },
  AUS: { id: 'AUS', name: 'Australia', flag: '🇦🇺' },
  CAN: { id: 'CAN', name: 'Canada', flag: '🇨🇦' },
  SUI: { id: 'SUI', name: 'Switzerland', flag: '🇨🇭' },
  DEN: { id: 'DEN', name: 'Denmark', flag: '🇩🇰' },
  COL: { id: 'COL', name: 'Colombia', flag: '🇨🇴' },
  CHI: { id: 'CHI', name: 'Chile', flag: '🇨🇱' },
  NGA: { id: 'NGA', name: 'Nigeria', flag: '🇳🇬' },
  EGY: { id: 'EGY', name: 'Egypt', flag: '🇪🇬' },
  KSA: { id: 'KSA', name: 'Saudi Arabia', flag: '🇸🇦' },
  IRN: { id: 'IRN', name: 'IR Iran', flag: '🇮🇷' },
  QAT: { id: 'QAT', name: 'Qatar', flag: '🇶🇦' },
  ECU: { id: 'ECU', name: 'Ecuador', flag: '🇪🇨' },
  POL: { id: 'POL', name: 'Poland', flag: '🇵🇱' },
  SRB: { id: 'SRB', name: 'Serbia', flag: '🇷🇸' },
};

export const INITIAL_ROUND_32_MATCHES: Match[] = [
  { id: 'R32-1', round: 32, matchNumber: 1, teamA: TEAMS.ARG, teamB: TEAMS.CAN },
  { id: 'R32-2', round: 32, matchNumber: 2, teamA: TEAMS.SUI, teamB: TEAMS.ITA },
  { id: 'R32-3', round: 32, matchNumber: 3, teamA: TEAMS.GER, teamB: TEAMS.DEN },
  { id: 'R32-4', round: 32, matchNumber: 4, teamA: TEAMS.ESP, teamB: TEAMS.GEO || TEAMS.SRB }, // fallback
  { id: 'R32-5', round: 32, matchNumber: 5, teamA: TEAMS.FRA, teamB: TEAMS.BEL },
  { id: 'R32-6', round: 32, matchNumber: 6, teamA: TEAMS.POR, teamB: TEAMS.SLO || TEAMS.POL }, // fallback
  { id: 'R32-7', round: 32, matchNumber: 7, teamA: TEAMS.ROU || TEAMS.COL, teamB: TEAMS.NED }, // fallback
  { id: 'R32-8', round: 32, matchNumber: 8, teamA: TEAMS.ENG, teamB: TEAMS.SVK || TEAMS.CHI }, // fallback
  
  // Right side of bracket
  { id: 'R32-9', round: 32, matchNumber: 9, teamA: TEAMS.BRA, teamB: TEAMS.KOR },
  { id: 'R32-10', round: 32, matchNumber: 10, teamA: TEAMS.JPN, teamB: TEAMS.CRO },
  { id: 'R32-11', round: 32, matchNumber: 11, teamA: TEAMS.MAR, teamB: TEAMS.USA },
  { id: 'R32-12', round: 32, matchNumber: 12, teamA: TEAMS.SEN, teamB: TEAMS.MEX },
  { id: 'R32-13', round: 32, matchNumber: 13, teamA: TEAMS.URU, teamB: TEAMS.AUS },
  { id: 'R32-14', round: 32, matchNumber: 14, teamA: TEAMS.KSA, teamB: TEAMS.ECU },
  { id: 'R32-15', round: 32, matchNumber: 15, teamA: TEAMS.IRN, teamB: TEAMS.QAT },
  { id: 'R32-16', round: 32, matchNumber: 16, teamA: TEAMS.NGA, teamB: TEAMS.EGY },
];
