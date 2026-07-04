import { useState, useEffect } from 'react';
import { fetchMatches, saveMatch, deleteMatch, fetchTeams, fetchSettings } from '../../lib/services';
import { recalculateAllScores } from '../../lib/scoreEngine';
import type { Match, Team, GoalEvent } from '../../types';
import { formatISTDateOnly, formatISTTimeOnly } from '../../utils/date';
import { syncMatchesFromApi } from '../../lib/apiFootball';

export const MatchesManager = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Form State
  const [id, setId] = useState('');
  const [round, setRound] = useState('Round of 32');
  const [homeTeamId, setHomeTeamId] = useState('');
  const [awayTeamId, setAwayTeamId] = useState('');
  const [date, setDate] = useState('');
  const [kickoff, setKickoff] = useState('');
  const [stadium, setStadium] = useState('');
  const [city, setCity] = useState('');
  const [winnerTeamId, setWinnerTeamId] = useState('');
  const [completed, setCompleted] = useState(false);
  const [nextMatchId, setNextMatchId] = useState('');
  const [nextSlot, setNextSlot] = useState<'home' | 'away' | ''>('');
  const [loserNextMatchId, setLoserNextMatchId] = useState('');
  const [loserNextSlot, setLoserNextSlot] = useState<'home' | 'away' | ''>('');
  const [isLocked, setIsLocked] = useState(false);
  const [homeScore, setHomeScore] = useState<number | ''>('');
  const [awayScore, setAwayScore] = useState<number | ''>('');
  const [homePenaltyScore, setHomePenaltyScore] = useState<number | ''>('');
  const [awayPenaltyScore, setAwayPenaltyScore] = useState<number | ''>('');
  const [extraTime, setExtraTime] = useState(false);
  const [penalties, setPenalties] = useState(false);
  const [highlightUrl, setHighlightUrl] = useState('');
  const [goals, setGoals] = useState<GoalEvent[]>([]);

  // Telegram Link Resolver State
  const [telegramLink, setTelegramLink] = useState('');
  const [resolving, setResolving] = useState(false);
  const [videoMetadata, setVideoMetadata] = useState<any>(null);
  const [resolveError, setResolveError] = useState('');

  const loadData = async () => {
    setLoading(true);
    const [matchesData, teamsData] = await Promise.all([fetchMatches(), fetchTeams()]);
    // Sort logically
    matchesData.sort((a, b) => {
      if (a.round !== b.round) return a.round.localeCompare(b.round);
      return a.id.localeCompare(b.id);
    });
    setMatches(matchesData);
    setTeams(teamsData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    let processedHighlightUrl = highlightUrl;

    const matchToSave: any = {
      id, round, homeTeamId: homeTeamId || null, awayTeamId: awayTeamId || null,
      date, kickoff, isLocked, stadium, city, 
      winnerTeamId: winnerTeamId || null, completed,
      nextMatchId: nextMatchId || null,
      nextSlot: (nextSlot as 'home' | 'away') || null,
      loserNextMatchId: loserNextMatchId || null,
      loserNextSlot: (loserNextSlot as 'home' | 'away') || null,
      extraTime,
      penalties,
      goals: goals.length > 0 ? goals : undefined,
    };

    if (homeScore !== '') matchToSave.homeScore = Number(homeScore);
    if (awayScore !== '') matchToSave.awayScore = Number(awayScore);
    if (penalties && homePenaltyScore !== '') matchToSave.homePenaltyScore = Number(homePenaltyScore);
    if (penalties && awayPenaltyScore !== '') matchToSave.awayPenaltyScore = Number(awayPenaltyScore);
    if (processedHighlightUrl) matchToSave.highlightUrl = processedHighlightUrl;

    await saveMatch(matchToSave as Match);

    // Propagate official winner to next match if applicable
    if (completed && winnerTeamId) {
      if (nextMatchId && nextSlot) {
        const nextM = matches.find(m => m.id === nextMatchId);
        if (nextM) {
          const updatedNextMatch = { ...nextM };
          if (nextSlot === 'home') updatedNextMatch.homeTeamId = winnerTeamId;
          if (nextSlot === 'away') updatedNextMatch.awayTeamId = winnerTeamId;
          await saveMatch(updatedNextMatch);
        }
      }

      // Propagate loser to next match if applicable
      const loserTeamId = winnerTeamId === homeTeamId ? awayTeamId : homeTeamId;
      if (loserNextMatchId && loserNextSlot && loserTeamId) {
        const loserNextM = matches.find(m => m.id === loserNextMatchId);
        if (loserNextM) {
          const updatedLoserNextMatch = { ...loserNextM };
          if (loserNextSlot === 'home') updatedLoserNextMatch.homeTeamId = loserTeamId;
          if (loserNextSlot === 'away') updatedLoserNextMatch.awayTeamId = loserTeamId;
          await saveMatch(updatedLoserNextMatch);
        }
      }
    }
    
    // If completed and winner chosen, recalculate scores automatically!
    if (completed && winnerTeamId) {
      await recalculateAllScores();
      alert('Match saved and all user scores recalculated!');
    }
    
    resetForm();
    loadData();
  };

  const handleApiSync = async () => {
    try {
      setSyncing(true);
      const settings = await fetchSettings();
      if (!settings?.apiFootballKey) {
        alert("API-Football Key is missing! Add it in Settings > General.");
        setSyncing(false);
        return;
      }
      
      const updatedMatches = await syncMatchesFromApi(settings.apiFootballKey, matches, teams);
      
      if (updatedMatches.length === 0) {
        alert("No new completed matches found in the API to sync.");
      } else {
        // Save all updated matches
        for (const m of updatedMatches) {
          await saveMatch(m);
        }
        await recalculateAllScores();
        alert(`Successfully synced ${updatedMatches.length} matches and recalculated scores!`);
        loadData();
      }
    } catch (error: any) {
      console.error(error);
      alert("Error syncing from API: " + error.message);
    } finally {
      setSyncing(false);
    }
  };

  const resetForm = () => {
    setId(''); setRound('Round of 32'); setHomeTeamId(''); setAwayTeamId(''); 
    setDate(''); setKickoff(''); setStadium(''); setCity(''); 
    setWinnerTeamId(''); setCompleted(false); setNextMatchId(''); setNextSlot('');
    setLoserNextMatchId(''); setLoserNextSlot(''); setIsLocked(false);
    setHomeScore(''); setAwayScore(''); 
    setHomePenaltyScore(''); setAwayPenaltyScore('');
    setExtraTime(false); setPenalties(false);
    setHighlightUrl(''); setGoals([]);
    
    // Reset resolver state
    setTelegramLink('');
    setVideoMetadata(null);
    setResolveError('');
  };

  const handleEdit = (m: Match) => {
    setId(m.id); setRound(m.round); 
    setHomeTeamId(m.homeTeamId || ''); setAwayTeamId(m.awayTeamId || ''); 
    setDate(m.date); setKickoff(m.kickoff); setStadium(m.stadium); setCity(m.city);
    setWinnerTeamId(m.winnerTeamId || ''); setCompleted(m.completed); 
    setNextMatchId(m.nextMatchId || ''); setNextSlot(m.nextSlot || '');
    setLoserNextMatchId(m.loserNextMatchId || ''); setLoserNextSlot(m.loserNextSlot || '');
    setIsLocked(m.isLocked || false);
    setHomeScore(m.homeScore !== undefined ? m.homeScore : '');
    setAwayScore(m.awayScore !== undefined ? m.awayScore : '');
    setHomePenaltyScore(m.homePenaltyScore !== undefined ? m.homePenaltyScore : '');
    setAwayPenaltyScore(m.awayPenaltyScore !== undefined ? m.awayPenaltyScore : '');
    setExtraTime(m.extraTime || false);
    setPenalties(m.penalties || false);
    setHighlightUrl(m.highlightUrl || '');
    setGoals(m.goals || []);
    
    // Set resolver state for edit
    setTelegramLink('');
    setVideoMetadata(null);
    setResolveError('');
  };

  const handleDelete = async (deleteId: string) => {
    if (window.confirm('Delete match?')) {
      await deleteMatch(deleteId);
      loadData();
    }
  };

  const handleResolve = async () => {
    if (!telegramLink) return;
    setResolving(true);
    setResolveError('');
    try {
      const apiUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/telegram/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link: telegramLink })
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to resolve link');
      }
      const data = await res.json();
      setHighlightUrl(data.videoId); // internal videoId
      setVideoMetadata(data.metadata);
    } catch (err: any) {
      setResolveError(err.message);
    } finally {
      setResolving(false);
    }
  };

  const getTeamDisplay = (teamId: string | null) => {
    if (!teamId) return <span className="text-text-muted">TBD</span>;
    const team = teams.find(t => t.id === teamId);
    if (!team) return teamId;
    return (
      <div className="flex items-center gap-2">
        <img src={team.flagUrl} alt={team.name} className="w-6 h-4 object-cover rounded shadow" />
        <span>{team.name}</span>
      </div>
    );
  };

  const addGoal = () => {
    setGoals([...goals, { id: crypto.randomUUID(), playerName: '', minute: '', isHomeTeam: true }]);
  };

  const updateGoal = (id: string, updates: Partial<GoalEvent>) => {
    setGoals(goals.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  const removeGoal = (id: string) => {
    setGoals(goals.filter(g => g.id !== id));
  };

  return (
    <div className="bg-bg-secondary p-6 rounded-xl border border-[rgba(0,217,255,0.18)]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Matches Management</h2>
        <button 
          onClick={handleApiSync} 
          disabled={syncing}
          className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded font-bold disabled:opacity-50"
        >
          {syncing ? 'Syncing...' : 'Sync Latest Scores from API'}
        </button>
      </div>
      
      <form onSubmit={handleSave} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 bg-bg-primary p-4 rounded-lg">
        <input placeholder="Match ID (e.g. R32-1)" value={id} onChange={e=>setId(e.target.value)} required className="bg-bg-secondary p-2 rounded" />
        <select value={round} onChange={e=>setRound(e.target.value)} className="bg-bg-secondary p-2 rounded">
          <option>Round of 32</option><option>Round of 16</option><option>Quarter Finals</option>
          <option>Semi Finals</option><option>Third Place</option><option>Final</option>
        </select>
        
        <select value={homeTeamId} onChange={e=>setHomeTeamId(e.target.value)} className="bg-bg-secondary p-2 rounded">
          <option value="">-- Select Home Team --</option>
          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={awayTeamId} onChange={e=>setAwayTeamId(e.target.value)} className="bg-bg-secondary p-2 rounded">
          <option value="">-- Select Away Team --</option>
          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="bg-bg-secondary p-2 rounded" />
        <input type="datetime-local" value={kickoff.slice(0, 16)} onChange={e=>setKickoff(new Date(e.target.value).toISOString())} className="bg-bg-secondary p-2 rounded" />
        <input placeholder="Stadium" value={stadium} onChange={e=>setStadium(e.target.value)} className="bg-bg-secondary p-2 rounded" />
        <input placeholder="City" value={city} onChange={e=>setCity(e.target.value)} className="bg-bg-secondary p-2 rounded" />
        
        <input placeholder="Next Match ID (e.g. R16-1)" value={nextMatchId} onChange={e=>setNextMatchId(e.target.value)} className="bg-bg-secondary p-2 rounded" />
        <select value={nextSlot} onChange={e=>setNextSlot(e.target.value as any)} className="bg-bg-secondary p-2 rounded">
          <option value="">No Next Slot</option>
          <option value="home">Home Slot</option>
          <option value="away">Away Slot</option>
        </select>
        
        <input placeholder="Loser Next Match (e.g. M103)" value={loserNextMatchId} onChange={e=>setLoserNextMatchId(e.target.value)} className="bg-bg-secondary p-2 rounded" />
        <select value={loserNextSlot} onChange={e=>setLoserNextSlot(e.target.value as any)} className="bg-bg-secondary p-2 rounded">
          <option value="">No Loser Slot</option>
          <option value="home">Home Slot</option>
          <option value="away">Away Slot</option>
        </select>
        
        <select value={winnerTeamId} onChange={e=>setWinnerTeamId(e.target.value)} className="bg-bg-secondary p-2 rounded border border-cyan-primary/50">
          <option value="">-- Select Winner --</option>
          {homeTeamId && <option value={homeTeamId}>{teams.find(t => t.id === homeTeamId)?.name || homeTeamId}</option>}
          {awayTeamId && <option value={awayTeamId}>{teams.find(t => t.id === awayTeamId)?.name || awayTeamId}</option>}
        </select>
        
        <div className="flex gap-2">
          <input type="number" placeholder="Home Score" value={homeScore} onChange={e=>setHomeScore(e.target.value === '' ? '' : Number(e.target.value))} className="bg-bg-secondary p-2 rounded w-full" />
          <input type="number" placeholder="Away Score" value={awayScore} onChange={e=>setAwayScore(e.target.value === '' ? '' : Number(e.target.value))} className="bg-bg-secondary p-2 rounded w-full" />
        </div>
        
        {/* Telegram Video Link Section */}
        <div className="md:col-span-4 bg-bg-secondary p-4 rounded border border-purple-500/30 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-purple-400">Telegram Video Link</h3>
          <div className="flex gap-2 items-center">
            <input 
              placeholder="Paste Telegram message link... (e.g. https://t.me/c/12345/25)" 
              value={telegramLink} 
              onChange={e=>setTelegramLink(e.target.value)} 
              className="bg-bg-primary p-2 rounded flex-1 border border-white/10" 
            />
            <button 
              type="button" 
              onClick={handleResolve} 
              disabled={resolving || !telegramLink}
              className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded font-bold disabled:opacity-50 whitespace-nowrap transition-colors"
            >
              {resolving ? 'Resolving...' : 'Resolve'}
            </button>
          </div>
          
          {resolveError && <p className="text-status-danger text-sm font-medium">{resolveError}</p>}
          
          {videoMetadata && (
            <div className="bg-bg-primary p-4 rounded border border-green-500/30 flex gap-4 items-start">
              {videoMetadata.thumbnail ? (
                 <img src={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}${videoMetadata.thumbnail}`} alt="Thumbnail" className="w-32 h-20 object-cover rounded bg-black" />
              ) : (
                 <div className="w-32 h-20 bg-white/5 rounded flex items-center justify-center text-xs text-text-muted">No Thumb</div>
              )}
              <div className="flex flex-col gap-1 text-sm">
                 <p><span className="font-bold text-text-secondary">Resolution:</span> {videoMetadata.resolution || 'Unknown'}</p>
                 <p><span className="font-bold text-text-secondary">Duration:</span> {videoMetadata.duration ? `${Math.floor(videoMetadata.duration/60)}:${(videoMetadata.duration%60).toString().padStart(2, '0')}` : 'Unknown'}</p>
                 <p><span className="font-bold text-text-secondary">Size:</span> {(videoMetadata.size / 1024 / 1024).toFixed(2)} MB</p>
                 <p><span className="font-bold text-text-secondary">Type:</span> {videoMetadata.mimeType}</p>
                 <div className="flex gap-2 mt-2">
                   <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded flex items-center gap-1">✔ Video Verified</span>
                   <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded flex items-center gap-1">✔ Telegram Link Verified</span>
                 </div>
              </div>
            </div>
          )}
          
          {highlightUrl && !videoMetadata && (
            <div className="bg-white/5 p-3 rounded text-sm text-text-secondary italic">
              Existing Highlight URL / Video ID: <span className="font-mono text-cyan-primary">{highlightUrl}</span>
            </div>
          )}
        </div>
        
        <div className="flex flex-col gap-4 md:col-span-4 bg-bg-secondary p-4 rounded border border-white/5">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 font-bold">
              <input type="checkbox" checked={completed} onChange={e=>setCompleted(e.target.checked)} />
              Completed
            </label>
            <label className="flex items-center gap-2 border-l border-white/10 pl-4">
              <input type="checkbox" checked={isLocked} onChange={e=>setIsLocked(e.target.checked)} />
              Locked (Closes Predictions)
            </label>
            <label className="flex items-center gap-2 border-l border-white/10 pl-4">
              <input type="checkbox" checked={extraTime} onChange={e=>setExtraTime(e.target.checked)} />
              AET
            </label>
            <label className="flex items-center gap-2 border-l border-white/10 pl-4">
              <input type="checkbox" checked={penalties} onChange={e=>setPenalties(e.target.checked)} />
              Penalties
            </label>
          </div>

          {penalties && (
            <div className="flex gap-2 items-center p-3 bg-white/5 rounded border border-cyan-primary/30 mt-2">
              <span className="text-xs uppercase font-bold tracking-widest text-cyan-primary w-24">Penalty Score</span>
              <input type="number" placeholder="Home Pen" value={homePenaltyScore} onChange={e=>setHomePenaltyScore(e.target.value === '' ? '' : Number(e.target.value))} className="bg-bg-primary p-2 rounded w-full border border-white/10" />
              <input type="number" placeholder="Away Pen" value={awayPenaltyScore} onChange={e=>setAwayPenaltyScore(e.target.value === '' ? '' : Number(e.target.value))} className="bg-bg-primary p-2 rounded w-full border border-white/10" />
            </div>
          )}
        </div>

        {/* Goal Events Section */}
        <div className="md:col-span-4 bg-bg-secondary p-4 rounded border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-widest text-text-secondary">Match Events (Goals)</h3>
            <button type="button" onClick={addGoal} className="text-xs bg-cyan-primary/20 text-cyan-primary px-3 py-1 rounded font-bold uppercase tracking-wider hover:bg-cyan-primary/30 transition-colors">+ Add Goal</button>
          </div>
          {goals.length > 0 ? (
            <div className="space-y-2">
              {goals.map(goal => (
                <div key={goal.id} className="flex flex-wrap md:flex-nowrap items-center gap-2 bg-bg-primary p-2 rounded border border-white/5">
                  <select 
                    value={goal.isHomeTeam ? 'home' : 'away'} 
                    onChange={e => updateGoal(goal.id, { isHomeTeam: e.target.value === 'home' })}
                    className="bg-bg-secondary p-1.5 rounded text-sm min-w-[100px]"
                  >
                    <option value="home">Home ({homeTeamId ? teams.find(t=>t.id===homeTeamId)?.name : 'Team'})</option>
                    <option value="away">Away ({awayTeamId ? teams.find(t=>t.id===awayTeamId)?.name : 'Team'})</option>
                  </select>
                  <input type="text" placeholder="Player Name" value={goal.playerName} onChange={e=>updateGoal(goal.id, { playerName: e.target.value })} className="bg-bg-secondary p-1.5 rounded text-sm flex-1" />
                  <input type="text" placeholder="Min (e.g. 45')" value={goal.minute} onChange={e=>updateGoal(goal.id, { minute: e.target.value })} className="bg-bg-secondary p-1.5 rounded text-sm w-20" />
                  <label className="flex items-center gap-1 text-xs">
                    <input type="checkbox" checked={goal.isPenalty || false} onChange={e=>updateGoal(goal.id, { isPenalty: e.target.checked })} />
                    Pen?
                  </label>
                  <label className="flex items-center gap-1 text-xs border-l border-white/10 pl-2">
                    <input type="checkbox" checked={goal.isOwnGoal || false} onChange={e=>updateGoal(goal.id, { isOwnGoal: e.target.checked })} />
                    OG?
                  </label>
                  <button type="button" onClick={() => removeGoal(goal.id)} className="text-status-danger hover:text-red-400 p-1 ml-auto">×</button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-text-muted italic">No goals added.</p>
          )}
        </div>

        <button 
          type="submit" 
          disabled={telegramLink.length > 0 && !videoMetadata}
          className="bg-cyan-primary text-navy-900 font-bold p-2 rounded md:col-span-4 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save Match & Recalculate
        </button>
      </form>

      {loading ? <p>Loading matches...</p> : (
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-bg-secondary/95 backdrop-blur-sm z-10 shadow-sm border-b border-[rgba(0,217,255,0.18)]">
              <tr>
                <th className="p-4 text-text-secondary font-medium tracking-wider uppercase text-[10px]">ID</th>
                <th className="p-4 text-text-secondary font-medium tracking-wider uppercase text-[10px]">Round</th>
                <th className="p-4 text-text-secondary font-medium tracking-wider uppercase text-[10px]">Home Team</th>
                <th className="p-4 text-text-secondary font-medium tracking-wider uppercase text-[10px]">Away Team</th>
                <th className="p-4 text-text-secondary font-medium tracking-wider uppercase text-[10px]">Kickoff</th>
                <th className="p-4 text-text-secondary font-medium tracking-wider uppercase text-[10px]">Location</th>
                <th className="p-4 text-text-secondary font-medium tracking-wider uppercase text-[10px]">Score</th>
                <th className="p-4 text-text-secondary font-medium tracking-wider uppercase text-[10px]">Status</th>
                <th className="p-4 text-text-secondary font-medium tracking-wider uppercase text-[10px]">Winner</th>
                <th className="p-4 text-text-secondary font-medium tracking-wider uppercase text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {matches.map(m => (
                <tr key={m.id} className="hover:bg-white/5 transition-colors group">
                  <td className="p-4 font-mono font-bold text-cyan-primary text-xs">{m.id}</td>
                  <td className="p-4 text-sm font-medium">{m.round}</td>
                  <td className="p-4 text-sm font-bold">{getTeamDisplay(m.homeTeamId)}</td>
                  <td className="p-4 text-sm font-bold">{getTeamDisplay(m.awayTeamId)}</td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-text-primary text-sm font-mono tracking-tight">{formatISTDateOnly(m.kickoff)}</span>
                      <span className="text-text-secondary text-xs uppercase tracking-widest">{formatISTTimeOnly(m.kickoff)}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-text-primary text-sm font-medium">{m.city}</span>
                      <span className="text-text-secondary text-[10px] uppercase tracking-wider">{m.stadium}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white">
                        {m.homeScore !== undefined && m.awayScore !== undefined ? `${m.homeScore} - ${m.awayScore}` : '-'}
                      </span>
                      {(m.extraTime || m.penalties) && (
                        <span className="text-[10px] text-text-secondary uppercase mt-1">
                          {m.penalties ? (
                            <span className="text-cyan-primary">Pens: {m.homePenaltyScore ?? '-'} - {m.awayPenaltyScore ?? '-'}</span>
                          ) : (
                            'AET'
                          )}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      {m.completed ? (
                        <span className="px-2 py-1 bg-status-success/20 text-status-success text-[10px] font-bold tracking-wider uppercase rounded inline-block w-max">Completed</span>
                      ) : (
                        <span className="px-2 py-1 bg-cyan-primary/10 text-cyan-primary text-[10px] font-bold tracking-wider uppercase rounded inline-block w-max">Scheduled</span>
                      )}
                      {m.isLocked && (
                        <span className="px-2 py-1 bg-status-danger/20 text-status-danger text-[10px] font-bold tracking-wider uppercase rounded inline-block w-max">🔒 Locked</span>
                      )}
                      {m.highlightUrl && (
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-[10px] font-bold tracking-wider uppercase rounded inline-block w-max flex items-center gap-1">
                          <span>✔</span> Highlight
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 font-bold text-cyan-primary">
                    {getTeamDisplay(m.winnerTeamId)}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-3 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(m)} className="text-cyan-primary hover:text-cyan-secondary text-sm font-bold tracking-wider uppercase transition-colors">Edit</button>
                      <button onClick={() => handleDelete(m.id)} className="text-status-danger hover:text-red-300 text-sm font-bold tracking-wider uppercase transition-colors">Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
