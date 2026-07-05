import { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { fetchMatches, fetchTeams } from '../lib/services';
import { Users, Target, Trophy, Activity, BarChart3 } from 'lucide-react';

export const GlobalAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [matchesStats, setMatchesStats] = useState<any[]>([]);

  useEffect(() => {
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

    loadAnalytics();
  }, []);

  if (loading) return <div className="p-8 text-center text-text-secondary flex justify-center items-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-primary"></div></div>;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Top Level Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl border border-white/5 flex flex-col items-center text-center group hover:border-cyan-primary/30 transition-all">
          <Users className="text-blue-400 mb-2 group-hover:scale-110 transition-transform" size={24} />
          <span className="text-2xl font-bold font-mono text-white">{stats.registeredUsers}</span>
          <span className="text-xs text-text-secondary uppercase tracking-wider mt-1">Users</span>
        </div>
        <div className="glass-card p-4 rounded-xl border border-white/5 flex flex-col items-center text-center group hover:border-cyan-primary/30 transition-all">
          <Activity className="text-green-400 mb-2 group-hover:scale-110 transition-transform" size={24} />
          <span className="text-2xl font-bold font-mono text-white">{stats.predictionsSubmitted}</span>
          <span className="text-xs text-text-secondary uppercase tracking-wider mt-1">Submitted</span>
        </div>
        <div className="glass-card p-4 rounded-xl border border-white/5 flex flex-col items-center text-center group hover:border-cyan-primary/30 transition-all">
          <Target className="text-purple-400 mb-2 group-hover:scale-110 transition-transform" size={24} />
          <span className="text-2xl font-bold font-mono text-white">{stats.avgAccuracy}%</span>
          <span className="text-xs text-text-secondary uppercase tracking-wider mt-1">Avg Accuracy</span>
        </div>
        <div className="glass-card p-4 rounded-xl border border-[rgba(0,217,255,0.18)] flex flex-col items-center text-center group hover:border-cyan-primary/50 transition-all shadow-[0_0_15px_rgba(0,217,255,0.05)]">
          <Trophy className="text-cyan-primary mb-2 group-hover:scale-110 transition-transform" size={24} />
          <span className="text-2xl font-bold font-mono text-cyan-primary drop-shadow-[0_0_8px_rgba(0,217,255,0.3)]">{stats.avgScore}</span>
          <span className="text-xs text-text-secondary uppercase tracking-wider mt-1">Avg Score</span>
        </div>
      </div>

      {/* Champion Stat */}
      <div className="glass-card p-6 md:p-8 rounded-xl border border-[#e5b969]/30 flex flex-col items-center justify-center relative overflow-hidden group hover:border-[#e5b969]/60 transition-all shadow-[0_0_20px_rgba(229,185,105,0.05)]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#e5b969]/10 to-transparent pointer-events-none" />
        <h3 className="text-xs md:text-sm uppercase tracking-widest text-[#e5b969] mb-6 z-10 font-black">Most Predicted Champion</h3>
        {stats.mostPredictedChampion ? (
          <div className="flex flex-col items-center gap-3 z-10">
            <div className="w-24 h-16 md:w-32 md:h-20 rounded-lg overflow-hidden shadow-lg border-2 border-[#e5b969] bg-bg-secondary p-1 group-hover:scale-105 transition-transform">
              <img src={stats.mostPredictedChampion.flagUrl} alt="" className="w-full h-full object-cover rounded" />
            </div>
            <span className="text-2xl md:text-3xl font-bold text-white uppercase tracking-wider mt-2">{stats.mostPredictedChampion.name}</span>
            <span className="text-xs md:text-sm font-bold text-navy-900 bg-[#e5b969] px-4 py-1.5 rounded-full mt-1 shadow-[0_0_15px_rgba(229,185,105,0.4)]">{stats.champPercent}% of users</span>
          </div>
        ) : (
          <span className="text-text-muted z-10 font-bold text-xl">- No data -</span>
        )}
      </div>

      {/* Matches Stats */}
      <div className="glass-card p-6 rounded-xl border border-[rgba(0,217,255,0.18)]">
        <h3 className="text-xl font-display font-bold mb-6 flex items-center gap-2 text-cyan-primary border-b border-cyan-primary/20 pb-3">
          <BarChart3 /> Match Breakdown
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2 pb-4">
          {matchesStats.map(m => {
            if (!m.homeTeam || !m.awayTeam) return null;
            return (
              <div key={m.match.id} className="bg-bg-primary/50 p-4 md:p-5 rounded-lg border border-white/5 hover:bg-white/5 transition-colors">
                <div className="flex justify-between items-center mb-4 text-xs text-text-secondary">
                  <span className="text-cyan-primary font-bold tracking-wider">{m.match.id}</span>
                  <span className="font-mono bg-white/5 px-2 py-1 rounded">{m.total} picks</span>
                </div>
                
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between text-sm font-bold">
                    <span className={m.homePercent >= m.awayPercent ? "text-white flex items-center gap-2 drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]" : "text-text-secondary flex items-center gap-2"}><img src={m.homeTeam.flagUrl} className="w-5 h-3.5 inline-block rounded-sm" /> {m.homeTeam.name}</span>
                    <span className={m.awayPercent > m.homePercent ? "text-white flex items-center gap-2 drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]" : "text-text-secondary flex items-center gap-2"}>{m.awayTeam.name} <img src={m.awayTeam.flagUrl} className="w-5 h-3.5 inline-block rounded-sm" /></span>
                  </div>
                  
                  <div className="w-full h-2.5 bg-bg-secondary rounded-full flex overflow-hidden shadow-inner">
                    <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 relative" style={{ width: `${m.homePercent}%` }}>
                      {m.homePercent > 10 && <span className="absolute right-1 text-[8px] text-white font-bold h-full flex items-center">{m.homePercent}%</span>}
                    </div>
                    <div className="h-full bg-gradient-to-r from-red-400 to-red-600 relative" style={{ width: `${m.awayPercent}%` }}>
                      {m.awayPercent > 10 && <span className="absolute left-1 text-[8px] text-white font-bold h-full flex items-center">{m.awayPercent}%</span>}
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-xs font-bold font-mono mt-1">
                    <span className="text-blue-400">{m.homePercent}%</span>
                    <span className="text-red-400">{m.awayPercent}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
