import { useState, useEffect } from 'react';
import { LiveStreamPlayer } from './LiveStreamPlayer';
import type { Match, Team, TournamentSettings } from '../../types';
import { MapPin, VideoOff } from 'lucide-react';

interface Props {
  matches: Match[];
  teams: Team[];
  settings: TournamentSettings | null;
}

const CountdownTimer = ({ targetDate }: { targetDate: string }) => {
  const [timeLeft, setTimeLeft] = useState<{ hours: string; minutes: string; seconds: string } | null>(null);

  useEffect(() => {
    const targetTime = new Date(targetDate).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = targetTime - now;

      if (difference <= 0) {
        setTimeLeft({ hours: '00', minutes: '00', seconds: '00' });
        return;
      }

      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({
        hours: hours.toString().padStart(2, '0'),
        minutes: minutes.toString().padStart(2, '0'),
        seconds: seconds.toString().padStart(2, '0'),
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!timeLeft) return null;

  return (
    <div className="flex items-center justify-center gap-4 mt-6">
      <div className="flex flex-col items-center">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 w-20 flex items-center justify-center backdrop-blur-sm shadow-xl">
          <span className="text-3xl font-mono font-bold text-white">{timeLeft.hours}</span>
        </div>
        <span className="text-xs text-text-secondary mt-2 uppercase tracking-widest font-bold">Hours</span>
      </div>
      <span className="text-2xl text-cyan-primary/50 font-bold -mt-6">:</span>
      <div className="flex flex-col items-center">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 w-20 flex items-center justify-center backdrop-blur-sm shadow-xl">
          <span className="text-3xl font-mono font-bold text-white">{timeLeft.minutes}</span>
        </div>
        <span className="text-xs text-text-secondary mt-2 uppercase tracking-widest font-bold">Mins</span>
      </div>
      <span className="text-2xl text-cyan-primary/50 font-bold -mt-6">:</span>
      <div className="flex flex-col items-center">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 w-20 flex items-center justify-center backdrop-blur-sm shadow-xl">
          <span className="text-3xl font-mono font-bold text-cyan-primary">{timeLeft.seconds}</span>
        </div>
        <span className="text-xs text-text-secondary mt-2 uppercase tracking-widest font-bold">Secs</span>
      </div>
    </div>
  );
};

export const LiveStreamView = ({ matches, teams, settings }: Props) => {
  const getTeam = (id: string | null) => teams.find(t => t.id === id);

  const config = settings?.liveStream;
  const mode = config?.mode || 'Auto';
  const streams = config?.streams || [];

  const now = new Date().getTime();
  
  // Sort matches by kickoff
  const sortedMatches = [...matches].sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime());
  
  // A match is considered live if it hasn't completed and kickoff has passed
  const currentLiveMatch = sortedMatches.find(m => !m.completed && new Date(m.kickoff).getTime() <= now);
  // Next upcoming match that hasn't kicked off
  const nextMatch = sortedMatches.find(m => !m.completed && new Date(m.kickoff).getTime() > now);

  let state: 'LIVE' | 'COUNTDOWN' | 'OFFLINE' = 'OFFLINE';

  if (mode === 'Auto') {
    if (currentLiveMatch) state = 'LIVE';
    else if (nextMatch) state = 'COUNTDOWN';
    else state = 'OFFLINE';
  } else if (mode === 'Live Now') {
    state = 'LIVE';
  } else if (mode === 'Countdown') {
    state = 'COUNTDOWN';
  } else if (mode === 'Offline') {
    state = 'OFFLINE';
  }

  // The match context used for UI
  const displayMatch = state === 'LIVE' ? (currentLiveMatch || nextMatch || sortedMatches[0]) : nextMatch;

  if (state === 'OFFLINE' || (!displayMatch && state !== 'LIVE')) {
    return (
      <div className="flex flex-col items-center justify-center p-12 glass-card rounded-2xl border border-[rgba(0,217,255,0.18)] text-center min-h-[400px]">
        <VideoOff size={48} className="text-text-muted mb-4" />
        <h2 className="text-2xl font-display font-bold text-white mb-2">No matches are currently live.</h2>
        <p className="text-text-secondary">Please check back later for live broadcasts.</p>
      </div>
    );
  }

  if (state === 'COUNTDOWN' && displayMatch) {
    const homeTeam = getTeam(displayMatch.homeTeamId);
    const awayTeam = getTeam(displayMatch.awayTeamId);

    return (
      <div className="flex flex-col items-center justify-center p-8 md:p-12 glass-card rounded-2xl border border-[rgba(0,217,255,0.18)] text-center min-h-[500px] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-bg-primary/0 to-bg-primary/0 pointer-events-none" />
        
        <div className="z-10 w-full max-w-2xl">
          <div className="inline-block px-4 py-1.5 bg-cyan-primary/10 border border-cyan-primary/20 text-cyan-primary rounded-full text-xs font-bold uppercase tracking-widest mb-8 shadow-[0_0_15px_rgba(0,217,255,0.1)]">
            Upcoming Match
          </div>

          <div className="flex items-center justify-center gap-6 md:gap-12 mb-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-14 md:w-28 md:h-20 rounded shadow-xl border border-white/10 overflow-hidden bg-bg-secondary">
                {homeTeam && <img src={homeTeam.flagUrl} alt={homeTeam.name} className="w-full h-full object-cover" />}
              </div>
              <span className="font-display font-bold text-lg md:text-2xl">{homeTeam?.name || 'TBD'}</span>
            </div>
            
            <div className="text-2xl md:text-4xl font-bold text-text-muted/50 font-display">VS</div>
            
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-14 md:w-28 md:h-20 rounded shadow-xl border border-white/10 overflow-hidden bg-bg-secondary">
                {awayTeam && <img src={awayTeam.flagUrl} alt={awayTeam.name} className="w-full h-full object-cover" />}
              </div>
              <span className="font-display font-bold text-lg md:text-2xl">{awayTeam?.name || 'TBD'}</span>
            </div>
          </div>

          <div className="mb-4">
            <span className="text-text-secondary text-sm font-bold tracking-widest uppercase">Starts In</span>
          </div>
          
          <CountdownTimer targetDate={displayMatch.kickoff} />
          
          <div className="mt-10 flex items-center justify-center gap-4 text-xs text-text-muted">
            <span className="flex items-center gap-1"><MapPin size={14} /> {displayMatch.stadium}, {displayMatch.city}</span>
          </div>
        </div>
      </div>
    );
  }

  // LIVE STATE
  const homeTeam = getTeam(displayMatch?.homeTeamId || null);
  const awayTeam = getTeam(displayMatch?.awayTeamId || null);

  return (
    <div className="flex flex-col gap-6">
      
      {/* Match Context Header */}
      {displayMatch && (
        <div className="glass-card rounded-2xl p-4 md:p-6 border border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.1)] relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/5 to-red-500/0 pointer-events-none animate-pulse" />
          
          <div className="flex flex-col gap-1 text-center md:text-left z-10">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-red-500 font-bold tracking-widest uppercase text-xs">Live Broadcast</span>
            </div>
            <h2 className="text-xl md:text-2xl font-display font-bold text-white">
              {homeTeam?.name || 'TBD'} vs {awayTeam?.name || 'TBD'}
            </h2>
            <div className="flex items-center justify-center md:justify-start gap-3 text-xs text-text-secondary mt-1">
              <span className="uppercase tracking-wider font-bold text-cyan-primary">{displayMatch.round}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><MapPin size={12} /> {displayMatch.stadium}</span>
            </div>
          </div>
          
          {displayMatch && (
            <div className="flex items-center gap-4 z-10 bg-bg-primary/50 px-6 py-3 rounded-xl border border-white/5">
              <div className="flex flex-col items-center">
                <span className="text-3xl font-mono font-bold">{displayMatch.homeScore ?? '-'}</span>
              </div>
              <span className="text-xl text-cyan-primary/50">-</span>
              <div className="flex flex-col items-center">
                <span className="text-3xl font-mono font-bold">{displayMatch.awayScore ?? '-'}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stream Player */}
      <div className="w-full max-w-5xl mx-auto">
        <LiveStreamPlayer streams={streams} />
      </div>

    </div>
  );
};
