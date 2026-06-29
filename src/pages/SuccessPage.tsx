import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Copy, Download, ChevronRight, Trophy } from 'lucide-react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { AnimatedTransition } from '../components/AnimatedTransition';
import { useUserStore } from '../store/useUserStore';

export default function SuccessPage() {
  const navigate = useNavigate();
  const { entryId, recoveryCode, name } = useUserStore();
  const [copiedId, setCopiedId] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const { width, height } = useWindowSize();

  // If somehow they get here without entryId
  if (!entryId || !recoveryCode) {
    navigate('/');
    return null;
  }

  const handleCopyId = () => {
    navigator.clipboard.writeText(entryId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(recoveryCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownload = () => {
    const text = `Contest Name: THE FOOTBALL ROOM - World Cup 2026 Predictor\nParticipant Name: ${name || 'Anonymous'}\nEntry ID: ${entryId}\nRecovery Code: ${recoveryCode}\nSubmission Date & Time: ${new Date().toLocaleString()}\n`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fifa-prediction-recovery.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleContinue = () => {
    navigate('/dashboard');
  };

  return (
    <AnimatedTransition className="min-h-screen bg-bg-primary p-6 flex flex-col items-center justify-center relative overflow-hidden">
      <Confetti
        width={width}
        height={height}
        recycle={false}
        numberOfPieces={500}
        gravity={0.15}
        colors={['#00D9FF', '#FFF', '#112240', '#EF4444', '#3B82F6']}
      />

      <div className="w-full max-w-lg z-10">
        <div className="glass-card p-8 flex flex-col items-center text-center relative overflow-hidden border border-cyan-primary/30 shadow-[0_0_50px_rgba(0,217,255,0.15)]">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-primary/10 via-navy-900/0 to-navy-900/0 pointer-events-none" />

          <Trophy size={64} className="text-cyan-primary mb-6 drop-shadow-[0_0_15px_rgba(0,217,255,0.5)] animate-bounce" />
          <h1 className="text-3xl font-bold font-display mb-2 text-cyan-primary">Prediction Submitted Successfully!</h1>
          <p className="text-gray-300 mb-8 font-bold text-lg">Good Luck!</p>

          <div className="w-full bg-bg-primary/80 rounded-xl p-4 border border-[rgba(0,217,255,0.18)] mb-4 text-left">
            <span className="text-xs text-text-muted uppercase tracking-wider block mb-1">Entry ID</span>
            <div className="flex items-center justify-between gap-4">
              <code className="text-sm text-gray-300 font-mono truncate">{entryId}</code>
              <button onClick={handleCopyId} className="p-2 hover:bg-white/10 rounded transition-colors text-cyan-primary">
                {copiedId ? <span className="text-xs font-bold text-green-400">Copied!</span> : <Copy size={16} />}
              </button>
            </div>
          </div>

          <div className="w-full bg-bg-primary/80 rounded-xl p-4 border border-[rgba(0,217,255,0.18)] mb-8 text-left">
            <span className="text-xs text-text-muted uppercase tracking-wider block mb-1">Recovery Code</span>
            <div className="flex items-center justify-between gap-4">
              <code className="text-2xl text-cyan-primary font-mono tracking-widest">{recoveryCode}</code>
              <button onClick={handleCopyCode} className="p-2 hover:bg-white/10 rounded transition-colors text-cyan-primary">
                {copiedCode ? <span className="text-xs font-bold text-green-400">Copied!</span> : <Copy size={16} />}
              </button>
            </div>
          </div>

          <button
            onClick={handleDownload}
            className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors mb-8 border border-[rgba(0,217,255,0.18)]"
          >
            <Download size={18} />
            Download My Recovery Details
          </button>

          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl mb-6">
            <p className="text-red-200 text-sm font-bold flex items-start gap-2 text-left">
              <span>⚠️</span>
              Keep your Recovery Code safe. You will need it if you open the contest on another browser or another device.
            </p>
          </div>

          <label className="flex items-center gap-3 w-full text-left cursor-pointer mb-6 group">
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-6 h-6 rounded border ${acknowledged ? 'bg-cyan-primary border-cyan-primary' : 'border-gray-500 group-hover:border-cyan-primary'} flex items-center justify-center transition-colors`}>
                {acknowledged && <CheckCircle size={14} className="text-navy-900" />}
              </div>
            </div>
            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
              I have safely stored my recovery details.
            </span>
          </label>

          <button
            onClick={handleContinue}
            disabled={!acknowledged}
            className="w-full bg-gradient-to-r from-cyan-primary to-cyan-secondary hover:from-cyan-primary hover:to-cyan-secondary text-navy-900 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Continue to Dashboard</span>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </AnimatedTransition>
  );
}
