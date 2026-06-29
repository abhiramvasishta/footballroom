import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, Clock, MapPin, BarChart3, Lock, Trophy } from 'lucide-react';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Match, Team } from '../types';
import { cn } from '../utils/cn';
import { formatISTDateOnly, formatISTTimeOnly } from '../utils/date';

interface Props {
  match: Match;
  homeTeam: Team | null;
  awayTeam: Team | null;
  onClose: () => void;
}

export const MatchDetailsModal = ({ match, homeTeam, awayTeam, onClose }: Props) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ home: 0, away: 0, total: 0 });
  const isLocked = match.isLocked || false;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const snap = await getDoc(doc(db, 'statistics', `match_${match.id}`));
        if (snap.exists()) {
          const data = snap.data();
          setStats({
            home: data.homeCount || 0,
            away: data.awayCount || 0,
            total: data.total || 0
          });
        }
      } catch (err) {
        console.error("Failed to fetch match stats", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [match.id, match.homeTeamId, match.awayTeamId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  const homePercent = stats.total > 0 ? Math.round((stats.home / stats.total) * 100) : 0;
  const awayPercent = stats.total > 0 ? Math.round((stats.away / stats.total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <motion.div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <motion.div 
        layoutId={`match-details-${match.id}`}
        className="relative w-full max-w-lg bg-bg-primary border border-cyan-primary/50 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-primary/5 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[rgba(0,217,255,0.18)] bg-bg-primary/95 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-white/10 text-cyan-primary font-bold text-xs uppercase tracking-wider rounded-full border border-cyan-primary/30">
              {match.round}
            </span>
            {isLocked ? (
              <span className="flex items-center gap-1 text-red-400 text-xs font-bold bg-red-500/10 px-2 py-1 rounded-full border border-red-500/20">
                <Lock size={12} /> Locked
              </span>
            ) : (
              <span className="flex items-center gap-1 text-green-400 text-xs font-bold bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
                Open
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 relative z-10">
          
          <div className="flex items-center justify-between w-full mb-8">
            <div className="flex flex-col items-center gap-3 flex-1">
              {homeTeam ? (
                <>
                  <div className={cn("w-20 h-14 md:w-24 md:h-16 rounded overflow-hidden shadow-lg border-2", match.completed && match.winnerTeamId === homeTeam.id ? "border-cyan-primary" : "border-[rgba(0,217,255,0.18)]")}>
                    <img src={homeTeam.flagUrl} alt={homeTeam.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="font-bold text-lg font-display text-center">{homeTeam.name}</span>
                  {match.completed && match.winnerTeamId === homeTeam.id && (
                     <span className="text-xs font-bold text-cyan-primary uppercase tracking-widest flex items-center gap-1"><Trophy size={12}/> Winner</span>
                  )}
                </>
              ) : (
                <span className="text-text-muted font-bold">TBD</span>
              )}
            </div>
            
            <div className="px-4 flex flex-col items-center">
              <span className="font-black italic text-text-muted text-xl">VS</span>
            </div>
            
            <div className="flex flex-col items-center gap-3 flex-1">
              {awayTeam ? (
                <>
                  <div className={cn("w-20 h-14 md:w-24 md:h-16 rounded overflow-hidden shadow-lg border-2", match.completed && match.winnerTeamId === awayTeam.id ? "border-cyan-primary" : "border-[rgba(0,217,255,0.18)]")}>
                    <img src={awayTeam.flagUrl} alt={awayTeam.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="font-bold text-lg font-display text-center">{awayTeam.name}</span>
                  {match.completed && match.winnerTeamId === awayTeam.id && (
                     <span className="text-xs font-bold text-cyan-primary uppercase tracking-widest flex items-center gap-1"><Trophy size={12}/> Winner</span>
                  )}
                </>
              ) : (
                <span className="text-text-muted font-bold">TBD</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8 bg-black/20 p-4 rounded-xl border border-white/5">
            <div className="flex flex-col gap-1">
              <span className="text-text-muted text-[10px] uppercase tracking-wider font-bold">Date</span>
              <span className="text-sm font-bold flex items-center gap-2"><Calendar size={14} className="text-cyan-primary"/> {formatISTDateOnly(match.kickoff)}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-text-muted text-[10px] uppercase tracking-wider font-bold">Time (IST)</span>
              <span className="text-sm font-bold flex items-center gap-2"><Clock size={14} className="text-cyan-primary"/> {formatISTTimeOnly(match.kickoff)}</span>
            </div>
            <div className="flex flex-col gap-1 col-span-2">
              <span className="text-text-muted text-[10px] uppercase tracking-wider font-bold">Location</span>
              <span className="text-sm font-bold flex items-center gap-2"><MapPin size={14} className="text-cyan-primary"/> {match.stadium}, {match.city}</span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="text-sm uppercase tracking-wider font-bold text-text-secondary flex items-center gap-2 border-b border-[rgba(0,217,255,0.18)] pb-2">
              <BarChart3 size={16} /> Prediction Analytics
            </h3>
            
            {loading ? (
              <div className="flex justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-primary" />
              </div>
            ) : homeTeam && awayTeam ? (
              <div className="flex flex-col gap-3">
                <div className="flex justify-between text-sm font-bold">
                  <span className={homePercent >= awayPercent ? "text-cyan-primary" : "text-white"}>{homeTeam.name}</span>
                  <span className={awayPercent > homePercent ? "text-cyan-primary" : "text-white"}>{awayTeam.name}</span>
                </div>
                <div className="w-full h-3 bg-bg-primary rounded-full flex overflow-hidden border border-[rgba(0,217,255,0.18)]">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${homePercent}%` }} 
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-blue-500"
                  />
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${awayPercent}%` }} 
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-red-500"
                  />
                </div>
                <div className="flex justify-between text-xs text-text-secondary font-bold">
                  <span>{homePercent}%</span>
                  <span>{awayPercent}%</span>
                </div>
                <p className="text-center text-[10px] text-text-muted mt-2">Based on {stats.total} total predictions</p>
              </div>
            ) : (
              <p className="text-center text-sm text-text-muted py-4">Teams not yet determined.</p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
