import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { goldenBallPlayers } from '../data/goldenBallPlayers';
import type { Team, Match, PredictionDoc, UserData } from '../types';
import { getPredictionData } from '../lib/services';

interface Props {
  user: UserData | null;
  isOpen: boolean;
  onClose: () => void;
  allMatches: Match[];
  allTeams: Team[];
}

export const UserPicksModal = ({ user, isOpen, onClose, allMatches, allTeams }: Props) => {
  const [predictionDoc, setPredictionDoc] = useState<PredictionDoc | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFullscreenPhoto, setIsFullscreenPhoto] = useState(false);

  useEffect(() => {
    if (isOpen && user?.entryId) {
      setLoading(true);
      getPredictionData(user.entryId)
        .then(doc => {
          setPredictionDoc(doc);
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to load user predictions", err);
          setLoading(false);
        });
    }
  }, [isOpen, user?.entryId]);

  if (!isOpen || !user) return null;

  const getTeamName = (teamId: string) => allTeams.find(t => t.id === teamId)?.name || teamId;
  const initials = user.name.charAt(0).toUpperCase();

  const mvpPlayer = predictionDoc?.goldenBallPlayerId 
    ? goldenBallPlayers.find(p => p.id === predictionDoc.goldenBallPlayerId)
    : null;

  // Calculate Analysis Stats
  const correctPicks = predictionDoc ? Object.entries(predictionDoc.picks).filter(([matchId, winnerId]) => {
    const match = allMatches.find(m => m.id === matchId);
    return match && match.completed && match.winnerTeamId === winnerId;
  }).length : 0;

  const wrongPicks = predictionDoc ? Object.entries(predictionDoc.picks).filter(([matchId, winnerId]) => {
    const match = allMatches.find(m => m.id === matchId);
    return match && match.completed && match.winnerTeamId && match.winnerTeamId !== winnerId;
  }).length : 0;

  const pendingPicks = predictionDoc ? Object.entries(predictionDoc.picks).filter(([matchId]) => {
    const match = allMatches.find(m => m.id === matchId);
    return match && !match.completed;
  }).length : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-bg-primary border border-cyan-primary/30 rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(0,217,255,0.1)] overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-white/10 bg-bg-secondary shrink-0">
            <div className="flex items-center gap-4">
              <div 
                className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden bg-bg-primary border-2 border-cyan-primary flex items-center justify-center relative shadow-[0_0_15px_rgba(0,217,255,0.3)] cursor-pointer group hover:scale-105 transition-transform"
                onClick={() => {
                  if (user.photoURL) {
                    setIsFullscreenPhoto(true);
                  } else {
                    toast('No profile photo', { icon: '⚠️', style: { borderRadius: '10px', background: '#1a202c', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } });
                  }
                }}
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-full h-full object-cover group-hover:opacity-90 transition-opacity" />
                ) : (
                  <span className="font-bold text-cyan-primary text-2xl md:text-3xl">{initials}</span>
                )}
              </div>
              <div className="flex flex-col">
                <h3 className="font-bold text-white text-xl md:text-2xl">{user.name}</h3>
                <span className="text-sm text-cyan-primary/80 font-mono tracking-widest mt-1">SCORE: {user.score} | ACCURACY: {user.accuracy}%</span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors self-start">
              <X size={20} className="text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-primary"></div>
              </div>
            ) : predictionDoc ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-bg-secondary p-4 rounded-lg border border-cyan-primary/20 flex flex-col items-center justify-center text-center">
                    <span className="text-xs uppercase tracking-widest text-text-secondary font-bold mb-1">Predicted Champion</span>
                    <span className="text-xl font-display font-bold text-cyan-primary drop-shadow-[0_0_8px_rgba(0,217,255,0.5)]">
                      {predictionDoc.predictedChampion ? getTeamName(predictionDoc.predictedChampion) : 'Not Selected'}
                    </span>
                  </div>
                  <div className="bg-bg-secondary p-4 rounded-lg border border-[#d4af37]/30 flex flex-col items-center justify-center text-center">
                    <span className="text-xs uppercase tracking-widest text-text-secondary font-bold mb-1">Golden Ball Winner</span>
                    <span className="text-lg font-bold text-[#d4af37] drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]">
                      {mvpPlayer ? mvpPlayer.name : 'Not Selected'}
                    </span>
                  </div>
                </div>

                {/* Prediction Analysis Stats */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-bg-secondary p-3 rounded-lg border border-green-500/20 flex flex-col items-center text-center">
                    <span className="text-[10px] uppercase tracking-widest text-text-secondary font-bold mb-1">Correct</span>
                    <span className="text-xl font-bold text-green-400">{correctPicks}</span>
                  </div>
                  <div className="bg-bg-secondary p-3 rounded-lg border border-red-500/20 flex flex-col items-center text-center">
                    <span className="text-[10px] uppercase tracking-widest text-text-secondary font-bold mb-1">Wrong</span>
                    <span className="text-xl font-bold text-red-400">{wrongPicks}</span>
                  </div>
                  <div className="bg-bg-secondary p-3 rounded-lg border border-blue-500/20 flex flex-col items-center text-center">
                    <span className="text-[10px] uppercase tracking-widest text-text-secondary font-bold mb-1">Pending</span>
                    <span className="text-xl font-bold text-blue-400">{pendingPicks}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold uppercase tracking-widest text-text-secondary mb-3 border-b border-white/10 pb-2">Match Picks</h4>
                  <div className="space-y-2">
                    {allMatches
                      .sort((a, b) => {
                        const roundOrder: Record<string, number> = { 'Round of 32': 1, 'Round of 16': 2, 'Quarter Finals': 3, 'Semi Finals': 4, 'Third Place': 5, 'Final': 6 };
                        return (roundOrder[a.round] || 0) - (roundOrder[b.round] || 0);
                      })
                      .map(match => {
                        const predictedWinnerId = predictionDoc.picks[match.id];
                        if (!predictedWinnerId) return null;
                        const isCorrect = match.completed && match.winnerTeamId === predictedWinnerId;
                        const isWrong = match.completed && match.winnerTeamId && match.winnerTeamId !== predictedWinnerId;

                        return (
                          <div key={match.id} className={`flex justify-between items-center p-3 rounded-lg border text-sm ${
                            isCorrect ? 'bg-green-500/10 border-green-500/30' : isWrong ? 'bg-red-500/10 border-red-500/30' : 'bg-white/5 border-white/5'
                          }`}>
                            <span className="font-mono text-cyan-primary/70 text-xs w-12 shrink-0">{match.id}</span>
                            <span className="text-text-secondary flex-1 text-xs truncate">
                              {getTeamName(match.homeTeamId || '?')} <span className="mx-1 text-xs opacity-50">vs</span> {getTeamName(match.awayTeamId || '?')}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] text-text-muted">Picked:</span>
                              <span className={`font-bold text-xs px-2 py-1 rounded ${
                                isCorrect ? 'text-green-400 bg-green-500/20' : isWrong ? 'text-red-400 bg-red-500/20' : 'text-white bg-white/10'
                              }`}>
                                {getTeamName(predictedWinnerId)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    {Object.keys(predictionDoc.picks).length === 0 && (
                      <p className="text-text-secondary text-sm italic">No individual match picks found.</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-text-secondary text-center p-8">No prediction data found.</p>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Fullscreen Photo Modal */}
      <AnimatePresence>
        {isFullscreenPhoto && user?.photoURL && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl"
            onClick={() => setIsFullscreenPhoto(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-3xl max-h-[90vh] flex flex-col items-center gap-4"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setIsFullscreenPhoto(false)}
                className="absolute -top-12 right-0 p-2 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
              <img 
                src={user.photoURL} 
                alt={user.name} 
                className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-[0_0_50px_rgba(0,217,255,0.2)] border border-white/10" 
              />
              <h3 className="text-2xl font-display font-bold text-white tracking-widest uppercase">{user.name}</h3>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
};
