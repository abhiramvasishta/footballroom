import { Volume1, Volume2, VolumeX } from 'lucide-react';
import { useState } from 'react';

interface Props {
  volume: number;
  isMuted: boolean;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
}

export const VolumeControl = ({ volume, isMuted, onVolumeChange, onToggleMute }: Props) => {
  const [isHovered, setIsHovered] = useState(false);

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeX className="w-5 h-5 text-white" />;
    if (volume < 0.5) return <Volume1 className="w-5 h-5 text-white" />;
    return <Volume2 className="w-5 h-5 text-white" />;
  };

  return (
    <div 
      className="flex items-center gap-2 relative group h-8"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button 
        onClick={onToggleMute}
        className="p-1.5 hover:bg-white/10 rounded-full transition-colors flex items-center justify-center"
      >
        {getVolumeIcon()}
      </button>
      
      <div 
        className={`flex items-center transition-all duration-300 overflow-hidden ${isHovered ? 'w-20 opacity-100' : 'w-0 opacity-0'}`}
      >
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={isMuted ? 0 : volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer accent-cyan-primary outline-none"
        />
      </div>
    </div>
  );
};
