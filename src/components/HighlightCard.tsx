import { Calendar, MapPin, Play, Video, Hourglass } from 'lucide-react';
import type { Match, Team } from '../types';
import { cn } from '../utils/cn';
import { formatISTDateOnly, formatISTTimeOnly } from '../utils/date';

interface Props {
  match: Match;
  homeTeam: Team | null;
  awayTeam: Team | null;
  onWatch: () => void;
}

export const HighlightCard = ({ match, homeTeam, awayTeam, onWatch }: Props) => {
  const now = new Date().getTime();
  const kickoffTime = new Date(match.kickoff).getTime();
  
  const isCompleted = match.completed;
  const isOngoing = !isCompleted && now >= kickoffTime;
  const isFuture = !isCompleted && now < kickoffTime;
  const hasHighlight = isCompleted && !!match.highlightUrl;

  return (
    <div className={cn(
      "glass-card rounded-2xl overflow-hidden relative transition-all duration-300",
      hasHighlight ? "border-cyan-primary/50 shadow-[0_0_20px_rgba(0,217,255,0.15)] group" : "border-white/10 opacity-80",
      isFuture ? "opacity-60 grayscale-[30%]" : ""
    )}>
      
      {hasHighlight && (
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-primary/0 via-cyan-primary/5 to-cyan-primary/0 pointer-events-none" />
      )}

      {/* Header Info */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-bg-secondary/30">
        <div className="flex items-center gap-3 text-xs text-text-secondary">
          <span className="font-bold text-cyan-primary tracking-widest uppercase">{match.round}</span>
          <span>•</span>
          <span className="flex items-center gap-1"><Calendar size={12} /> {formatISTDateOnly(match.kickoff)}</span>
          <span className="flex items-center gap-1"><MapPin size={12} /> {match.stadium}</span>
        </div>
      </div>

      {/* Main Card Content */}
      <div className="p-6">
        <div className="flex items-center justify-between gap-4">
          
          {/* Home Team */}
          <div className="flex flex-col items-center flex-1 gap-2">
            <div className="w-16 h-12 md:w-20 md:h-14 rounded overflow-hidden shadow-lg border border-white/10">
              {homeTeam ? (
                <img src={homeTeam.flagUrl} alt={homeTeam.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-white/5 flex items-center justify-center font-bold text-text-muted">?</div>
              )}
            </div>
            <span className="font-display font-bold text-lg md:text-xl text-center leading-tight tracking-wide">
              {homeTeam?.name || 'TBD'}
            </span>
          </div>

          {/* Score / Status */}
          <div className="flex flex-col items-center justify-center flex-[0.5] px-2">
            {isCompleted ? (
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center gap-3 text-3xl md:text-4xl font-mono font-bold text-white drop-shadow-md">
                  <span>{match.homeScore ?? '-'}</span>
                  <span className="text-cyan-primary/50">-</span>
                  <span>{match.awayScore ?? '-'}</span>
                </div>
                {(match.extraTime || match.penalties) && (
                  <span className="text-[10px] text-text-secondary uppercase tracking-widest font-bold mt-1 bg-white/5 px-2 py-0.5 rounded text-center">
                    {match.penalties ? (
                      <>
                        <span className="block text-cyan-primary mb-0.5 text-xs">({match.homePenaltyScore ?? '-'}) Pens ({match.awayPenaltyScore ?? '-'})</span>
                        After Penalties
                      </>
                    ) : (
                      'After Extra Time'
                    )}
                  </span>
                )}
              </div>
            ) : isOngoing ? (
              <div className="flex flex-col items-center text-cyan-primary animate-pulse">
                <span className="text-2xl font-bold font-mono tracking-widest">LIVE</span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-text-muted">
                <span className="text-sm font-bold tracking-widest">{formatISTTimeOnly(match.kickoff)}</span>
                <span className="text-xs">IST</span>
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center flex-1 gap-2">
            <div className="w-16 h-12 md:w-20 md:h-14 rounded overflow-hidden shadow-lg border border-white/10">
              {awayTeam ? (
                <img src={awayTeam.flagUrl} alt={awayTeam.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-white/5 flex items-center justify-center font-bold text-text-muted">?</div>
              )}
            </div>
            <span className="font-display font-bold text-lg md:text-xl text-center leading-tight tracking-wide">
              {awayTeam?.name || 'TBD'}
            </span>
          </div>
          
        </div>
      </div>

      {/* Footer / Action */}
      <div className="p-4 border-t border-white/5 bg-bg-secondary/50">
        {isFuture ? (
          <div className="flex items-center justify-center gap-2 text-text-secondary text-sm">
            <Calendar size={16} />
            <span>Match Not Started — Highlights will be available after the match.</span>
          </div>
        ) : isOngoing ? (
          <div className="flex items-center justify-center gap-2 text-cyan-primary text-sm">
            <Hourglass size={16} className="animate-pulse" />
            <span>Match In Progress — Highlights will be available after full-time.</span>
          </div>
        ) : !hasHighlight ? (
          <div className="flex items-center justify-center gap-2 text-text-secondary text-sm">
            <Video size={16} />
            <span>Highlights Coming Soon — Waiting for upload.</span>
          </div>
        ) : (
          <button 
            onClick={onWatch}
            className="w-full py-3 bg-cyan-primary/10 hover:bg-cyan-primary/20 text-cyan-primary font-bold tracking-widest uppercase rounded-xl flex items-center justify-center gap-2 transition-colors border border-cyan-primary/30 shadow-[0_0_15px_rgba(0,217,255,0.1)] group-hover:shadow-[0_0_20px_rgba(0,217,255,0.2)]"
          >
            <Play size={18} className="fill-cyan-primary" />
            Watch Highlights
          </button>
        )}
      </div>

    </div>
  );
};
