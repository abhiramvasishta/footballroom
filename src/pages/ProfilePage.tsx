import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Camera, Loader2, Share2, Copy, CheckCircle2, Eye, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { uploadProfilePhoto, cropAndResizeImage } from '../lib/cloudinary';
import { updateUserPhoto, fetchTeams, fetchMatches, getPredictionData } from '../lib/services';
import { useUserStore } from '../store/useUserStore';
import { ShareBracket, type ShareBracketRef } from '../components/ShareBracket';
import { AnimatedTransition } from '../components/AnimatedTransition';
import { goldenBallPlayers } from '../data/goldenBallPlayers';
import type { UserData, Team, Match, PredictionDoc } from '../types';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { entryId } = useUserStore();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [championTeam, setChampionTeam] = useState<Team | null>(null);
  const [predictionDoc, setPredictionDoc] = useState<PredictionDoc | null>(null);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPicks, setShowPicks] = useState(false);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const shareRef = useRef<ShareBracketRef>(null);



  useEffect(() => {
    if (!entryId) {
      navigate('/');
      return;
    }

    const loadStaticData = async () => {
      try {
        const [teams, matches, pred] = await Promise.all([
          fetchTeams(),
          fetchMatches(),
          getPredictionData(entryId)
        ]);
        setAllTeams(teams);
        setAllMatches(matches);
        setPredictionDoc(pred);
        if (pred?.predictedChampion) {
          setChampionTeam(teams.find(t => t.id === pred.predictedChampion) || null);
        }
      } catch (err) {
        console.error("Failed to load profile static data", err);
      }
    };
    
    loadStaticData();

    // Real-time listener for user data
    const unsubscribe = onSnapshot(doc(db, 'users', entryId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as UserData;
        setUserData(data);
        setCurrentPhoto(data.photoURL || null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [entryId, navigate]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processAndUploadFile(file);
    }
  };

  const processAndUploadFile = async (file: File) => {
    setError(null);
    setUploadSuccess(false);

    if (file.size > 5 * 1024 * 1024) {
      setError('File is too large. Maximum size is 5MB.');
      return;
    }
    
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
      setError('Unsupported format. Please use JPG, PNG, or WebP.');
      return;
    }

    setIsUploading(true);
    try {
      const processedBlob = await cropAndResizeImage(file);
      const processedFile = new File([processedBlob], 'profile.jpg', { type: 'image/jpeg' });
      const secureUrl = await uploadProfilePhoto(processedFile);
      
      if (entryId) {
        await updateUserPhoto(entryId, secureUrl);
      }
      
      setCurrentPhoto(secureUrl);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = async () => {
    if (!entryId) return;
    setIsUploading(true);
    try {
      await updateUserPhoto(entryId, '');
      setCurrentPhoto(null);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err: any) {
      setError('Failed to remove photo.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopyCode = () => {
    if (userData) {
      navigator.clipboard.writeText(userData.recoveryCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (shareRef.current) {
      setIsSharing(true);
      try {
        await shareRef.current.generateAndShare();
      } catch (err) {
        console.error("Profile handleShare caught error:", err);
      } finally {
        setIsSharing(false);
      }
    }
  };

  if (loading || !userData) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-primary"></div>
      </div>
    );
  }

  // Get Avatar initials
  const initials = userData.name.charAt(0).toUpperCase();

  const mvpPlayer = predictionDoc?.goldenBallPlayerId 
    ? goldenBallPlayers.find(p => p.id === predictionDoc.goldenBallPlayerId)
    : null;

  const getTeamName = (teamId: string) => allTeams.find(t => t.id === teamId)?.name || teamId;

  return (
    <AnimatedTransition className="min-h-screen bg-bg-primary text-text-primary p-4 md:p-8 pb-24">
      <div className="max-w-4xl mx-auto flex flex-col gap-8 mt-12 md:mt-4">
        
        {/* Profile Header & Edit */}
        <div className="glass-card p-6 md:p-10 border-[rgba(0,217,255,0.18)] flex flex-col items-center">
          <div className="relative group mb-6">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-bg-secondary bg-bg-tertiary flex items-center justify-center relative">
              {currentPhoto ? (
                <img 
                  src={currentPhoto} 
                  alt={userData.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-5xl font-display font-bold text-cyan-primary/50">{initials}</span>
              )}
              
              {isUploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-cyan-primary animate-spin" />
                </div>
              )}
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute bottom-0 right-0 p-3 bg-cyan-primary text-navy-900 rounded-full hover:bg-white transition-all shadow-[0_0_15px_rgba(0,217,255,0.3)] disabled:opacity-50 group-hover:scale-110"
              title="Change photo"
            >
              <Camera size={20} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/jpeg,image/png,image/webp,image/jpg"
              className="hidden"
            />
          </div>

          <h1 className="text-3xl font-display font-bold text-white mb-2">{userData.name}</h1>

          {currentPhoto && (
            <button
              onClick={handleRemovePhoto}
              disabled={isUploading}
              className="mt-4 flex items-center gap-2 text-sm text-red-500 hover:text-red-400 transition-colors bg-red-500/10 px-4 py-2 rounded-lg"
            >
              <Trash2 size={16} />
              Remove Photo
            </button>
          )}

          <AnimatePresence>
            {error && (
              <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-red-500 text-sm mt-4 text-center">
                {error}
              </motion.p>
            )}
            {uploadSuccess && (
              <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-green-500 text-sm mt-4 flex items-center justify-center gap-2">
                <CheckCircle2 size={16} /> Photo updated successfully
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          <div className="glass-card p-6 flex flex-col items-center justify-center text-center gap-2 border-[rgba(0,217,255,0.18)] group relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-cyan-primary/10 rounded-full blur-xl group-hover:bg-cyan-primary/20 transition-colors" />
            <span className="text-4xl font-bold font-mono text-white group-hover:text-cyan-primary transition-colors relative z-10">{userData.score || 0}</span>
            <span className="text-xs text-text-secondary uppercase tracking-widest font-semibold mt-1 relative z-10">Total Score</span>
          </div>
          
          <div className="glass-card p-6 flex flex-col items-center justify-center text-center gap-2 border-[rgba(0,217,255,0.18)] group relative overflow-hidden">
            <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-colors" />
            <span className="text-4xl font-bold font-mono text-white group-hover:text-blue-400 transition-colors relative z-10">{userData.accuracy || 0}%</span>
            <span className="text-xs text-text-secondary uppercase tracking-widest font-semibold mt-1 relative z-10">Accuracy</span>
          </div>
          
          <div className="glass-card p-4 md:p-6 flex flex-col items-center justify-center text-center gap-2 border-[rgba(0,217,255,0.18)] group">
            <div className="flex gap-4 items-center">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold font-mono text-status-success">{userData.correctPicks || 0}</span>
                <span className="text-[10px] text-text-secondary uppercase mt-1">Won</span>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold font-mono text-status-danger">{userData.wrongPicks || 0}</span>
                <span className="text-[10px] text-text-secondary uppercase mt-1">Lost</span>
              </div>
            </div>
            
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-2">
              <div 
                className="h-full bg-gradient-to-r from-status-success to-status-success" 
                style={{ width: `${((userData.correctPicks || 0) / Math.max(1, (userData.correctPicks || 0) + (userData.wrongPicks || 0))) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-text-secondary uppercase tracking-widest font-semibold mt-1">Win Rate</span>
          </div>

          <div className="glass-card relative overflow-hidden p-6 flex flex-col items-center justify-center text-center gap-2 border-[#e5b969]/30 group hover:border-[#e5b969]/60 transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-[#e5b969]/10 to-transparent pointer-events-none" />
            {mvpPlayer ? (
              <div className="flex flex-col items-center gap-2 relative z-10">
                <div className="w-20 h-20 md:w-20 md:h-20 rounded-full p-1 bg-gradient-to-b from-[#e5b969] to-[#b08d57]">
                  <img src={mvpPlayer.photoUrl || mvpPlayer.flagUrl} alt={mvpPlayer.name} className="w-full h-full object-cover rounded-full border-2 border-bg-primary bg-bg-secondary" />
                </div>
                <span className="font-bold text-white uppercase tracking-wider text-base md:text-lg mt-2">{mvpPlayer.name}</span>
              </div>
            ) : (
              <span className="text-2xl font-bold text-white relative z-10">-</span>
            )}
            <span className="text-xs text-[#e5b969] uppercase tracking-widest font-black mt-2 relative z-10">MVP (Golden Ball)</span>
          </div>
          
          <div className="glass-card relative overflow-hidden p-6 flex flex-col items-center justify-center text-center gap-2 border-[#e5b969]/30 group hover:border-[#e5b969]/60 transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-[#e5b969]/10 to-transparent pointer-events-none" />
            {championTeam ? (
              <div className="flex flex-col items-center gap-2 relative z-10">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full p-1 bg-gradient-to-b from-[#e5b969] to-[#b08d57]">
                  <img src={championTeam.flagUrl} alt={championTeam.id} className="w-full h-full object-cover rounded-full border-2 border-bg-primary" />
                </div>
                <span className="font-bold text-white uppercase tracking-wider">{championTeam.id}</span>
              </div>
            ) : (
              <span className="text-2xl font-bold text-white relative z-10">-</span>
            )}
            <span className="text-xs text-[#e5b969] uppercase tracking-widest font-black mt-2 relative z-10">Champion</span>
          </div>

          <button
            onClick={() => setShowPicks(true)}
            className="glass-card relative overflow-hidden p-6 flex flex-col items-center justify-center text-center gap-2 border-cyan-primary/30 group hover:border-cyan-primary/60 transition-all cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-primary/10 to-transparent pointer-events-none" />
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-cyan-primary/20 text-cyan-primary group-hover:scale-110 transition-transform relative z-10">
              <Eye size={24} />
            </div>
            <span className="font-bold text-white uppercase tracking-wider mt-2 relative z-10">View My Picks</span>
            <span className="text-[10px] text-text-secondary uppercase tracking-widest font-semibold mt-1 relative z-10">See your bracket</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recovery Code Card */}
          <div className="glass-card p-6 border-[rgba(0,217,255,0.18)] flex flex-col items-center justify-center text-center">
            <h3 className="font-bold text-white mb-2">Recovery Code</h3>
            <p className="text-sm text-text-secondary mb-4">
              Save this code to recover your account if you clear your browser data.
            </p>
            <div className="bg-bg-tertiary p-4 rounded-xl flex items-center justify-between gap-4 w-full border border-white/5">
              <code className="text-cyan-primary font-mono text-lg font-bold tracking-widest truncate">
                {userData.recoveryCode}
              </code>
              <button
                onClick={handleCopyCode}
                className={`p-2 rounded-lg transition-all ${copied ? 'bg-green-500/20 text-green-500' : 'bg-white/5 text-text-secondary hover:text-white hover:bg-white/10'}`}
                title="Copy code"
              >
                {copied ? <CheckCircle2 size={20} /> : <Copy size={20} />}
              </button>
            </div>
          </div>

          {/* Share Actions Card */}
          <div className="glass-card p-6 border-[rgba(0,217,255,0.18)] flex flex-col items-center justify-center text-center">
            <h3 className="font-bold text-white mb-2">Share Predictions</h3>
            <p className="text-sm text-text-secondary mb-4">
              Generate an image of your predictions to share with friends!
            </p>
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-cyan-primary text-navy-900 rounded-xl font-bold hover:bg-white transition-all shadow-[0_0_20px_rgba(0,217,255,0.2)] hover:shadow-[0_0_30px_rgba(0,217,255,0.4)] hover:scale-[1.02]"
            >
              {isSharing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Generating Image...</span>
                </>
              ) : (
                <>
                  <Share2 className="w-5 h-5" />
                  <span>Share Predictions</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
      
      {/* Hidden ShareBracket component for image generation */}
      <div className="absolute top-0 left-[-9999px] opacity-0 pointer-events-none">
        <ShareBracket ref={shareRef} user={{ name: userData.name, photoURL: currentPhoto }} picks={predictionDoc?.picks} goldenBallPlayerId={predictionDoc?.goldenBallPlayerId} championId={predictionDoc?.predictedChampion} />
      </div>

      {/* View My Picks Modal */}
      <AnimatePresence>
        {showPicks && predictionDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowPicks(false)}
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
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-bg-primary border border-cyan-primary/50 flex items-center justify-center">
                    {currentPhoto ? (
                      <img src={currentPhoto} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-bold text-cyan-primary text-lg">{initials}</span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <h3 className="font-bold text-white text-lg">{userData.name}'s Predictions</h3>
                    <span className="text-xs text-text-secondary">Score: {userData.score} | Accuracy: {userData.accuracy}%</span>
                  </div>
                </div>
                <button onClick={() => setShowPicks(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                  <X size={20} className="text-white" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
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
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatedTransition>
  );
}
