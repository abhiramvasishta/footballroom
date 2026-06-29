import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { Trophy, Star } from 'lucide-react';
import { usePredictionStore } from '../store/usePredictionStore';
import { officialMatches as matches, officialTeams as teams } from '../data/worldcup2026-fixtures';
import { useUserStore } from '../store/useUserStore';
import { goldenBallPlayers } from '../data/goldenBallPlayers';

import toast from 'react-hot-toast';

export interface ShareBracketProps {
  picks?: Record<string, string>;
  user?: any;
  goldenBallPlayerId?: string | null;
  teams?: any[];
  matches?: any[];
  championId?: string | null;
}

export interface ShareBracketRef {
  containerRef: React.RefObject<HTMLDivElement | null>;
  generateAndShare: () => Promise<void>;
}

export const ShareBracket = forwardRef<ShareBracketRef, ShareBracketProps>((props, ref) => {
  const { picks: storePicks } = usePredictionStore();
  const userStore = useUserStore();

  const picks = props.picks || storePicks;
  const user = props.user || userStore;
  const goldenBallPlayerId = props.goldenBallPlayerId;

  const containerRef = useRef<HTMLDivElement>(null);
  
  
  const generateAndShare = async () => {
    if (!containerRef.current) return;
    const toastId = toast.loading('Generating Poster...');
    
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvases = containerRef.current.querySelectorAll("canvas");
      canvases.forEach(c => {
        if (c.width === 0 || c.height === 0) c.setAttribute('data-html2canvas-ignore', 'true');
      });
      const canvas = await html2canvas(containerRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#05070A',
        logging: false
      });
      
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Failed to generate image blob');
      
      const file = new File([blob], 'fifa-world-cup-prediction.png', { type: 'image/png' });
      
      const downloadBlob = (b: Blob) => {
        const url = URL.createObjectURL(b);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'fifa-world-cup-prediction.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      };

      if (navigator.share) {
        toast.loading('Opening Share Menu...', { id: toastId });
        try {
          await navigator.share({
            title: 'My FIFA World Cup Prediction',
            text: '🏆 Check out my FIFA World Cup 2026 prediction!',
            files: [file]
          });
          toast.dismiss(toastId);
        } catch (err: any) {
          if (err.name === 'AbortError') {
            toast.dismiss(toastId);
          } else {
            toast.error("Sharing isn't supported on this device. Your poster has been downloaded instead.", { id: toastId, duration: 4000 });
            downloadBlob(blob);
          }
        }
      } else {
        toast.loading('Downloading Poster...', { id: toastId });
        downloadBlob(blob);
        toast.success('Downloaded!', { id: toastId });
      }
    } catch (err) {
      toast.error('Failed to generate poster.', { id: toastId });
    }
  };

  useImperativeHandle(ref, () => ({
    containerRef,
    generateAndShare
  }));



  const getMatch = (id: string) => matches?.find(m => m.id === id);

  const getDynamicTeamAId = (match: any): string | null => {
    if (!match) return null;
    if (match.homeTeamId) return match.homeTeamId;
    const prevMatchWinner = matches?.find(m => m.nextMatchId === match.id && m.nextSlot === 'home');
    if (prevMatchWinner) return picks?.[prevMatchWinner.id] || null;
    const prevMatchLoser = matches?.find(m => m.loserNextMatchId === match.id && m.loserNextSlot === 'home');
    if (prevMatchLoser) {
      const winnerId = picks?.[prevMatchLoser.id];
      if (!winnerId) return null;
      const teamA = getDynamicTeamAId(prevMatchLoser);
      const teamB = getDynamicTeamBId(prevMatchLoser);
      if (teamA && teamB) return winnerId === teamA ? teamB : teamA;
    }
    return null;
  };
  
  const getDynamicTeamBId = (match: any): string | null => {
    if (!match) return null;
    if (match.awayTeamId) return match.awayTeamId;
    const prevMatchWinner = matches?.find(m => m.nextMatchId === match.id && m.nextSlot === 'away');
    if (prevMatchWinner) return picks?.[prevMatchWinner.id] || null;
    const prevMatchLoser = matches?.find(m => m.loserNextMatchId === match.id && m.loserNextSlot === 'away');
    if (prevMatchLoser) {
      const winnerId = picks?.[prevMatchLoser.id];
      if (!winnerId) return null;
      const teamA = getDynamicTeamAId(prevMatchLoser);
      const teamB = getDynamicTeamBId(prevMatchLoser);
      if (teamA && teamB) return winnerId === teamA ? teamB : teamA;
    }
    return null;
  };

  const matchWidth = 120;
  
  const leftColumns = [
    { x: 30, ids: ['M74', 'M77', 'M73', 'M75', 'M84', 'M83', 'M82', 'M81'], title: 'ROUND OF 32' },
    { x: 190, ids: ['M89', 'M90', 'M93', 'M94'], title: 'ROUND OF 16' },
    { x: 350, ids: ['M97', 'M98'], title: 'QUARTER FINALS' },
    { x: 510, ids: ['M101'], title: 'SEMI FINALS' }
  ];

  const rightColumns = [
    { x: 1450, ids: ['M76', 'M78', 'M79', 'M80', 'M88', 'M86', 'M85', 'M87'], title: 'ROUND OF 32' },
    { x: 1290, ids: ['M91', 'M92', 'M95', 'M96'], title: 'ROUND OF 16' },
    { x: 1130, ids: ['M99', 'M100'], title: 'QUARTER FINALS' },
    { x: 970, ids: ['M102'], title: 'SEMI FINALS' }
  ];

  const svgLines: any[] = [];

  // Left Lines
  leftColumns.forEach((col, i) => {
    if (i === leftColumns.length - 1) return;
    const nextCol = leftColumns[i+1];
    const N = col.ids.length;
    col.ids.forEach((id, j) => {
      const startX = col.x + matchWidth;
      const startY = 40 + (j + 0.5) * (1500 / N);
      const endX = nextCol.x;
      const endY = 40 + (Math.floor(j/2) + 0.5) * (1500 / (N/2));
      const midX = startX + (endX - startX) / 2;
      svgLines.push(
        <path key={`line-l-${id}`} d={`M ${startX} ${startY} H ${midX} V ${endY} H ${endX}`} fill="none" stroke="rgba(0,217,255,0.4)" strokeWidth="2.5" strokeLinecap="square" />
      );
    });
  });

  // Right Lines
  rightColumns.forEach((col, i) => {
    if (i === rightColumns.length - 1) return;
    const nextCol = rightColumns[i+1];
    const N = col.ids.length;
    col.ids.forEach((id, j) => {
      const startX = col.x;
      const startY = 40 + (j + 0.5) * (1500 / N);
      const endX = nextCol.x + matchWidth;
      const endY = 40 + (Math.floor(j/2) + 0.5) * (1500 / (N/2));
      const midX = startX - (startX - endX) / 2;
      svgLines.push(
        <path key={`line-r-${id}`} d={`M ${startX} ${startY} H ${midX} V ${endY} H ${endX}`} fill="none" stroke="rgba(0,217,255,0.4)" strokeWidth="2.5" strokeLinecap="square" />
      );
    });
  });

  // Center Lines
  const lsfStartX = leftColumns[3].x + matchWidth;
  const lsfStartY = 40 + 750;
  const finalLeftX = 710;
  const finalYCenter = 546.5 + 68.25;
  const midLeftX = lsfStartX + (finalLeftX - lsfStartX) / 2;
  
  svgLines.push(<path key="line-lsf-final" d={`M ${lsfStartX} ${lsfStartY} H ${midLeftX} V ${finalYCenter} H ${finalLeftX}`} fill="none" stroke="rgba(0,217,255,0.4)" strokeWidth="2.5" strokeLinecap="square" />);

  const rsfStartX = rightColumns[3].x;
  const rsfStartY = 40 + 750;
  const finalRightX = 710 + 180;
  const midRightX = finalRightX + (rsfStartX - finalRightX) / 2;
  
  svgLines.push(<path key="line-rsf-final" d={`M ${rsfStartX} ${rsfStartY} H ${midRightX} V ${finalYCenter} H ${finalRightX}`} fill="none" stroke="rgba(0,217,255,0.4)" strokeWidth="2.5" strokeLinecap="square" />);

  svgLines.push(<path key="line-final-champ" d={`M 800 520 V 420`} fill="none" stroke="rgba(0,217,255,0.4)" strokeWidth="2.5" />);

  const TeamRow = ({ team, isWinner, isDecided }: { team: any, isWinner: boolean, isDecided: boolean }) => {
    const isDimmed = isDecided && !isWinner;
    
    return (
      <div className={`flex items-center justify-center h-[66px] w-full ${isDimmed ? 'opacity-30 grayscale' : 'opacity-100 drop-shadow-[0_0_10px_rgba(0,217,255,0.6)]'}`}>
        {team ? (
          <img src={team.flagUrl} crossOrigin="anonymous" className="w-[84px] h-[56px] object-cover rounded-[4px] border-[2px] border-[rgba(255,255,255,0.15)]" />
        ) : (
          <span className="text-[14px] text-[#4b5563] uppercase font-black tracking-widest text-center">TBD</span>
        )}
      </div>
    );
  };

  const BracketMatch = ({ matchId, width = matchWidth }: { matchId: string, width?: number }) => {
    const match = getMatch(matchId);
    if (!match) return null;
    const winnerId = match.winnerTeamId || picks?.[match.id];
    
    const dynHomeId = getDynamicTeamAId(match);
    const dynAwayId = getDynamicTeamBId(match);
    
    const homeTeam = teams?.find(t => t.id === dynHomeId) || null;
    const awayTeam = teams?.find(t => t.id === dynAwayId) || null;
    const isHomeWinner = winnerId === dynHomeId;
    const isAwayWinner = winnerId === dynAwayId;
  
    return (
      <div className={`bg-[#05070A] border-[1.5px] border-[#00D9FF] rounded-[8px] flex flex-col relative z-10 shadow-[0_0_20px_rgba(0,217,255,0.15)] overflow-hidden`} style={{ width: `${width}px` }}>
        <TeamRow team={homeTeam} isWinner={isHomeWinner} isDecided={!!winnerId} />
        <div className="h-[1.5px] w-full bg-[rgba(0,217,255,0.3)]" />
        <TeamRow team={awayTeam} isWinner={isAwayWinner} isDecided={!!winnerId} />
      </div>
    );
  };

  const ColumnHeader = ({ title, x }: { title: string, x: number }) => (
    <div className="absolute top-0 w-[140px] flex justify-center z-10" style={{ left: x - 20 }}>
      <span className="text-[#00D9FF] text-[10px] font-black uppercase tracking-[0.2em] text-center border-b border-[rgba(0,217,255,0.3)] pb-1.5 w-full drop-shadow-[0_2px_5px_rgba(0,217,255,0.3)] bg-[#05070A] whitespace-nowrap">{title}</span>
    </div>
  );

  return (
    <div className="fixed z-[-1] pointer-events-none" style={{ left: '-999999px', top: '0' }}>
      <div ref={containerRef} className="w-[1600px] h-[1800px] bg-[#05070A] text-white flex flex-col font-sans relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-16 h-[160px] border-b border-[rgba(0,217,255,0.15)] relative z-20 bg-[#0B1118] shrink-0">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full border-[3px] border-[#00D9FF] overflow-hidden bg-[#101722] flex items-center justify-center shadow-[0_0_20px_rgba(0,217,255,0.3)] shrink-0">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Avatar" crossOrigin="anonymous" className="w-full h-full object-cover" />
              ) : (
                <span className="font-bold text-[#00D9FF] text-5xl leading-none pb-2">{user?.name?.charAt(0)?.toUpperCase() || '?'}</span>
              )}
            </div>
            <div className="flex flex-col">
              <h2 className="text-4xl font-black font-display text-white tracking-wide whitespace-nowrap">{user?.name || 'Anonymous User'}</h2>
            </div>
          </div>
          
          <div className="flex flex-col items-center pr-4">
            <span className="text-[#00D9FF] font-black text-4xl font-display tracking-[0.1em] drop-shadow-[0_0_10px_rgba(0,217,255,0.5)] whitespace-nowrap">FIFA WORLD CUP 2026</span>
            <div className="flex items-center gap-5 mt-2">
              <div className="h-[2px] w-16 bg-[#00D9FF] opacity-50" />
              <span className="text-white text-lg font-bold tracking-[0.5em] uppercase whitespace-nowrap">Official Predictor</span>
              <div className="h-[2px] w-16 bg-[#00D9FF] opacity-50" />
            </div>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 w-full relative z-10 pt-10">
          
          {/* SVGs Lines */}
          <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none">
             {svgLines}
          </svg>

          {/* Left Columns */}
          {leftColumns.map((col, i) => (
            <React.Fragment key={`l-col-${i}`}>
              <ColumnHeader title={col.title} x={col.x} />
              {col.ids.map((id, j) => {
                const yCenter = 40 + (j + 0.5) * (1500 / col.ids.length);
                const top = yCenter - 68.25; 
                return (
                  <div key={id} className="absolute z-10" style={{ left: col.x, top }}>
                    <BracketMatch matchId={id} />
                  </div>
                );
              })}
            </React.Fragment>
          ))}

          {/* Right Columns */}
          {rightColumns.map((col, i) => (
            <React.Fragment key={`r-col-${i}`}>
              <ColumnHeader title={col.title} x={col.x} />
              {col.ids.map((id, j) => {
                const yCenter = 40 + (j + 0.5) * (1500 / col.ids.length);
                const top = yCenter - 68.25; 
                return (
                  <div key={id} className="absolute z-10" style={{ left: col.x, top }}>
                    <BracketMatch matchId={id} />
                  </div>
                );
              })}
            </React.Fragment>
          ))}

          {/* Center Content */}
          <div className="absolute z-0 opacity-[0.15] flex justify-center items-center pointer-events-none" style={{ left: 600, top: 180, width: 400, height: 600 }}>
             <Trophy size={480} className="text-[#00D9FF] drop-shadow-[0_0_50px_rgba(0,217,255,1)]" strokeWidth={0.5} />
          </div>

          <div className="absolute w-[600px] flex justify-center z-20" style={{ left: 500, top: 160 }}>
            <span className="text-[#00D9FF] font-black uppercase tracking-[0.25em] text-2xl drop-shadow-[0_0_10px_rgba(0,217,255,0.6)] whitespace-nowrap">PREDICTED WORLD CHAMPION</span>
          </div>
          
          {(() => {
            const finalMatch = getMatch('M104');
            const championId = finalMatch?.winnerTeamId || picks['M104'];
            const champion = teams.find(t => t.id === championId);
            return (
              <div className="absolute flex flex-col items-center justify-center bg-[#101722] border-[3px] border-[#00D9FF] rounded-2xl shadow-[0_0_40px_rgba(0,217,255,0.2),inset_0_0_20px_rgba(0,217,255,0.1)] p-6 z-20" style={{ left: 670, top: 220, width: 260 }}>
                {champion ? (
                  <>
                    <img src={champion.flagUrl} crossOrigin="anonymous" className="w-[120px] h-[80px] object-cover border-[3px] border-[#00D9FF] rounded-lg shadow-[0_10px_20px_rgba(0,0,0,0.5)] mb-4" />
                    <div className="flex gap-1 mb-2">
                      {[...Array(5)].map((_, i) => <Star key={i} size={14} className="text-[#00D9FF] fill-[#00D9FF]" />)}
                    </div>
                    <span className="font-black text-3xl font-display text-center uppercase tracking-widest drop-shadow-md text-white">{champion.name}</span>
                  </>
                ) : (
                  <span className="text-[#4b5563] font-bold text-4xl uppercase py-10">TBD</span>
                )}
              </div>
            );
          })()}

          <div className="absolute w-[180px] flex justify-center z-20" style={{ left: 710, top: 520 }}>
            <span className="text-[#00D9FF] font-black uppercase tracking-[0.2em] text-[12px] drop-shadow-md whitespace-nowrap">FINAL</span>
          </div>
          <div className="absolute z-20" style={{ left: 710, top: 546.5 }}>
            <BracketMatch matchId="M104" width={180} />
          </div>

          <div className="absolute w-[180px] flex justify-center z-20" style={{ left: 710, top: 740 }}>
            <span className="text-[#00D9FF] font-black uppercase tracking-[0.2em] text-[12px] drop-shadow-md whitespace-nowrap">THIRD PLACE</span>
          </div>
          <div className="absolute z-20" style={{ left: 710, top: 766.5 }}>
            <BracketMatch matchId="M103" width={180} />
          </div>
          
          {/* Golden Ball Player */}
          {goldenBallPlayerId && (
            <div className="absolute w-[800px] flex flex-col items-center justify-center p-6 z-20" style={{ left: 400, top: 880 }}>
              {(() => {
                const player = goldenBallPlayers.find(p => p.id === goldenBallPlayerId);
                if (!player) return null;
                return (
                  <div className="flex flex-col items-center">
                    <div className="w-[600px] h-[600px] mb-4 flex items-end justify-center">
                      <img 
                        src={player.photoUrl} 
                        alt={player.name} 
                        className="w-full h-full object-contain drop-shadow-[0_0_80px_rgba(0,217,255,0.4)]" 
                        crossOrigin="anonymous" 
                        onError={(e) => { e.currentTarget.src = '/silhouette.svg'; e.currentTarget.onerror = null; }}
                      />
                    </div>
                    <span className="font-black text-6xl font-display text-white tracking-widest uppercase text-center drop-shadow-[0_4px_10px_rgba(0,0,0,1)] mb-3">{player.name}</span>
                    <span className="text-[#00D9FF] font-black uppercase tracking-[0.4em] text-2xl mb-6 drop-shadow-[0_2px_8px_rgba(0,217,255,0.5)] text-center">PLAYER OF THE TOURNAMENT</span>
                  </div>
                );
              })()}
            </div>
          )}

        </div>
      </div>
    </div>
  );
});
