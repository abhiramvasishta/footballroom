import { useState, useEffect, type RefObject } from 'react';
import type { GoalEvent, Match, Team } from '../../types';
import { useVideoPlayer } from '../../hooks/useVideoPlayer';
import { VideoControls } from './VideoControls';
import { LoadingOverlay } from './LoadingOverlay';
import { PlayerOverlay } from './PlayerOverlay';
import { PausedOverlay } from './PausedOverlay';
import { EndedOverlay } from './EndedOverlay';
import { GoalNotification } from './GoalNotification';
import { SettingsMenu } from './SettingsMenu';

interface Props {
  videoRef: RefObject<HTMLVideoElement | null>;
  containerRef: RefObject<HTMLDivElement | null>;
  markers: GoalEvent[];
  match?: Match;
  homeTeam?: Team | null;
  awayTeam?: Team | null;
  onClose?: () => void;
  onNext?: () => void;
}

export const PlayerUI = ({ 
  videoRef, 
  containerRef, 
  markers,
  match,
  homeTeam,
  awayTeam,
  onClose,
  onNext
}: Props) => {
  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isFullscreen,
    isBuffering,
    buffered,
    showControls,
    handleMouseMove,
    setShowControls,
    togglePlay,
    seek,
    changeVolume,
    toggleMute,
    toggleFullscreen
  } = useVideoPlayer(videoRef);

  const [isEnded, setIsEnded] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const handleEnded = () => setIsEnded(true);
    const handlePlay = () => setIsEnded(false);
    
    video.addEventListener('ended', handleEnded);
    video.addEventListener('play', handlePlay);
    
    return () => {
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('play', handlePlay);
    };
  }, [videoRef]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      switch(e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen(containerRef);
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'arrowup':
          e.preventDefault();
          changeVolume(Math.min(1, volume + 0.1));
          break;
        case 'arrowdown':
          e.preventDefault();
          changeVolume(Math.max(0, volume - 0.1));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, toggleFullscreen, toggleMute, changeVolume, volume, containerRef]);

  // Mobile gesture handling
  let lastTapTime = 0;
  const handleTouchStart = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTapTime < DOUBLE_TAP_DELAY) {
       // Reserved for future double tap actions
    } else {
      if (isSettingsOpen) setIsSettingsOpen(false);
      else setShowControls(!showControls);
    }
    lastTapTime = now;
  };

  return (
    <div 
      className="absolute inset-0 z-10"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
      onClick={() => {
        if (isSettingsOpen) {
          setIsSettingsOpen(false);
        } else {
          togglePlay();
        }
      }}
      onDoubleClick={() => toggleFullscreen(containerRef)}
      onTouchStart={handleTouchStart}
    >
      <LoadingOverlay isBuffering={isBuffering} />
      <PlayerOverlay isPlaying={isPlaying} />
      
      {!isPlaying && !isEnded && currentTime > 0 && !isSettingsOpen && (
        <PausedOverlay 
          match={match} 
          homeTeam={homeTeam} 
          awayTeam={awayTeam} 
          onContinue={togglePlay} 
        />
      )}
      
      {isEnded && !isSettingsOpen && (
        <EndedOverlay 
          onReplay={() => { seek(0); togglePlay(); }}
          onBack={onClose}
          onNext={onNext}
        />
      )}
      
      <GoalNotification currentTime={currentTime} markers={markers} />

      <div onClick={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
        <SettingsMenu
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          match={match}
          markers={markers}
          duration={duration}
          onSeek={seek}
          onToggleFullscreen={() => toggleFullscreen(containerRef)}
        />

        <VideoControls
          show={showControls || !isPlaying}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          isMuted={isMuted}
          isFullscreen={isFullscreen}
          buffered={buffered}
          markers={markers}
          onTogglePlay={togglePlay}
          onSeek={seek}
          onVolumeChange={changeVolume}
          onToggleMute={toggleMute}
          onToggleFullscreen={() => toggleFullscreen(containerRef)}
          onToggleSettings={() => setIsSettingsOpen(!isSettingsOpen)}
          isSettingsOpen={isSettingsOpen}
        />
      </div>
    </div>
  );
};
