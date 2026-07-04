import { motion } from 'framer-motion';
import type { Match, Team } from '../../types';
import { formatISTDateOnly } from '../../utils/date';
import { Play } from 'lucide-react';

interface Props {
  match?: Match;
  homeTeam?: Team | null;
  awayTeam?: Team | null;
  onContinue: () => void;
}

export const PausedOverlay = ({ match, homeTeam, awayTeam, onContinue }: Props) => {
  if (!match) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-8"
      onClick={onContinue}
    >
      <div className="flex flex-col items-center gap-6 max-w-2xl w-full" onClick={e => e.stopPropagation()}>
        
        {/* Teams and Score */}
        <div className="flex items-center justify-center gap-8 w-full">
          <div className="flex flex-col items-center flex-1">
            <span className="text-white font-display font-bold text-xl sm:text-2xl text-center">{homeTeam?.name || 'Home'}</span>
          </div>
          
          <div className="flex flex-col items-center shrink-0 px-4">
            <span className="text-4xl sm:text-5xl font-display font-black text-cyan-primary drop-shadow-[0_0_15px_rgba(0,217,255,0.5)]">
              {match.homeScore ?? '-'} : {match.awayScore ?? '-'}
            </span>
          </div>

          <div className="flex flex-col items-center flex-1">
            <span className="text-white font-display font-bold text-xl sm:text-2xl text-center">{awayTeam?.name || 'Away'}</span>
          </div>
        </div>

        {/* Match Details */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-text-secondary/80 font-medium">
          {match.round && (
            <>
              <span className="text-cyan-primary/90">{match.round}</span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
            </>
          )}
          <span>{match.stadium}</span>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <span>{formatISTDateOnly(match.kickoff)}</span>
        </div>

        {/* Continue Button */}
        <button 
          onClick={onContinue}
          className="mt-4 flex items-center gap-2 bg-cyan-primary hover:bg-cyan-secondary text-black font-bold px-6 py-2.5 rounded-full transition-colors group"
        >
          <Play className="w-4 h-4 fill-black group-hover:scale-110 transition-transform" />
          Continue Watching
        </button>
      </div>
    </motion.div>
  );
};
