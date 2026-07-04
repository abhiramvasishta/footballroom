import { useState, useEffect, type RefObject } from 'react';

export const useVideoPlayer = (videoRef: RefObject<HTMLVideoElement | null>) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [buffered, setBuffered] = useState<{ start: number; end: number }[]>([]);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updatePlayState = () => setIsPlaying(!video.paused && !video.ended);
    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration || 0);
    const updateVolume = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };
    const updateBuffering = (status: boolean) => () => setIsBuffering(status);
    
    const updateBuffered = () => {
      const ranges = [];
      for (let i = 0; i < video.buffered.length; i++) {
        ranges.push({
          start: video.buffered.start(i),
          end: video.buffered.end(i)
        });
      }
      setBuffered(ranges);
    };

    video.addEventListener('play', updatePlayState);
    video.addEventListener('pause', updatePlayState);
    video.addEventListener('ended', updatePlayState);
    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('volumechange', updateVolume);
    video.addEventListener('waiting', updateBuffering(true));
    video.addEventListener('playing', updateBuffering(false));
    video.addEventListener('canplay', updateBuffering(false));
    video.addEventListener('progress', updateBuffered);
    
    // Init values
    updateVolume();
    updateDuration();

    return () => {
      video.removeEventListener('play', updatePlayState);
      video.removeEventListener('pause', updatePlayState);
      video.removeEventListener('ended', updatePlayState);
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('volumechange', updateVolume);
      video.removeEventListener('waiting', updateBuffering(true));
      video.removeEventListener('playing', updateBuffering(false));
      video.removeEventListener('canplay', updateBuffering(false));
      video.removeEventListener('progress', updateBuffered);
    };
  }, [videoRef]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeout) clearTimeout(controlsTimeout);
    
    if (isPlaying) {
      const timeout = setTimeout(() => {
        setShowControls(false);
      }, 2000);
      setControlsTimeout(timeout);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(console.error);
    } else {
      videoRef.current.pause();
    }
  };

  const seek = (time: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = time;
  };

  const fastForward = () => seek(currentTime + 10);
  const rewind = () => seek(currentTime - 10);

  const changeVolume = (newVolume: number) => {
    if (!videoRef.current) return;
    videoRef.current.volume = newVolume;
    videoRef.current.muted = newVolume === 0;
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMuted = !videoRef.current.muted;
    videoRef.current.muted = newMuted;
    if (!newMuted && videoRef.current.volume === 0) {
      videoRef.current.volume = 1;
    }
  };

  const toggleFullscreen = (containerRef: RefObject<HTMLElement | null>) => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  };

  const changePlaybackRate = (rate: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  };

  return {
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isFullscreen,
    isBuffering,
    buffered,
    playbackRate,
    showControls,
    handleMouseMove,
    setShowControls,
    togglePlay,
    seek,
    fastForward,
    rewind,
    changeVolume,
    toggleMute,
    toggleFullscreen,
    changePlaybackRate
  };
};
