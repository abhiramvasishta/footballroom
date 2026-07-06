import { useState, useEffect } from 'react';
import { fetchSettings, saveSettings } from '../../lib/services';
import type { TournamentSettings } from '../../types';
import { goldenBallPlayers } from '../../data/goldenBallPlayers';
import { Plus, Trash2, ChevronUp, ChevronDown, Eye, X } from 'lucide-react';
import { parseIframeEmbedCode } from '../../utils/iframeParser';
import { LiveStreamPlayer } from '../player/LiveStreamPlayer';

export const SettingsManager = () => {
  const [settings, setSettings] = useState<TournamentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewStream, setPreviewStream] = useState<any | null>(null);

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
      
      if (!data.liveStream) {
        data.liveStream = {
          mode: 'Auto',
          streams: []
        };
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
      if (settings.liveStream) {
        for (const stream of settings.liveStream.streams) {
          if (stream.enabled && stream.embedCode.trim() !== '') {
            const parsed = parseIframeEmbedCode(stream.embedCode);
            if (!parsed) {
              alert(`Cannot save: Stream "${stream.name}" has invalid embed code.`);
              return;
            }
          }
        }
      }

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

          <label>
            <span className="block text-sm text-text-secondary mb-1">Actual MVP (Golden Ball)</span>
            <select
              className="w-full bg-bg-secondary p-2 rounded text-cyan-primary border-none focus:ring-1 focus:ring-cyan-primary outline-none"
              value={settings.actualMvpPlayerId || ''}
              onChange={e => setSettings({...settings, actualMvpPlayerId: e.target.value || null})}
            >
              <option value="">-- Undecided --</option>
              {goldenBallPlayers.map(player => (
                <option key={player.id} value={player.id}>
                  {player.name} ({player.countryName})
                </option>
              ))}
            </select>
            <span className="block text-[10px] text-text-muted mt-1">
              Select the player who won the MVP to award points to users who predicted them correctly.
            </span>
          </label>

          <label>
            <span className="block text-sm text-text-secondary mb-1">API-Football Key</span>
            <input 
              type="password"
              className="w-full bg-bg-secondary p-2 rounded" 
              placeholder="e.g. 00d32d615a6538686dc..."
              value={settings.apiFootballKey || ''}
              onChange={e => setSettings({...settings, apiFootballKey: e.target.value || null})} 
            />
            <span className="block text-[10px] text-text-muted mt-1">
              Used to automatically sync match scores. Get a free key at api-sports.io.
            </span>
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

        {/* Live Streaming Settings */}
        <div className="flex flex-col gap-4 bg-bg-primary p-6 rounded-xl md:col-span-2">
          <h3 className="font-bold text-cyan-primary border-b border-[rgba(0,217,255,0.18)] pb-2 flex items-center justify-between">
            <span>Live Streaming</span>
            <span className="text-xs text-text-secondary bg-bg-secondary px-2 py-1 rounded">Experimental</span>
          </h3>

          <label className="flex flex-col gap-2 p-3 bg-bg-secondary/50 border border-white/10 rounded-lg">
            <div>
              <span className="block font-bold">Live Page Mode</span>
              <span className="text-xs text-text-secondary">Determine how the Live tab behaves.</span>
            </div>
            <select
              value={settings.liveStream?.mode || 'Auto'}
              onChange={e => setSettings({...settings, liveStream: { ...settings.liveStream!, mode: e.target.value as any }})}
              className="bg-bg-primary border border-white/20 rounded text-white p-2 w-full mt-1 focus:border-cyan-primary outline-none"
            >
              <option value="Auto">Auto (Uses match kickoff data priority)</option>
              <option value="Live Now">Force: Live Now</option>
              <option value="Countdown">Force: Countdown</option>
              <option value="Offline">Force: Offline</option>
            </select>
          </label>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold">Configured Streams</span>
              <button 
                type="button" 
                onClick={() => {
                  const newStreams = [...(settings.liveStream?.streams || []), { id: Date.now().toString(), name: 'New Stream', embedCode: '', enabled: true }];
                  setSettings({...settings, liveStream: { ...settings.liveStream!, streams: newStreams }});
                }}
                className="flex items-center gap-1 text-xs bg-cyan-primary/20 text-cyan-primary px-3 py-1.5 rounded hover:bg-cyan-primary/30 transition-colors"
              >
                <Plus size={14} /> Add Stream
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {(settings.liveStream?.streams || []).length === 0 && (
                <div className="text-center text-text-secondary text-sm p-4 border border-dashed border-white/20 rounded-lg">
                  No streams configured.
                </div>
              )}
              {(settings.liveStream?.streams || []).map((stream, idx) => (
                <div key={stream.id} className="bg-bg-secondary p-4 rounded-lg border border-white/10 flex flex-col gap-3 relative group">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                    <input 
                      type="text" 
                      placeholder="Stream Name (e.g. English)" 
                      value={stream.name} 
                      onChange={e => {
                        const newStreams = [...settings.liveStream!.streams];
                        newStreams[idx].name = e.target.value;
                        setSettings({...settings, liveStream: { ...settings.liveStream!, streams: newStreams }});
                      }}
                      className="bg-bg-primary p-2 rounded text-sm w-full md:w-64 font-bold border-none outline-none focus:ring-1 focus:ring-cyan-primary"
                    />
                    
                    <div className="flex items-center gap-2 self-end md:self-auto">
                      <button 
                        type="button" 
                        onClick={() => {
                          const parsed = parseIframeEmbedCode(stream.embedCode);
                          if (!parsed) {
                            alert("Cannot preview: Invalid or missing iframe embed code.");
                            return;
                          }
                          setPreviewStream(stream);
                        }}
                        className="p-1.5 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/40 transition-colors"
                        title="Preview Stream"
                      >
                        <Eye size={16} />
                      </button>

                      <button 
                        type="button" 
                        disabled={idx === 0}
                        onClick={() => {
                          const newStreams = [...settings.liveStream!.streams];
                          [newStreams[idx-1], newStreams[idx]] = [newStreams[idx], newStreams[idx-1]];
                          setSettings({...settings, liveStream: { ...settings.liveStream!, streams: newStreams }});
                        }}
                        className="p-1.5 bg-white/5 text-text-secondary rounded hover:text-white disabled:opacity-30 disabled:hover:text-text-secondary"
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button 
                        type="button"
                        disabled={idx === settings.liveStream!.streams.length - 1}
                        onClick={() => {
                          const newStreams = [...settings.liveStream!.streams];
                          [newStreams[idx+1], newStreams[idx]] = [newStreams[idx], newStreams[idx+1]];
                          setSettings({...settings, liveStream: { ...settings.liveStream!, streams: newStreams }});
                        }} 
                        className="p-1.5 bg-white/5 text-text-secondary rounded hover:text-white disabled:opacity-30 disabled:hover:text-text-secondary"
                      >
                        <ChevronDown size={16} />
                      </button>
                      
                      <button 
                        type="button"
                        onClick={() => {
                          const newStreams = [...settings.liveStream!.streams];
                          newStreams.splice(idx, 1);
                          setSettings({...settings, liveStream: { ...settings.liveStream!, streams: newStreams }});
                        }}
                        className="p-1.5 bg-red-500/20 text-red-500 rounded hover:bg-red-500/40 transition-colors ml-2"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <textarea 
                    placeholder="Paste full <iframe> embed code here..."
                    value={stream.embedCode}
                    onChange={e => {
                      const newStreams = [...settings.liveStream!.streams];
                      newStreams[idx].embedCode = e.target.value;
                      setSettings({...settings, liveStream: { ...settings.liveStream!, streams: newStreams }});
                    }}
                    className="w-full h-24 bg-bg-primary p-2 rounded text-xs font-mono text-text-secondary border-none outline-none focus:ring-1 focus:ring-cyan-primary resize-none"
                  />

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={stream.enabled}
                        onChange={e => {
                          const newStreams = [...settings.liveStream!.streams];
                          newStreams[idx].enabled = e.target.checked;
                          setSettings({...settings, liveStream: { ...settings.liveStream!, streams: newStreams }});
                        }}
                        className="w-4 h-4 accent-cyan-primary cursor-pointer"
                      />
                      <span className="text-sm font-bold">Enabled</span>
                    </label>

                    {stream.embedCode.trim() && !parseIframeEmbedCode(stream.embedCode) && (
                      <span className="text-xs text-red-400 font-bold bg-red-400/10 px-2 py-1 rounded">
                        Invalid Embed Code (No valid src)
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
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

      {previewStream && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-bg-secondary border border-white/10 rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-[0_0_50px_rgba(0,0,0,0.8)]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold font-display">Live Preview: {previewStream.name}</h3>
              <button 
                onClick={() => setPreviewStream(null)}
                className="text-text-secondary hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <LiveStreamPlayer streams={[previewStream]} />
            
          </div>
        </div>
      )}
    </div>
  );
};
