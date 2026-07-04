import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import type { GoalEvent } from '../../types';

interface Props {
  currentTime: number;
  markers: GoalEvent[];
}

export const GoalNotification = ({ currentTime, markers }: Props) => {
  const [activeGoal, setActiveGoal] = useState<GoalEvent | null>(null);
  const [shownGoals, setShownGoals] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Find a goal that occurred within the last 1 second of current time
    const goal = markers.find(m => 
      m.videoTimestampSeconds !== undefined &&
      currentTime >= m.videoTimestampSeconds && 
      currentTime < m.videoTimestampSeconds + 1
    );

    if (goal && !shownGoals.has(goal.id)) {
      setActiveGoal(goal);
      setShownGoals(prev => new Set(prev).add(goal.id));
      
      const timer = setTimeout(() => {
        setActiveGoal(null);
      }, 2500); // Display for 2.5 seconds

      return () => clearTimeout(timer);
    }
  }, [currentTime, markers, shownGoals]);

  // Reset shown goals if user scrubs backward before the first goal
  useEffect(() => {
    if (currentTime < 1 && shownGoals.size > 0) {
      setShownGoals(new Set());
    }
  }, [currentTime, shownGoals.size]);

  return (
    <AnimatePresence>
      {activeGoal && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="absolute top-8 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
        >
          <div className="bg-bg-secondary/90 backdrop-blur-md border border-[rgba(0,217,255,0.2)] rounded-lg px-6 py-3 shadow-2xl flex flex-col items-center gap-1 min-w-[200px]">
            <span className="text-cyan-primary text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
              ⚽ Goal
            </span>
            <span className="text-white font-display font-bold text-lg text-center leading-tight">
              {activeGoal.playerName}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-cyan-primary/80 font-mono text-sm">{activeGoal.minute}'</span>
              {activeGoal.isPenalty && <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-text-secondary">Penalty</span>}
              {activeGoal.isOwnGoal && <span className="text-[10px] bg-status-danger/20 px-1.5 py-0.5 rounded text-status-danger">Own Goal</span>}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
