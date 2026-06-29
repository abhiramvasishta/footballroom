import { useState } from 'react';
import { Database, Trash2 } from 'lucide-react';
import { seedTournament, clearTournament } from '../../lib/seed';

export const SeedControls = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSeed = async () => {
    if (!window.confirm("This will populate Firestore with the official FIFA World Cup 2026 Knockout fixtures. Are you sure?")) return;
    setLoading(true);
    try {
      await seedTournament();
      setMessage("Tournament fixtures loaded successfully.");
    } catch (err) {
      setMessage("Error loading tournament fixtures.");
      console.error(err);
    }
    setLoading(false);
  };

  const handleClear = async () => {
    if (!window.confirm("WARNING: This will delete ALL teams, matches, and settings. Are you absolutely sure?")) return;
    setLoading(true);
    try {
      await clearTournament();
      setMessage("Tournament cleared successfully.");
    } catch (err) {
      setMessage("Error clearing tournament.");
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="bg-bg-secondary p-6 rounded-xl border border-[rgba(0,217,255,0.18)] mb-6">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Database className="text-cyan-primary" />
        Tournament Initialization
      </h3>
      <p className="text-sm text-text-secondary mb-6">
        Use these controls to load the official World Cup 2026 Knockout fixtures from your seed data files.
      </p>
      
      <div className="flex gap-4">
        <button 
          onClick={handleSeed}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-bold disabled:opacity-50"
        >
          Load Tournament Fixtures
        </button>
        <button 
          onClick={handleClear}
          disabled={loading}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-bold disabled:opacity-50"
        >
          <Trash2 size={18} /> Clear Tournament
        </button>
      </div>
      {message && <p className="mt-4 text-cyan-primary text-sm">{message}</p>}
    </div>
  );
};
