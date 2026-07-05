import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { DetailedMatch } from '../../../hooks/useMatchDetails';

interface Props {
  match: DetailedMatch;
}

const STAT_KEYS = [
  { key: 'possessionPct', label: 'Possession %' },
  { key: 'totalShots', label: 'Shots' },
  { key: 'shotsOnTarget', label: 'Shots on Target' },
  { key: 'wonCorners', label: 'Corners' },
  { key: 'foulsCommitted', label: 'Fouls' },
  { key: 'yellowCards', label: 'Yellow Cards' },
  { key: 'redCards', label: 'Red Cards' },
  { key: 'offsides', label: 'Offsides' },
  { key: 'saves', label: 'Saves' },
];

export const MatchStatistics = ({ match }: Props) => {
  const [isOpen, setIsOpen] = useState(true);

  if (!match.homeStatistics?.length && !match.awayStatistics?.length) {
    return null;
  }

  const getStat = (stats: any[], key: string) => {
    const stat = stats.find(s => s.name === key);
    return stat ? parseFloat(stat.displayValue) : 0;
  };

  return (
    <div className="bg-bg-secondary/80 backdrop-blur-md rounded-xl border border-[rgba(0,217,255,0.18)] overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 sm:p-6 hover:bg-white/5 transition-colors"
        aria-expanded={isOpen}
      >
        <span className="font-display font-bold text-lg text-white">Team Statistics</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
          <ChevronDown className="text-cyan-primary" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 sm:p-6 pt-0 flex flex-col gap-5">
              <div className="flex justify-between text-xs sm:text-sm font-bold uppercase tracking-wider mb-2">
                <span className="text-white truncate max-w-[40%]">{match.homeTeam}</span>
                <span className="text-white truncate max-w-[40%] text-right">{match.awayTeam}</span>
              </div>
              
              {STAT_KEYS.map(({ key, label }) => {
                const homeVal = getStat(match.homeStatistics, key);
                const awayVal = getStat(match.awayStatistics, key);
                
                if (homeVal === 0 && awayVal === 0 && key !== 'possessionPct') return null;

                const total = homeVal + awayVal;
                const homePct = total > 0 ? (homeVal / total) * 100 : 50;
                const awayPct = total > 0 ? (awayVal / total) * 100 : 50;

                return (
                  <div key={key} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold text-white min-w-[2rem]">{key === 'possessionPct' ? `${homeVal}%` : homeVal}</span>
                      <span className="text-text-secondary text-xs uppercase tracking-widest">{label}</span>
                      <span className="font-bold text-white min-w-[2rem] text-right">{key === 'possessionPct' ? `${awayVal}%` : awayVal}</span>
                    </div>
                    
                    <div className="h-2 w-full bg-bg-primary rounded-full overflow-hidden flex">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${homePct}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-cyan-primary"
                      />
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${awayPct}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-[#f60123]"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
