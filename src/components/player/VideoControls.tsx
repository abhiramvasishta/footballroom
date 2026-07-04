import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Maximize, Minimize, Settings, Share2 } from 'lucide-react';
import { ProgressBar } from './ProgressBar';
import { VolumeControl } from './VolumeControl';
import type { GoalEvent } from '../../types';
import { toast } from 'react-hot-toast';

interface Props {
  show: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  buffered: { start: number; end: number }[];
  markers: GoalEvent[];
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  onToggleSettings: () => void;
  isSettingsOpen: boolean;
}

export const VideoControls = ({
  show,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  isFullscreen,
  buffered,
  markers,
  onTogglePlay,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onToggleFullscreen,
  onToggleSettings,
  isSettingsOpen
}: Props) => {

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Match link copied!');
  };

  return (
    <AnimatePresence>
      {(show || isSettingsOpen) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-16 pb-4 px-4 sm:px-6"
        >
          <div className="flex items-center justify-between gap-4">
            
            {/* Left: Play/Pause and Time */}
            <div className="flex items-center gap-3 sm:gap-4 shrink-0">
              <button 
                onClick={onTogglePlay} 
                className="text-white hover:text-cyan-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-primary rounded-full p-1"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>

              <div className="text-white/80 text-xs sm:text-sm font-mono tracking-wider flex items-center gap-1 select-none pointer-events-none min-w-[80px]">
                <span>{formatTime(currentTime)}</span>
                <span className="text-white/40">/</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Center: Progress Bar */}
            <div className="flex-1 max-w-4xl px-2 hidden sm:block">
              <ProgressBar 
                currentTime={currentTime} 
                duration={duration} 
                buffered={buffered} 
                markers={markers} 
                onSeek={onSeek} 
              />
            </div>

            {/* Right: Volume, Share, Settings, Fullscreen */}
            <div className="flex items-center justify-end gap-2 sm:gap-4 shrink-0">
              
              <div className="hidden sm:block">
                <VolumeControl 
                  volume={volume} 
                  isMuted={isMuted} 
                  onVolumeChange={onVolumeChange} 
                  onToggleMute={onToggleMute} 
                />
              </div>

              <button 
                onClick={handleShare} 
                className="text-white hover:text-cyan-primary transition-colors focus:outline-none p-1.5 hidden sm:block opacity-70 hover:opacity-100"
                title="Share Match"
              >
                <Share2 className="w-4 h-4" />
              </button>

              <button 
                onClick={onToggleSettings} 
                className={`text-white transition-colors focus:outline-none p-1.5 opacity-70 hover:opacity-100 ${isSettingsOpen ? 'text-cyan-primary opacity-100 rotate-90' : 'hover:text-cyan-primary'} transition-all duration-300`}
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>

              <button 
                onClick={onToggleFullscreen} 
                className="text-white hover:text-cyan-primary transition-colors focus:outline-none p-1.5 opacity-70 hover:opacity-100"
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>

            </div>

          </div>
          
          {/* Mobile Progress Bar (Shown below controls on small screens) */}
          <div className="w-full mt-3 sm:hidden px-2">
            <ProgressBar 
              currentTime={currentTime} 
              duration={duration} 
              buffered={buffered} 
              markers={markers} 
              onSeek={onSeek} 
            />
          </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
};
