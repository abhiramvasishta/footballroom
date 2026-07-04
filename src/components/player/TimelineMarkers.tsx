import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import type { GoalEvent } from '../../types';

interface Props {
  markers: GoalEvent[];
  duration: number;
  onSeek: (time: number) => void;
}

export const TimelineMarkers = ({ markers, duration, onSeek }: Props) => {
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);

  if (!duration || duration <= 0) return null;

  return (
    <>
      {markers.map((marker) => {
        if (marker.videoTimestampSeconds === undefined) return null;
        
        const leftPercent = (marker.videoTimestampSeconds / duration) * 100;
        // Don't render if outside bounds
        if (leftPercent < 0 || leftPercent > 100) return null;

        const isHovered = hoveredMarker === marker.id;

        return (
          <div
            key={marker.id}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group z-30 cursor-pointer flex items-center justify-center w-6 h-6"
            style={{ left: `${leftPercent}%` }}
            onMouseEnter={() => setHoveredMarker(marker.id)}
            onMouseLeave={() => setHoveredMarker(null)}
            onClick={(e) => {
              e.stopPropagation();
              if (marker.videoTimestampSeconds !== undefined) {
                onSeek(marker.videoTimestampSeconds);
              }
            }}
          >
            {/* Marker Icon */}
            <div className={`w-3 h-3 rounded-full border border-black shadow flex items-center justify-center transition-transform ${isHovered ? 'scale-150' : 'scale-100'} ${marker.isOwnGoal ? 'bg-status-danger' : 'bg-cyan-primary'}`}>
              <div className="text-[6px]">⚽</div>
            </div>

            {/* Tooltip */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: -25, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-bg-secondary/95 backdrop-blur-md border border-[rgba(0,217,255,0.2)] rounded px-3 py-1.5 shadow-xl flex flex-col items-center whitespace-nowrap z-50 pointer-events-none"
                >
                  <div className="flex items-center gap-1.5 text-xs text-white font-medium">
                    <span className="text-cyan-primary font-mono">{marker.minute}'</span>
                    <span>{marker.playerName}</span>
                    {marker.isPenalty && <span className="text-[9px] bg-white/10 px-1 rounded text-text-secondary">P</span>}
                    {marker.isOwnGoal && <span className="text-[9px] bg-status-danger/20 px-1 rounded text-status-danger">OG</span>}
                  </div>
                  {/* Tooltip caret */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-bg-secondary/95" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </>
  );
};
