import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useState, useMemo } from 'react';
import type { DetailedMatch } from '../../../hooks/useMatchDetails';

interface Props {
  match: DetailedMatch;
}

interface TimelineEvent {
  minute: number;
  displayMinute: string;
  type: 'goal' | 'own_goal' | 'penalty' | 'yellow_card' | 'red_card' | 'substitution';
  player: string;
  playerOff?: string; // For substitutions
  isHomeTeam: boolean;
}

export const MatchEventsTimeline = ({ match }: Props) => {
  const [isOpen, setIsOpen] = useState(true);

  const events = useMemo(() => {
    const allEvents: TimelineEvent[] = [];

    const parseMinute = (minStr: string) => {
      const match = minStr.match(/(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    };

    // Add Goals
    match.goals?.forEach((g: any) => {
      allEvents.push({
        minute: parseMinute(g.minute),
        displayMinute: g.minute,
        type: g.isOwnGoal ? 'own_goal' : (g.isPenalty ? 'penalty' : 'goal'),
        player: g.player,
        isHomeTeam: g.isHomeTeam,
      });
    });

    // Add Cards
    match.cards?.forEach((c: any) => {
      allEvents.push({
        minute: parseMinute(c.minute),
        displayMinute: c.minute,
        type: c.type === 'Yellow Card' ? 'yellow_card' : 'red_card',
        player: c.player,
        isHomeTeam: c.teamId === match.homeEspnId,
      });
    });

    // Add Substitutions
    match.substitutions?.forEach((s: any) => {
      allEvents.push({
        minute: parseMinute(s.minute),
        displayMinute: s.minute,
        type: 'substitution',
        player: s.playerOn,
        playerOff: s.playerOff,
        isHomeTeam: s.teamId === match.homeEspnId,
      });
    });

    return allEvents.sort((a, b) => a.minute - b.minute);
  }, [match]);

  if (!events.length) return null;

  const renderIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'goal': return '⚽';
      case 'own_goal': return '⚽ (OG)';
      case 'penalty': return '⚽ (P)';
      case 'yellow_card': return '🟨';
      case 'red_card': return '🔴';
      case 'substitution': return '↔';
    }
  };

  return (
    <div className="bg-bg-secondary/80 backdrop-blur-md rounded-xl border border-[rgba(0,217,255,0.18)] overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 sm:p-6 hover:bg-white/5 transition-colors"
        aria-expanded={isOpen}
      >
        <span className="font-display font-bold text-lg text-white">Match Events</span>
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
              <div className="relative border-l border-white/10 ml-[28px] space-y-6">
                {events.map((ev, idx) => (
                  <div key={idx} className="relative flex items-center">
                    <div className="absolute -left-[28px] w-[56px] flex justify-center bg-bg-secondary font-bold text-cyan-primary text-xs">
                      {ev.displayMinute}
                    </div>
                    <div className="ml-[40px] flex items-center gap-3 w-full bg-white/5 rounded-lg p-3">
                      <div className="text-lg w-6 flex justify-center shrink-0">
                        {renderIcon(ev.type)}
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white truncate">{ev.player}</span>
                          <span className="text-[10px] uppercase font-bold text-text-secondary px-2 py-0.5 rounded-full bg-white/10 shrink-0">
                            {ev.isHomeTeam ? match.homeTeam : match.awayTeam}
                          </span>
                        </div>
                        {ev.type === 'substitution' && ev.playerOff && (
                          <span className="text-xs text-text-secondary truncate mt-0.5">
                            Out: {ev.playerOff}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
