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
      // Migrate from old contestStatus/predictionLocked
      if (data.registrationOpen === undefined) {
        data.registrationOpen = (data as any).contestStatus === 'Registration Open' || !(data as any).contestStatus;
      }
      if (data.predictionsOpen === undefined) {
        data.predictionsOpen = (data as any).predictionLocked === undefined ? true : !(data as any).predictionLocked;
      }
      if (data.websiteStatus === undefined) {
        data.websiteStatus = 'Open';
      }
      
      // Cleanup legacy fields for clean save
      delete (data as any).contestStatus;
      delete (data as any).predictionLocked;
      
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

  const [syncing, setSyncing] = useState(false);
  const handleSyncPhotos = async () => {
    setSyncing(true);
    try {
      // Dynamic import to avoid circular dependencies or cluttering the top of the file
      const { collection, getDocs, writeBatch, doc } = await import('firebase/firestore');
      const { db } = await import('../../lib/firebase');
      
      const usersSnap = await getDocs(collection(db, 'users'));
      const batch = writeBatch(db);
      
      let count = 0;
      usersSnap.docs.forEach(userDoc => {
        const userData = userDoc.data();
        if (userData.photoURL) {
          const lbRef = doc(db, 'leaderboard', userDoc.id);
          batch.set(lbRef, { photoURL: userData.photoURL }, { merge: true });
          count++;
        }
      });
      
      await batch.commit();
      alert(`Successfully synced ${count} photos to the leaderboard!`);
    } catch (error) {
      console.error("Error syncing photos:", error);
      alert('Error syncing photos. Check console.');
    }
    setSyncing(false);
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
          <div className="bg-bg-primary/50 p-6 rounded-xl border border-white/5 flex flex-col gap-4">
            <h3 className="text-xl font-bold font-display text-cyan-primary">Access Controls</h3>
            
            <label className="flex items-center justify-between p-3 bg-bg-primary border border-white/10 rounded-lg cursor-pointer hover:border-white/30 transition-colors">
              <div>
                <span className="block font-bold">Registration</span>
                <span className="text-xs text-text-secondary">Allow new users to sign up</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold ${settings.registrationOpen ? 'text-green-400' : 'text-red-400'}`}>{settings.registrationOpen ? 'OPEN' : 'CLOSED'}</span>
                <input 
                  type="checkbox" 
                  checked={settings.registrationOpen}
                  onChange={e => setSettings({...settings, registrationOpen: e.target.checked})} 
                  className="w-5 h-5 accent-cyan-primary cursor-pointer"
                />
              </div>
            </label>

            <label className="flex items-center justify-between p-3 bg-bg-primary border border-white/10 rounded-lg cursor-pointer hover:border-white/30 transition-colors">
              <div>
                <span className="block font-bold">Predictions</span>
                <span className="text-xs text-text-secondary">Allow users to make or edit picks</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold ${settings.predictionsOpen ? 'text-green-400' : 'text-red-400'}`}>{settings.predictionsOpen ? 'OPEN' : 'CLOSED'}</span>
                <input 
                  type="checkbox" 
                  checked={settings.predictionsOpen}
                  onChange={e => setSettings({...settings, predictionsOpen: e.target.checked})} 
                  className="w-5 h-5 accent-cyan-primary cursor-pointer"
                />
              </div>
            </label>

            <label className="flex flex-col gap-2 p-3 bg-bg-primary border border-white/10 rounded-lg">
              <div>
                <span className="block font-bold text-red-400">Website Access</span>
                <span className="text-xs text-text-secondary">Global site access (Admin always bypasses)</span>
              </div>
              <select
                value={settings.websiteStatus || 'Open'}
                onChange={e => setSettings({...settings, websiteStatus: e.target.value as 'Open' | 'Maintenance'})}
                className="bg-bg-secondary border border-white/20 rounded text-white p-2 w-full mt-1 focus:border-cyan-primary outline-none"
              >
                <option value="Open">OPEN</option>
                <option value="Maintenance">MAINTENANCE (Blocks all non-admin users)</option>
              </select>
            </label>
          </div>
          <label>
            <span className="block text-sm text-text-secondary mb-1">Current Round</span>
            <input 
              className="w-full bg-bg-secondary p-2 rounded" 
              value={settings.currentRound}
              onChange={e => setSettings({...settings, currentRound: e.target.value})} 
            />
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

        <div className="md:col-span-2 flex justify-end gap-4">
          <button 
            type="button" 
            onClick={handleSyncPhotos}
            disabled={syncing}
            className="bg-bg-secondary text-white border border-cyan-primary/50 font-bold px-8 py-3 rounded-lg hover:bg-white/5 disabled:opacity-50"
          >
            {syncing ? 'Syncing...' : 'Sync Missing Photos'}
          </button>
          <button type="submit" className="bg-cyan-primary text-navy-900 font-bold px-8 py-3 rounded-lg">
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
};
