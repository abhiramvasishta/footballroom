import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Trophy, X, ChevronUp, ChevronDown, Minus } from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { fetchTeams, fetchMatches } from '../lib/services';
import type { Team } from '../types';
import { cn } from '../utils/cn';
import { Avatar } from './Avatar';

interface LeaderboardEntry {
  entryId: string;
  name: string;
  avatar: string | null;
  photoURL?: string;
  score: number;
  accuracy: number;
  correctPicks: number;
  wrongPicks: number;
  rank: number;
  previousRank: number;
  status: string;
  championTeamId?: string | null;
  championTeam?: Team;
}

interface Props {
  currentEntryId?: string;
  onClose: () => void;
}

export const LeaderboardOverlay = ({ currentEntryId, onClose }: Props) => {
  const [users, setUsers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const userRowRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    let unsubscribe = () => { };

    const loadInitialData = async () => {
      try {
        // 1. Fetch matches to determine if tournament started
        const matches = await fetchMatches();
        const started = matches.some(m => m.completed);
        setHasStarted(started);

        if (!started) {
          setLoading(false);
          return;
        }

        // 2. Fetch static teams & predictions
        const teamsData = await fetchTeams();
        // 3. Subscribe to real-time leaderboard
        unsubscribe = onSnapshot(collection(db, 'leaderboard'), (snapshot) => {
          const lbData = snapshot.docs.map(doc => doc.data() as LeaderboardEntry);

          const enhancedUsers: LeaderboardEntry[] = lbData.map(entry => {
            const champTeam = entry.championTeamId ? teamsData.find(t => t.id === entry.championTeamId) : undefined;
            return { ...entry, championTeam: champTeam };
          });

          // Sort users properly according to stored rank
          // If rank is missing (0), fallback to score sort.
          enhancedUsers.sort((a, b) => {
            if (a.rank && b.rank) return a.rank - b.rank;
            if (b.score !== a.score) return b.score - a.score;
            return b.accuracy - a.accuracy;
          });

          setUsers(enhancedUsers);
          setLoading(false);
        });

      } catch (err) {
        console.error("Failed to load leaderboard overlay", err);
        setLoading(false);
      }
    };

    loadInitialData();

    return () => {
      unsubscribe();
    };
  }, []);

  // Auto-scroll to current user after loading
  useEffect(() => {
    if (!loading && hasStarted && userRowRef.current) {
      setTimeout(() => {
        userRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [loading, hasStarted]);

  // Handle ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const renderRankChange = (user: LeaderboardEntry) => {
    if (!user.previousRank || user.previousRank === user.rank || user.rank === 0) {
      return <Minus size={14} className="text-text-muted" />;
    }
    const diff = user.previousRank - user.rank;
    if (diff > 0) {
      return (
        <span className="flex items-center text-green-400 text-xs font-bold">
          <ChevronUp size={14} /> {diff}
        </span>
      );
    }
    return (
      <span className="flex items-center text-red-400 text-xs font-bold">
        <ChevronDown size={14} /> {Math.abs(diff)}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Overlay Modal */}
      <motion.div
        layoutId="leaderboard-card"
        className="relative w-full max-w-4xl max-h-[85vh] bg-bg-primary border border-cyan-primary/50 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden"
        style={{ originY: 0.5 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-primary/5 to-transparent pointer-events-none" />

        {/* Sticky Header */}
        <div className="flex items-center justify-between p-6 border-b border-[rgba(0,217,255,0.18)] bg-bg-primary/95 sticky top-0 z-20 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Trophy className="text-cyan-primary" size={28} />
            <h2 className="text-2xl font-bold font-display text-cyan-primary">Leaderboard</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-primary" />
            </div>
          ) : !hasStarted ? (
            <div className="flex flex-col items-center justify-center py-32 text-center px-6">
              <Trophy size={64} className="text-cyan-primary/30 mb-6" />
              <h3 className="text-2xl font-bold font-display mb-2">No rankings available yet</h3>
              <p className="text-text-secondary max-w-sm mx-auto">
                Rankings will appear automatically after the first official match is completed.
              </p>
            </div>
          ) : (
            <div className="w-full pb-6">
              <table className="w-full text-left border-collapse">
                <thead className="bg-bg-secondary/80 sticky top-0 z-10 shadow-sm border-b border-[rgba(0,217,255,0.18)]">
                  <tr>
                    <th className="p-2 sm:p-4 text-text-secondary font-medium whitespace-nowrap text-sm sm:text-base">Rank</th>
                    <th className="p-2 sm:p-4 text-text-secondary font-medium w-full text-sm sm:text-base">Player</th>
                    <th className="p-2 sm:p-4 text-text-secondary font-medium text-center whitespace-nowrap text-sm sm:text-base">Score</th>
                    <th className="p-2 sm:p-4 text-text-secondary font-medium text-center whitespace-nowrap hidden sm:table-cell">Accuracy</th>
                    <th className="p-2 sm:p-4 text-text-secondary font-medium text-center whitespace-nowrap hidden md:table-cell">Champion</th>
                    <th className="p-2 sm:p-4 text-text-secondary font-medium text-right whitespace-nowrap hidden sm:table-cell">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-text-muted">
                      <Trophy size={48} className="mb-4 opacity-20" />
                      <p className="text-lg">No leaderboard available yet.</p>
                    </div>
                  ) : (
                    users.map((user) => {
                      const isCurrentUser = user.entryId === currentEntryId;
                      return (
                        <tr
                          key={user.entryId}
                          ref={isCurrentUser ? userRowRef : null}
                          className={`transition-colors ${isCurrentUser
                              ? 'bg-cyan-primary/10 border-y border-cyan-primary/30 shadow-[inset_0_0_20px_rgba(0,217,255,0.05)]'
                              : 'hover:bg-white/5'
                            }`}
                        >
                          <td className="p-2 sm:p-4 whitespace-nowrap">
                            <div className="flex items-center gap-1 sm:gap-3">
                              <span className={cn(
                                "font-bold text-xl sm:text-2xl font-mono",
                                user.rank === 1 ? "text-cyan-primary drop-shadow-[0_0_15px_rgba(0,217,255,0.6)]" :
                                user.rank === 2 ? "text-white" :
                                user.rank === 3 ? "text-text-secondary" :
                                "text-text-muted"
                              )}>
                                #{user.rank || '-'}
                              </span>
                              <div className="w-8 flex justify-center">
                                {renderRankChange(user)}
                              </div>
                            </div>
                          </td>
                          <td className="p-2 sm:p-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <Avatar photoURL={user.photoURL} avatar={user.avatar} name={user.name} className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full text-xs sm:text-sm font-bold border-2 ${isCurrentUser ? 'border-cyan-primary bg-gold-900/50' : 'border-[rgba(0,217,255,0.18)] bg-card-hover'}`} />
                              <div className="flex flex-col min-w-0">
                                <span className={`font-bold truncate text-sm sm:text-base ${isCurrentUser ? 'text-cyan-primary' : 'text-white'}`}>
                                  {user.name} {isCurrentUser && <span className="ml-1 sm:ml-2 text-[10px] sm:text-xs bg-cyan-primary text-navy-900 px-1.5 py-0.5 rounded-full uppercase tracking-wider">You</span>}
                                </span>
                                <span className="text-xs text-text-secondary hidden sm:inline">
                                  {user.correctPicks}W / {user.wrongPicks}L
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="p-2 sm:p-4 text-center whitespace-nowrap font-bold text-base sm:text-lg text-white">
                            <motion.div
                              key={user.score}
                              initial={{ scale: 1.5, color: '#00D9FF' }}
                              animate={{ scale: 1, color: '#FFFFFF' }}
                              transition={{ duration: 0.5, ease: 'easeOut' }}
                            >
                              {user.score}
                            </motion.div>
                          </td>
                          <td className="p-2 sm:p-4 text-center whitespace-nowrap text-gray-300 hidden sm:table-cell">
                            {user.accuracy}%
                          </td>
                          <td className="p-2 sm:p-4 text-center whitespace-nowrap hidden md:table-cell">
                            {user.championTeam ? (
                              <div className="flex flex-col items-center gap-1">
                                <div className="w-8 h-5 rounded overflow-hidden shadow-sm border border-white/20">
                                  <img src={user.championTeam.flagUrl} alt={user.championTeam.name} className="w-full h-full object-cover" />
                                </div>
                                <span className="text-[10px] text-text-secondary truncate max-w-[80px]">{user.championTeam.name}</span>
                              </div>
                            ) : (
                              <span className="text-text-muted">-</span>
                            )}
                          </td>
                          <td className="p-2 sm:p-4 text-right whitespace-nowrap hidden sm:table-cell">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${user.status === 'Eliminated' ? 'bg-red-500/20 text-red-400 border border-red-500/20' :
                                user.status === 'Champion' ? 'bg-cyan-primary/20 text-cyan-primary border border-cyan-primary/20' :
                                  'bg-blue-500/20 text-blue-400 border border-blue-500/20'
                              }`}>
                              {user.status || 'Still Alive'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
