import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { Trophy, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { getPredictionData, fetchTeams, fetchMatches } from '../lib/services';
import type { UserData, Team, Match } from '../types';
import { Avatar } from '../components/Avatar';
import { UserPicksModal } from '../components/UserPicksModal';

interface LeaderboardEntry extends UserData {
  championTeam?: Team;
}

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'users'));
        const usersData = snapshot.docs.map(doc => doc.data() as UserData);
        
        // Fetch teams to map champion IDs and matches for modal
        const [teams, matches] = await Promise.all([
          fetchTeams(),
          fetchMatches()
        ]);
        setAllTeams(teams);
        setAllMatches(matches);
        
        const enhancedUsers: LeaderboardEntry[] = (await Promise.all(
          usersData.map(async (user) => {
            const pred = await getPredictionData(user.entryId);
            if (!pred) return null; // Filter out users who haven't made predictions
            
            const champTeam = pred?.predictedChampion ? teams.find(t => t.id === pred.predictedChampion) : undefined;
            return { ...user, championTeam: champTeam };
          })
        )).filter(Boolean) as LeaderboardEntry[];

        // Sort: Status (Eliminated last) -> Score -> Accuracy -> SubmittedAt -> Champion
        enhancedUsers.sort((a, b) => {
          const aEliminated = a.status === 'Eliminated';
          const bEliminated = b.status === 'Eliminated';
          if (aEliminated && !bEliminated) return 1;
          if (!aEliminated && bEliminated) return -1;

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
    <div className="min-h-screen bg-bg-primary text-white p-4 md:p-6 pb-24">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate(-1)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
            <ChevronLeft />
          </button>
          <div className="flex items-center gap-3">
            <Trophy className="text-cyan-primary" size={32} />
            <h1 className="text-3xl font-bold font-display text-cyan-primary">Leaderboard</h1>
          </div>
        </div>

        {/* Podium for Top 3 */}
        {top3.length > 0 && (
          <div className="flex justify-center items-end h-64 mb-12 gap-2 md:gap-4">
            {/* 2nd Place */}
            {top3[1] && (
              <div 
                className="flex flex-col items-center w-1/4 animate-fade-in-up cursor-pointer group" 
                style={{ animationDelay: '0.2s' }}
                onClick={() => setSelectedUser(top3[1])}
              >
                <Avatar photoURL={top3[1].photoURL} avatar={top3[1].avatar} name={top3[1].name} className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-bg-secondary text-text-primary font-bold text-xl md:text-2xl mb-2 z-10 border-2 border-[rgba(0,217,255,0.3)] shadow-[0_0_15px_rgba(0,217,255,0.1)]" />
                <div className="w-full bg-gradient-to-t from-cyan-primary/5 to-bg-primary rounded-t-lg border-t border-x border-[rgba(0,217,255,0.18)] flex flex-col items-center justify-end pb-4 relative overflow-hidden" style={{ height: '120px' }}>
                  <span className="text-text-primary font-bold font-mono text-2xl drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">#2</span>
                  <span className="text-xs text-text-secondary truncate w-full text-center px-1 mt-1">{top3[1].name}</span>
                  <span className="font-bold text-cyan-primary font-mono text-sm">{top3[1].status === 'Eliminated' ? '-' : `${top3[1].score} pts`}</span>
                </div>
              </div>
            )}
            
            {/* 1st Place */}
            <div 
              className="flex flex-col items-center w-1/3 animate-fade-in-up z-20 cursor-pointer group"
              onClick={() => setSelectedUser(top3[0])}
            >
              <div className="relative mb-2">
                <Trophy className="absolute -top-7 left-1/2 -translate-x-1/2 text-cyan-primary drop-shadow-[0_0_10px_rgba(0,217,255,0.8)] z-20" size={28} />
                <Avatar photoURL={top3[0].photoURL} avatar={top3[0].avatar} name={top3[0].name} className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-bg-primary text-cyan-primary font-bold text-2xl md:text-3xl shadow-[0_0_25px_rgba(0,217,255,0.6)] border-2 border-cyan-primary" />
              </div>
              <div className="w-full bg-gradient-to-t from-cyan-primary/20 to-bg-primary rounded-t-lg border-t border-x border-cyan-primary/70 flex flex-col items-center justify-end pb-6 relative overflow-hidden" style={{ height: '160px' }}>
                <div className="absolute inset-0 bg-gradient-to-t from-cyan-primary/10 to-transparent pointer-events-none" />
                <span className="text-cyan-primary font-bold font-mono text-4xl mb-1 drop-shadow-[0_0_15px_rgba(0,217,255,0.8)]">#1</span>
                <span className="text-sm font-bold truncate w-full text-center px-1 tracking-wide">{top3[0].name}</span>
                <span className="font-bold text-cyan-primary font-mono text-lg">{top3[0].status === 'Eliminated' ? '-' : `${top3[0].score} pts`}</span>
              </div>
            </div>

            {/* 3rd Place */}
            {top3[2] && (
              <div 
                className="flex flex-col items-center w-1/4 animate-fade-in-up cursor-pointer group" 
                style={{ animationDelay: '0.4s' }}
                onClick={() => setSelectedUser(top3[2])}
              >
                <Avatar photoURL={top3[2].photoURL} avatar={top3[2].avatar} name={top3[2].name} className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-bg-secondary text-text-primary font-bold text-xl md:text-2xl mb-2 z-10 border-2 border-white/10" />
                <div className="w-full bg-gradient-to-t from-white/5 to-bg-primary rounded-t-lg border-t border-x border-white/10 flex flex-col items-center justify-end pb-2 relative overflow-hidden" style={{ height: '90px' }}>
                  <span className="text-text-secondary font-bold font-mono text-xl">#3</span>
                  <span className="text-xs text-text-secondary truncate w-full text-center px-1 mt-1">{top3[2].name}</span>
                  <span className="font-bold text-cyan-primary/80 font-mono text-sm">{top3[2].status === 'Eliminated' ? '-' : `${top3[2].score} pts`}</span>
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
                  <th className="p-2 md:p-4 text-text-secondary font-medium text-center w-12 md:w-auto">#</th>
                  <th className="p-2 md:p-4 text-text-secondary font-medium">Player</th>
                  <th className="p-2 md:p-4 text-text-secondary font-medium text-center">Score</th>
                  <th className="p-2 md:p-4 text-text-secondary font-medium text-center hidden sm:table-cell">Accuracy</th>
                  <th className="p-2 md:p-4 text-text-secondary font-medium text-center hidden md:table-cell">Champion</th>
                  <th className="p-2 md:p-4 text-text-secondary font-medium text-right hidden sm:table-cell">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rest.map((user) => (
                  <tr 
                    key={user.entryId} 
                    className="hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => setSelectedUser(user)}
                  >
                    <td className="p-2 md:p-4 text-center font-bold text-text-muted">{user.status === 'Eliminated' ? '-' : `#${user.rank}`}</td>
                    <td className="p-2 md:p-4">
                      <div className="flex items-center gap-2 md:gap-3">
                        <Avatar photoURL={user.photoURL} avatar={user.avatar} name={user.name} className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-card-hover text-[10px] md:text-xs font-bold border border-[rgba(0,217,255,0.18)]" />
                        <span className={`font-bold text-sm md:text-base truncate max-w-[100px] sm:max-w-[150px] md:max-w-none ${user.status === 'Eliminated' ? 'text-red-500' : ''}`}>{user.name}</span>
                      </div>
                    </td>
                    <td className="p-2 md:p-4 text-center font-bold text-cyan-primary text-sm md:text-base">
                      {user.status === 'Eliminated' ? <span className="text-text-muted font-normal">-</span> : user.score}
                    </td>
                    <td className="p-2 md:p-4 text-center text-sm hidden sm:table-cell">
                      {user.status === 'Eliminated' ? <span className="text-text-muted">-</span> : `${user.accuracy}%`}
                    </td>
                    <td className="p-2 md:p-4 text-center hidden md:table-cell">
                      {user.championTeam ? (
                        <div className="w-10 h-7 mx-auto rounded overflow-hidden shadow-sm border border-white/20" title={user.championTeam.name}>
                          <img src={user.championTeam.flagUrl} alt={user.championTeam.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <span className="text-text-muted">-</span>
                      )}
                    </td>
                    <td className="p-2 md:p-4 text-right hidden sm:table-cell">
                      <span className={`text-[10px] md:text-xs px-2 py-1 rounded-full ${
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

      <UserPicksModal 
        user={selectedUser} 
        isOpen={!!selectedUser} 
        onClose={() => setSelectedUser(null)} 
        allMatches={allMatches} 
        allTeams={allTeams} 
      />
    </div>
  );
}
