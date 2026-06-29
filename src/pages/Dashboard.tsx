import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Trophy, Share2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AnimatedTransition } from '../components/AnimatedTransition';
import { LeaderboardOverlay } from '../components/LeaderboardOverlay';
import { ProfileModal } from '../components/ProfileModal';
import { NextMatchCountdown } from '../components/NextMatchCountdown';
import { ShareBracket, type ShareBracketRef } from '../components/ShareBracket';

import { CardSkeleton, Skeleton } from '../components/Skeleton';
import { useUserStore } from '../store/useUserStore';
import { getPredictionData, fetchTeams, fetchMatches } from '../lib/services';
import type { UserData, Team, Match } from '../types';
import { goldenBallPlayers } from '../data/goldenBallPlayers';

export default function Dashboard() {
  const navigate = useNavigate();
  const { entryId } = useUserStore();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [championTeam, setChampionTeam] = useState<Team | null>(null);
  const [goldenBallPlayerId, setGoldenBallPlayerId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const [predictionsCount, setPredictionsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isSharing, setIsSharing] = useState(false);
  const shareRef = useRef<ShareBracketRef>(null);
  const TOTAL_MATCHES = 32;

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
        
        setTeams(teams);
        setMatches(matches);

        if (pred?.predictedChampion) {
          setChampionTeam(teams.find(t => t.id === pred.predictedChampion) || null);
        }
        
        if (pred?.goldenBallPlayerId) {
          setGoldenBallPlayerId(pred.goldenBallPlayerId);
        }
        
        if (pred?.picks) {
          setPicks(pred.picks);
          setPredictionsCount(Object.keys(pred.picks).length);
        }
      } catch (err) {
        console.error("Failed to load dashboard static data", err);
      }
    };
    
    loadStaticData();

    // Real-time listener for user data (live scoring)
    const unsubscribe = onSnapshot(doc(db, 'users', entryId), (docSnap) => {
      if (docSnap.exists()) {
        setUserData(docSnap.data() as UserData);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [entryId, navigate]);

  const handleCopyCode = () => {
    if (userData) {
      navigator.clipboard.writeText(userData.recoveryCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    console.log("Share button clicked");
    if (shareRef.current) {
      console.log("shareRef.current is valid, invoking generateAndShare()");
      setIsSharing(true);
      try {
        await shareRef.current.generateAndShare();
      } catch (err) {
        console.error("Dashboard handleShare caught error:", err);
      } finally {
        setIsSharing(false);
      }
    } else {
      console.error("shareRef.current is null!");
    }
  };

  if (loading || !userData) {
    return (
      <AnimatedTransition className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-6 pt-20">
        <div className="flex justify-between items-center glass-card p-6 border-cyan-primary/20">
          <div>
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-8 w-48" />
          </div>
          <Skeleton className="w-16 h-16 rounded-full" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </AnimatedTransition>
    );
  }

  const progressPercent = Math.min(Math.round((predictionsCount / TOTAL_MATCHES) * 100), 100);

  return (
    <AnimatedTransition className="min-h-screen bg-bg-primary text-text-primary p-4 md:p-8 pb-24">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        
        {/* Top Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Welcome Card */}
          <div className="glass-card p-8 flex flex-col items-center justify-start text-center relative overflow-hidden group col-span-1 lg:col-span-2 border-[rgba(0,217,255,0.18)] lg:min-h-[340px]">
            <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-cyan-primary/10 rounded-full blur-[80px] pointer-events-none transition-all group-hover:bg-cyan-primary/20" />
            
            <button 
              onClick={() => setIsProfileOpen(true)}
              className="w-24 h-24 rounded-full bg-bg-secondary flex items-center justify-center text-4xl shadow-[0_0_25px_rgba(0,217,255,0.4)] ring-2 ring-cyan-primary/30 ring-offset-2 ring-offset-bg-primary overflow-hidden hover:scale-105 transition-all group cursor-pointer relative shrink-0 mb-4 z-10"
            >
              {userData.photoURL ? (
                <img src={userData.photoURL} alt="Avatar" className="w-full h-full object-cover" />
              ) : userData.avatar && userData.avatar.startsWith('http') ? (
                <img src={userData.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="font-bold text-white group-hover:opacity-0 transition-opacity font-display">
                  {userData.avatar || userData.name.charAt(0).toUpperCase()}
                </span>
              )}
              {!userData.photoURL && (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                  <span className="text-xs text-white font-semibold uppercase tracking-wider font-sans">Edit</span>
                </div>
              )}
            </button>
            
            <h1 className="text-2xl md:text-3xl font-bold font-display tracking-wide z-10 mb-2">{userData.name}</h1>
            
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border z-10 mb-auto ${
              userData.status === 'Eliminated' ? 'bg-status-danger/10 text-status-danger border-status-danger/30' : 
              userData.status === 'Champion' ? 'bg-status-success/10 text-status-success border-status-success/30' :
              'bg-cyan-primary/10 text-cyan-primary border-cyan-primary/30'
            }`}>
              {userData.status || 'Still Alive'}
            </span>
            
            {/* Quick Progress */}
            <div className="relative z-10 w-full mt-4">
              <div className="flex justify-between items-end mb-2">
                <span className="text-[10px] text-text-secondary uppercase tracking-widest font-bold">Prediction Progress</span>
                <span className="font-mono font-bold text-cyan-primary text-sm">{predictionsCount} / {TOTAL_MATCHES}</span>
              </div>
              <div className="w-full h-1.5 bg-bg-secondary rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  className="h-full bg-cyan-primary shadow-[0_0_10px_rgba(0,217,255,0.8)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
            </div>

            {/* Mobile Only: Leaderboard & Share */}
            <div className="flex md:hidden w-full gap-3 mt-6 pt-5 border-t border-white/10 relative z-10">
              <button onClick={() => setIsLeaderboardOpen(true)} className="flex-1 flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-cyan-primary/10 border border-cyan-primary/30 text-cyan-primary hover:bg-cyan-primary/20">
                <Trophy size={18} />
                <span className="text-[10px] uppercase font-bold tracking-widest">Leaderboard</span>
              </button>
              <button onClick={handleShare} disabled={isSharing} className="flex-1 flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-cyan-primary text-bg-primary font-bold hover:bg-cyan-primary/90 disabled:opacity-50 shadow-[0_0_15px_rgba(0,217,255,0.3)]">
                {isSharing ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />}
                <span className="text-[10px] uppercase font-bold tracking-widest">Share</span>
              </button>
            </div>
          </div>

          {/* Champion & Player Prediction */}
          <div className="glass-card p-6 flex flex-col items-center justify-between border-cyan-primary/30 relative overflow-hidden group col-span-1 shadow-[0_0_30px_rgba(0,217,255,0.1)] lg:min-h-[340px]">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-primary/10 via-transparent to-transparent pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity" />
            
            {/* Champion Section */}
            <div className="flex flex-col items-center w-full mb-6 relative z-10 border-b border-white/10 pb-4">
              <h3 className="text-[10px] text-text-secondary uppercase tracking-widest font-bold mb-2">Champion Prediction</h3>
              {championTeam ? (
                <div className="flex items-center gap-3 transition-transform duration-500 group-hover:scale-[1.03]">
                  <img src={championTeam.flagUrl} alt={`${championTeam.name} flag`} className="w-12 h-8 rounded-sm shadow-[0_0_10px_rgba(0,217,255,0.3)] object-cover" />
                  <span className="font-bold text-xl font-display text-white tracking-wide">{championTeam.name}</span>
                </div>
              ) : (
                <span className="font-bold text-xs tracking-widest uppercase text-text-muted">Not Selected</span>
              )}
            </div>

            {/* Golden Ball Section */}
            <div className="flex flex-col items-center w-full relative z-10">
              {goldenBallPlayerId ? (
                (() => {
                  const player = goldenBallPlayers.find(p => p.id === goldenBallPlayerId);
                  return player ? (
                    <div className="flex flex-col items-center transition-transform duration-500 group-hover:scale-[1.03] mt-2">
                      <div className="w-32 h-32 mb-2 flex items-end justify-center">
                        <img 
                          src={player.photoUrl} 
                          alt={player.name} 
                          className="h-full w-auto object-contain drop-shadow-[0_0_15px_rgba(0,217,255,0.3)]" 
                          crossOrigin="anonymous" 
                          onError={(e) => { e.currentTarget.src = '/silhouette.svg'; e.currentTarget.onerror = null; }}
                        />
                      </div>
                      <span className="font-bold text-2xl text-white tracking-wide mb-1 drop-shadow-md">{player.name}</span>
                      <span className="text-[10px] text-cyan-primary font-bold uppercase tracking-[0.2em] mb-2 text-center drop-shadow-sm">Player of the Tournament</span>
                    </div>
                  ) : null;
                })()
              ) : (
                <span className="font-bold text-xs tracking-widest uppercase text-text-muted">Not Selected</span>
              )}
            </div>
          </div>

          {/* Next Match & Countdown Container */}
          <div className="col-span-1 flex items-stretch justify-center">
            <NextMatchCountdown matches={matches} teams={teams} />
          </div>
        </div>

        {/* Top Actions: Leaderboard & Share Banner */}
        <div className="hidden md:grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Leaderboard Banner */}
          <div 
            onClick={() => setIsLeaderboardOpen(true)}
            className="glass-card p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between border-[rgba(0,217,255,0.18)] shadow-[0_0_20px_rgba(0,217,255,0.05)] bg-gradient-to-r from-bg-primary via-cyan-primary/5 to-bg-primary group overflow-hidden relative cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-primary/0 via-cyan-primary/10 to-cyan-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />
            <div className="flex items-center gap-4 mb-4 sm:mb-0 relative z-10">
              <div className="w-12 h-12 rounded-full bg-cyan-primary/10 flex items-center justify-center text-cyan-primary shadow-[0_0_15px_rgba(0,217,255,0.2)]">
                <Trophy size={24} />
              </div>
              <div>
                <h3 className="font-bold font-display text-xl tracking-wide text-text-primary uppercase">Leaderboard</h3>
                <p className="text-sm text-text-secondary font-medium">See how you rank globally</p>
              </div>
            </div>
            <div className="flex items-center justify-center text-cyan-primary font-bold font-display tracking-widest relative z-10 shrink-0">
              {userData.rank ? (
                <span className="text-3xl drop-shadow-[0_0_10px_rgba(0,217,255,0.5)]">
                  #{userData.rank}
                </span>
              ) : (
                <span className="text-sm px-6 py-3 border border-cyan-primary/30 rounded-xl hover:bg-cyan-primary/10 transition-colors uppercase tracking-widest bg-bg-secondary/50">View Rank</span>
              )}
            </div>
          </div>

          {/* Share Banner */}
          <div className="glass-card p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between border-[rgba(0,217,255,0.18)] shadow-[0_0_20px_rgba(0,217,255,0.05)] bg-gradient-to-r from-bg-primary via-cyan-primary/5 to-bg-primary group overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-primary/0 via-cyan-primary/10 to-cyan-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />
            <div className="flex items-center gap-4 mb-4 sm:mb-0 relative z-10">
              <div className="w-12 h-12 rounded-full bg-cyan-primary/10 flex items-center justify-center text-cyan-primary shadow-[0_0_15px_rgba(0,217,255,0.2)]">
                <Share2 size={24} />
              </div>
              <div>
                <h3 className="font-bold font-display text-xl tracking-wide text-text-primary uppercase">Share Bracket</h3>
                <p className="text-sm text-text-secondary font-medium">Generate a prediction poster</p>
              </div>
            </div>
            <button 
              onClick={handleShare}
              disabled={isSharing}
              className="w-full sm:w-auto py-3 px-6 bg-cyan-primary text-bg-primary font-bold font-display tracking-widest text-sm rounded-xl hover:bg-cyan-primary/90 hover:scale-[1.02] transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(0,217,255,0.4)] flex items-center justify-center gap-2 relative z-10 shrink-0"
            >
              {isSharing ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Share2 size={16} />
                  <span>Generate</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 flex flex-col items-center justify-center text-center gap-2 border-[rgba(0,217,255,0.18)] group">
            <span className="text-4xl font-bold font-mono text-white group-hover:text-cyan-primary transition-colors">{userData.score || 0}</span>
            <span className="text-xs text-text-secondary uppercase tracking-widest font-semibold mt-2">Total Score</span>
          </div>
          
          <div className="glass-card p-6 flex flex-col items-center justify-center text-center gap-2 border-[rgba(0,217,255,0.18)] group">
            <span className="text-4xl font-bold font-mono text-white group-hover:text-cyan-primary transition-colors">{userData.accuracy || 0}%</span>
            <span className="text-xs text-text-secondary uppercase tracking-widest font-semibold mt-2">Accuracy</span>
          </div>
          
          <div className="glass-card p-6 flex flex-col items-center justify-center text-center gap-2 border-[rgba(0,217,255,0.18)] group">
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
            <span className="text-xs text-text-secondary uppercase tracking-widest font-semibold mt-3">Predictions</span>
          </div>
        </div>

        {/* Action Bottom Row */}
        <div className="max-w-2xl mx-auto w-full mt-4">
          <div className="glass-card p-6 flex flex-col justify-center border-[rgba(0,217,255,0.18)] items-center text-center">
            <h3 className="font-bold font-display text-xl tracking-wide mb-2 flex items-center justify-center gap-2 text-text-primary w-full">
              Recovery Code
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              Save this code to restore your predictions on another device.
            </p>
            <div className="flex items-center gap-3 bg-bg-secondary p-4 rounded-xl border border-white/5 w-full max-w-md">
              <code className="flex-1 font-mono text-xl text-center text-cyan-primary tracking-[0.25em]">{userData.recoveryCode}</code>
              <button 
                onClick={handleCopyCode}
                className="p-3 bg-cyan-primary/10 hover:bg-cyan-primary/20 rounded-lg transition-colors text-cyan-primary shrink-0"
              >
                {copied ? <span className="text-status-success text-xs font-bold uppercase tracking-widest">Copied</span> : <Copy size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isLeaderboardOpen && (
          <LeaderboardOverlay 
            currentEntryId={entryId || undefined}
            onClose={() => setIsLeaderboardOpen(false)}
          />
        )}
        {isProfileOpen && (
          <ProfileModal 
            user={userData}
            predictionsCount={predictionsCount}
            totalMatches={TOTAL_MATCHES}
            championTeam={championTeam}
            onClose={() => setIsProfileOpen(false)}
          />
        )}
      </AnimatePresence>
      <ShareBracket 
        ref={shareRef}
        user={userData}
        teams={teams}
        matches={matches}
        picks={picks}
        championId={championTeam?.id || null}
        goldenBallPlayerId={goldenBallPlayerId}
      />
    </AnimatedTransition>
  );
}
