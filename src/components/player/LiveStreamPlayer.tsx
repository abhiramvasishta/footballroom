import { useState, useEffect } from 'react';
import { Video, AlertTriangle } from 'lucide-react';
import { parseIframeEmbedCode } from '../../utils/iframeParser';
import type { ParsedIframe } from '../../utils/iframeParser';

interface Stream {
  id: string;
  name: string;
  embedCode: string;
  enabled: boolean;
}

interface Props {
  streams: Stream[];
}

export const LiveStreamPlayer = ({ streams }: Props) => {
  const [activeStreamId, setActiveStreamId] = useState<string>('');
  const [hasError, setHasError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize selected stream from localStorage or default to first
  useEffect(() => {
    if (streams.length === 0) return;

    const savedId = localStorage.getItem('lastLiveStreamId');
    const streamExists = streams.some(s => s.id === savedId && s.enabled);
    
    if (streamExists && savedId) {
      setActiveStreamId(savedId);
    } else {
      const firstEnabled = streams.find(s => s.enabled);
      if (firstEnabled) {
        setActiveStreamId(firstEnabled.id);
      }
    }
  }, [streams]);

  const activeStream = streams.find(s => s.id === activeStreamId);
  let parsed: ParsedIframe | null = null;
  
  if (activeStream?.embedCode) {
    parsed = parseIframeEmbedCode(activeStream.embedCode);
  }

  const handleSwitchStream = (id: string) => {
    setActiveStreamId(id);
    setHasError(false);
    setLoading(true);
    localStorage.setItem('lastLiveStreamId', id);
  };

  const handleIframeLoad = () => {
    setLoading(false);
  };

  const handleIframeError = () => {
    setLoading(false);
    setHasError(true);
  };

  const enabledStreams = streams.filter(s => s.enabled);

  if (enabledStreams.length === 0) {
    return (
      <div className="w-full aspect-video bg-black/50 rounded-xl flex items-center justify-center border border-white/10">
        <div className="text-center text-text-secondary">
          <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No streams available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="w-full aspect-video bg-black rounded-xl overflow-hidden relative border border-white/10 shadow-2xl">
        {/* Loading State */}
        {loading && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-primary"></div>
          </div>
        )}

        {/* Error State */}
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 text-center p-6">
            <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Stream Unavailable</h3>
            <p className="text-text-secondary text-sm max-w-md">
              This stream failed to load. The provider may have blocked it, or it may be temporarily offline. Please try another stream if available.
            </p>
          </div>
        )}

        {/* Player */}
        {parsed ? (
          <iframe
            src={parsed.src}
            className="w-full h-full border-0 absolute inset-0"
            allow={parsed.allow || undefined}
            allowFullScreen={parsed.allowFullScreen}
            sandbox={parsed.sandbox || undefined}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            title={activeStream?.name || "Live Stream"}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-20 text-center p-6">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
            <p className="text-white">Invalid stream configuration.</p>
          </div>
        )}
      </div>

      {/* Stream Selection */}
      {enabledStreams.length > 1 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {enabledStreams.map((stream) => (
            <button
              key={stream.id}
              onClick={() => handleSwitchStream(stream.id)}
              className={`px-6 py-2.5 rounded-lg font-bold text-sm tracking-wide transition-all ${
                activeStreamId === stream.id
                  ? 'bg-cyan-primary text-navy-900 shadow-[0_0_15px_rgba(0,217,255,0.3)]'
                  : 'bg-white/5 text-text-secondary hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              {stream.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
