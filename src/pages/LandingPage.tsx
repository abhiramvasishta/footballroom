import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, UserCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { AnimatedTransition } from '../components/AnimatedTransition';
import { recoverUser, fetchSettings } from '../lib/services';
import type { TournamentSettings } from '../types';
import { useUserStore } from '../store/useUserStore';

export default function LandingPage() {
  const navigate = useNavigate();
  const setEntryId = useUserStore((state) => state.setEntryId);
  const setHasSubmitted = useUserStore((state) => state.setHasSubmitted);
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<TournamentSettings | null>(null);

  useEffect(() => {
    fetchSettings().then(setSettings);
  }, []);

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryCode.trim()) return;
    
    setLoading(true);
    setError('');
    
    const user = await recoverUser(recoveryCode.trim().toUpperCase());
    
    if (user) {
      const hasSub = !!user.submittedAt;
      setHasSubmitted(hasSub);
      setEntryId(user.entryId);
      navigate(hasSub ? '/dashboard' : '/predict');
    } else {
      setError('Invalid Recovery Code. Please try again.');
    }
    
    setLoading(false);
  };

  return (
    <AnimatedTransition className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan-primary/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-card-hover/50 rounded-full blur-[120px]" />
      
      <div className="z-10 w-full max-w-md flex flex-col items-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          transition={{ delay: 0.2, type: 'spring' }}
          className="w-48 h-56 mb-8 flex items-center justify-center"
        >
          <img 
            src="/logo.webp" 
            alt="FIFA World Cup 2026 Logo" 
            className="w-full h-full object-contain"
          />
        </motion.div>

        <h1 className="text-5xl md:text-6xl font-bold font-display text-center mb-2 leading-tight tracking-wider text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
          THE FOOTBALL ROOM
        </h1>
        <h2 className="text-cyan-primary text-center mb-6 text-sm md:text-base font-bold tracking-[0.3em] uppercase drop-shadow-[0_0_8px_rgba(0,217,255,0.5)]">
          World Cup 2026 Predictor
        </h2>
        
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-white text-center mb-10 text-base md:text-lg font-medium flex items-center justify-center gap-2 flex-wrap px-4"
        >
          ⚽ Gelisthe chivarlo <span className="text-cyan-primary animate-pulse drop-shadow-[0_0_8px_rgba(0,217,255,0.8)]">prize</span> untadhi mowaa! 🏆
        </motion.p>

        {!isRecovering ? (
          <div className="w-full space-y-4">
            {settings === null ? (
              <div className="w-full h-16 animate-pulse bg-white/10 rounded-xl"></div>
            ) : settings.registrationOpen ? (
              <button 
                onClick={() => navigate('/register')}
                className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-r from-cyan-primary to-cyan-secondary p-[2px] transition-all hover:shadow-[0_0_20px_rgba(0,217,255,0.3)]"
              >
                <div className="w-full flex items-center justify-center gap-2 bg-bg-primary px-8 py-4 rounded-[10px] transition-colors group-hover:bg-opacity-0 group-hover:text-navy-900">
                  <span className="font-bold text-lg">Start Prediction</span>
                  <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ) : (
              <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-center">
                <span className="text-red-400 font-bold">Registration Closed</span>
                <p className="text-sm text-text-secondary mt-1">New entries are no longer being accepted.</p>
              </div>
            )}
            
            <button 
              onClick={() => setIsRecovering(true)}
              className="w-full flex items-center justify-center gap-2 py-3 text-text-secondary hover:text-white transition-colors"
            >
              <UserCheck size={18} />
              <span>Recover My Prediction</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleRecover} className="w-full glass-card p-6 w-full space-y-4">
            <h3 className="text-xl font-bold text-center mb-2">Recover Access</h3>
            <p className="text-sm text-text-secondary text-center mb-4">Enter your 6-character recovery code.</p>
            
            <div>
              <input 
                type="text" 
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                placeholder="e.g. A1B2C3" 
                className="w-full bg-bg-primary border border-white/20 rounded-lg px-4 py-3 text-center text-xl tracking-widest uppercase focus:outline-none focus:border-cyan-primary transition-colors"
                maxLength={6}
              />
            </div>
            
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            
            <button 
              type="submit"
              disabled={loading || recoveryCode.length < 6}
              className="w-full bg-cyan-primary hover:bg-cyan-primary text-navy-900 font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Recovering...' : 'Recover Account'}
            </button>
            
            <button 
              type="button"
              onClick={() => setIsRecovering(false)}
              className="w-full text-sm text-text-secondary hover:text-white py-2"
            >
              Back to Start
            </button>
          </form>
        )}
      </div>
    </AnimatedTransition>
  );
}
