import { LRUCache } from 'lru-cache';

export interface ParsedMatch {
  id: string;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  homePenalties: number | null;
  awayPenalties: number | null;
  status: number; 
  kickoffTime: string;
  venue: string | null;
  referee: string | null;
  goals: any[];
  cards: any[];
  substitutions: any[];
  homeLineup: any[];
  awayLineup: any[];
}

export class FifaProvider {
  private cache: LRUCache<string, any>;
  private readonly baseUrl = 'https://api.fifa.com/api/v3';

  constructor() {
    this.cache = new LRUCache({
      max: 100,
      ttl: 1000 * 30 // 30 seconds
    });
  }

  private async fetchFromFifa(endpoint: string): Promise<any> {
    const cached = this.cache.get(endpoint);
    if (cached) return cached;

    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`FIFA API Error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    this.cache.set(endpoint, data);
    return data;
  }

  private getLocaleDescription(localizedArray: any[] | undefined): string | null {
    if (!localizedArray || !Array.isArray(localizedArray) || localizedArray.length === 0) return null;
    const gb = localizedArray.find((l: any) => l.Locale === 'en-GB' || l.Locale === 'en-gb');
    return gb ? gb.Description : localizedArray[0].Description;
  }

  private parseMatch(raw: any): ParsedMatch {
    const homeTeamName = this.getLocaleDescription(raw.Home?.TeamName) || raw.Home?.Abbreviation || 'TBD';
    const awayTeamName = this.getLocaleDescription(raw.Away?.TeamName) || raw.Away?.Abbreviation || 'TBD';
    const compName = this.getLocaleDescription(raw.CompetitionName) || 'Unknown Competition';
    const venueName = this.getLocaleDescription(raw.Stadium?.Name);
    
    let refereeName = null;
    if (raw.Officials && Array.isArray(raw.Officials)) {
      const mainRef = raw.Officials.find((o: any) => o.OfficialType === 1);
      if (mainRef) {
        refereeName = this.getLocaleDescription(mainRef.NameShort) || this.getLocaleDescription(mainRef.Name);
      }
    }

    return {
      id: raw.IdMatch,
      competition: compName,
      homeTeam: homeTeamName,
      awayTeam: awayTeamName,
      homeScore: raw.HomeTeamScore ?? null,
      awayScore: raw.AwayTeamScore ?? null,
      homePenalties: raw.HomeTeamPenaltyScore ?? null,
      awayPenalties: raw.AwayTeamPenaltyScore ?? null,
      status: raw.ResultType ?? 1, // 1 = Not Started typically
      kickoffTime: raw.Date,
      venue: venueName,
      referee: refereeName,
      goals: raw.Goals || [],
      cards: raw.Bookings || [],
      substitutions: raw.Substitutions || [],
      homeLineup: raw.Home?.Team || [],
      awayLineup: raw.Away?.Team || []
    };
  }

  async getLiveMatches(): Promise<ParsedMatch[]> {
    const data = await this.fetchFromFifa('/live/football/now');
    if (!data.Results) return [];
    return data.Results.map((m: any) => this.parseMatch(m));
  }

  async getMatchDetails(matchId: string): Promise<ParsedMatch | null> {
    try {
      const data = await this.fetchFromFifa(`/live/football/${matchId}`);
      return this.parseMatch(data);
    } catch (e) {
      return null;
    }
  }

  async getTodayMatches(): Promise<ParsedMatch[]> {
    const today = new Date().toISOString().split('T')[0];
    const data = await this.fetchFromFifa(`/calendar/matches?dates=${today}`);
    if (!data.Results) return [];
    return data.Results.map((m: any) => this.parseMatch(m));
  }

  async getUpcomingMatches(): Promise<ParsedMatch[]> {
    const dates = [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    const data = await this.fetchFromFifa(`/calendar/matches?dates=${dates.join(',')}`);
    if (!data.Results) return [];
    return data.Results.map((m: any) => this.parseMatch(m));
  }
}
