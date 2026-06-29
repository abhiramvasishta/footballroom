import { useState, useEffect } from 'react';
import { fetchTeams, saveTeam, deleteTeam } from '../../lib/services';
import type { Team } from '../../types';

export const TeamsManager = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [fifaCode, setFifaCode] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [confederation, setConfederation] = useState('');

  const loadTeams = async () => {
    setLoading(true);
    const data = await fetchTeams();
    setTeams(data);
    setLoading(false);
  };

  useEffect(() => {
    loadTeams();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const flagUrl = `https://flagcdn.com/w80/${countryCode.toLowerCase()}.png`;
    await saveTeam({
      id, name, fifaCode, countryCode, flagUrl, confederation
    });
    setId('');
    setName('');
    setFifaCode('');
    setCountryCode('');
    setConfederation('');
    loadTeams();
  };

  const handleEdit = (team: Team) => {
    setId(team.id);
    setName(team.name);
    setFifaCode(team.fifaCode);
    setCountryCode(team.countryCode || '');
    setConfederation(team.confederation);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete team?')) {
      await deleteTeam(id);
      loadTeams();
    }
  };

  return (
    <div className="bg-bg-secondary p-6 rounded-xl border border-[rgba(0,217,255,0.18)]">
      <h2 className="text-2xl font-bold mb-6">Teams Management</h2>
      
      <form onSubmit={handleSave} className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 bg-bg-primary p-4 rounded-lg">
        <input placeholder="Team ID (e.g. ARG)" value={id} onChange={e=>setId(e.target.value)} required className="bg-bg-secondary p-2 rounded" />
        <input placeholder="Team Name" value={name} onChange={e=>setName(e.target.value)} required className="bg-bg-secondary p-2 rounded" />
        <input placeholder="FIFA Code" value={fifaCode} onChange={e=>setFifaCode(e.target.value)} required className="bg-bg-secondary p-2 rounded" />
        <input placeholder="Country Code (e.g. ar)" value={countryCode} onChange={e=>setCountryCode(e.target.value)} required className="bg-bg-secondary p-2 rounded" />
        <input placeholder="Confederation" value={confederation} onChange={e=>setConfederation(e.target.value)} className="bg-bg-secondary p-2 rounded" />
        <button type="submit" className="bg-cyan-primary text-navy-900 font-bold p-2 rounded md:col-span-5">Save Team</button>
      </form>

      {loading ? <p>Loading teams...</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-bg-secondary/95 backdrop-blur-sm z-10 shadow-sm border-b border-[rgba(0,217,255,0.18)]">
              <tr>
                <th className="p-4 text-text-secondary font-medium tracking-wider uppercase text-[10px]">ID</th>
                <th className="p-4 text-text-secondary font-medium tracking-wider uppercase text-[10px]">Name</th>
                <th className="p-4 text-text-secondary font-medium tracking-wider uppercase text-[10px]">Code</th>
                <th className="p-4 text-text-secondary font-medium tracking-wider uppercase text-[10px]">Flag</th>
                <th className="p-4 text-text-secondary font-medium tracking-wider uppercase text-[10px]">Conf</th>
                <th className="p-4 text-text-secondary font-medium tracking-wider uppercase text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {teams.map(team => (
                <tr key={team.id} className="hover:bg-white/5 transition-colors group">
                  <td className="p-4 font-mono font-bold text-cyan-primary text-xs">{team.id}</td>
                  <td className="p-4 text-sm font-bold text-text-primary">{team.name}</td>
                  <td className="p-4 font-mono text-xs">{team.fifaCode}</td>
                  <td className="p-4">
                    <img src={team.flagUrl} alt="flag" className="w-8 h-5 object-cover rounded shadow border border-white/20" />
                  </td>
                  <td className="p-4 text-sm text-text-secondary">{team.confederation}</td>
                  <td className="p-4">
                    <div className="flex gap-3 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(team)} className="text-cyan-primary hover:text-cyan-secondary text-sm font-bold tracking-wider uppercase transition-colors">Edit</button>
                      <button onClick={() => handleDelete(team.id)} className="text-status-danger hover:text-red-300 text-sm font-bold tracking-wider uppercase transition-colors">Del</button>
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
