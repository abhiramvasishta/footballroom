import { formatISTDateOnly } from '../../../utils/date';
import type { DetailedMatch } from '../../../hooks/useMatchDetails';

interface Props {
  match: DetailedMatch;
}

export const MatchInfoPanel = ({ match }: Props) => {
  return (
    <div className="bg-bg-secondary/80 backdrop-blur-md rounded-xl p-4 sm:p-6 border border-[rgba(0,217,255,0.18)] flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
        <div className="flex flex-col">
          <span className="text-text-secondary text-xs uppercase font-medium tracking-wider mb-1">Competition</span>
          <span className="text-white font-medium">{match.competition}</span>
        </div>
        
        <div className="flex flex-col">
          <span className="text-text-secondary text-xs uppercase font-medium tracking-wider mb-1">Status</span>
          <span className="text-white font-medium capitalize">
            {match.status === 0 ? 'Full Time' : match.status === 1 ? 'Not Started' : 'Live'}
          </span>
        </div>

        {match.venue && (
          <div className="flex flex-col">
            <span className="text-text-secondary text-xs uppercase font-medium tracking-wider mb-1">Stadium</span>
            <span className="text-white font-medium">{match.venue}</span>
          </div>
        )}

        {match.city && (
          <div className="flex flex-col">
            <span className="text-text-secondary text-xs uppercase font-medium tracking-wider mb-1">City</span>
            <span className="text-white font-medium">{match.city}</span>
          </div>
        )}

        <div className="flex flex-col">
          <span className="text-text-secondary text-xs uppercase font-medium tracking-wider mb-1">Kickoff</span>
          <span className="text-white font-medium">{formatISTDateOnly(match.kickoffTime)}</span>
        </div>

        {match.referee && (
          <div className="flex flex-col">
            <span className="text-text-secondary text-xs uppercase font-medium tracking-wider mb-1">Referee</span>
            <span className="text-white font-medium">{match.referee}</span>
          </div>
        )}
      </div>
    </div>
  );
};
