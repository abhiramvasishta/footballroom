import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import type { Match, Team } from '../types';
import { formatISTDate } from '../utils/date';

interface Props {
  matches: Match[];
  teams: Team[];
}

export const NextMatchCountdown = ({ matches, teams }: Props) => {
  const [displayState, setDisplayState] = useState<{
    type: 'countdown' | 'live' | 'complete' | 'loading';
    match: Match | null;
    timeLeft: { days: number, hours: number, minutes: number, seconds: number } | null;
  }>({ type: 'loading', match: null, timeLeft: null });

  useEffect(() => {
    if (!matches || matches.length === 0) return;

    const sortedMatches = [...matches].sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime());

    const updateDisplay = () => {
      const now = new Date().getTime();
      let currentMatch = null;
      let displayType: 'countdown' | 'live' | 'complete' = 'complete';

      for (const m of sortedMatches) {
        const start = new Date(m.kickoff).getTime();
        const end = start + (2 * 60 * 60 * 1000); // 2 hours

        if (now < start) {
          displayType = 'countdown';
          currentMatch = m;
          break;
        }

        if (now >= start && now < end) {
          displayType = 'live';
          currentMatch = m;
          break;
        }
      }

      if (!currentMatch) {
        setDisplayState({ type: 'complete', match: null, timeLeft: null });
        return;
      }

      const targetTime = displayType === 'countdown' ? new Date(currentMatch.kickoff).getTime() : new Date(currentMatch.kickoff).getTime() + (2 * 60 * 60 * 1000);
      const diff = targetTime - now;

      if (diff <= 0 && displayType === 'live') {
         return; 
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setDisplayState({
        type: displayType,
        match: currentMatch,
        timeLeft: { days, hours, minutes, seconds }
      });
    };

    updateDisplay();
    const interval = setInterval(updateDisplay, 1000);

    return () => clearInterval(interval);
  }, [matches]);

  if (displayState.type === 'loading') return null;

  if (displayState.type === 'complete') {
    return (
      <div className="glass-card p-6 flex flex-col items-center justify-center border border-[rgba(0,217,255,0.18)] relative overflow-hidden w-full mb-6 mt-6">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-primary/10 to-transparent pointer-events-none" />
        <h3 className="text-xl text-cyan-primary font-bold uppercase tracking-wider relative z-10">Tournament Complete</h3>
      </div>
    );
  }

  const match = displayState.match!;
  const homeTeam = match.homeTeamId ? teams.find(t => t.id === match.homeTeamId) || null : null;
  const awayTeam = match.awayTeamId ? teams.find(t => t.id === match.awayTeamId) || null : null;

  return (
    <div className={`glass-card p-6 flex flex-col items-center justify-between border ${displayState.type === 'live' ? 'border-green-500/30 shadow-[0_0_20px_rgba(74,222,128,0.1)]' : 'border-[rgba(0,217,255,0.18)]'} relative overflow-hidden group w-full lg:min-h-[340px] h-full`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${displayState.type === 'live' ? 'from-green-500/10' : 'from-cyan-primary/10'} to-transparent pointer-events-none`} />
      <h3 className="text-xs text-text-secondary uppercase tracking-widest relative z-10 font-bold mt-2 flex items-center gap-2">
        <Clock size={16} className={displayState.type === 'live' ? "text-green-400 animate-pulse" : "text-cyan-primary"} /> 
        {displayState.type === 'live' ? (
          <span className="text-green-400 font-bold">● MATCH UNDERWAY</span>
        ) : 'Upcoming Match'}
      </h3>
      
      <div className="flex items-center justify-between w-full max-w-sm mb-auto mt-6 z-10 relative">
        {/* Home Team */}
        <div className="flex flex-col items-center gap-2 flex-1">
          {homeTeam ? (
            <>
              <div className="w-16 h-10 shadow-sm rounded overflow-hidden border border-white/20">
                <img src={homeTeam.flagUrl} alt={homeTeam.name} className="w-full h-full object-cover" />
              </div>
              <span className="font-bold text-center text-sm md:text-base">{homeTeam.name}</span>
            </>
          ) : (
            <span className="text-text-muted font-bold">TBD</span>
          )}
        </div>
        
        {/* VS */}
        <div className="px-4 font-black italic text-text-muted">VS</div>
        
        {/* Away Team */}
        <div className="flex flex-col items-center gap-2 flex-1">
          {awayTeam ? (
            <>
              <div className="w-16 h-10 shadow-sm rounded overflow-hidden border border-white/20">
                <img src={awayTeam.flagUrl} alt={awayTeam.name} className="w-full h-full object-cover" />
              </div>
              <span className="font-bold text-center text-sm md:text-base">{awayTeam.name}</span>
            </>
          ) : (
            <span className="text-text-muted font-bold">TBD</span>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center mb-6 text-sm text-text-secondary z-10 relative">
        <span className="font-bold text-white">{formatISTDate(match.kickoff)}</span>
        <span>{match.stadium}, {match.city}</span>
      </div>

      {displayState.timeLeft && (
        <div className="flex flex-col items-center z-10 relative">
          <span className={`text-xs ${displayState.type === 'live' ? 'text-status-success' : 'text-cyan-primary'} uppercase tracking-widest mb-3 font-bold`}>
            {displayState.type === 'live' ? 'Time Remaining' : 'Starts In'}
          </span>
          <div className="flex gap-4 text-center">
            {displayState.type === 'countdown' && displayState.timeLeft.days > 0 && (
              <div className="flex flex-col bg-bg-primary/80 rounded-xl p-3 min-w-[70px] border-[rgba(0,217,255,0.18)] border">
                <span className="text-3xl font-bold font-mono text-white">{displayState.timeLeft.days}</span>
                <span className="text-[10px] text-text-secondary uppercase mt-1 tracking-wider">Days</span>
              </div>
            )}
            <div className="flex flex-col bg-bg-primary/80 rounded-xl p-3 min-w-[70px] border-[rgba(0,217,255,0.18)] border">
              <span className="text-3xl font-bold font-mono text-white">{String(displayState.timeLeft.hours).padStart(2, '0')}</span>
              <span className="text-[10px] text-text-secondary uppercase mt-1 tracking-wider">Hours</span>
            </div>
            <div className="flex flex-col bg-bg-primary/80 rounded-xl p-3 min-w-[70px] border-[rgba(0,217,255,0.18)] border">
              <span className="text-3xl font-bold font-mono text-white">{String(displayState.timeLeft.minutes).padStart(2, '0')}</span>
              <span className="text-[10px] text-text-secondary uppercase mt-1 tracking-wider">Mins</span>
            </div>
            <div className="flex flex-col bg-bg-primary/80 rounded-xl p-3 min-w-[70px] border-[rgba(0,217,255,0.18)] border">
              <span className={`text-3xl font-bold font-mono ${displayState.type === 'live' ? 'text-status-success' : 'text-cyan-primary'}`}>
                {String(displayState.timeLeft.seconds).padStart(2, '0')}
              </span>
              <span className="text-[10px] text-text-secondary uppercase mt-1 tracking-wider">Secs</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
