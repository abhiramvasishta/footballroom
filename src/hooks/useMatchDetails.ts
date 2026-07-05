import { useState, useEffect } from 'react';
import type { Match, Team } from '../types';

export interface DetailedMatch {
  id: string;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  homeEspnId: string;
  awayEspnId: string;
  homeScore: number | null;
  awayScore: number | null;
  homePenalties: number | null;
  awayPenalties: number | null;
  status: number;
  kickoffTime: string;
  venue: string | null;
  city: string | null;
  referee: string | null;
  goals: any[];
  cards: any[];
  substitutions: any[];
  homeLineup: any[];
  awayLineup: any[];
  homeStatistics: any[];
  awayStatistics: any[];
}

const sessionCache = new Map<string, DetailedMatch>();

const normalizeTeamName = (name: string): string => {
  if (!name) return '';
  return name.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/korea(republic|south)/g, 'southkorea')
    .replace(/korea(dpr|north)/g, 'northkorea')
    .replace(/unitedstates(ofamerica)?/g, 'usa')
    .replace(/unitedkingdom/g, 'uk')
    .replace(/greatbritain/g, 'gb');
};

export const useMatchDetails = (match: Match, homeTeam: Team | null, awayTeam: Team | null) => {
  const [data, setData] = useState<DetailedMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchDetails = async () => {
      if (!homeTeam || !awayTeam) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Date formatted as YYYYMMDD
        const dateStr = match.date.replace(/-/g, '');
        const cacheKey = `${match.homeTeamId}_${match.awayTeamId}_${dateStr}`;

        if (sessionCache.has(cacheKey)) {
          setData(sessionCache.get(cacheKey)!);
          setLoading(false);
          return;
        }

        // 1. Fetch matches by date to find ESPN ID
        // Because of timezone differences between IST and ESPN's internal dates, 
        // a match on 2026-06-15 in Firestore might appear on 20260614 or 20260616 in ESPN.
        const baseDate = new Date(match.date);
        const prevDate = new Date(baseDate);
        prevDate.setDate(prevDate.getDate() - 1);
        const nextDate = new Date(baseDate);
        nextDate.setDate(nextDate.getDate() + 1);

        const formatDate = (d: Date) => d.toISOString().split('T')[0].replace(/-/g, '');

        const datesToTry = [
          formatDate(baseDate),
          formatDate(prevDate),
          formatDate(nextDate)
        ];

        let dateMatches: any[] = [];
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        
        console.log(`[useMatchDetails] Fetching dates from API: ${apiUrl}`, datesToTry);

        const responses = await Promise.allSettled(
          datesToTry.map(async (d) => {
            const url = `${apiUrl}/api/fifa/date/${d}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status} at ${url}`);
            return res.json();
          })
        );

        responses.forEach((res, i) => {
          if (res.status === 'fulfilled') {
            if (Array.isArray(res.value)) {
              dateMatches = dateMatches.concat(res.value);
            } else {
              console.warn(`[useMatchDetails] Response for ${datesToTry[i]} was not an array:`, res.value);
            }
          } else {
            console.error(`[useMatchDetails] Failed to fetch date ${datesToTry[i]}:`, res.reason);
          }
        });

        console.log(`[useMatchDetails] Total match candidates from ESPN:`, dateMatches.length);

        // 2. Find matching ESPN match
        const normHome = normalizeTeamName(homeTeam.name);
        const normAway = normalizeTeamName(awayTeam.name);

        const espnMatch = dateMatches.find((m: any) => {
          const mHome = normalizeTeamName(m.homeTeam);
          const mAway = normalizeTeamName(m.awayTeam);
          return (mHome === normHome && mAway === normAway) || (mHome === normAway && mAway === normHome);
        });

        if (!espnMatch) {
          console.error('[useMatchDetails] Could not find match:', { normHome, normAway, datesTried: datesToTry });
          throw new Error('Could not find match in ESPN data');
        }

        // 3. Fetch full match details
        const detailsRes = await fetch(`${apiUrl}/api/fifa/match/${espnMatch.id}`);
        if (!detailsRes.ok) throw new Error('Failed to fetch detailed match data');
        
        const detailsData = await detailsRes.json();
        
        if (isMounted) {
          sessionCache.set(cacheKey, detailsData);
          setData(detailsData);
        }
      } catch (err) {
        console.error('[useMatchDetails] Error:', err);
        if (isMounted) setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDetails();

    return () => {
      isMounted = false;
    };
  }, [match, homeTeam, awayTeam]);

  return { data, loading, error };
};
