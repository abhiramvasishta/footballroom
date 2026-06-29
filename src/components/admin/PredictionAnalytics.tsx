import { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { fetchMatches, fetchTeams } from '../../lib/services';
import { recalculateAggregates } from '../../lib/aggregates';
import { Users, BarChart3, Trophy, Target, Activity, RefreshCw } from 'lucide-react';

export const PredictionAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [matchesStats, setMatchesStats] = useState<any[]>([]);

  const loadAnalytics = async () => {
    try {
      const [globalSnap, champSnap, matches, teams] = await Promise.all([
        getDoc(doc(db, 'statistics', 'global')),
        getDoc(doc(db, 'statistics', 'champions')),
        fetchMatches(),
        fetchTeams()
      ]);

      const globalStats = globalSnap.exists() ? globalSnap.data() : {
        registeredUsers: 0, predictionsSubmitted: 0, avgScore: 0, avgAccuracy: 0, totalPredictions: 0
      };
      
      const champCounts = champSnap.exists() ? champSnap.data() : {};
      
      let mostPredictedChampion = null;
      let mostChampCount = 0;
      Object.entries(champCounts).forEach(([teamId, count]) => {
        if (typeof count === 'number' && count > mostChampCount) {
          mostChampCount = count;
          mostPredictedChampion = teams.find(t => t.id === teamId);
        }
      });
      const champPercent = globalStats.totalPredictions > 0 ? Math.round((mostChampCount / globalStats.totalPredictions) * 100) : 0;

      // Fetch matches stats
      const matchesStatsSnap = await getDocs(collection(db, 'statistics'));
      const mStats = matches.map(m => {
        const docSnap = matchesStatsSnap.docs.find(d => d.id === `match_${m.id}`);
        const data = docSnap ? docSnap.data() : { homePercent: 0, awayPercent: 0, total: 0 };
        
        return {
          match: m,
          homeTeam: teams.find(t => t.id === m.homeTeamId),
          awayTeam: teams.find(t => t.id === m.awayTeamId),
          ...data
        };
      }).sort((a, b) => new Date(a.match.kickoff).getTime() - new Date(b.match.kickoff).getTime());

      setStats({
        ...globalStats,
        mostPredictedChampion,
        champPercent
      });
      setMatchesStats(mStats);

    } catch (err) {
      console.error("Failed to load analytics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await recalculateAggregates();
      await loadAnalytics();
    } catch (err) {
      console.error(err);
      alert("Failed to refresh aggregates");
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-text-secondary">Loading analytics...</div>;

  return (
    <div className="bg-bg-secondary p-6 rounded-xl border border-[rgba(0,217,255,0.18)]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="text-cyan-primary" /> Prediction Analytics
        </h2>
        <button 
          onClick={handleRefresh}
          disabled={refreshing}
          className="bg-card-hover hover:bg-navy-600 border border-[rgba(0,217,255,0.18)] px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /> 
          Refresh Aggregates
        </button>
      </div>

      {/* Top Level Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-bg-primary p-4 rounded-lg border border-white/5 flex flex-col items-center text-center">
          <Users className="text-blue-400 mb-2" size={24} />
          <span className="text-2xl font-bold">{stats.registeredUsers}</span>
          <span className="text-xs text-text-secondary uppercase">Users</span>
        </div>
        <div className="bg-bg-primary p-4 rounded-lg border border-white/5 flex flex-col items-center text-center">
          <Activity className="text-green-400 mb-2" size={24} />
          <span className="text-2xl font-bold">{stats.predictionsSubmitted}</span>
          <span className="text-xs text-text-secondary uppercase">Submitted</span>
        </div>
        <div className="bg-bg-primary p-4 rounded-lg border border-white/5 flex flex-col items-center text-center">
          <Target className="text-purple-400 mb-2" size={24} />
          <span className="text-2xl font-bold">{stats.avgAccuracy}%</span>
          <span className="text-xs text-text-secondary uppercase">Avg Accuracy</span>
        </div>
        <div className="bg-bg-primary p-4 rounded-lg border border-white/5 flex flex-col items-center text-center">
          <Trophy className="text-cyan-primary mb-2" size={24} />
          <span className="text-2xl font-bold text-cyan-primary">{stats.avgScore}</span>
          <span className="text-xs text-text-secondary uppercase">Avg Score</span>
        </div>
      </div>

      {/* Champion Stat */}
      <div className="bg-bg-primary p-6 rounded-lg border border-cyan-primary/30 mb-8 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-primary/10 to-transparent pointer-events-none" />
        <h3 className="text-sm uppercase tracking-wider text-text-secondary mb-4 z-10">Most Predicted Champion</h3>
        {stats.mostPredictedChampion ? (
          <div className="flex flex-col items-center gap-2 z-10">
            <img src={stats.mostPredictedChampion.flagUrl} alt="" className="w-24 h-16 rounded shadow-lg border-2 border-cyan-primary object-cover" />
            <span className="text-2xl font-bold text-cyan-primary">{stats.mostPredictedChampion.name}</span>
            <span className="text-sm font-bold text-gray-300 bg-white/10 px-3 py-1 rounded-full">{stats.champPercent}% of users</span>
          </div>
        ) : (
          <span className="text-text-muted z-10">No data</span>
        )}
      </div>

      {/* Matches Stats */}
      <h3 className="text-xl font-bold mb-4 border-b border-[rgba(0,217,255,0.18)] pb-2">Match Predictions</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
        {matchesStats.map(m => {
          if (!m.homeTeam || !m.awayTeam) return null;
          return (
            <div key={m.match.id} className="bg-bg-primary p-4 rounded-lg border border-white/5">
              <div className="flex justify-between items-center mb-4 text-xs text-text-secondary">
                <span className="text-cyan-primary font-bold">{m.match.id}</span>
                <span>{m.total} predictions</span>
              </div>
              
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-sm font-bold">
                  <span className={m.homePercent >= m.awayPercent ? "text-white" : "text-text-secondary flex items-center gap-2"}><img src={m.homeTeam.flagUrl} className="w-4 h-3 inline-block" /> {m.homeTeam.name}</span>
                  <span className={m.awayPercent > m.homePercent ? "text-white" : "text-text-secondary flex items-center gap-2"}>{m.awayTeam.name} <img src={m.awayTeam.flagUrl} className="w-4 h-3 inline-block" /></span>
                </div>
                
                <div className="w-full h-3 bg-bg-secondary rounded-full flex overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${m.homePercent}%` }} />
                  <div className="h-full bg-red-500" style={{ width: `${m.awayPercent}%` }} />
                </div>
                
                <div className="flex justify-between text-xs font-bold text-text-secondary">
                  <span>{m.homePercent}%</span>
                  <span>{m.awayPercent}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
