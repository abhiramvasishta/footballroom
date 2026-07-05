import { LRUCache } from 'lru-cache';

export interface ParsedMatch {
  id: string;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  homeEspnId?: string;
  awayEspnId?: string;
  homeScore: number | null;
  awayScore: number | null;
  homePenalties: number | null;
  awayPenalties: number | null;
  status: number; 
  kickoffTime: string;
  venue: string | null;
  city?: string | null;
  referee: string | null;
  goals: any[];
  cards: any[];
  substitutions: any[];
  homeLineup: any[];
  awayLineup: any[];
  homeStatistics?: any[];
  awayStatistics?: any[];
}

export class EspnProvider {
  private cache: LRUCache<string, any>;
  private readonly baseUrl = 'http://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world';

  constructor() {
    this.cache = new LRUCache({
      max: 100,
      ttl: 1000 * 30 // 30 seconds
    });
  }

  private async fetchFromEspn(endpoint: string): Promise<any> {
    const cached = this.cache.get(endpoint);
    if (cached) return cached;

    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`ESPN API Error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    this.cache.set(endpoint, data);
    return data;
  }

  private mapStatus(state: string): number {
    switch (state) {
      case 'pre': return 1; // Not Started
      case 'in': return 3;  // Live
      case 'post': return 0; // Completed
      default: return 1;
    }
  }

  private parseScoreboardMatch(event: any): ParsedMatch {
    const comp = event.competitions[0];
    const home = comp.competitors.find((c: any) => c.homeAway === 'home');
    const away = comp.competitors.find((c: any) => c.homeAway === 'away');

    return {
      id: event.id,
      competition: 'FIFA World Cup',
      homeTeam: home?.team?.name || 'TBD',
      awayTeam: away?.team?.name || 'TBD',
      homeScore: home?.score ? parseInt(home.score) : null,
      awayScore: away?.score ? parseInt(away.score) : null,
      homePenalties: home?.shootoutScore ? parseInt(home.shootoutScore) : null,
      awayPenalties: away?.shootoutScore ? parseInt(away.shootoutScore) : null,
      status: this.mapStatus(event.status.type.state),
      kickoffTime: event.date,
      venue: comp.venue?.fullName || null,
      referee: null, // Basic scoreboard doesn't have referee usually
      goals: [],
      cards: [],
      substitutions: [],
      homeLineup: [],
      awayLineup: []
    };
  }

  private parseDetailedMatch(data: any): ParsedMatch {
    const header = data.header.competitions[0];
    const home = header.competitors.find((c: any) => c.homeAway === 'home');
    const away = header.competitors.find((c: any) => c.homeAway === 'away');
    
    const goals: any[] = [];
    const cards: any[] = [];
    const substitutions: any[] = [];

    if (data.keyEvents) {
      data.keyEvents.forEach((ev: any) => {
        if (ev.scoringPlay && !ev.shootout) {
          goals.push({
            minute: ev.clock?.displayValue,
            player: ev.participants?.[0]?.athlete?.displayName || 'Unknown',
            teamId: ev.team?.id,
            isHomeTeam: ev.team?.id === home.team.id,
            isPenalty: ev.type?.text?.includes('Penalty') || false,
            isOwnGoal: ev.type?.text?.includes('Own') || ev.text?.includes('Own Goal') || false
          });
        } else if (ev.type?.text?.includes('Card')) {
          cards.push({
            minute: ev.clock?.displayValue,
            type: ev.type.text,
            player: ev.participants?.[0]?.athlete?.displayName || 'Unknown',
            teamId: ev.team?.id
          });
        } else if (ev.type?.text === 'Substitution') {
          substitutions.push({
            minute: ev.clock?.displayValue,
            playerOn: ev.participants?.[0]?.athlete?.displayName,
            playerOff: ev.participants?.[1]?.athlete?.displayName,
            teamId: ev.team?.id
          });
        }
      });
    }

    const homeLineup = data.rosters?.find((r: any) => r.team.id === home.team.id)?.roster || [];
    const awayLineup = data.rosters?.find((r: any) => r.team.id === away.team.id)?.roster || [];

    let refereeName = null;
    if (data.gameInfo?.officials?.length > 0) {
      const ref = data.gameInfo.officials.find((o: any) => o.position?.name === 'Referee');
      refereeName = ref ? ref.displayName : data.gameInfo.officials[0].displayName;
    }

    const homeStats = data.boxscore?.teams?.find((t: any) => t.team?.id === home.team.id)?.statistics || [];
    const awayStats = data.boxscore?.teams?.find((t: any) => t.team?.id === away.team.id)?.statistics || [];

    return {
      id: header.id,
      competition: 'FIFA World Cup',
      homeTeam: home.team.name,
      awayTeam: away.team.name,
      homeEspnId: home.team.id,
      awayEspnId: away.team.id,
      homeScore: home.score ? parseInt(home.score) : null,
      awayScore: away.score ? parseInt(away.score) : null,
      homePenalties: home.shootoutScore ? parseInt(home.shootoutScore) : null,
      awayPenalties: away.shootoutScore ? parseInt(away.shootoutScore) : null,
      status: this.mapStatus(header.status.type.state),
      kickoffTime: header.date,
      venue: data.gameInfo?.venue?.fullName || null,
      city: data.gameInfo?.venue?.address?.city || null,
      referee: refereeName,
      goals,
      cards,
      substitutions,
      homeLineup,
      awayLineup,
      homeStatistics: homeStats,
      awayStatistics: awayStats
    };
  }

  async getLiveMatches(): Promise<ParsedMatch[]> {
    const data = await this.fetchFromEspn('/scoreboard');
    if (!data.events) return [];
    // Filter for live matches if needed, but scoreboard endpoint usually returns the current window
    return data.events.map((e: any) => this.parseScoreboardMatch(e));
  }

  async getTodayMatches(): Promise<ParsedMatch[]> {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const data = await this.fetchFromEspn(`/scoreboard?dates=${today}`);
    if (!data.events) return [];
    return data.events.map((e: any) => this.parseScoreboardMatch(e));
  }

  async getMatchesByDate(date: string): Promise<ParsedMatch[]> {
    const data = await this.fetchFromEspn(`/scoreboard?dates=${date}`);
    if (!data.events) return [];
    return data.events.map((e: any) => this.parseScoreboardMatch(e));
  }

  async getUpcomingMatches(): Promise<ParsedMatch[]> {
    const data = await this.fetchFromEspn('/scoreboard');
    if (!data.events) return [];
    return data.events
      .filter((e: any) => e.status.type.state === 'pre')
      .map((e: any) => this.parseScoreboardMatch(e));
  }

  async getMatchDetails(matchId: string): Promise<ParsedMatch | null> {
    try {
      const data = await this.fetchFromEspn(`/summary?event=${matchId}`);
      return this.parseDetailedMatch(data);
    } catch (e) {
      return null;
    }
  }
}
