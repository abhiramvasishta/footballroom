import { useRef, useState, type MouseEvent as ReactMouseEvent, type TouchEvent as ReactTouchEvent } from 'react';
import type { GoalEvent } from '../../types';
import { TimelineMarkers } from './TimelineMarkers';

interface Props {
  currentTime: number;
  duration: number;
  buffered: { start: number; end: number }[];
  markers: GoalEvent[];
  onSeek: (time: number) => void;
}

export const ProgressBar = ({ currentTime, duration, buffered, markers, onSeek }: Props) => {
  const progressRef = useRef<HTMLDivElement>(null);
  const [hoverPercent, setHoverPercent] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const calculatePercent = (e: ReactMouseEvent<HTMLDivElement> | ReactTouchEvent<HTMLDivElement> | MouseEvent | TouchEvent) => {
    if (!progressRef.current || duration === 0) return 0;
    const rect = progressRef.current.getBoundingClientRect();
    let clientX = 0;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
    } else {
      clientX = (e as unknown as MouseEvent).clientX;
    }
    
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    return x / rect.width;
  };

  const handlePointerDown = (e: ReactMouseEvent<HTMLDivElement> | ReactTouchEvent<HTMLDivElement>) => {
    e.preventDefault(); // Prevent selection
    setIsDragging(true);
    const p = calculatePercent(e);
    onSeek(p * duration);

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const p = calculatePercent(e);
      onSeek(p * duration);
      setHoverPercent(p);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchend', handlePointerUp);
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('touchmove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchend', handlePointerUp);
  };

  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (isDragging) return;
    const p = calculatePercent(e);
    setHoverPercent(p);
  };

  const handleMouseLeave = () => {
    if (!isDragging) setHoverPercent(null);
  };

  const currentPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const formatPreviewTime = (p: number) => {
    const s = p * duration;
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className="relative w-full h-8 flex items-center group cursor-pointer"
      onMouseDown={handlePointerDown}
      onTouchStart={handlePointerDown}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div ref={progressRef} className="relative w-full h-1.5 bg-white/20 rounded-full transition-all duration-300 group-hover:h-2.5">
        
        {/* Buffered */}
        {buffered.map((range, i) => (
          <div 
            key={i}
            className="absolute top-0 bottom-0 bg-white/30 rounded-full pointer-events-none"
            style={{ 
              left: `${(range.start / duration) * 100}%`,
              width: `${((range.end - range.start) / duration) * 100}%` 
            }} 
          />
        ))}

        {/* Current Progress */}
        <div 
          className="absolute top-0 bottom-0 left-0 bg-cyan-primary rounded-full shadow-[0_0_10px_rgba(0,217,255,0.6)] pointer-events-none"
          style={{ width: `${currentPercent}%` }}
        >
          {/* Thumb */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_#00d9ff] scale-0 group-hover:scale-100 transition-transform duration-200" />
        </div>

        {/* Hover Preview Timeline */}
        {hoverPercent !== null && (
          <div 
            className="absolute top-0 bottom-0 bg-white/20 pointer-events-none"
            style={{ left: 0, width: `${hoverPercent * 100}%` }}
          />
        )}

        {/* Markers */}
        <TimelineMarkers markers={markers} duration={duration} onSeek={onSeek} />

        {/* Hover Tooltip Preview */}
        {hoverPercent !== null && duration > 0 && (
          <div 
            className="absolute bottom-full mb-3 -translate-x-1/2 bg-black/80 backdrop-blur text-white text-xs font-mono px-2 py-1 rounded border border-white/10 pointer-events-none z-40"
            style={{ left: `${hoverPercent * 100}%` }}
          >
            {formatPreviewTime(hoverPercent)}
          </div>
        )}
      </div>
    </div>
  );
};
