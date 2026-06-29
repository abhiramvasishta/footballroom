import { motion } from 'framer-motion';

interface Props {
  currentRound: number;
  totalMatches: number;
  completedMatches: number;
}

export const ProgressBar = ({ currentRound, totalMatches, completedMatches }: Props) => {
  const getRoundName = (round: number) => {
    switch(round) {
      case 32: return "Round of 32";
      case 16: return "Round of 16";
      case 8: return "Quarter Finals";
      case 4: return "Semi Finals";
      case 3: return "Third Place";
      case 2: return "Final";
      default: return "Review";
    }
  };

  const progress = (completedMatches / totalMatches) * 100;

  return (
    <div className="sticky top-0 z-50 w-full bg-bg-primary/80 backdrop-blur-md border-b border-[rgba(0,217,255,0.18)] p-4">
      <div className="max-w-3xl mx-auto flex flex-col gap-2">
        <div className="flex justify-between items-end">
          <h2 className="text-xl font-bold text-white">{getRoundName(currentRound)}</h2>
          <span className="text-sm font-mono text-cyan-primary">
            {completedMatches} / {totalMatches} Completed
          </span>
        </div>
        <div className="h-2 w-full bg-bg-secondary rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-cyan-primary to-cyan-secondary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", bounce: 0, duration: 0.5 }}
          />
        </div>
      </div>
    </div>
  );
};
