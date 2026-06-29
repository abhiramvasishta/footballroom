import { useState, useEffect } from 'react';
import { fetchSettings, saveSettings } from '../../lib/services';
import type { TournamentSettings } from '../../types';

export const SettingsManager = () => {
  const [settings, setSettings] = useState<TournamentSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    setLoading(true);
    const data = await fetchSettings();
    if (data) {
      // Migrate from old contestPhase or default to Registration Open
      if (!data.contestStatus) {
        data.contestStatus = 'Registration Open';
      }
      setSettings(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (settings) {
      await saveSettings(settings);
      alert('Settings saved!');
    }
  };

  if (loading) return <p>Loading settings...</p>;
  if (!settings) return <p>No settings found. Try seeding the database.</p>;

  return (
    <div className="bg-bg-secondary p-6 rounded-xl border border-[rgba(0,217,255,0.18)]">
      <h2 className="text-2xl font-bold mb-6">Tournament Settings</h2>
      
      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-4 bg-bg-primary p-6 rounded-xl">
          <h3 className="font-bold text-cyan-primary border-b border-[rgba(0,217,255,0.18)] pb-2">General</h3>
          <label>
            <span className="block text-sm text-text-secondary mb-1">Contest Name</span>
            <input 
              className="w-full bg-bg-secondary p-2 rounded" 
              value={settings.contestName}
              onChange={e => setSettings({...settings, contestName: e.target.value})} 
            />
          </label>
          <div className="bg-bg-primary/50 p-6 rounded-xl border border-white/5">
            <h3 className="text-xl font-bold mb-4 font-display text-cyan-primary">Contest Status</h3>
            
            <div className="flex flex-col gap-4">
              <select
                value={settings.contestStatus || 'Registration Open'}
                onChange={e => setSettings({...settings, contestStatus: e.target.value as TournamentSettings['contestStatus']})}
                className="bg-bg-primary border border-white/20 rounded-lg p-3 text-white focus:border-cyan-primary outline-none w-full max-w-md"
              >
                <option value="Registration Open">Registration Open (Users can sign up & predict)</option>
                <option value="Registration Closed">Registration Closed (No new signups, dashboard available)</option>
                <option value="Tournament Live">Tournament Live (Matches lock at kickoff)</option>
                <option value="Tournament Finished">Tournament Finished (Read-only mode)</option>
              </select>
            </div>
          </div>
          <label>
            <span className="block text-sm text-text-secondary mb-1">Current Round</span>
            <input 
              className="w-full bg-bg-secondary p-2 rounded" 
              value={settings.currentRound}
              onChange={e => setSettings({...settings, currentRound: e.target.value})} 
            />
          </label>
          <label className="flex items-center gap-2 mt-2">
            <input 
              type="checkbox" 
              checked={settings.predictionLocked}
              onChange={e => setSettings({...settings, predictionLocked: e.target.checked})} 
            />
            Predictions Locked?
          </label>
          <label className="flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={settings.leaderboardVisible}
              onChange={e => setSettings({...settings, leaderboardVisible: e.target.checked})} 
            />
            Leaderboard Visible?
          </label>
        </div>

        <div className="flex flex-col gap-4 bg-bg-primary p-6 rounded-xl">
          <h3 className="font-bold text-cyan-primary border-b border-[rgba(0,217,255,0.18)] pb-2">Scoring System</h3>
          {Object.entries(settings.scoringSystem).map(([key, val]) => (
            <label key={key} className="flex justify-between items-center">
              <span className="text-sm text-text-secondary capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
              <input 
                type="number" 
                className="w-24 bg-bg-secondary p-2 rounded text-right" 
                value={val}
                onChange={e => setSettings({
                  ...settings, 
                  scoringSystem: { ...settings.scoringSystem, [key]: Number(e.target.value) }
                })} 
              />
            </label>
          ))}
          <p className="text-xs text-text-muted mt-4 text-center">Note: Changing the scoring system does not automatically recalculate scores. You must trigger a recalculation by saving a match.</p>
        </div>

        <div className="md:col-span-2 flex justify-end">
          <button type="submit" className="bg-cyan-primary text-navy-900 font-bold px-8 py-3 rounded-lg">
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
};
