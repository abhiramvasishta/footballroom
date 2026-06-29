import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { Trophy, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AnimatedTransition } from '../components/AnimatedTransition';
import { db } from '../lib/firebase';
import { getPredictionData, fetchTeams } from '../lib/services';
import type { UserData, Team } from '../types';

interface LeaderboardEntry extends UserData {
  championTeam?: Team;
}

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'users'));
        const usersData = snapshot.docs.map(doc => doc.data() as UserData);
        
        // Fetch teams to map champion IDs
        const teams = await fetchTeams();
        
        const enhancedUsers: LeaderboardEntry[] = [];
        
        for (const user of usersData) {
           const pred = await getPredictionData(user.entryId);
           const champTeam = pred?.predictedChampion ? teams.find(t => t.id === pred.predictedChampion) : undefined;
           enhancedUsers.push({ ...user, championTeam: champTeam });
        }

        // Sort: Score -> Accuracy -> SubmittedAt -> Champion (alphabetical string compare)
        enhancedUsers.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
          
          const aTime = a.submittedAt ? new Date(a.submittedAt).getTime() : Infinity;
          const bTime = b.submittedAt ? new Date(b.submittedAt).getTime() : Infinity;
          if (aTime !== bTime) return aTime - bTime;

          const aChamp = a.championTeam?.name || '';
          const bChamp = b.championTeam?.name || '';
          return aChamp.localeCompare(bChamp);
        });

        // Assign ranks (handling ties)
        let currentRank = 1;
        for (let i = 0; i < enhancedUsers.length; i++) {
          if (i > 0) {
            const prev = enhancedUsers[i - 1];
            const curr = enhancedUsers[i];
            if (curr.score !== prev.score || curr.accuracy !== prev.accuracy) {
              currentRank = i + 1;
            }
          }
          enhancedUsers[i].rank = currentRank;
        }

        setUsers(enhancedUsers);
      } catch (err) {
        console.error("Failed to load leaderboard", err);
      }
      setLoading(false);
    };

    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-primary"></div>
      </div>
    );
  }

  const top3 = users.slice(0, 3);
  const rest = users.slice(3);

  return (
    <AnimatedTransition className="min-h-screen bg-bg-primary text-white p-4 md:p-6 pb-24">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate(-1)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
            <ChevronLeft />
          </button>
          <div className="flex items-center gap-3">
            <Trophy className="text-cyan-primary" size={32} />
            <h1 className="text-3xl font-bold font-display text-cyan-primary">Global Leaderboard</h1>
          </div>
        </div>

        {/* Podium for Top 3 */}
        {top3.length > 0 && (
          <div className="flex justify-center items-end h-64 mb-12 gap-2 md:gap-4">
            {/* 2nd Place */}
            {top3[1] && (
              <div className="flex flex-col items-center w-1/4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-bg-secondary flex items-center justify-center text-text-primary font-bold text-xl md:text-2xl mb-2 z-10 border-2 border-[rgba(0,217,255,0.3)] shadow-[0_0_15px_rgba(0,217,255,0.1)]">
                  {top3[1].avatar && top3[1].avatar.startsWith('http') ? <img src={top3[1].avatar} alt="" className="w-full h-full object-cover rounded-full" /> : top3[1].avatar || top3[1].name.charAt(0).toUpperCase()}
                </div>
                <div className="w-full bg-gradient-to-t from-cyan-primary/5 to-bg-primary rounded-t-lg border-t border-x border-[rgba(0,217,255,0.18)] flex flex-col items-center justify-end pb-4 relative overflow-hidden" style={{ height: '120px' }}>
                  <span className="text-text-primary font-bold font-mono text-2xl drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">#2</span>
                  <span className="text-xs text-text-secondary truncate w-full text-center px-1 mt-1">{top3[1].name}</span>
                  <span className="font-bold text-cyan-primary font-mono text-sm">{top3[1].score} pts</span>
                </div>
              </div>
            )}
            
            {/* 1st Place */}
            <div className="flex flex-col items-center w-1/3 animate-fade-in-up z-20">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-bg-primary flex items-center justify-center text-cyan-primary font-bold text-2xl md:text-3xl mb-2 shadow-[0_0_25px_rgba(0,217,255,0.6)] border-2 border-cyan-primary relative">
                <Trophy className="absolute -top-7 text-cyan-primary drop-shadow-[0_0_10px_rgba(0,217,255,0.8)]" size={28} />
                {top3[0].avatar && top3[0].avatar.startsWith('http') ? <img src={top3[0].avatar} alt="" className="w-full h-full object-cover rounded-full" /> : top3[0].avatar || top3[0].name.charAt(0).toUpperCase()}
              </div>
              <div className="w-full bg-gradient-to-t from-cyan-primary/20 to-bg-primary rounded-t-lg border-t border-x border-cyan-primary/70 flex flex-col items-center justify-end pb-6 relative overflow-hidden" style={{ height: '160px' }}>
                <div className="absolute inset-0 bg-gradient-to-t from-cyan-primary/10 to-transparent pointer-events-none" />
                <span className="text-cyan-primary font-bold font-mono text-4xl mb-1 drop-shadow-[0_0_15px_rgba(0,217,255,0.8)]">#1</span>
                <span className="text-sm font-bold truncate w-full text-center px-1 tracking-wide">{top3[0].name}</span>
                <span className="font-bold text-cyan-primary font-mono text-lg">{top3[0].score} pts</span>
              </div>
            </div>

            {/* 3rd Place */}
            {top3[2] && (
              <div className="flex flex-col items-center w-1/4 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-bg-secondary flex items-center justify-center text-text-primary font-bold text-xl md:text-2xl mb-2 z-10 border-2 border-white/10">
                  {top3[2].avatar && top3[2].avatar.startsWith('http') ? <img src={top3[2].avatar} alt="" className="w-full h-full object-cover rounded-full" /> : top3[2].avatar || top3[2].name.charAt(0).toUpperCase()}
                </div>
                <div className="w-full bg-gradient-to-t from-white/5 to-bg-primary rounded-t-lg border-t border-x border-white/10 flex flex-col items-center justify-end pb-2 relative overflow-hidden" style={{ height: '90px' }}>
                  <span className="text-text-secondary font-bold font-mono text-xl">#3</span>
                  <span className="text-xs text-text-secondary truncate w-full text-center px-1 mt-1">{top3[2].name}</span>
                  <span className="font-bold text-cyan-primary/80 font-mono text-sm">{top3[2].score} pts</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Rest of Leaderboard */}
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-bg-secondary/80 border-b border-[rgba(0,217,255,0.18)]">
                <tr>
                  <th className="p-4 text-text-secondary font-medium">Rank</th>
                  <th className="p-4 text-text-secondary font-medium">Player</th>
                  <th className="p-4 text-text-secondary font-medium text-center">Score</th>
                  <th className="p-4 text-text-secondary font-medium text-center">Accuracy</th>
                  <th className="p-4 text-text-secondary font-medium text-center">Champion</th>
                  <th className="p-4 text-text-secondary font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rest.map((user) => (
                  <tr key={user.entryId} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 text-center font-bold text-text-muted">#{user.rank}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-card-hover flex items-center justify-center text-xs font-bold border border-[rgba(0,217,255,0.18)]">
                          {user.avatar && user.avatar.startsWith('http') ? <img src={user.avatar} alt="" className="w-full h-full object-cover rounded-full" /> : user.avatar || user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold">{user.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center font-bold text-cyan-primary">{user.score}</td>
                    <td className="p-4 text-center">{user.accuracy}%</td>
                    <td className="p-4 text-center">
                      {user.championTeam ? (
                        <div className="w-10 h-7 mx-auto rounded overflow-hidden shadow-sm border border-white/20" title={user.championTeam.name}>
                          <img src={user.championTeam.flagUrl} alt={user.championTeam.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <span className="text-text-muted">-</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        user.status === 'Eliminated' ? 'bg-red-500/20 text-red-400' :
                        user.status === 'Champion' ? 'bg-cyan-primary/20 text-cyan-primary' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {user.status || 'Still Alive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AnimatedTransition>
  );
}
