import { useRef, useEffect } from 'react';
import type { GoalEvent, Match, Team } from '../types';
import { PlayerUI } from './player/PlayerUI';

export interface SmartVideoPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  markers?: GoalEvent[];
  match?: Match;
  homeTeam?: Team | null;
  awayTeam?: Team | null;
  onClose?: () => void;
  onNext?: () => void;
}

export const SmartVideoPlayer = ({ 
  src, 
  poster, 
  autoPlay = true, 
  markers = [],
  match,
  homeTeam,
  awayTeam,
  onClose,
  onNext
}: SmartVideoPlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && autoPlay) {
      videoRef.current.play().catch(console.error);
    }
  }, [src, autoPlay]);

  const apiUrl = import.meta.env.VITE_API_URL;
  const videoSrc = src.startsWith('http') ? src : `${apiUrl}/api/stream/${src}`;

  return (
    <div 
      ref={containerRef}
      className={`relative group bg-black shadow-[0_0_50px_rgba(0,217,255,0.15)] overflow-hidden flex items-center justify-center w-full h-full rounded-lg`}
    >
      <video
        ref={videoRef}
        src={videoSrc}
        poster={poster}
        playsInline
        className="w-full h-full object-contain cursor-pointer absolute inset-0 z-0"
        crossOrigin="anonymous"
      >
        Your browser does not support the video tag.
      </video>
      
      <PlayerUI 
        videoRef={videoRef} 
        containerRef={containerRef}
        markers={markers}
        match={match}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        onClose={onClose}
        onNext={onNext}
      />
    </div>
  );
};
