import type { Match, Team } from '../types';



export const syncMatchesFromApi = async (
  _apiKey: string, // Kept for signature compatibility
  localMatches: Match[],
  localTeams: Team[]
): Promise<Match[]> => {
  // Fetch from our backend which now uses ESPN
  const apiUrl = import.meta.env.VITE_API_URL || '';
  const response = await fetch(`${apiUrl}/api/fifa/today`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch from backend: ${response.statusText}`);
  }
  
  const apiFixtures = await response.json();
  const updatedMatches: Match[] = [];

  for (const localMatch of localMatches) {
    if (localMatch.completed) continue;
    if (!localMatch.homeTeamId || !localMatch.awayTeamId) continue;
    
    const homeTeam = localTeams.find(t => t.id === localMatch.homeTeamId);
    const awayTeam = localTeams.find(t => t.id === localMatch.awayTeamId);
    
    if (!homeTeam || !awayTeam) continue;

    // Stable mapping by team names
    const apiMatch = apiFixtures.find((f: any) => {
      const apiHome = f.homeTeam.toLowerCase();
      const apiAway = f.awayTeam.toLowerCase();
      const localHome = homeTeam.name.toLowerCase();
      const localAway = awayTeam.name.toLowerCase();
      
      return (apiHome === localHome && apiAway === localAway) || 
             (apiHome === localAway && apiAway === localHome);
    });

    if (!apiMatch) {
       console.warn(`[ESPN Sync] Skipping ${homeTeam.name} vs ${awayTeam.name} - Cannot find in API response`);
       continue;
    }

    // 0 = Completed, 3 = Live
    if (apiMatch.status === 0 || apiMatch.status === 3) { 
      const isReversed = apiMatch.homeTeam.toLowerCase() === awayTeam.name.toLowerCase();
      
      // Inherit the exact original Firestore document to prevent new document creations
      const newMatch: Match = { ...localMatch };
      
      if (apiMatch.status === 0) {
          newMatch.completed = true;
      }

      // Safely apply scores depending on bracket reversal
      if (!isReversed) {
        newMatch.homeScore = apiMatch.homeScore !== null ? apiMatch.homeScore : undefined;
        newMatch.awayScore = apiMatch.awayScore !== null ? apiMatch.awayScore : undefined;
        newMatch.homePenaltyScore = apiMatch.homePenalties !== null ? apiMatch.homePenalties : undefined;
        newMatch.awayPenaltyScore = apiMatch.awayPenalties !== null ? apiMatch.awayPenalties : undefined;
      } else {
        newMatch.homeScore = apiMatch.awayScore !== null ? apiMatch.awayScore : undefined;
        newMatch.awayScore = apiMatch.homeScore !== null ? apiMatch.homeScore : undefined;
        newMatch.homePenaltyScore = apiMatch.awayPenalties !== null ? apiMatch.awayPenalties : undefined;
        newMatch.awayPenaltyScore = apiMatch.homePenalties !== null ? apiMatch.homePenalties : undefined;
      }

      if (newMatch.homePenaltyScore !== undefined || newMatch.awayPenaltyScore !== undefined) {
          newMatch.extraTime = true;
          newMatch.penalties = true;
      }
      
      // Update Goals, Cards, Substitutions directly if needed.
      // (AdminPanel saves goals/cards natively if they exist).
      // newMatch.goals = apiMatch.goals (We could map it if AdminPanel expects a specific format)
      // Actually, AdminPanel just reads homeScore/awayScore and winnerTeamId.
      
      // Determine Winner if completed
      if (newMatch.completed) {
         if ((newMatch.homeScore || 0) > (newMatch.awayScore || 0)) {
           newMatch.winnerTeamId = newMatch.homeTeamId;
         } else if ((newMatch.awayScore || 0) > (newMatch.homeScore || 0)) {
           newMatch.winnerTeamId = newMatch.awayTeamId;
         } else if (newMatch.penalties) {
           if ((newMatch.homePenaltyScore || 0) > (newMatch.awayPenaltyScore || 0)) {
               newMatch.winnerTeamId = newMatch.homeTeamId;
           } else {
               newMatch.winnerTeamId = newMatch.awayTeamId;
           }
         }
      }

      updatedMatches.push(newMatch);
    }
  }

  return updatedMatches;
};
