import { useState, useEffect } from 'react';
import { fetchTeams, fetchMatches } from '../lib/services';
import type { Team, Match } from '../types';
import { AnimatedTransition } from '../components/AnimatedTransition';

// Helper to group matches by round
const ROUND_ORDER = [
  'Round of 32',
  'Round of 16',
  'Quarter Finals',
  'Semi Finals',
  'Third Place',
  'Final'
];

export default function BracketPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [t, m] = await Promise.all([fetchTeams(), fetchMatches()]);
        setTeams(t);
        setMatches(m);
      } catch (err) {
        console.error('Failed to load bracket data', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-primary"></div>
      </div>
    );
  }

  // Build a map of teams for quick lookup
  const teamMap = new Map(teams.map((t) => [t.id, t]));

  // A helper function to get the participating team for a match node,
  // resolving through previous matches if the actual team isn't set yet.
  const getTeam = (teamId: string | null, matchId: string, isHome: boolean, roundName?: string) => {
    if (teamId && teamMap.has(teamId)) return teamMap.get(teamId)!;

    // Look for a previous match that feeds into this slot
    const prevMatch = matches.find((m) => m.nextMatchId === matchId && m.nextSlot === (isHome ? 'home' : 'away'));
    if (prevMatch && prevMatch.winnerTeamId) {
      return teamMap.get(prevMatch.winnerTeamId) || null;
    }

    if (roundName === 'Third Place') {
      const loserPrevMatch = matches.find((m) => m.loserNextMatchId === matchId && m.loserNextSlot === (isHome ? 'home' : 'away'));
      if (loserPrevMatch && loserPrevMatch.winnerTeamId) {
        const loserId = loserPrevMatch.winnerTeamId === loserPrevMatch.homeTeamId ? loserPrevMatch.awayTeamId : loserPrevMatch.homeTeamId;
        if (loserId) return teamMap.get(loserId) || null;
      }
    }

    return null;
  };

  // Render a single Match block
  const MatchBox = ({ match }: { match: Match }) => {
    const homeTeam = getTeam(match.homeTeamId, match.id, true, match.round);
    const awayTeam = getTeam(match.awayTeamId, match.id, false, match.round);

    return (
      <div className="glass-card flex flex-col w-48 rounded-lg overflow-hidden border-[rgba(0,217,255,0.1)] text-sm shadow-[0_4px_15px_rgba(0,0,0,0.3)] shrink-0 transition-transform hover:scale-105">
        <div className="bg-bg-tertiary px-3 py-1 text-[10px] font-bold text-text-secondary uppercase tracking-wider border-b border-[rgba(0,217,255,0.1)] flex justify-between">
          <span>{match.date ? new Date(match.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'TBD'}</span>
          <span>{match.completed ? 'FT' : (match.date ? 'Scheduled' : 'TBD')}</span>
        </div>
        
        <div className="flex flex-col">
          {/* Home Team */}
          <div className={`flex items-center justify-between p-2 border-b border-white/5 ${match.winnerTeamId === homeTeam?.id ? 'bg-cyan-primary/10' : ''}`}>
            <div className="flex items-center gap-2 overflow-hidden">
              {homeTeam ? (
                <>
                  <img src={homeTeam.flagUrl} alt={homeTeam.id} className="w-5 h-5 rounded-full object-cover" />
                  <span className="font-bold text-white truncate text-xs">{homeTeam.id}</span>
                </>
              ) : (
                <span className="text-text-secondary italic text-xs">TBD</span>
              )}
            </div>
            <span className="font-bold text-white">{match.homeScore ?? '-'}</span>
          </div>

          {/* Away Team */}
          <div className={`flex items-center justify-between p-2 ${match.winnerTeamId === awayTeam?.id ? 'bg-cyan-primary/10' : ''}`}>
            <div className="flex items-center gap-2 overflow-hidden">
              {awayTeam ? (
                <>
                  <img src={awayTeam.flagUrl} alt={awayTeam.id} className="w-5 h-5 rounded-full object-cover" />
                  <span className="font-bold text-white truncate text-xs">{awayTeam.id}</span>
                </>
              ) : (
                <span className="text-text-secondary italic text-xs">TBD</span>
              )}
            </div>
            <span className="font-bold text-white">{match.awayScore ?? '-'}</span>
          </div>
        </div>
      </div>
    );
  };

  // Desktop Bracket Renderer (Horizontal tree)
  const renderDesktopBracket = () => {
    // We split R32 into Left (8) and Right (8).
    // The same for R16, QF, SF.
    const getMatchesForRound = (roundName: string) => matches.filter(m => m.round === roundName).sort((a, b) => a.id.localeCompare(b.id));

    const r32 = getMatchesForRound('Round of 32');
    const r16 = getMatchesForRound('Round of 16');
    const qf = getMatchesForRound('Quarter Finals');
    const sf = getMatchesForRound('Semi Finals');
    const third = getMatchesForRound('Third Place');
    const final = matches.find(m => m.round === 'Final');

    // Split Left and Right for dual-sided bracket
    const splitMatches = (list: Match[]) => {
      const half = Math.ceil(list.length / 2);
      return { left: list.slice(0, half), right: list.slice(half) };
    };

    const { left: r32L, right: r32R } = splitMatches(r32);
    const { left: r16L, right: r16R } = splitMatches(r16);
    const { left: qfL, right: qfR } = splitMatches(qf);
    const { left: sfL, right: sfR } = splitMatches(sf);

    const Column = ({ title, mList }: { title: string, mList: Match[] }) => (
      <div className="flex flex-col justify-around gap-4 h-full relative z-10 py-8">
        {mList.length > 0 && <h3 className="text-cyan-primary font-bold text-center absolute top-0 w-full text-xs uppercase tracking-widest">{title}</h3>}
        {mList.map(m => <MatchBox key={m.id} match={m} />)}
      </div>
    );

    return (
      <div className="hidden lg:flex w-full overflow-x-auto pb-10 custom-scrollbar justify-center items-stretch h-[800px]">
        <div className="flex items-stretch gap-12 min-w-max px-8 relative">
          
          {/* Left Side */}
          <Column title="Round of 32" mList={r32L} />
          <Column title="Round of 16" mList={r16L} />
          <Column title="Quarter Final" mList={qfL} />
          <Column title="Semi Final" mList={sfL} />

          {/* Center (Final & Third Place) */}
          <div className="flex flex-col justify-center items-center gap-12 relative z-10 px-8">
            <h2 className="text-2xl font-display font-bold text-white mb-[-2rem] text-shadow-glow">FINAL</h2>
            {final && <MatchBox match={final} />}
            
            {third && third.length > 0 && (
              <div className="mt-8 flex flex-col items-center gap-4">
                <h3 className="text-cyan-primary font-bold text-xs uppercase tracking-widest">Third Place</h3>
                <MatchBox match={third[0]} />
              </div>
            )}
          </div>

          {/* Right Side */}
          <Column title="Semi Final" mList={sfR} />
          <Column title="Quarter Final" mList={qfR} />
          <Column title="Round of 16" mList={r16R} />
          <Column title="Round of 32" mList={r32R} />
          
        </div>
      </div>
    );
  };

  // Mobile Bracket Renderer (Vertical list grouped by round)
  const renderMobileBracket = () => {
    return (
      <div className="lg:hidden flex flex-col gap-10 w-full px-4">
        {ROUND_ORDER.map((roundName) => {
          const roundMatches = matches.filter(m => m.round === roundName).sort((a, b) => a.id.localeCompare(b.id));
          if (roundMatches.length === 0) return null;

          return (
            <div key={roundName} className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-cyan-primary/30" />
                <h3 className="text-cyan-primary font-display font-bold uppercase tracking-widest text-sm">
                  {roundName}
                </h3>
                <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-cyan-primary/30" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {roundMatches.map(m => (
                  <div key={m.id} className="flex justify-center">
                    <MatchBox match={m} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <AnimatedTransition className="min-h-screen bg-bg-primary text-text-primary pt-6 pb-24 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-[1600px] mx-auto flex flex-col gap-8">
        
        {/* Header */}
        <div className="text-center px-4">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-2">Tournament Bracket</h1>
          <p className="text-text-secondary text-sm max-w-2xl mx-auto">
            Follow the journey to the cup. Winners automatically progress to the next round based on match results.
          </p>
        </div>

        {/* Desktop & Mobile Views */}
        {renderDesktopBracket()}
        {renderMobileBracket()}
        
      </div>
    </AnimatedTransition>
  );
}
