import { useState, useEffect } from 'react';
import { fetchMatches, saveMatch, deleteMatch, fetchTeams } from '../../lib/services';
import { recalculateAllScores } from '../../lib/scoreEngine';
import type { Match, Team } from '../../types';
import { formatISTDateOnly, formatISTTimeOnly } from '../../utils/date';

export const MatchesManager = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

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

    const matchToSave: Match = {
      id, round, homeTeamId: homeTeamId || null, awayTeamId: awayTeamId || null,
      date, kickoff, isLocked, stadium, city, 
      winnerTeamId: winnerTeamId || null, completed,
      nextMatchId: nextMatchId || null,
      nextSlot: (nextSlot as 'home' | 'away') || null,
      loserNextMatchId: loserNextMatchId || null,
      loserNextSlot: (loserNextSlot as 'home' | 'away') || null
    };

    await saveMatch(matchToSave);

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

  const resetForm = () => {
    setId(''); setRound('Round of 32'); setHomeTeamId(''); setAwayTeamId(''); 
    setDate(''); setKickoff(''); setStadium(''); setCity(''); 
    setWinnerTeamId(''); setCompleted(false); setNextMatchId(''); setNextSlot('');
    setLoserNextMatchId(''); setLoserNextSlot(''); setIsLocked(false);
  };

  const handleEdit = (m: Match) => {
    setId(m.id); setRound(m.round); 
    setHomeTeamId(m.homeTeamId || ''); setAwayTeamId(m.awayTeamId || ''); 
    setDate(m.date); setKickoff(m.kickoff); setStadium(m.stadium); setCity(m.city);
    setWinnerTeamId(m.winnerTeamId || ''); setCompleted(m.completed); 
    setNextMatchId(m.nextMatchId || ''); setNextSlot(m.nextSlot || '');
    setLoserNextMatchId(m.loserNextMatchId || ''); setLoserNextSlot(m.loserNextSlot || '');
    setIsLocked(m.isLocked || false);
  };

  const handleDelete = async (deleteId: string) => {
    if (window.confirm('Delete match?')) {
      await deleteMatch(deleteId);
      loadData();
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

  return (
    <div className="bg-bg-secondary p-6 rounded-xl border border-[rgba(0,217,255,0.18)]">
      <h2 className="text-2xl font-bold mb-6">Matches Management</h2>
      
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
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={completed} onChange={e=>setCompleted(e.target.checked)} />
          Completed?
        </label>
        
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={isLocked} onChange={e=>setIsLocked(e.target.checked)} />
          Locked? (Closes Predictions)
        </label>

        <button type="submit" className="bg-cyan-primary text-navy-900 font-bold p-2 rounded md:col-span-4">Save Match & Recalculate</button>
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
                    <div className="flex flex-col gap-1">
                      {m.completed ? (
                        <span className="px-2 py-1 bg-status-success/20 text-status-success text-[10px] font-bold tracking-wider uppercase rounded inline-block w-max">Completed</span>
                      ) : (
                        <span className="px-2 py-1 bg-cyan-primary/10 text-cyan-primary text-[10px] font-bold tracking-wider uppercase rounded inline-block w-max">Scheduled</span>
                      )}
                      {m.isLocked && (
                        <span className="px-2 py-1 bg-status-danger/20 text-status-danger text-[10px] font-bold tracking-wider uppercase rounded inline-block w-max">🔒 Locked</span>
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
