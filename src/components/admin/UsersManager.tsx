import { useState, useEffect, useMemo } from 'react';
import { fetchAllUsers, fetchAllPredictions, fetchTeams, fetchMatches } from '../../lib/services';
import type { UserData, PredictionDoc, Team, Match } from '../../types';
import { goldenBallPlayers } from '../../data/goldenBallPlayers';
import { X, Search } from 'lucide-react';

export const UsersManager = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [predictions, setPredictions] = useState<PredictionDoc[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'submitted' | 'pending'>('all');
  
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [u, p, t, m] = await Promise.all([
        fetchAllUsers(),
        fetchAllPredictions(),
        fetchTeams(),
        fetchMatches()
      ]);
      // Sort users by rank (handling nulls)
      u.sort((a, b) => {
        if (a.rank && b.rank) return a.rank - b.rank;
        if (a.rank) return -1;
        if (b.rank) return 1;
        return (b.score || 0) - (a.score || 0);
      });
      setUsers(u);
      setPredictions(p);
      setTeams(t);
      setMatches(m);
      setLoading(false);
    };
    loadData();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || 
                            u.entryId.toLowerCase().includes(search.toLowerCase());
      
      const hasSubmitted = !!u.submittedAt;

      if (filterStatus === 'submitted') return matchesSearch && hasSubmitted;
      if (filterStatus === 'pending') return matchesSearch && !hasSubmitted;
      
      return matchesSearch;
    });
  }, [users, search, filterStatus]);

  const selectedPrediction = selectedUser 
    ? predictions.find(p => p.entryId === selectedUser.entryId) 
    : null;

  const getTeamName = (teamId: string) => teams.find(t => t.id === teamId)?.name || teamId;
  const getPlayerName = (playerId: string) => goldenBallPlayers.find(p => p.id === playerId)?.name || playerId;

  return (
    <div className="bg-bg-secondary p-6 rounded-xl border border-[rgba(0,217,255,0.18)] flex flex-col h-full">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold font-display">Users & Predictions</h2>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'submitted' | 'pending')}
            className="bg-bg-primary border border-white/20 rounded-lg px-4 py-2 text-white focus:border-cyan-primary outline-none text-sm appearance-none"
          >
            <option value="all">All Users</option>
            <option value="submitted">Submitted Only</option>
            <option value="pending">Pending (Not Submitted)</option>
          </select>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-bg-primary border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white focus:border-cyan-primary outline-none text-sm"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-primary"></div>
        </div>
      ) : (
        <div className="overflow-x-auto flex-1 border border-white/10 rounded-lg">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-bg-primary/95 backdrop-blur-sm z-10 shadow-sm border-b border-[rgba(0,217,255,0.18)]">
              <tr>
                <th className="p-4 text-text-secondary font-medium tracking-wider uppercase text-[10px]">Rank</th>
                <th className="p-4 text-text-secondary font-medium tracking-wider uppercase text-[10px]">Player</th>
                <th className="p-4 text-text-secondary font-medium tracking-wider uppercase text-[10px]">Score</th>
                <th className="p-4 text-text-secondary font-medium tracking-wider uppercase text-[10px]">Accuracy</th>
                <th className="p-4 text-text-secondary font-medium tracking-wider uppercase text-[10px]">Status</th>
                <th className="p-4 text-text-secondary font-medium tracking-wider uppercase text-[10px] text-right">Predictions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.map(user => (
                <tr key={user.entryId} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 font-mono font-bold text-cyan-primary text-xs">
                    {user.rank ? `#${user.rank}` : '—'}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-bg-primary border border-white/10 shrink-0">
                        {user.photoURL ? (
                          <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <img src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`} alt={user.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-white text-sm">{user.name}</span>
                        <span className="text-[10px] text-text-secondary font-mono">{user.entryId}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-bold font-mono text-white text-base">{user.score}</td>
                  <td className="p-4 text-sm font-mono text-cyan-primary">{user.accuracy}%</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-[10px] font-bold tracking-wider uppercase rounded inline-block w-max ${
                      user.status === 'Eliminated' ? 'bg-status-danger/20 text-status-danger' :
                      user.status === 'Champion' ? 'bg-status-success/20 text-status-success' :
                      'bg-white/10 text-text-primary'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => setSelectedUser(user)}
                      className="px-3 py-1.5 bg-cyan-primary/10 text-cyan-primary border border-cyan-primary/30 rounded text-xs font-bold uppercase tracking-widest hover:bg-cyan-primary hover:text-navy-900 transition-colors"
                    >
                      View Picks
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-text-secondary">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Predictions Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-bg-primary border border-cyan-primary/30 rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(0,217,255,0.1)] overflow-hidden">
            
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-white/10 bg-bg-secondary shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-bg-primary border border-cyan-primary/50">
                  <img src={selectedUser.photoURL || selectedUser.avatar || ''} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col">
                  <h3 className="font-bold text-white text-lg">{selectedUser.name}'s Predictions</h3>
                  <span className="text-xs text-text-secondary">Score: {selectedUser.score} | Accuracy: {selectedUser.accuracy}%</span>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} className="text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {!selectedPrediction ? (
                <div className="p-8 text-center text-text-secondary italic">
                  User hasn't submitted any predictions yet.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-bg-secondary p-4 rounded-lg border border-cyan-primary/20 flex flex-col items-center justify-center text-center">
                      <span className="text-xs uppercase tracking-widest text-text-secondary font-bold mb-1">Predicted Champion</span>
                      <span className="text-xl font-display font-bold text-cyan-primary drop-shadow-[0_0_8px_rgba(0,217,255,0.5)]">
                        {selectedPrediction.predictedChampion ? getTeamName(selectedPrediction.predictedChampion) : 'Not Selected'}
                      </span>
                    </div>
                    
                    <div className="bg-bg-secondary p-4 rounded-lg border border-[#d4af37]/30 flex flex-col items-center justify-center text-center">
                      <span className="text-xs uppercase tracking-widest text-text-secondary font-bold mb-1">Golden Ball Winner</span>
                      <span className="text-lg font-bold text-[#d4af37] drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]">
                        {selectedPrediction.goldenBallPlayerId ? getPlayerName(selectedPrediction.goldenBallPlayerId) : 'Not Selected'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-widest text-text-secondary mb-3 border-b border-white/10 pb-2">Match Picks</h4>
                    <div className="space-y-2">
                      {matches.map(match => {
                        const predictedWinnerId = selectedPrediction.picks[match.id];
                        if (!predictedWinnerId) return null;
                        
                        return (
                          <div key={match.id} className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5 text-sm">
                            <span className="font-mono text-cyan-primary/70 text-xs w-16">{match.id}</span>
                            <span className="text-text-secondary flex-1">
                              {getTeamName(match.homeTeamId || '')} <span className="mx-2 text-xs opacity-50">vs</span> {getTeamName(match.awayTeamId || '')}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-text-muted">Picked:</span>
                              <span className="font-bold text-white bg-white/10 px-2 py-1 rounded">
                                {getTeamName(predictedWinnerId)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      {Object.keys(selectedPrediction.picks).length === 0 && (
                        <p className="text-text-secondary text-sm italic">No individual match picks found.</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
