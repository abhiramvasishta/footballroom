import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AnimatedTransition } from '../components/AnimatedTransition';
import { MatchCard } from '../components/MatchCard';
import { MatchCardSkeleton, Skeleton } from '../components/Skeleton';
import { useUserStore } from '../store/useUserStore';
import { usePredictionStore } from '../store/usePredictionStore';
import type { Match } from '../types';
import { goldenBallPlayers } from '../data/goldenBallPlayers';
import { Search } from 'lucide-react';

const ROUND_NAMES: Record<number, string> = {
  32: 'Round of 32',
  16: 'Round of 16',
  8: 'Quarter Finals',
  4: 'Semi Finals',
  3: 'Third Place',
  2: 'Final'
};

export default function PredictionFlow() {
  const navigate = useNavigate();
  const { isRegistered, entryId } = useUserStore();
  const store = usePredictionStore();
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');

  useEffect(() => {
    if (!isRegistered) {
      navigate('/');
    }
  }, [isRegistered, navigate]);

  useEffect(() => {
    store.initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (store.isLoading) {
    return (
      <AnimatedTransition className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-6 pt-20">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Skeleton className="h-10 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="w-12 h-12 rounded-full" />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          <Skeleton className="h-10 w-32 shrink-0 rounded-full" />
          <Skeleton className="h-10 w-32 shrink-0 rounded-full" />
          <Skeleton className="h-10 w-32 shrink-0 rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MatchCardSkeleton />
          <MatchCardSkeleton />
          <MatchCardSkeleton />
          <MatchCardSkeleton />
        </div>
      </AnimatedTransition>
    );
  }

  if (store.matches.length === 0) {
    return (
      <AnimatedTransition className="min-h-screen bg-bg-primary flex flex-col items-center justify-center text-white p-6">
        <AlertCircle size={48} className="text-cyan-primary mb-4" />
        <h2 className="text-2xl font-bold font-display mb-2">No Fixtures Available</h2>
        <p className="text-text-secondary text-center max-w-md">
          Tournament fixtures have not been created yet. Please check back later when the official matches are announced.
        </p>
      </AnimatedTransition>
    );
  }

  const currentRoundName = ROUND_NAMES[store.currentRound];
  const roundMatches = store.matches
    .filter(m => m.round === currentRoundName)
    .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime());

  const isRoundComplete = roundMatches.length > 0 && roundMatches.every(m => store.picks[m.id]);

  const handleNext = () => {
    if (store.isSelectingGoldenBall) {
      navigate('/review');
    } else if (store.currentRound === 2) {
      store.setSelectingGoldenBall(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      store.advanceRound();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (store.isSelectingGoldenBall) {
      store.setSelectingGoldenBall(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      store.goBackRound();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getDynamicTeamAId = (match: Match): string | null => {
    if (match.homeTeamId) return match.homeTeamId;
    
    // Look for winner progression
    const prevMatchWinner = store.matches.find(m => m.nextMatchId === match.id && m.nextSlot === 'home');
    if (prevMatchWinner) {
      return store.picks[prevMatchWinner.id] || null;
    }

    // Look for loser progression
    const prevMatchLoser = store.matches.find(m => m.loserNextMatchId === match.id && m.loserNextSlot === 'home');
    if (prevMatchLoser) {
      const winnerId = store.picks[prevMatchLoser.id];
      if (!winnerId) return null;
      const teamA = getDynamicTeamAId(prevMatchLoser);
      const teamB = getDynamicTeamBId(prevMatchLoser);
      if (teamA && teamB) {
        return winnerId === teamA ? teamB : teamA;
      }
    }

    return null;
  };

  const getDynamicTeamBId = (match: Match): string | null => {
    if (match.awayTeamId) return match.awayTeamId;
    
    // Look for winner progression
    const prevMatchWinner = store.matches.find(m => m.nextMatchId === match.id && m.nextSlot === 'away');
    if (prevMatchWinner) {
      return store.picks[prevMatchWinner.id] || null;
    }

    // Look for loser progression
    const prevMatchLoser = store.matches.find(m => m.loserNextMatchId === match.id && m.loserNextSlot === 'away');
    if (prevMatchLoser) {
      const winnerId = store.picks[prevMatchLoser.id];
      if (!winnerId) return null;
      const teamA = getDynamicTeamAId(prevMatchLoser);
      const teamB = getDynamicTeamBId(prevMatchLoser);
      if (teamA && teamB) {
        return winnerId === teamA ? teamB : teamA;
      }
    }

    return null;
  };

  const predictedCountInRound = store.isSelectingGoldenBall ? (store.goldenBallPlayerId ? 1 : 0) : roundMatches.filter(m => store.picks[m.id]).length;
  const progressPercentage = store.isSelectingGoldenBall ? (store.goldenBallPlayerId ? 100 : 0) : Math.round((predictedCountInRound / (roundMatches.length || 1)) * 100);

  const handleSelectTeam = async (matchId: string, teamId: string) => {
    // 1. Update State synchronously
    store.setWinner(matchId, teamId);
    
    // 2. Fire Auto-Save in background
    if (entryId) {
      setSaveStatus('saving');
      try {
        await store.autoSave(entryId);
      } catch (err) {
        console.error("Auto-save failed", err);
      } finally {
        setSaveStatus('saved');
      }
    }
  };

  const handleSelectPlayer = async (playerId: string) => {
    store.setGoldenBallPlayerId(playerId);
    if (entryId) {
      setSaveStatus('saving');
      try {
        await store.autoSave(entryId);
      } catch (err) {
        console.error("Auto-save failed", err);
      } finally {
        setSaveStatus('saved');
      }
    }
  };

  const filteredPlayers = goldenBallPlayers.filter(p => 
    p.name.toLowerCase().includes(playerSearchQuery.toLowerCase()) || 
    p.countryName.toLowerCase().includes(playerSearchQuery.toLowerCase())
  );

  return (
    <AnimatedTransition className="min-h-screen bg-bg-primary text-white pb-32">
      <div className="sticky top-0 z-50 bg-bg-primary/95 backdrop-blur-md border-b border-[rgba(0,217,255,0.18)] shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {(store.currentRound !== 32 || store.isSelectingGoldenBall) && (
                <button 
                  onClick={handleBack}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors flex-shrink-0"
                >
                  <ChevronLeft />
                </button>
              )}
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-bold font-display text-cyan-primary">
                    {store.isSelectingGoldenBall ? 'Golden Ball' : currentRoundName}
                  </h1>
                  {((!store.isSelectingGoldenBall && isRoundComplete) || (store.isSelectingGoldenBall && store.goldenBallPlayerId)) && <CheckCircle2 size={20} className="text-green-400" />}
                </div>
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <span className="font-mono">
                    {store.isSelectingGoldenBall 
                      ? (store.goldenBallPlayerId ? '1 / 1 predicted' : '0 / 1 predicted')
                      : `${predictedCountInRound} / ${roundMatches.length} predicted`}
                  </span>
                  <span>•</span>
                  <span className="italic">{saveStatus === 'saving' ? 'Saving...' : 'All changes saved'}</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleNext}
              disabled={(!store.isSelectingGoldenBall && !isRoundComplete) || (store.isSelectingGoldenBall && !store.goldenBallPlayerId)}
              className="flex items-center gap-2 bg-cyan-primary text-navy-900 px-4 py-2 rounded-full font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cyan-primary transition-colors flex-shrink-0"
            >
              <span className="hidden sm:inline">{store.isSelectingGoldenBall ? 'Review' : 'Next Round'}</span>
              <ChevronRight size={18} />
            </button>
          </div>
          
          <div className="h-1.5 w-full bg-bg-secondary rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-cyan-primary rounded-full shadow-[0_0_10px_rgba(0,217,255,0.8)]"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-6 mt-4">
        {store.isSelectingGoldenBall ? (
          <div className="animate-fade-in flex flex-col gap-6">
            <div className="text-center mb-4">
              <h2 className="text-3xl font-display text-white mb-2 tracking-wide uppercase">Player of the Tournament</h2>
              <p className="text-text-secondary">Select your prediction for the Golden Ball winner.</p>
            </div>
            
            <div className="relative mb-6 max-w-md mx-auto w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="text-text-secondary" size={18} />
              </div>
              <input
                type="text"
                placeholder="Search by player or country..."
                value={playerSearchQuery}
                onChange={(e) => setPlayerSearchQuery(e.target.value)}
                className="w-full bg-bg-secondary border border-[rgba(0,217,255,0.2)] rounded-full pl-10 pr-4 py-3 text-white focus:outline-none focus:border-cyan-primary focus:ring-1 focus:ring-cyan-primary transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredPlayers.map(player => {
                const isSelected = store.goldenBallPlayerId === player.id;
                return (
                  <div
                    key={player.id}
                    onClick={() => handleSelectPlayer(player.id)}
                    className={`relative cursor-pointer rounded-2xl overflow-hidden transition-all duration-300 group
                      ${isSelected ? 'border-2 border-cyan-primary shadow-[0_0_25px_rgba(0,217,255,0.5)] scale-105' : 'border border-[rgba(255,255,255,0.1)] hover:border-cyan-primary/50 hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(0,217,255,0.15)] bg-card-bg'}`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 z-20 bg-cyan-primary rounded-full p-1 shadow-[0_0_10px_rgba(0,217,255,0.8)]">
                        <CheckCircle2 size={16} className="text-navy-900" />
                      </div>
                    )}
                    <div className="h-40 w-full bg-gradient-to-b from-navy-800 to-navy-950 relative overflow-hidden rounded-t-2xl">
                       <img 
                         src={player.photoUrl} 
                         alt={player.name} 
                         className="w-full h-full object-cover mix-blend-screen opacity-90 transition-opacity duration-300 group-hover:opacity-100" 
                         crossOrigin="anonymous" 
                         onError={(e) => { e.currentTarget.src = '/silhouette.svg'; e.currentTarget.onerror = null; }}
                       />
                       <div className="absolute inset-0 bg-gradient-to-t from-[#0B1118] via-transparent to-transparent pointer-events-none" />
                    </div>
                    <div className="p-4 flex flex-col items-center bg-[#0B1118]">
                       <span className="font-bold text-sm text-center mb-2 line-clamp-1 group-hover:text-cyan-primary transition-colors">{player.name}</span>
                       <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                         <img src={player.flagUrl} alt={player.countryName} className="w-4 h-3 object-cover rounded-sm" crossOrigin="anonymous" />
                         <span className="text-[10px] text-text-secondary uppercase tracking-widest font-semibold">{player.countryName}</span>
                       </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {filteredPlayers.length === 0 && (
              <div className="text-center text-text-secondary py-10">
                No players found matching your search.
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {roundMatches.map((match, index) => {
              const dynTeamAId = getDynamicTeamAId(match);
              const dynTeamBId = getDynamicTeamBId(match);
              
              const teamA = store.teams.find(t => t.id === dynTeamAId) || null;
              const teamB = store.teams.find(t => t.id === dynTeamBId) || null;
              
              return (
                <div key={match.id} className="match-card-container">
                  <MatchCard
                    match={match}
                    teamA={teamA}
                    teamB={teamB}
                    selectedTeamId={store.picks[match.id] || null}
                    onSelectTeam={(teamId) => handleSelectTeam(match.id, teamId)}
                    index={index}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AnimatedTransition>
  );
}
