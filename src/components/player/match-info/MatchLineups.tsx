import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { DetailedMatch } from '../../../hooks/useMatchDetails';

interface Props {
  match: DetailedMatch;
}

const renderPlayer = (p: any, idx: number) => {
  const name = p.athlete?.displayName || p.athlete?.shortName || p.name;
  const jersey = p.jersey || '-';
  const pos = p.position?.abbreviation || p.position?.name || '';
  
  return (
    <div key={idx} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
      <div className="w-6 text-center text-xs font-bold text-text-secondary bg-white/5 rounded py-0.5 shrink-0">
        {jersey}
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-sm font-medium text-white truncate">{name}</span>
      </div>
      {pos && (
        <div className="text-[10px] uppercase font-bold text-cyan-primary px-1.5 shrink-0">
          {pos}
        </div>
      )}
    </div>
  );
};

export const MatchLineups = ({ match }: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!match.homeLineup?.length && !match.awayLineup?.length) {
    return null;
  }

  const homeStarters = match.homeLineup.filter((p: any) => p.starter);
  const homeSubs = match.homeLineup.filter((p: any) => !p.starter);

  const awayStarters = match.awayLineup.filter((p: any) => p.starter);
  const awaySubs = match.awayLineup.filter((p: any) => !p.starter);

  return (
    <div className="bg-bg-secondary/80 backdrop-blur-md rounded-xl border border-[rgba(0,217,255,0.18)] overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 sm:p-6 hover:bg-white/5 transition-colors"
        aria-expanded={isOpen}
      >
        <span className="font-display font-bold text-lg text-white">Lineups</span>
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
            <div className="p-4 sm:p-6 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {/* Home Team */}
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-white uppercase tracking-wider">{match.homeTeam}</span>
                    <span className="text-xs text-text-secondary">Starting XI</span>
                  </div>
                  <div className="flex flex-col">
                    {homeStarters.map(renderPlayer)}
                  </div>
                  
                  {homeSubs.length > 0 && (
                    <>
                      <span className="text-xs text-text-secondary mt-2">Substitutes</span>
                      <div className="flex flex-col">
                        {homeSubs.map(renderPlayer)}
                      </div>
                    </>
                  )}
                </div>

                {/* Away Team */}
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-white uppercase tracking-wider">{match.awayTeam}</span>
                    <span className="text-xs text-text-secondary">Starting XI</span>
                  </div>
                  <div className="flex flex-col">
                    {awayStarters.map(renderPlayer)}
                  </div>

                  {awaySubs.length > 0 && (
                    <>
                      <span className="text-xs text-text-secondary mt-2">Substitutes</span>
                      <div className="flex flex-col">
                        {awaySubs.map(renderPlayer)}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
