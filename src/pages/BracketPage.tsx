import { useState, useEffect } from 'react';
import { fetchTeams, fetchMatches } from '../lib/services';
import type { Team, Match } from '../types';
import { AnimatedTransition } from '../components/AnimatedTransition';
import { Loader2 } from 'lucide-react';

const ROUND_ORDER = [
  'Round of 32',
  'Round of 16',
  'Quarter Finals',
  'Semi Finals',
  'Third Place',
  'Final'
];

export default function BracketPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
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
        <Loader2 className="w-12 h-12 text-cyan-primary animate-spin" />
      </div>
    );
  }

  const teamMap = new Map(teams.map((t) => [t.id, t]));

  const getTeam = (teamId: string | null, matchId: string, isHome: boolean, roundName?: string) => {
    if (teamId && teamMap.has(teamId)) return teamMap.get(teamId)!;

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

  const MatchBox = ({ match, width = 140 }: { match: Match, width?: number }) => {
    const homeTeam = getTeam(match.homeTeamId, match.id, true, match.round);
    const awayTeam = getTeam(match.awayTeamId, match.id, false, match.round);

    const isHomeWinner = match.winnerTeamId === homeTeam?.id;
    const isAwayWinner = match.winnerTeamId === awayTeam?.id;

    // AET & Penalty Logic
    let statusText = match.completed ? 'FT' : (match.date ? new Date(match.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'TBD');
    if (match.completed) {
      if (match.penalties) statusText = 'AET (P)';
      else if (match.extraTime) statusText = 'AET';
    }

    const TeamRow = ({ team, score, penScore, isWinner }: { team: Team | null, score?: number, penScore?: number, isWinner: boolean }) => (
      <div className={`flex items-center justify-between px-2 py-1.5 ${isWinner ? 'bg-cyan-primary/10' : ''}`}>
        <div className="flex items-center gap-2 overflow-hidden flex-1">
          {team ? (
            <>
              <img src={team.flagUrl} alt={team.id} className="w-5 h-5 rounded-sm object-cover border border-white/10 shrink-0" />
              <span className={`font-bold text-[11px] truncate ${isWinner ? 'text-white' : 'text-text-secondary'}`}>{team.id}</span>
            </>
          ) : (
            <span className="text-text-secondary italic text-[11px] uppercase tracking-widest pl-1">TBD</span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {penScore !== undefined && match.penalties && (
            <span className="text-[9px] text-cyan-primary/70">({penScore})</span>
          )}
          <span className={`font-bold text-[12px] ${isWinner ? 'text-cyan-primary' : 'text-white'}`}>{score ?? '-'}</span>
        </div>
      </div>
    );

    return (
      <div className={`bg-bg-tertiary border-[1.5px] border-cyan-primary/30 rounded-lg flex flex-col relative shadow-[0_0_15px_rgba(0,217,255,0.05)] overflow-hidden transition-transform hover:scale-105 hover:border-cyan-primary`} style={{ width: `${width}px` }}>
        <div className="bg-bg-secondary px-2 py-1 text-[9px] font-bold text-cyan-primary/70 uppercase tracking-widest border-b border-white/5 flex justify-between items-center text-center">
           <span className="w-full truncate">{statusText}</span>
        </div>
        <TeamRow team={homeTeam} score={match.homeScore} penScore={match.homePenaltyScore} isWinner={isHomeWinner} />
        <div className="h-[1px] w-full bg-white/5" />
        <TeamRow team={awayTeam} score={match.awayScore} penScore={match.awayPenaltyScore} isWinner={isAwayWinner} />
      </div>
    );
  };

  const renderDesktopBracket = () => {
    const matchWidth = 140;
    
    const leftColumns = [
      { x: 20, ids: ['M74', 'M77', 'M73', 'M75', 'M84', 'M83', 'M82', 'M81'], title: 'ROUND OF 32' },
      { x: 200, ids: ['M89', 'M90', 'M93', 'M94'], title: 'ROUND OF 16' },
      { x: 380, ids: ['M97', 'M98'], title: 'QUARTER FINALS' },
      { x: 560, ids: ['M101'], title: 'SEMI FINALS' }
    ];

    const rightColumns = [
      { x: 1440, ids: ['M76', 'M78', 'M79', 'M80', 'M88', 'M86', 'M85', 'M87'], title: 'ROUND OF 32' },
      { x: 1260, ids: ['M91', 'M92', 'M95', 'M96'], title: 'ROUND OF 16' },
      { x: 1080, ids: ['M99', 'M100'], title: 'QUARTER FINALS' },
      { x: 900, ids: ['M102'], title: 'SEMI FINALS' }
    ];

    const svgLines: any[] = [];
    const drawnMatches: any[] = [];

    // Left Lines & Matches
    leftColumns.forEach((col, i) => {
      if (i < leftColumns.length - 1) {
        const nextCol = leftColumns[i+1];
        const N = col.ids.length;
        col.ids.forEach((id, j) => {
          const startX = col.x + matchWidth;
          const startY = 40 + (j + 0.5) * (1400 / N);
          const endX = nextCol.x;
          const endY = 40 + (Math.floor(j/2) + 0.5) * (1400 / (N/2));
          const midX = startX + (endX - startX) / 2;
          svgLines.push(
            <path key={`line-l-${id}`} d={`M ${startX} ${startY} H ${midX} V ${endY} H ${endX}`} fill="none" stroke="rgba(0,217,255,0.2)" strokeWidth="2" />
          );
        });
      }
      
      const N = col.ids.length;
      col.ids.forEach((id, j) => {
        const match = matches.find(m => m.id === id);
        if (match) {
          const y = 40 + (j + 0.5) * (1400 / N);
          drawnMatches.push(
            <div key={id} className="absolute" style={{ left: col.x, top: y, transform: 'translateY(-50%)' }}>
              <MatchBox match={match} width={matchWidth} />
            </div>
          );
        }
      });
    });

    // Right Lines & Matches
    rightColumns.forEach((col, i) => {
      if (i < rightColumns.length - 1) {
        const nextCol = rightColumns[i+1];
        const N = col.ids.length;
        col.ids.forEach((id, j) => {
          const startX = col.x;
          const startY = 40 + (j + 0.5) * (1400 / N);
          const endX = nextCol.x + matchWidth;
          const endY = 40 + (Math.floor(j/2) + 0.5) * (1400 / (N/2));
          const midX = startX - (startX - endX) / 2;
          svgLines.push(
            <path key={`line-r-${id}`} d={`M ${startX} ${startY} H ${midX} V ${endY} H ${endX}`} fill="none" stroke="rgba(0,217,255,0.2)" strokeWidth="2" />
          );
        });
      }

      const N = col.ids.length;
      col.ids.forEach((id, j) => {
        const match = matches.find(m => m.id === id);
        if (match) {
          const y = 40 + (j + 0.5) * (1400 / N);
          drawnMatches.push(
            <div key={id} className="absolute" style={{ left: col.x, top: y, transform: 'translateY(-50%)' }}>
              <MatchBox match={match} width={matchWidth} />
            </div>
          );
        }
      });
    });

    // Center Lines
    const lsfStartX = leftColumns[3].x + matchWidth;
    const lsfStartY = 40 + 700; // N=1, so (0+0.5)*(1400/1) = 700
    const finalLeftX = 720;
    const finalYCenter = 600;
    const midLeftX = lsfStartX + (finalLeftX - lsfStartX) / 2;
    svgLines.push(<path key="line-lsf-final" d={`M ${lsfStartX} ${lsfStartY} H ${midLeftX} V ${finalYCenter} H ${finalLeftX}`} fill="none" stroke="rgba(0,217,255,0.2)" strokeWidth="2" />);

    const rsfStartX = rightColumns[3].x;
    const rsfStartY = 40 + 700;
    const finalRightX = 720 + 160;
    const midRightX = finalRightX + (rsfStartX - finalRightX) / 2;
    svgLines.push(<path key="line-rsf-final" d={`M ${rsfStartX} ${rsfStartY} H ${midRightX} V ${finalYCenter} H ${finalRightX}`} fill="none" stroke="rgba(0,217,255,0.2)" strokeWidth="2" />);

    // Center Matches
    const finalMatch = matches.find(m => m.id === 'M104' || m.round === 'Final');
    const thirdMatch = matches.find(m => m.id === 'M103' || m.round === 'Third Place');

    if (finalMatch) {
      drawnMatches.push(
        <div key="final" className="absolute" style={{ left: 720, top: finalYCenter, transform: 'translateY(-50%)' }}>
          <div className="flex flex-col items-center gap-2">
            <h3 className="text-[10px] font-bold text-cyan-primary uppercase tracking-[0.2em] bg-bg-secondary px-3 py-1 rounded-full border border-cyan-primary/30">Final</h3>
            <MatchBox match={finalMatch} width={160} />
          </div>
        </div>
      );
    }

    if (thirdMatch) {
      drawnMatches.push(
        <div key="third" className="absolute" style={{ left: 720, top: finalYCenter + 150, transform: 'translateY(-50%)' }}>
          <div className="flex flex-col items-center gap-2">
            <h3 className="text-[9px] font-bold text-[#b08d57] uppercase tracking-[0.2em] bg-bg-secondary px-3 py-1 rounded-full border border-[#b08d57]/30">Third Place</h3>
            <MatchBox match={thirdMatch} width={160} />
          </div>
        </div>
      );
    }

    return (
      <div className="hidden xl:block w-full overflow-x-auto custom-scrollbar pb-8 pt-4">
        <div className="min-w-[1600px] h-[1500px] relative mx-auto bg-[#030407] rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
          
          {/* Header Texts */}
          {leftColumns.map(col => (
             <div key={`header-l-${col.title}`} className="absolute top-4 w-[140px] text-center" style={{ left: col.x }}>
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{col.title}</span>
             </div>
          ))}
          {rightColumns.map(col => (
             <div key={`header-r-${col.title}`} className="absolute top-4 w-[140px] text-center" style={{ left: col.x }}>
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{col.title}</span>
             </div>
          ))}

          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-60">
            {svgLines}
          </svg>
          {drawnMatches}
        </div>
      </div>
    );
  };

  const renderMobileBracket = () => {
    return (
      <div className="xl:hidden flex flex-col gap-10 w-full px-4">
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
                  <div key={m.id} className="flex justify-center w-full max-w-[280px] mx-auto">
                    <MatchBox match={m} width={280} />
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
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-[1640px] mx-auto flex flex-col gap-8 px-4 xl:px-0">
        <div className="text-center px-4">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-2">Tournament Bracket</h1>
          <p className="text-text-secondary text-sm max-w-2xl mx-auto">
            Follow the journey to the cup. Knockout bracket dynamically updates with latest results.
          </p>
        </div>

        {renderDesktopBracket()}
        {renderMobileBracket()}
      </div>
    </AnimatedTransition>
  );
}
