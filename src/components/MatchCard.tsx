import { motion } from 'framer-motion';
import type { Match, Team } from '../types';
import { cn } from '../utils/cn';
import { Calendar, MapPin, Clock, Lock, Info } from 'lucide-react';
import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { MatchDetailsModal } from './MatchDetailsModal';
import { formatISTDateOnly, formatISTTimeOnly } from '../utils/date';

interface Props {
  match: Match;
  teamA: Team | null;
  teamB: Team | null;
  selectedTeamId: string | null;
  onSelectTeam: (teamId: string) => void;
  index: number;
  isLockedOverride?: boolean;
}

export const MatchCard = ({ match, teamA, teamB, selectedTeamId, onSelectTeam, index, isLockedOverride }: Props) => {
  const isLocked = isLockedOverride || match.isLocked || false;
  const [showModal, setShowModal] = useState(false);

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "glass-card rounded-2xl overflow-hidden border transition-colors",
        isLocked ? "border-red-500/30 opacity-90" : "border-[rgba(0,217,255,0.18)] hover:border-white/20"
      )}
    >
      <div 
        onClick={() => setShowModal(true)}
        className="bg-bg-primary/80 p-3 text-center border-b border-[rgba(0,217,255,0.18)] relative cursor-pointer hover:bg-white/5 transition-colors group"
      >
        <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity text-cyan-primary">
          <Info size={16} />
        </div>
        <span className="text-cyan-primary font-bold text-sm uppercase tracking-wider">{match.round}</span>
        
        {isLocked && (
          <div className="absolute top-3 right-3 flex items-center gap-1 text-red-400 text-xs font-bold bg-red-500/10 px-2 py-1 rounded">
            <Lock size={12} /> Predictions Closed
          </div>
        )}

        <div className="flex items-center justify-center gap-4 mt-2 text-xs text-text-secondary">
          <span className="flex items-center gap-1">
            <Calendar size={12} /> 
            {formatISTDateOnly(match.kickoff)}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} /> 
            {formatISTTimeOnly(match.kickoff)}
          </span>
        </div>
        <div className="flex items-center justify-center gap-1 mt-1 text-xs text-text-secondary">
          <MapPin size={12} /> {match.stadium}, {match.city}
        </div>
      </div>

      <div className="flex divide-x divide-white/10 relative">
        {isLocked && !selectedTeamId && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-bg-primary/80 backdrop-blur-sm border-t border-red-500/30">
            <span className="text-red-400 font-bold uppercase tracking-wider text-sm mb-1">Prediction Closed</span>
            <span className="text-text-secondary text-xs">No Prediction Submitted</span>
          </div>
        )}
        {[teamA, teamB].map((team, idx) => {
          if (!team) {
             return (
               <div key={idx} className="flex-1 p-6 text-center text-text-muted italic bg-bg-secondary/30">
                 TBD
               </div>
             )
          }

          const isSelected = selectedTeamId === team.id;
          const hasSelection = selectedTeamId !== null;
          const isLoser = hasSelection && !isSelected;

          return (
            <button
              key={team.id}
              onClick={() => {
                if (!isLocked) onSelectTeam(team.id);
              }}
              disabled={isLocked}
              className={cn(
                "flex-1 p-8 flex flex-col items-center gap-4 transition-all duration-300 relative overflow-hidden group",
                isSelected ? "bg-white/5" : "hover:bg-white/5",
                isLoser ? "opacity-40 hover:opacity-60" : "opacity-100",
                isLocked && !isSelected ? "opacity-30 cursor-not-allowed" : "",
                isLocked && isSelected ? "cursor-default" : ""
              )}
            >
              {isSelected && (
                <motion.div
                  layoutId={`highlight-${match.id}`}
                  className="absolute inset-0 bg-gradient-to-t from-cyan-primary/10 to-transparent pointer-events-none"
                />
              )}
              
              <div className={cn(
                "relative w-24 h-16 md:w-28 md:h-20 shadow-[0_0_15px_rgba(0,0,0,0.5)] border rounded-lg overflow-hidden transition-all duration-500",
                isSelected ? "scale-105 border-cyan-primary/70 shadow-[0_0_20px_rgba(0,217,255,0.2)]" : "border-[rgba(0,217,255,0.1)]",
                !isLocked && !hasSelection ? "group-hover:scale-105 group-hover:border-[rgba(0,217,255,0.3)]" : ""
              )}>
                <img 
                  src={team.flagUrl} 
                  alt={`${team.name} flag`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              
              <div className="flex flex-col items-center z-10">
                <span className={cn(
                  "font-bold text-xl md:text-2xl font-display transition-colors tracking-wide",
                  isSelected ? "text-white" : "text-text-primary"
                )}>
                  {team.name}
                </span>
                <span className="text-[10px] text-text-secondary hidden sm:block tracking-widest mt-1 uppercase">{team.fifaCode}</span>
              </div>

              {isSelected && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute top-4 right-4 flex items-center justify-center w-5 h-5 rounded-full bg-cyan-primary/20 border border-cyan-primary shadow-[0_0_10px_rgba(0,217,255,0.3)]"
                >
                  <div className="w-2 h-2 bg-cyan-primary rounded-full" />
                </motion.div>
              )}
            </button>
          );
        })}
      </div>
    </motion.div>
    
    <AnimatePresence>
      {showModal && (
        <MatchDetailsModal
          match={match}
          homeTeam={teamA}
          awayTeam={teamB}
          onClose={() => setShowModal(false)}
        />
      )}
    </AnimatePresence>
    </>
  );
};
