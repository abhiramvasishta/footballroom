import type { Match, Team } from '../types';

interface ApiFootballFixture {
  fixture: {
    id: number;
    status: {
      short: string; // 'FT', 'PEN', 'AET', 'NS'
    };
  };
  teams: {
    home: { name: string; winner: boolean | null };
    away: { name: string; winner: boolean | null };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    penalty: { home: number | null; away: number | null };
  };
}

export const syncMatchesFromApi = async (
  apiKey: string,
  localMatches: Match[],
  localTeams: Team[]
): Promise<Match[]> => {
  if (!apiKey) throw new Error("API Key is missing.");

  // Fetch all fixtures for World Cup (league 1) for the 2026 season
  const response = await fetch('https://v3.football.api-sports.io/fixtures?league=1&season=2026', {
    headers: {
      'x-apisports-key': apiKey,
    },
  });

  const data = await response.json();
  if (data.errors && Object.keys(data.errors).length > 0) {
    throw new Error(Object.values(data.errors)[0] as string);
  }

  const apiFixtures: ApiFootballFixture[] = data.response;
  const updatedMatches: Match[] = [];

  // Iterate over our incomplete local matches and see if API says they are finished
  for (const localMatch of localMatches) {
    if (localMatch.completed) continue;
    
    // We need both home and away teams to match it
    if (!localMatch.homeTeamId || !localMatch.awayTeamId) continue;
    
    const homeTeam = localTeams.find(t => t.id === localMatch.homeTeamId);
    const awayTeam = localTeams.find(t => t.id === localMatch.awayTeamId);
    
    if (!homeTeam || !awayTeam) continue;

    // Find a matching fixture in the API data
    const apiMatch = apiFixtures.find(f => {
      const apiHome = f.teams.home.name.toLowerCase();
      const apiAway = f.teams.away.name.toLowerCase();
      const localHome = homeTeam.name.toLowerCase();
      const localAway = awayTeam.name.toLowerCase();

      // Check direct match or reversed (in case of bracket flips)
      return (apiHome === localHome && apiAway === localAway) || 
             (apiHome === localAway && apiAway === localHome);
    });

    if (apiMatch && ['FT', 'PEN', 'AET'].includes(apiMatch.fixture.status.short)) {
      // The match is finished in the real world
      const isReversed = apiMatch.teams.home.name.toLowerCase() === awayTeam.name.toLowerCase();
      
      const newMatch: Match = { ...localMatch, completed: true };

      // Set scores
      if (!isReversed) {
        newMatch.homeScore = apiMatch.goals.home ?? undefined;
        newMatch.awayScore = apiMatch.goals.away ?? undefined;
      } else {
        newMatch.homeScore = apiMatch.goals.away ?? undefined;
        newMatch.awayScore = apiMatch.goals.home ?? undefined;
      }

      // Check Extra Time & Penalties
      if (apiMatch.fixture.status.short === 'AET') {
        newMatch.extraTime = true;
      }
      if (apiMatch.fixture.status.short === 'PEN') {
        newMatch.extraTime = true;
        newMatch.penalties = true;
        if (!isReversed) {
          newMatch.homePenaltyScore = apiMatch.score.penalty.home ?? undefined;
          newMatch.awayPenaltyScore = apiMatch.score.penalty.away ?? undefined;
        } else {
          newMatch.homePenaltyScore = apiMatch.score.penalty.away ?? undefined;
          newMatch.awayPenaltyScore = apiMatch.score.penalty.home ?? undefined;
        }
      }

      // Determine Winner
      if (apiMatch.teams.home.winner) {
        newMatch.winnerTeamId = !isReversed ? localMatch.homeTeamId : localMatch.awayTeamId;
      } else if (apiMatch.teams.away.winner) {
        newMatch.winnerTeamId = !isReversed ? localMatch.awayTeamId : localMatch.homeTeamId;
      }

      updatedMatches.push(newMatch);
    }
  }

  return updatedMatches;
};
