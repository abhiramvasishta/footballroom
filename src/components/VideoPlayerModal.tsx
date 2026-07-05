import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import type { Match, Team } from '../types';
import { SmartVideoPlayer } from './SmartVideoPlayer';
import { useMatchDetails } from '../hooks/useMatchDetails';
import { MatchInfoPanel } from './player/match-info/MatchInfoPanel';
import { MatchStatistics } from './player/match-info/MatchStatistics';
import { MatchEventsTimeline } from './player/match-info/MatchEventsTimeline';
import { MatchLineups } from './player/match-info/MatchLineups';

interface Props {
  match: Match;
  homeTeam: Team | null;
  awayTeam: Team | null;
  onClose: () => void;
}

export const VideoPlayerModal = ({ match, homeTeam, awayTeam, onClose }: Props) => {
  const { data: detailedMatch, loading, error } = useMatchDetails(match, homeTeam, awayTeam);

  // Scroll Lock for iOS and Android
  useEffect(() => {
    const originalBodyStyle = document.body.style.overflow;
    const originalHtmlStyle = document.documentElement.style.overflow;
    
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = originalBodyStyle;
      document.documentElement.style.overflow = originalHtmlStyle;
    };
  }, []);

  if (!match.highlightUrl) return null;
  const streamUrl = match.highlightUrl;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-bg-primary overflow-y-auto overscroll-none">
      
      {/* Header (Non-sticky, just top) */}
      <div className="flex items-center justify-between p-4 bg-bg-secondary/80 backdrop-blur-md border-b border-[rgba(0,217,255,0.18)] shrink-0 z-50">
        <div className="flex flex-col">
          <span className="font-display font-bold text-lg text-white">
            {homeTeam?.name || 'TBD'} vs {awayTeam?.name || 'TBD'}
          </span>
          <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary mt-1">
            <span className="font-bold text-cyan-primary">FT • {match.homeScore ?? '-'}–{match.awayScore ?? '-'}</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors shrink-0 group"
          aria-label="Close video player"
        >
          <X size={24} className="text-white group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      {/* Sticky Video Container for Mobile, normal for Desktop */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="w-full relative flex items-center justify-center bg-black shrink-0 z-40 lg:static sticky top-0"
        style={{ minHeight: '30vh' }}
      >
        <div className="w-full max-w-5xl mx-auto flex items-center justify-center p-0 lg:p-8">
          <div className="w-full aspect-video relative">
            <SmartVideoPlayer src={streamUrl} markers={match.goals || []} />
          </div>
        </div>
      </motion.div>

      {/* Details Container - Lazy loaded */}
      <div className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 lg:gap-8 z-10">
        
        {loading ? (
          // Progressive Loading Skeletons
          <div className="flex flex-col gap-6 lg:gap-8 animate-pulse">
            <div className="h-32 bg-white/5 rounded-xl border border-white/10" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
              <div className="lg:col-span-7 flex flex-col gap-6 lg:gap-8">
                <div className="h-48 bg-white/5 rounded-xl border border-white/10" />
                <div className="h-64 bg-white/5 rounded-xl border border-white/10" />
              </div>
              <div className="lg:col-span-5">
                <div className="h-[500px] bg-white/5 rounded-xl border border-white/10" />
              </div>
            </div>
          </div>
        ) : error || !detailedMatch ? (
          // Fallback if ESPN data fails - Just hide it, do not show error
          <div className="text-center text-text-secondary text-sm p-8 opacity-50">
            No additional match details available.
          </div>
        ) : (
          // Success Render
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col gap-6 lg:gap-8"
          >
            {/* Match Info Panel always full width */}
            <MatchInfoPanel match={detailedMatch} />

            {/* Desktop Two-Column Layout / Mobile Stack */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
              
              <div className="lg:col-span-7 flex flex-col gap-6 lg:gap-8">
                <MatchStatistics match={detailedMatch} />
                <MatchEventsTimeline match={detailedMatch} />
              </div>

              <div className="lg:col-span-5">
                <MatchLineups match={detailedMatch} />
              </div>

            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
};
