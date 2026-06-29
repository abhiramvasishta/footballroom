import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Edit2, Trophy } from 'lucide-react';
import { AnimatedTransition } from '../components/AnimatedTransition';

import { usePredictionStore } from '../store/usePredictionStore';
import { useUserStore } from '../store/useUserStore';
import { saveUserToFirebase, getUserData } from '../lib/services';
import { goldenBallPlayers } from '../data/goldenBallPlayers';

export default function ReviewPage() {
  const navigate = useNavigate();
  const store = usePredictionStore();
  const { entryId, name, avatar, recoveryCode } = useUserStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [photoURL, setPhotoURL] = useState<string | undefined>();
  useEffect(() => {
    if (entryId) {
      getUserData(entryId).then(u => {
        if (u?.photoURL) setPhotoURL(u.photoURL);
      });
    }
  }, [entryId]);

  const championId = store.champion;
  const championTeam = store.teams.find(t => t.id === championId);

  const goldenBallId = store.goldenBallPlayerId;
  const goldenBallPlayer = goldenBallPlayers.find(p => p.id === goldenBallId);

  const handleSubmit = async () => {
    if (!entryId) return;
    
    if (!window.confirm("Are you ready to submit your predictions?")) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Save Predictions
      await store.submitBracket(entryId);

      // Save User Data (marks as submitted)
      const currentUser = await getUserData(entryId);
      if (currentUser) {
        await saveUserToFirebase({
          ...currentUser,
          submittedAt: new Date().toISOString()
        });
      } else {
        await saveUserToFirebase({
          entryId,
          name: name || 'Anonymous',
          avatar: avatar,
          photoURL: photoURL ?? null,
          recoveryCode: recoveryCode || '',
          score: 0,
          accuracy: 0,
          correctPicks: 0,
          wrongPicks: 0,
          maxPossible: 120,
          status: 'Still Alive',
          rank: 0,
          submittedAt: new Date().toISOString()
        });
      }
      
      // Update local store
      useUserStore.getState().setHasSubmitted(true);
      
      navigate('/success');
    } catch (err) {
      setError('Failed to submit predictions. Please try again.');
      setIsSubmitting(false);
    }
  };


  return (
    <AnimatedTransition className="min-h-screen bg-bg-primary p-6 pt-12 pb-24 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-1 font-display text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">Review Your Bracket</h1>
          <p className="text-text-secondary font-medium tracking-wide uppercase text-xs">Double check your picks before finalizing.</p>
        </div>

        <div className="glass-card p-6 flex flex-col items-center mb-4 relative overflow-hidden border border-cyan-primary/30 shadow-[0_0_40px_rgba(0,217,255,0.1)]">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-primary/10 via-transparent to-transparent pointer-events-none" />
          
          <Trophy size={48} className="text-cyan-primary mb-4 drop-shadow-[0_0_20px_rgba(0,217,255,0.6)]" strokeWidth={1.5} />
          <h2 className="text-xs text-text-secondary mb-3 uppercase tracking-widest font-bold">Predicted Champion</h2>
          <div className="w-24 h-16 md:w-32 md:h-20 shadow-[0_0_30px_rgba(0,217,255,0.3)] border-2 border-cyan-primary rounded-xl overflow-hidden mb-4 relative">
            <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] pointer-events-none" />
            {championTeam ? (
              <img src={championTeam.flagUrl} alt={`${championTeam.name} flag`} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-bg-secondary flex items-center justify-center text-text-muted font-bold text-xl">?</div>
            )}
          </div>
          <h3 className="text-3xl font-bold font-display text-white tracking-wider">{championTeam?.name || championId || 'None'}</h3>
        </div>

        {goldenBallPlayer && (
          <div className="glass-card p-6 flex flex-col items-center mb-6 relative overflow-hidden border border-cyan-primary/30 shadow-[0_0_40px_rgba(0,217,255,0.1)]">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-primary/10 via-transparent to-transparent pointer-events-none" />
            <span className="text-2xl mb-3 drop-shadow-[0_0_10px_rgba(255,215,0,0.6)]">⭐</span>
            <h2 className="text-xs text-text-secondary mb-3 uppercase tracking-widest font-bold text-center">Player of the Tournament</h2>
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full shadow-[0_0_30px_rgba(0,217,255,0.3)] border-2 border-cyan-primary overflow-hidden mb-4 relative bg-navy-900">
              <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] pointer-events-none z-10" />
              <img 
                src={goldenBallPlayer.photoUrl} 
                alt={goldenBallPlayer.name} 
                className="w-full h-full object-cover mix-blend-screen opacity-90" 
                crossOrigin="anonymous" 
                onError={(e) => { e.currentTarget.src = '/silhouette.svg'; e.currentTarget.onerror = null; }}
              />
            </div>
            <h3 className="text-2xl font-bold font-display text-white tracking-wider text-center mb-2">{goldenBallPlayer.name}</h3>
            <div className="flex items-center gap-2 mt-1 px-4 py-1 bg-white/5 rounded-full border border-white/10">
              <img src={goldenBallPlayer.flagUrl} alt={goldenBallPlayer.countryName} className="w-4 h-3 object-cover rounded-[2px]" crossOrigin="anonymous" />
              <span className="text-xs text-text-secondary uppercase tracking-wider font-bold">{goldenBallPlayer.countryName}</span>
            </div>
          </div>
        )}

        {error && <p className="text-status-danger text-center mb-6 font-bold bg-status-danger/10 p-3 rounded-lg border border-status-danger/20">{error}</p>}


        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={() => {
              navigate('/predict');
            }}
            className="flex-1 glass-card p-4 rounded-xl flex items-center justify-center gap-2 hover:bg-white/5 transition-colors border-[rgba(255,255,255,0.1)] text-text-primary font-bold uppercase tracking-widest text-sm"
          >
            <Edit2 size={18} />
            <span>Edit Predictions</span>
          </button>
          
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 bg-cyan-primary text-navy-900 font-bold p-4 rounded-xl flex items-center justify-center gap-2 hover:shadow-[0_0_25px_rgba(0,217,255,0.4)] hover:scale-[1.02] transition-all disabled:opacity-50 uppercase tracking-widest text-sm"
          >
            {isSubmitting ? 'Submitting...' : (
              <>
                <CheckCircle size={20} />
                <span>Confirm Submission</span>
              </>
            )}
          </button>
        </div>
      </div>


    </AnimatedTransition>
  );
}
