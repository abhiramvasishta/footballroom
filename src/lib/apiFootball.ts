import type { Match, Team } from '../types';


export const syncMatchesFromApi = async (
  _apiKey: string, // Kept for signature compatibility
  localMatches: Match[],
  localTeams: Team[]
): Promise<Match[]> => {
  const apiUrl = import.meta.env.VITE_API_URL || '';
  const updatedMatches: Match[] = [];
  
  // 1. Collect unique match dates from the incomplete (or missing goals) matches
  const datesToFetch = new Set<string>();
  
  for (const localMatch of localMatches) {
    const hasScoreButNoGoals = localMatch.completed && 
      ((localMatch.homeScore || 0) + (localMatch.awayScore || 0) > 0) &&
      (!localMatch.goals || localMatch.goals.length === 0);

    if ((!localMatch.completed || hasScoreButNoGoals) && localMatch.homeTeamId && localMatch.awayTeamId && localMatch.date) {
      // Convert 'YYYY-MM-DD' to 'YYYYMMDD' for ESPN
      datesToFetch.add(localMatch.date.replace(/-/g, ''));
    }
  }

  console.log(`[ESPN Sync] Requested dates: ${Array.from(datesToFetch).join(', ')}`);

  // 2. Make one ESPN request per unique date & 3. Merge all responses
  const allApiFixtures: any[] = [];
  for (const date of datesToFetch) {
    try {
      const response = await fetch(`${apiUrl}/api/fifa/date/${date}`);
      if (response.ok) {
        const data = await response.json();
        console.log(`[ESPN Sync] Date ${date} returned ${data.length} ESPN matches.`);
        allApiFixtures.push(...data);
      } else {
        console.warn(`[ESPN Sync] Failed to fetch date ${date}: ${response.statusText}`);
      }
    } catch (err) {
      console.warn(`[ESPN Sync] Error fetching date ${date}:`, err);
    }
  }

  let skippedCount = 0;
  let updatedCount = 0;

  for (const localMatch of localMatches) {
    const hasScoreButNoGoals = localMatch.completed && 
      ((localMatch.homeScore || 0) + (localMatch.awayScore || 0) > 0) &&
      (!localMatch.goals || localMatch.goals.length === 0);

    if (localMatch.completed && !hasScoreButNoGoals) continue;
    if (!localMatch.homeTeamId || !localMatch.awayTeamId) continue;
    
    const homeTeam = localTeams.find(t => t.id === localMatch.homeTeamId);
    const awayTeam = localTeams.find(t => t.id === localMatch.awayTeamId);
    
    if (!homeTeam || !awayTeam) continue;

    // Stable mapping by team names against the merged API fixtures
    const apiMatch = allApiFixtures.find((f: any) => {
      const apiHome = f.homeTeam.toLowerCase();
      const apiAway = f.awayTeam.toLowerCase();
      const localHome = homeTeam.name.toLowerCase();
      const localAway = awayTeam.name.toLowerCase();
      
      return (apiHome === localHome && apiAway === localAway) || 
             (apiHome === localAway && apiAway === localHome);
    });

    if (!apiMatch) {
       console.warn(`[ESPN Sync] Skipped ${homeTeam.name} vs ${awayTeam.name} - Reason: Cannot find match in ESPN response for the requested dates`);
       skippedCount++;
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

      // Fetch match details to get goal events
      if (apiMatch.id) {
        try {
          const detailRes = await fetch(`${apiUrl}/api/fifa/match/${apiMatch.id}`);
          if (detailRes.ok) {
            const detailData = await detailRes.json();
            if (detailData && detailData.goals) {
              newMatch.goals = detailData.goals.map((g: any, index: number) => {
                // If bracket is reversed locally compared to ESPN, we must flip the isHomeTeam flag safely
                const actualIsHomeTeam = isReversed ? !g.isHomeTeam : g.isHomeTeam;
                
                return {
                  id: `${newMatch.id}-goal-${index}`,
                  playerName: g.player,
                  minute: g.minute,
                  isHomeTeam: actualIsHomeTeam,
                  isPenalty: g.isPenalty || false,
                  isOwnGoal: g.isOwnGoal || false
                };
              });
            }
          }
        } catch (e) {
          console.warn(`[ESPN Sync] Failed to fetch details for match ${apiMatch.id}`);
        }
      }

      updatedMatches.push(newMatch);
      updatedCount++;
    } else {
      console.warn(`[ESPN Sync] Skipped ${homeTeam.name} vs ${awayTeam.name} - Reason: ESPN status is ${apiMatch.status} (Not live or completed)`);
      skippedCount++;
    }
  }

  console.log(`[ESPN Sync] Sync Summary: Updated ${updatedCount} matches. Skipped ${skippedCount} incomplete matches.`);

  return updatedMatches;
};
