import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Camera } from 'lucide-react';
import { AnimatedTransition } from '../components/AnimatedTransition';
import { HighlightCard } from '../components/HighlightCard';
import { VideoPlayerModal } from '../components/VideoPlayerModal';
import { CardSkeleton } from '../components/Skeleton';
import { fetchMatches, fetchTeams } from '../lib/services';
import type { Match, Team } from '../types';

export default function HighlightsPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [selectedRound, setSelectedRound] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [fetchedMatches, fetchedTeams] = await Promise.all([
          fetchMatches(),
          fetchTeams()
        ]);
        
        // Sort chronologically by kickoff
        const sortedMatches = fetchedMatches.sort((a, b) => 
          new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
        );
        
        setMatches(sortedMatches);
        setTeams(fetchedTeams);
        
        // Auto-select the first available round if none is selected
        const rounds = ['Round of 32', 'Round of 16', 'Quarter Finals', 'Semi Finals', 'Third Place', 'Final'];
        const firstAvailable = rounds.find(r => sortedMatches.some(m => m.round === r));
        if (firstAvailable) {
          setSelectedRound(firstAvailable);
        }
      } catch (err) {
        console.error("Failed to fetch highlights data:", err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const handleWatch = (match: Match) => {
    setSelectedMatch(match);
  };

  const getTeam = (teamId: string | null) => {
    if (!teamId) return null;
    return teams.find(t => t.id === teamId) || null;
  };

  if (loading) {
    return (
      <AnimatedTransition className="min-h-screen bg-bg-primary p-4 md:p-8 pt-12 pb-24">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-white mb-2 tracking-wide">Match Highlights</h1>
            <p className="text-text-secondary uppercase tracking-widest text-xs">The best moments of the tournament.</p>
          </div>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </AnimatedTransition>
    );
  }

  return (
    <AnimatedTransition className="min-h-screen bg-bg-primary p-4 md:p-8 pt-12 pb-24">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        
        <div className="mb-4">
          <h1 className="text-3xl font-display font-bold text-white mb-2 tracking-wide">Match Highlights</h1>
          <p className="text-text-secondary uppercase tracking-widest text-xs">Relive the best moments of the tournament.</p>
        </div>

        {matches.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar mb-2 border-b border-[rgba(0,217,255,0.1)]">
            {['Round of 32', 'Round of 16', 'Quarter Finals', 'Semi Finals', 'Third Place', 'Final']
              .filter(r => matches.some(m => m.round === r))
              .map(round => (
              <button
                key={round}
                onClick={() => setSelectedRound(round)}
                className={`px-4 py-1.5 sm:py-2 rounded-full whitespace-nowrap text-xs sm:text-sm font-medium transition-colors ${
                  selectedRound === round 
                    ? 'bg-cyan-primary text-navy-900 shadow-[0_0_15px_rgba(0,217,255,0.4)] font-bold' 
                    : 'bg-white/5 text-text-secondary hover:bg-white/10 hover:text-white border border-white/5'
                }`}
              >
                {round}
              </button>
            ))}
          </div>
        )}

        {matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 glass-card rounded-2xl border border-[rgba(0,217,255,0.18)] text-center h-64">
            <Camera size={48} className="text-cyan-primary mb-4 opacity-50" />
            <h2 className="text-xl font-display font-bold text-white mb-2">No match highlights are available yet.</h2>
            <p className="text-text-secondary">The best moments of the tournament will appear here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {['Round of 32', 'Round of 16', 'Quarter Finals', 'Semi Finals', 'Third Place', 'Final']
              .filter(round => selectedRound === round)
              .map(round => ({
                round,
                roundMatches: matches.filter(m => m.round === round)
              }))
              .filter(group => group.roundMatches.length > 0)
              .map(group => (
                <div key={group.round} className="flex flex-col gap-4">
                  <h2 className="text-2xl font-display font-bold text-cyan-primary border-b border-[rgba(0,217,255,0.18)] pb-2">
                    {group.round}
                  </h2>
                  <div className="flex flex-col gap-6">
                    {group.roundMatches.map(match => (
                      <HighlightCard 
                        key={match.id}
                        match={match}
                        homeTeam={getTeam(match.homeTeamId)}
                        awayTeam={getTeam(match.awayTeamId)}
                        onWatch={() => handleWatch(match)}
                      />
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedMatch && (
          <VideoPlayerModal 
            match={selectedMatch}
            homeTeam={getTeam(selectedMatch.homeTeamId)}
            awayTeam={getTeam(selectedMatch.awayTeamId)}
            onClose={() => setSelectedMatch(null)}
          />
        )}
      </AnimatePresence>
    </AnimatedTransition>
  );
}
