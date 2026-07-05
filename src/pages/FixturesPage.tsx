import { useState, useEffect } from 'react';
import { fetchMatches, fetchTeams } from '../lib/services';
import type { Match, Team } from '../types';
import { AnimatedTransition } from '../components/AnimatedTransition';
import { Loader2, Calendar, TableProperties } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Order for matches tab
const ROUND_ORDER = [
  'Round of 32',
  'Round of 16',
  'Quarter Finals',
  'Semi Finals',
  'Third Place',
  'Final'
];

export default function FixturesPage() {
  const [activeTab, setActiveTab] = useState<'matches' | 'standings'>('standings');
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [standingsData, setStandingsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [m, tReq, sReq] = await Promise.all([
          fetchMatches(),
          fetchTeams(),
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/fifa/standings`)
        ]);
        
        setMatches(m);
        setTeams(tReq);
        
        if (sReq.ok) {
          const sData = await sReq.json();
          setStandingsData(sData);
        }
      } catch (err) {
        console.error('Failed to load fixtures data', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <Loader2 className="w-12 h-12 text-cyan-primary animate-spin" />
      </div>
    );
  }

  const renderMatches = () => {
    return (
      <motion.div
        key="matches"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col gap-10 max-w-4xl mx-auto"
      >
        {ROUND_ORDER.map((roundName) => {
          const roundMatches = matches.filter(m => m.round === roundName).sort((a, b) => a.id.localeCompare(b.id));
          if (roundMatches.length === 0) return null;

          return (
            <div key={roundName} className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-cyan-primary/30" />
                <h3 className="text-cyan-primary font-display font-bold uppercase tracking-widest text-sm md:text-base">
                  {roundName}
                </h3>
                <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-cyan-primary/30" />
              </div>
              
              <div className="flex flex-col gap-3">
                {roundMatches.map(m => {
                  let homeTeam = teams.find(t => t.id === m.homeTeamId);
                  let awayTeam = teams.find(t => t.id === m.awayTeamId);
                  
                  // If homeTeam is missing, see if a previous match feeds into this slot and has a winner
                  if (!homeTeam) {
                    const prevMatchHome = matches.find((prev) => prev.nextMatchId === m.id && prev.nextSlot === 'home');
                    if (prevMatchHome && prevMatchHome.winnerTeamId) {
                      homeTeam = teams.find(t => t.id === prevMatchHome.winnerTeamId);
                    }
                  }

                  // If awayTeam is missing, see if a previous match feeds into this slot and has a winner
                  if (!awayTeam) {
                    const prevMatchAway = matches.find((prev) => prev.nextMatchId === m.id && prev.nextSlot === 'away');
                    if (prevMatchAway && prevMatchAway.winnerTeamId) {
                      awayTeam = teams.find(t => t.id === prevMatchAway.winnerTeamId);
                    }
                  }

                  // Fallback to third-place feeds (loserNextMatchId)
                  if (!homeTeam && m.round === 'Third Place') {
                    const prevMatchHome = matches.find((prev) => prev.loserNextMatchId === m.id && prev.loserNextSlot === 'home');
                    if (prevMatchHome && prevMatchHome.winnerTeamId) {
                      // The loser is the one who didn't win
                      const loserId = prevMatchHome.winnerTeamId === prevMatchHome.homeTeamId ? prevMatchHome.awayTeamId : prevMatchHome.homeTeamId;
                      homeTeam = teams.find(t => t.id === loserId);
                    }
                  }

                  if (!awayTeam && m.round === 'Third Place') {
                    const prevMatchAway = matches.find((prev) => prev.loserNextMatchId === m.id && prev.loserNextSlot === 'away');
                    if (prevMatchAway && prevMatchAway.winnerTeamId) {
                      const loserId = prevMatchAway.winnerTeamId === prevMatchAway.homeTeamId ? prevMatchAway.awayTeamId : prevMatchAway.homeTeamId;
                      awayTeam = teams.find(t => t.id === loserId);
                    }
                  }

                  let statusText = m.completed ? 'FT' : (m.date ? 'Scheduled' : 'TBD');
                  if (m.completed) {
                    if (m.penalties) statusText = 'AET (P)';
                    else if (m.extraTime) statusText = 'AET';
                  }

                  return (
                  <div key={m.id} className="glass-card flex items-center justify-between p-2 md:p-4 border-[rgba(0,217,255,0.1)] hover:bg-white/5 transition-colors gap-2 md:gap-4">
                    
                    <div className="flex items-center gap-1 md:gap-2 flex-1 justify-end text-right">
                       <div className="flex items-center gap-1.5 md:gap-3">
                         {m.penalties && m.homePenaltyScore !== undefined && (
                           <span className="text-[10px] md:text-xs text-cyan-primary/70 font-bold hidden md:inline-block">({m.homePenaltyScore})</span>
                         )}
                         <span className="font-bold text-white text-xs md:text-lg">{homeTeam ? homeTeam.id : 'TBD'}</span>
                         {homeTeam ? (
                           <img src={homeTeam.flagUrl} alt={homeTeam.id} className="w-4 h-4 md:w-6 md:h-6 rounded-full object-cover" />
                         ) : (
                           <div className="w-4 h-4 md:w-6 md:h-6 rounded-full bg-white/10" />
                         )}
                       </div>
                    </div>

                    <div className="flex flex-col items-center justify-center px-2 md:px-4 shrink-0 bg-bg-tertiary rounded-lg py-1 md:py-2 border border-white/5 min-w-[60px] md:min-w-[128px]">
                      <div className="text-[8px] md:text-[10px] text-text-secondary uppercase tracking-widest mb-0.5 md:mb-1 whitespace-nowrap">
                        {m.date ? new Date(m.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'TBD'}
                      </div>
                      <div className="font-bold text-sm md:text-xl text-cyan-primary flex items-center gap-1 md:gap-2">
                         <span className="md:hidden text-[9px] text-cyan-primary/70">{m.penalties ? `(${m.homePenaltyScore})` : ''}</span>
                         <span>{m.completed ? `${m.homeScore} - ${m.awayScore}` : 'vs'}</span>
                         <span className="md:hidden text-[9px] text-cyan-primary/70">{m.penalties ? `(${m.awayPenaltyScore})` : ''}</span>
                      </div>
                      <div className="text-[8px] md:text-[10px] text-text-secondary uppercase mt-0.5 md:mt-1">
                        {statusText}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 md:gap-2 flex-1 justify-start">
                       <div className="flex items-center gap-1.5 md:gap-3 flex-row">
                         {awayTeam ? (
                           <img src={awayTeam.flagUrl} alt={awayTeam.id} className="w-4 h-4 md:w-6 md:h-6 rounded-full object-cover" />
                         ) : (
                           <div className="w-4 h-4 md:w-6 md:h-6 rounded-full bg-white/10" />
                         )}
                         <span className="font-bold text-white text-xs md:text-lg">{awayTeam ? awayTeam.id : 'TBD'}</span>
                         {m.penalties && m.awayPenaltyScore !== undefined && (
                           <span className="text-[10px] md:text-xs text-cyan-primary/70 font-bold hidden md:inline-block">({m.awayPenaltyScore})</span>
                         )}
                       </div>
                    </div>

                  </div>
                )})}
              </div>
            </div>
          );
        })}
      </motion.div>
    );
  };

  const renderStandings = () => {
    if (!standingsData || !standingsData.children) {
      return (
        <div className="flex flex-col items-center justify-center text-center py-20 text-text-secondary">
          <TableProperties size={48} className="mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-white mb-2">Standings Not Available</h3>
          <p>The group standings are not available at this moment.</p>
        </div>
      );
    }

    const groups = standingsData.children;

    const getStat = (entry: any, statName: string) => {
      const stat = entry.stats.find((s: any) => s.name === statName);
      return stat ? stat.displayValue : '0';
    };

    return (
      <motion.div
        key="standings"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col gap-10 max-w-6xl mx-auto"
      >
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {groups.map((group: any) => (
            <div key={group.id} className="glass-card overflow-hidden border-[rgba(0,217,255,0.1)]">
              <div className="bg-cyan-primary/10 border-b border-[rgba(0,217,255,0.1)] px-4 py-3">
                <h3 className="font-display font-bold text-cyan-primary">{group.name}</h3>
              </div>
              <div className="w-full">
                <table className="w-full text-[10px] md:text-sm text-left">
                  <thead className="text-[9px] md:text-xs text-text-secondary uppercase bg-bg-tertiary">
                    <tr>
                      <th className="px-1 md:px-4 py-2 w-6 md:w-8 text-center">#</th>
                      <th className="px-1 md:px-4 py-2">Team</th>
                      <th className="px-1 md:px-4 py-2 text-center" title="Played">P</th>
                      <th className="px-1 md:px-4 py-2 text-center" title="Won">W</th>
                      <th className="px-1 md:px-4 py-2 text-center" title="Drawn">D</th>
                      <th className="px-1 md:px-4 py-2 text-center" title="Lost">L</th>
                      <th className="px-1 md:px-4 py-2 text-center" title="Goal Difference">GD</th>
                      <th className="px-1 md:px-4 py-2 text-center font-bold text-cyan-primary" title="Points">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.standings.entries.map((entry: any, idx: number) => (
                      <tr key={entry.team.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                        <td className="px-1 md:px-4 py-2 text-center text-text-secondary">{idx + 1}</td>
                        <td className="px-1 md:px-4 py-2">
                          <div className="flex items-center gap-1 md:gap-3">
                            <img src={entry.team.logos?.[0]?.href} alt={entry.team.name} className="w-4 h-4 md:w-6 md:h-6 rounded-full object-cover shrink-0" />
                            <span className="font-bold text-white truncate max-w-[60px] sm:max-w-[100px] md:max-w-[120px]">{entry.team.displayName}</span>
                          </div>
                        </td>
                        <td className="px-1 md:px-4 py-2 text-center text-text-secondary">{getStat(entry, 'gamesPlayed')}</td>
                        <td className="px-1 md:px-4 py-2 text-center text-text-secondary">{getStat(entry, 'wins')}</td>
                        <td className="px-1 md:px-4 py-2 text-center text-text-secondary">{getStat(entry, 'ties')}</td>
                        <td className="px-1 md:px-4 py-2 text-center text-text-secondary">{getStat(entry, 'losses')}</td>
                        <td className="px-1 md:px-4 py-2 text-center text-text-secondary">{getStat(entry, 'pointDifferential')}</td>
                        <td className="px-1 md:px-4 py-2 text-center font-bold text-cyan-primary">{getStat(entry, 'points')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  };

  return (
    <AnimatedTransition className="min-h-screen bg-bg-primary text-text-primary pt-6 pb-24 relative overflow-x-hidden">
      <div className="max-w-[1600px] mx-auto flex flex-col gap-8 px-4 md:px-8">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-2">Tournament Fixtures</h1>
          <p className="text-text-secondary text-sm max-w-2xl mx-auto">
            Stay up to date with the latest group standings and knockout matches.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-bg-secondary/90 backdrop-blur-md rounded-xl border border-[rgba(0,217,255,0.1)] w-full max-w-md mx-auto sticky top-4 z-20 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
          <button
            onClick={() => setActiveTab('standings')}
            className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 text-sm font-bold transition-all duration-300 ${
              activeTab === 'standings'
                ? 'bg-cyan-primary text-navy-900 shadow-[0_0_15px_rgba(0,217,255,0.3)]'
                : 'text-text-secondary hover:text-white hover:bg-white/5'
            }`}
          >
            <TableProperties size={18} />
            <span>Standings</span>
          </button>
          <button
            onClick={() => setActiveTab('matches')}
            className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 text-sm font-bold transition-all duration-300 ${
              activeTab === 'matches'
                ? 'bg-cyan-primary text-navy-900 shadow-[0_0_15px_rgba(0,217,255,0.3)]'
                : 'text-text-secondary hover:text-white hover:bg-white/5'
            }`}
          >
            <Calendar size={18} />
            <span>Matches</span>
          </button>
        </div>

        {/* Content */}
        <div className="w-full relative mt-4">
          <AnimatePresence mode="wait">
            {activeTab === 'standings' ? renderStandings() : renderMatches()}
          </AnimatePresence>
        </div>

      </div>
    </AnimatedTransition>
  );
}
