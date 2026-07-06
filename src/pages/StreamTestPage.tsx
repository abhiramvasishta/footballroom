import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function StreamTestPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-5xl flex flex-col gap-4">
        <button 
          onClick={() => navigate('/')}
          className="self-start flex items-center gap-2 text-text-secondary hover:text-white transition-colors py-2 px-4 bg-white/5 rounded-lg hover:bg-white/10"
        >
          <ArrowLeft size={20} />
          <span>Back to Home</span>
        </button>

        <div className="w-full aspect-video bg-black rounded-xl overflow-hidden border border-white/10 shadow-2xl relative">
          <iframe
            src="https://dlhd.st/stream/stream-111.php"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            allow="autoplay; fullscreen"
            title="Stream Test"
          ></iframe>
        </div>
      </div>
    </div>
  );
}
