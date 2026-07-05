import { useState, useEffect } from 'react';
import { fetchTeams, fetchMatches } from '../lib/services';
import type { Team, Match } from '../types';
import { AnimatedTransition } from '../components/AnimatedTransition';
import { Loader2, Trophy } from 'lucide-react';

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
    if (prevMatch && prevMatch.winnerTeamId) return teamMap.get(prevMatch.winnerTeamId) || null;
    if (roundName === 'Third Place') {
      const loserPrevMatch = matches.find((m) => m.loserNextMatchId === matchId && m.loserNextSlot === (isHome ? 'home' : 'away'));
      if (loserPrevMatch && loserPrevMatch.winnerTeamId) {
        const loserId = loserPrevMatch.winnerTeamId === loserPrevMatch.homeTeamId ? loserPrevMatch.awayTeamId : loserPrevMatch.homeTeamId;
        if (loserId) return teamMap.get(loserId) || null;
      }
    }
    return null;
  };

  const MatchBox = ({ match, x, y, isCenter = false, isMobile = false }: { match: Match, x?: number, y?: number, isCenter?: boolean, isMobile?: boolean }) => {
    const homeTeam = getTeam(match.homeTeamId, match.id, true, match.round);
    const awayTeam = getTeam(match.awayTeamId, match.id, false, match.round);

    const isPen = match.completed && match.penalties;
    const isAet = match.completed && match.extraTime;

    let statusText = match.completed 
      ? (isPen ? `(${match.homePenaltyScore}) ${match.homeScore} - ${match.awayScore} (${match.awayPenaltyScore})` : `${match.homeScore} - ${match.awayScore}`)
      : (match.date ? new Date(match.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'TBD');

    const boxContent = (
      <div className={`relative bg-[#1f2128] rounded-[12px] flex flex-col items-center justify-center p-2 text-white shadow-lg hover:bg-[#2a2d36] transition-colors w-full h-full`}>
        <div className="flex justify-between w-full px-1 mb-2">
          {homeTeam ? (
            <img src={homeTeam.flagUrl} alt={homeTeam.id} className="w-[20px] h-[20px] rounded-full object-cover border border-white/10" />
          ) : (
            <div className="w-[20px] h-[20px] rounded-full bg-white/10" />
          )}
          {awayTeam ? (
            <img src={awayTeam.flagUrl} alt={awayTeam.id} className="w-[20px] h-[20px] rounded-full object-cover border border-white/10" />
          ) : (
            <div className="w-[20px] h-[20px] rounded-full bg-white/10" />
          )}
        </div>
        <div className="flex justify-between w-full px-1 text-[11px] font-black text-[#a0a0a0] mb-1.5 tracking-wider">
          <span>{homeTeam ? homeTeam.id : 'TBD'}</span>
          <span>{awayTeam ? awayTeam.id : 'TBD'}</span>
        </div>
        <div className="text-[12px] font-black text-white whitespace-nowrap">
          {statusText}
        </div>
        
        {(isPen || isAet) && (
          <div className="absolute -top-[10px] bg-[#00D9FF] text-[#05070A] text-[9px] px-2 py-0.5 rounded-full font-bold shadow-[0_0_10px_rgba(0,217,255,0.4)]">
            {isPen ? 'AET (P)' : 'AET'}
          </div>
        )}
      </div>
    );

    const transform = x !== undefined && y !== undefined 
      ? (isMobile ? 'translate(-50%, 0)' : 'translate(0, -50%)') 
      : 'none';

    return (
      <div 
        className={`absolute z-10 ${x !== undefined && y === undefined ? 'w-[110px] h-[90px]' : ''}`}
        style={{ 
          width: 96, 
          height: 90, 
          left: x, 
          top: y, 
          transform: transform
        }}
      >
        {boxContent}
        {isCenter && (
           <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-[9px] font-bold text-[#b08d57] uppercase tracking-[0.2em] bg-[#1a1c23] px-3 py-1 rounded-full border border-[#b08d57]/30 whitespace-nowrap shadow-md">
             {match.round === 'Final' ? 'FINAL' : 'BRONZE FINAL'}
           </div>
        )}
      </div>
    );
  };

  const renderDesktopBracket = () => {
    const matchWidth = 96;
    const X_L = [0, 140, 280, 420];
    const X_CENTER = 560;
    const X_R = [700, 840, 980, 1120];

    const getY = (colIndex: number, rowIndex: number) => {
      if (colIndex === 0) return 50 + rowIndex * 100;
      if (colIndex === 1) return 100 + rowIndex * 200;
      if (colIndex === 2) return 200 + rowIndex * 400;
      if (colIndex === 3) return 400 + rowIndex * 800; // 0
      return 0;
    };

    const leftColumns = [
      { x: X_L[0], ids: ['M74', 'M77', 'M73', 'M75', 'M84', 'M83', 'M82', 'M81'] },
      { x: X_L[1], ids: ['M89', 'M90', 'M93', 'M94'] },
      { x: X_L[2], ids: ['M97', 'M98'] },
      { x: X_L[3], ids: ['M101'] }
    ];

    const rightColumns = [
      { x: X_R[0], ids: ['M102'] },
      { x: X_R[1], ids: ['M99', 'M100'] },
      { x: X_R[2], ids: ['M91', 'M92', 'M95', 'M96'] },
      { x: X_R[3], ids: ['M76', 'M78', 'M79', 'M80', 'M88', 'M86', 'M85', 'M87'] }
    ];

    const svgLines: any[] = [];
    const drawnMatches: any[] = [];

    // Left Lines & Matches
    leftColumns.forEach((col, i) => {
      if (i < leftColumns.length - 1) {
        const nextCol = leftColumns[i+1];
        col.ids.forEach((id, j) => {
          const startX = col.x + matchWidth;
          const startY = getY(i, j);
          const endX = nextCol.x;
          const endY = getY(i+1, Math.floor(j/2));
          const midX = startX + (endX - startX) / 2;
          svgLines.push(
            <path key={`ll-${id}`} d={`M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
          );
        });
      }
      
      col.ids.forEach((id, j) => {
        const match = matches.find(m => m.id === id);
        if (match) {
          drawnMatches.push(
            <MatchBox key={id} match={match} x={col.x} y={getY(i, j)} />
          );
        }
      });
    });

    // Right Lines & Matches
    rightColumns.forEach((col, i) => {
      // i=0 is SF, i=1 is QF, i=2 is R16, i=3 is R32
      // We want to connect i=3 to i=2, i=2 to i=1, i=1 to i=0
      if (i < rightColumns.length - 1) {
        const nextCol = rightColumns[i+1];
        nextCol.ids.forEach((id, j) => {
          const startX = nextCol.x;
          const startY = getY(3 - (i+1), j); 
          const endX = col.x + matchWidth;
          const endY = getY(3 - i, Math.floor(j/2));
          const midX = startX - (startX - endX) / 2;
          svgLines.push(
            <path key={`rl-${id}`} d={`M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
          );
        });
      }

      col.ids.forEach((id, j) => {
        const match = matches.find(m => m.id === id);
        if (match) {
          drawnMatches.push(
            <MatchBox key={id} match={match} x={col.x} y={getY(3 - i, j)} />
          );
        }
      });
    });

    // Center Lines
    const lsfX = leftColumns[3].x + matchWidth;
    const lsfY = getY(3, 0);
    const finalLeftX = X_CENTER;
    const finalY = lsfY;
    svgLines.push(<path key="c-l" d={`M ${lsfX} ${lsfY} L ${finalLeftX} ${finalY}`} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />);

    const rsfX = rightColumns[0].x;
    const rsfY = getY(3, 0);
    const finalRightX = X_CENTER + matchWidth;
    svgLines.push(<path key="c-r" d={`M ${rsfX} ${rsfY} L ${finalRightX} ${finalY}`} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />);

    // Draw Trophy and Center Matches
    const finalMatch = matches.find(m => m.id === 'M104' || m.round === 'Final');
    const thirdMatch = matches.find(m => m.id === 'M103' || m.round === 'Third Place');

    if (finalMatch) drawnMatches.push(<MatchBox key="final" match={finalMatch} x={X_CENTER} y={finalY} isCenter={true} />);
    if (thirdMatch) drawnMatches.push(<MatchBox key="third" match={thirdMatch} x={X_CENTER} y={finalY + 120} isCenter={true} />);

    return (
      <div className="w-full flex justify-start xl:justify-center overflow-auto custom-scrollbar pb-8 pt-10 px-4">
        <div className="w-[1296px] h-[800px] relative bg-[#131418] rounded-[24px] overflow-hidden shadow-2xl flex-shrink-0">
          
          <div className="absolute top-[180px] left-1/2 -translate-x-1/2 flex flex-col items-center opacity-80">
             <Trophy className="w-16 h-16 text-[#e5b969] drop-shadow-[0_0_15px_rgba(229,185,105,0.4)]" strokeWidth={1.5} />
             <span className="text-[#e5b969] text-[11px] font-black tracking-[0.25em] mt-3 uppercase">Champion</span>
          </div>

          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
            {svgLines}
          </svg>
          
          {/* Apply a subtle translation to perfectly center it inside the padded box */}
          <div className="absolute top-0 left-0 w-full h-full" style={{ transform: 'translate(40px, 0)' }}>
            {drawnMatches}
          </div>

        </div>
      </div>
    );
  };

  const renderMobileVerticalBracket = () => {
    // Swap X and Y concepts to make it Top-to-Bottom
    const matchHeight = 90;
    
    const Y_TOP = [0, 140, 280, 420];
    const Y_CENTER = 560;
    const Y_BOT = [700, 840, 980, 1120];

    const getX = (rowIndex: number, colIndex: number) => {
      // equivalent to old getY
      if (rowIndex === 0) return 50 + colIndex * 100;
      if (rowIndex === 1) return 100 + colIndex * 200;
      if (rowIndex === 2) return 200 + colIndex * 400;
      if (rowIndex === 3) return 400 + colIndex * 800; 
      return 0;
    };

    const topRows = [
      { y: Y_TOP[0], ids: ['M74', 'M77', 'M73', 'M75', 'M84', 'M83', 'M82', 'M81'] },
      { y: Y_TOP[1], ids: ['M89', 'M90', 'M93', 'M94'] },
      { y: Y_TOP[2], ids: ['M97', 'M98'] },
      { y: Y_TOP[3], ids: ['M101'] }
    ];

    const botRows = [
      { y: Y_BOT[0], ids: ['M102'] },
      { y: Y_BOT[1], ids: ['M99', 'M100'] },
      { y: Y_BOT[2], ids: ['M91', 'M92', 'M95', 'M96'] },
      { y: Y_BOT[3], ids: ['M76', 'M78', 'M79', 'M80', 'M88', 'M86', 'M85', 'M87'] }
    ];

    const svgLines: any[] = [];
    const drawnMatches: any[] = [];

    // Top Lines & Matches
    topRows.forEach((row, i) => {
      if (i < topRows.length - 1) {
        const nextRow = topRows[i+1];
        row.ids.forEach((id, j) => {
          const startY = row.y + matchHeight;
          const startX = getX(i, j);
          const endY = nextRow.y;
          const endX = getX(i+1, Math.floor(j/2));
          const midY = startY + (endY - startY) / 2;
          svgLines.push(
            <path key={`tl-${id}`} d={`M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
          );
        });
      }
      
      row.ids.forEach((id, j) => {
        const match = matches.find(m => m.id === id);
        if (match) {
          // translate(-50%, 0) is applied in MatchBox if x & y provided and isMobile
          drawnMatches.push(
            <MatchBox key={id} match={match} x={getX(i, j)} y={row.y} isMobile={true} />
          );
        }
      });
    });

    // Bottom Lines & Matches
    botRows.forEach((row, i) => {
      if (i < botRows.length - 1) {
        const nextRow = botRows[i+1];
        nextRow.ids.forEach((id, j) => {
          const startY = nextRow.y;
          const startX = getX(3 - (i+1), j); 
          const endY = row.y + matchHeight;
          const endX = getX(3 - i, Math.floor(j/2));
          const midY = startY - (startY - endY) / 2;
          svgLines.push(
            <path key={`bl-${id}`} d={`M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
          );
        });
      }

      row.ids.forEach((id, j) => {
        const match = matches.find(m => m.id === id);
        if (match) {
          drawnMatches.push(
            <MatchBox key={id} match={match} x={getX(3 - i, j)} y={row.y} isMobile={true} />
          );
        }
      });
    });

    // Center Lines
    const tsfY = topRows[3].y + matchHeight;
    const tsfX = getX(3, 0);
    const finalTopY = Y_CENTER;
    const finalX = tsfX;
    svgLines.push(<path key="c-t" d={`M ${tsfX} ${tsfY} L ${finalX} ${finalTopY}`} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />);

    const bsfY = botRows[0].y;
    const bsfX = getX(3, 0);
    const finalBotY = Y_CENTER + matchHeight;
    svgLines.push(<path key="c-b" d={`M ${bsfX} ${bsfY} L ${finalX} ${finalBotY}`} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />);

    // Draw Trophy and Center Matches
    const finalMatch = matches.find(m => m.id === 'M104' || m.round === 'Final');
    const thirdMatch = matches.find(m => m.id === 'M103' || m.round === 'Third Place');

    // For Center matches, we use isCenter which applies translate(-50%, -50%)? Wait, MatchBox has translate(0, -50%) by default...
    // Let's explicitly pass a style override or rely on our new isMobile condition.
    // If isCenter && isMobile, it uses translate(-50%, -50%)? Let's check MatchBox:
    // transform: x !== undefined && y !== undefined ? (isMobile && !isCenter ? 'translate(-50%, 0)' : 'translate(-50%, -50%)') : 'none'
    // I should fix MatchBox transform for isCenter on mobile!

    if (finalMatch) {
      drawnMatches.push(<MatchBox key="final" match={finalMatch} x={finalX} y={finalTopY} isCenter={true} isMobile={true} />);
      drawnMatches.push(
        <div key="trophy" className="absolute z-20 flex flex-col items-center opacity-80" style={{ left: finalX - 95, top: finalTopY + 45, transform: 'translate(-50%, -50%)' }}>
           <Trophy className="w-12 h-12 text-[#e5b969] drop-shadow-[0_0_15px_rgba(229,185,105,0.4)]" strokeWidth={1.5} />
           <span className="text-[#e5b969] text-[9px] font-black tracking-[0.25em] mt-2 uppercase">Champion</span>
        </div>
      );
    }
    if (thirdMatch) drawnMatches.push(<MatchBox key="third" match={thirdMatch} x={finalX + 160} y={finalTopY} isCenter={true} isMobile={true} />);

    return (
      <div className="xl:hidden w-full overflow-auto custom-scrollbar pb-8 pt-10 px-4">
        <div className="w-[800px] h-[1296px] relative bg-[#131418] rounded-[24px] overflow-hidden shadow-2xl flex-shrink-0">
          
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
            {svgLines}
          </svg>
          
          <div className="absolute top-0 left-0 w-full h-full" style={{ transform: 'translate(0, 40px)' }}>
            {drawnMatches}
          </div>

        </div>
      </div>
    );
  };

  return (
    <AnimatedTransition className="min-h-screen bg-[#05070A] text-text-primary pt-6 pb-24 relative overflow-hidden">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-8 px-0">
        <div className="text-center px-4">
          <h1 className="text-3xl md:text-4xl font-display font-black text-white mb-2 uppercase tracking-wide">Knockout Stage</h1>
        </div>

        {/* Desktop graphical bracket */}
        <div className="hidden xl:block">
          {renderDesktopBracket()}
        </div>
        
        {/* Mobile vertical graphical bracket */}
        <div className="block xl:hidden">
          {renderMobileVerticalBracket()}
        </div>
      </div>
    </AnimatedTransition>
  );
}
