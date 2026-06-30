import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Match, Team } from '../types';
import { formatISTDateOnly } from '../utils/date';

interface Props {
  match: Match;
  homeTeam: Team | null;
  awayTeam: Team | null;
  onClose: () => void;
}

export const VideoPlayerModal = ({ match, homeTeam, awayTeam, onClose }: Props) => {
  if (!match.highlightUrl) return null;

  const getStreamUrl = (url: string) => {
    const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (driveMatch) {
      return `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
    }
    return url;
  };

  const streamUrl = getStreamUrl(match.highlightUrl);
  const isYouTube = match.highlightUrl.includes('youtube.com') || match.highlightUrl.includes('youtu.be');

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-bg-primary overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-bg-secondary/80 backdrop-blur-md border-b border-[rgba(0,217,255,0.18)] z-10 shrink-0">
        <div className="flex flex-col">
          <span className="font-display font-bold text-lg text-white">
            {homeTeam?.name || 'TBD'} vs {awayTeam?.name || 'TBD'}
          </span>
          <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary mt-1">
            <span className="font-bold text-cyan-primary">FT • {match.homeScore ?? '-'}–{match.awayScore ?? '-'}</span>
            <span>•</span>
            <span>🏟 {match.stadium}</span>
            <span>•</span>
            <span>📅 {formatISTDateOnly(match.kickoff)}</span>
          </div>
        </div>
        
        <button 
          onClick={onClose}
          className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors shrink-0"
        >
          <X size={24} className="text-white" />
        </button>
      </div>

      {/* Video Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="flex-1 w-full relative bg-black flex items-center justify-center"
      >
        {isYouTube ? (
          <iframe 
            src={streamUrl} 
            className="w-full h-full md:w-[85%] md:h-[85%] rounded-lg shadow-[0_0_50px_rgba(0,217,255,0.15)]"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            title={`Highlights: ${homeTeam?.name} vs ${awayTeam?.name}`}
          ></iframe>
        ) : (
          <video 
            src={streamUrl} 
            className="w-full h-full md:w-[85%] md:h-[85%] rounded-lg shadow-[0_0_50px_rgba(0,217,255,0.15)] object-contain"
            controls
            autoPlay
            playsInline
          />
        )}
      </motion.div>

      {/* Stats Footer */}
      <div className="shrink-0 p-4 bg-bg-secondary/80 backdrop-blur-md border-t border-[rgba(0,217,255,0.18)] max-h-48 overflow-y-auto">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-6 justify-between text-sm w-full">
          
          {/* Home Goals */}
          <div className="flex-1 flex flex-col text-left">
            <span className="text-xs text-cyan-primary uppercase tracking-widest font-bold mb-2 border-b border-white/10 pb-1">{homeTeam?.name || 'Home'}</span>
            <div className="flex flex-col gap-1">
              {(match.goals || []).filter(g => g.isHomeTeam).sort((a, b) => (parseInt(a.minute.replace(/\D/g, '')) || 0) - (parseInt(b.minute.replace(/\D/g, '')) || 0)).map(goal => (
                <div key={goal.id} className="text-white text-xs flex items-center gap-2">
                  <span className="font-mono text-cyan-primary/70">{goal.minute}'</span>
                  <span className="font-medium">{goal.playerName}</span>
                  {goal.isPenalty && <span className="text-[9px] bg-white/10 px-1 rounded text-text-secondary">P</span>}
                  {goal.isOwnGoal && <span className="text-[9px] bg-status-danger/20 px-1 rounded text-status-danger">OG</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Center Info (Penalties / AET) */}
          <div className="flex-[0.5] flex flex-col justify-start items-center text-center gap-2 px-4 border-x border-white/5">
            {match.penalties && (
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs text-text-secondary uppercase tracking-widest font-bold">Penalties</span>
                <span className="text-lg font-mono font-bold text-cyan-primary">
                  {match.homePenaltyScore ?? '-'} - {match.awayPenaltyScore ?? '-'}
                </span>
              </div>
            )}
            {match.extraTime && !match.penalties && (
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs text-text-secondary uppercase tracking-widest font-bold">Extra Time</span>
                <span className="text-white text-xs">Played</span>
              </div>
            )}
          </div>

          {/* Away Goals */}
          <div className="flex-1 flex flex-col text-right">
            <span className="text-xs text-cyan-primary uppercase tracking-widest font-bold mb-2 border-b border-white/10 pb-1">{awayTeam?.name || 'Away'}</span>
            <div className="flex flex-col gap-1 items-end">
              {(match.goals || []).filter(g => !g.isHomeTeam).sort((a, b) => (parseInt(a.minute.replace(/\D/g, '')) || 0) - (parseInt(b.minute.replace(/\D/g, '')) || 0)).map(goal => (
                <div key={goal.id} className="text-white text-xs flex items-center justify-end gap-2">
                  {goal.isOwnGoal && <span className="text-[9px] bg-status-danger/20 px-1 rounded text-status-danger">OG</span>}
                  {goal.isPenalty && <span className="text-[9px] bg-white/10 px-1 rounded text-text-secondary">P</span>}
                  <span className="font-medium">{goal.playerName}</span>
                  <span className="font-mono text-cyan-primary/70">{goal.minute}'</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
      
    </div>
  );
};
