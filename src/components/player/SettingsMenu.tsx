import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Link, Trophy, Info, Maximize, RotateCcw, FastForward, Rewind, Settings2 } from 'lucide-react';
import type { Match, GoalEvent } from '../../types';
import { formatISTDateOnly } from '../../utils/date';
import { toast } from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  match?: Match;
  markers: GoalEvent[];
  duration: number;
  onSeek: (time: number) => void;
  onToggleFullscreen: () => void;
}

export const SettingsMenu = ({ isOpen, onClose, match, markers, duration, onSeek, onToggleFullscreen }: Props) => {
  const handleCopyLink = (highlightOnly: boolean) => {
    const url = window.location.href; // In a real app this would be more specific
    navigator.clipboard.writeText(url);
    toast.success(highlightOnly ? 'Highlight link copied' : 'Match link copied');
    onClose();
  };

  const jumpToFirstGoal = () => {
    const first = markers.find(m => m.videoTimestampSeconds !== undefined);
    if (first && first.videoTimestampSeconds !== undefined) {
      onSeek(first.videoTimestampSeconds);
    }
    onClose();
  };

  const jumpToLastGoal = () => {
    const last = [...markers].reverse().find(m => m.videoTimestampSeconds !== undefined);
    if (last && last.videoTimestampSeconds !== undefined) {
      onSeek(last.videoTimestampSeconds);
    }
    onClose();
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}m ${s}s`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-16 right-4 sm:right-6 w-72 bg-bg-secondary/95 backdrop-blur-xl border border-[rgba(0,217,255,0.2)] rounded-lg shadow-2xl overflow-hidden z-50 flex flex-col"
        >
          {/* Match Actions */}
          <div className="flex flex-col py-2 border-b border-white/5">
            <span className="px-4 py-1 text-[10px] uppercase tracking-widest text-text-secondary font-bold">⚽ Match</span>
            <button onClick={() => { onSeek(0); onClose(); }} className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 text-sm text-white transition-colors text-left">
              <RotateCcw className="w-4 h-4 text-cyan-primary" />
              Restart Highlight
            </button>
            {markers.some(m => m.videoTimestampSeconds !== undefined) && (
              <>
                <button onClick={jumpToFirstGoal} className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 text-sm text-white transition-colors text-left">
                  <Rewind className="w-4 h-4 text-cyan-primary" />
                  Jump to First Goal
                </button>
                <button onClick={jumpToLastGoal} className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 text-sm text-white transition-colors text-left">
                  <FastForward className="w-4 h-4 text-cyan-primary" />
                  Jump to Last Goal
                </button>
              </>
            )}
          </div>

          {/* Share */}
          <div className="flex flex-col py-2 border-b border-white/5">
            <span className="px-4 py-1 text-[10px] uppercase tracking-widest text-text-secondary font-bold">📤 Share</span>
            <button onClick={() => handleCopyLink(false)} className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 text-sm text-white transition-colors text-left">
              <Share2 className="w-4 h-4 text-cyan-primary" />
              Copy Match Link
            </button>
            <button onClick={() => handleCopyLink(true)} className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 text-sm text-white transition-colors text-left">
              <Link className="w-4 h-4 text-cyan-primary" />
              Copy Highlight Link
            </button>
          </div>

          {/* View */}
          <div className="flex flex-col py-2 border-b border-white/5">
            <span className="px-4 py-1 text-[10px] uppercase tracking-widest text-text-secondary font-bold">📺 View</span>
            
            <div className="px-4 py-2 flex items-center justify-between text-sm text-white">
              <div className="flex items-center gap-3">
                <Settings2 className="w-4 h-4 text-cyan-primary" />
                Quality
              </div>
              <select 
                className="bg-transparent border border-white/20 rounded px-2 py-1 text-xs outline-none focus:border-cyan-primary cursor-pointer text-text-secondary"
                onChange={(e) => {
                  toast.success(`Video quality set to ${e.target.value}`);
                  onClose();
                }}
              >
                <option value="Auto" className="bg-bg-primary text-white">Auto</option>
                <option value="1080p" className="bg-bg-primary text-white">1080p HD</option>
                <option value="720p" className="bg-bg-primary text-white">720p</option>
                <option value="480p" className="bg-bg-primary text-white">480p</option>
              </select>
            </div>

            <button onClick={() => { onToggleFullscreen(); onClose(); }} className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 text-sm text-white transition-colors text-left">
              <Maximize className="w-4 h-4 text-cyan-primary" />
              Fullscreen
            </button>
          </div>

          {/* Match Info */}
          <div className="flex flex-col py-2 bg-black/20">
            <span className="px-4 py-1 flex items-center gap-2 text-[10px] uppercase tracking-widest text-text-secondary font-bold">
              <Info className="w-3 h-3" /> Match Info
            </span>
            <div className="px-4 py-2 flex flex-col gap-1.5 text-xs">
              {match && (
                <>
                  <div className="flex justify-between items-start">
                    <span className="text-text-secondary">Stadium</span>
                    <span className="text-white text-right ml-4">{match.stadium}</span>
                  </div>
                  {match.round && (
                    <div className="flex justify-between items-start">
                      <span className="text-text-secondary">Competition</span>
                      <span className="text-white text-right ml-4 flex items-center gap-1">
                        <Trophy className="w-3 h-3 text-cyan-primary" /> {match.round}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-start">
                    <span className="text-text-secondary">Match Date</span>
                    <span className="text-white text-right ml-4">{formatISTDateOnly(match.kickoff)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between items-start">
                <span className="text-text-secondary">Duration</span>
                <span className="text-cyan-primary font-mono text-right ml-4">{formatDuration(duration)}</span>
              </div>
            </div>
          </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
};
