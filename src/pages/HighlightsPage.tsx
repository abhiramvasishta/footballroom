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

        {matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 glass-card rounded-2xl border border-[rgba(0,217,255,0.18)] text-center h-64">
            <Camera size={48} className="text-cyan-primary mb-4 opacity-50" />
            <h2 className="text-xl font-display font-bold text-white mb-2">No match highlights are available yet.</h2>
            <p className="text-text-secondary">The best moments of the tournament will appear here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {matches.map(match => (
              <HighlightCard 
                key={match.id}
                match={match}
                homeTeam={getTeam(match.homeTeamId)}
                awayTeam={getTeam(match.awayTeamId)}
                onWatch={() => handleWatch(match)}
              />
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
