import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { ShieldAlert, LogOut, Settings, Users, BarChart3, Trophy, Database, Trash2, AlertTriangle } from 'lucide-react';
import { auth } from '../lib/firebase';
import { clearTestData } from '../lib/services';
import { AnimatedTransition } from '../components/AnimatedTransition';
import { useUserStore } from '../store/useUserStore';

// Import managers
import { TeamsManager } from '../components/admin/TeamsManager';
import { MatchesManager } from '../components/admin/MatchesManager';
import { SettingsManager } from '../components/admin/SettingsManager';
import { SeedControls } from '../components/admin/SeedControls';
import { PredictionAnalytics } from '../components/admin/PredictionAnalytics';
import { UsersManager } from '../components/admin/UsersManager';

type Tab = 'dashboard' | 'teams' | 'matches' | 'settings' | 'users' | 'analytics';

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setError('');
    } catch (err) {
      setError('Invalid admin credentials.');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <AnimatedTransition className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md glass-card p-8">
          <div className="flex flex-col items-center mb-6 text-red-400">
            <ShieldAlert size={48} className="mb-4" />
            <h1 className="text-2xl font-bold text-white">Admin Access</h1>
            <p className="text-sm">Restricted Area</p>
          </div>
          
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input 
              type="email" 
              placeholder="Admin Email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="bg-bg-primary border border-white/20 rounded-lg p-3 text-white focus:border-cyan-primary outline-none"
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="bg-bg-primary border border-white/20 rounded-lg p-3 text-white focus:border-cyan-primary outline-none"
            />
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button type="submit" className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-lg transition-colors mt-2">
              Login
            </button>
          </form>
        </div>
      </AnimatedTransition>
    );
  }

  return (
    <AnimatedTransition className="min-h-screen bg-bg-primary text-white p-6">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        <div className="flex justify-between items-center glass-card p-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="text-red-400" />
            <h1 className="text-xl font-bold font-display">Admin Control Panel</h1>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors">
            <LogOut size={18} /> Logout
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1 flex flex-col gap-2">
            <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-3 p-4 rounded-xl text-left transition-colors border ${activeTab === 'dashboard' ? 'bg-bg-secondary border-cyan-primary/50 text-white' : 'bg-bg-secondary/50 border-transparent text-text-secondary hover:bg-card-hover'}`}>
              <Database size={20} className={activeTab === 'dashboard' ? 'text-cyan-primary' : ''} />
              <span className="font-bold">Dashboard</span>
            </button>
            <button onClick={() => setActiveTab('teams')} className={`flex items-center gap-3 p-4 rounded-xl text-left transition-colors border ${activeTab === 'teams' ? 'bg-bg-secondary border-cyan-primary/50 text-white' : 'bg-bg-secondary/50 border-transparent text-text-secondary hover:bg-card-hover'}`}>
              <Users size={20} className={activeTab === 'teams' ? 'text-cyan-primary' : ''} />
              <span className="font-bold">Teams</span>
            </button>
            <button onClick={() => setActiveTab('matches')} className={`flex items-center gap-3 p-4 rounded-xl text-left transition-colors border ${activeTab === 'matches' ? 'bg-bg-secondary border-cyan-primary/50 text-white' : 'bg-bg-secondary/50 border-transparent text-text-secondary hover:bg-card-hover'}`}>
              <Trophy size={20} className={activeTab === 'matches' ? 'text-cyan-primary' : ''} />
              <span className="font-bold">Matches</span>
            </button>
            <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-3 p-4 rounded-xl text-left transition-colors border ${activeTab === 'settings' ? 'bg-bg-secondary border-cyan-primary/50 text-white' : 'bg-bg-secondary/50 border-transparent text-text-secondary hover:bg-card-hover'}`}>
              <Settings size={20} className={activeTab === 'settings' ? 'text-cyan-primary' : ''} />
              <span className="font-bold">Settings</span>
            </button>
            <button onClick={() => setActiveTab('users')} className={`flex items-center gap-3 p-4 rounded-xl text-left transition-colors border ${activeTab === 'users' ? 'bg-bg-secondary border-cyan-primary/50 text-white' : 'bg-bg-secondary/50 border-transparent text-text-secondary hover:bg-card-hover'}`}>
              <Users size={20} className={activeTab === 'users' ? 'text-cyan-primary' : ''} />
              <span className="font-bold">Users</span>
            </button>
            <button onClick={() => setActiveTab('analytics')} className={`flex items-center gap-3 p-4 rounded-xl text-left transition-colors border ${activeTab === 'analytics' ? 'bg-bg-secondary border-cyan-primary/50 text-white' : 'bg-bg-secondary/50 border-transparent text-text-secondary hover:bg-card-hover'}`}>
              <BarChart3 size={20} className={activeTab === 'analytics' ? 'text-cyan-primary' : ''} />
              <span className="font-bold">Analytics</span>
            </button>
          </div>

          {/* Main Content Area */}
          <div className="md:col-span-4 glass-card p-6 min-h-[500px]">
            {activeTab === 'dashboard' && (
              <>
                <h2 className="text-2xl font-bold mb-6 font-display border-b border-[rgba(0,217,255,0.18)] pb-4">Overview</h2>
                <SeedControls />
                
                <div className="mt-12 pt-6 border-t border-red-500/20">
                  <h3 className="text-xl font-bold text-red-400 mb-2 flex items-center gap-2"><ShieldAlert size={20} /> Development Tools</h3>
                  <p className="text-text-secondary text-sm mb-4">These tools are for testing purposes only and affect your current browser or database.</p>
                  
                  <div className="flex flex-col gap-4 max-w-sm">
                    <button 
                      onClick={() => {
                        useUserStore.getState().resetDevice();
                        window.location.href = '/';
                      }}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-3 rounded font-bold transition-colors text-sm text-left"
                    >
                      Reset Device (Clear Local Storage)
                    </button>
                    
                    <button 
                      onClick={() => setShowClearConfirm(true)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded font-bold transition-colors text-sm flex items-center justify-between shadow-lg"
                    >
                      <span className="flex items-center gap-2"><Trash2 size={18} /> Clear Test Data</span>
                    </button>
                  </div>
                </div>
              </>
            )}
            {activeTab === 'teams' && <TeamsManager />}
            {activeTab === 'matches' && <MatchesManager />}
            {activeTab === 'settings' && <SettingsManager />}
            {activeTab === 'users' && <UsersManager />}
            {activeTab === 'analytics' && <PredictionAnalytics />}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-bg-primary border border-red-500/50 rounded-xl p-6 max-w-md w-full shadow-[0_0_50px_rgba(239,68,68,0.2)]">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4 text-red-500">
                <AlertTriangle size={32} />
              </div>
              <h2 className="text-2xl font-bold mb-2">Clear Test Data?</h2>
              <p className="text-gray-300 text-sm">
                This will permanently delete ALL users and ALL predictions.
              </p>
              <p className="text-text-secondary text-sm mt-4 p-3 bg-white/5 rounded-lg border border-[rgba(0,217,255,0.18)]">
                Tournament data (Teams, Matches and Settings) will <strong className="text-white">NOT</strong> be deleted.
              </p>
              <p className="text-red-400 text-sm font-bold mt-4">
                This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowClearConfirm(false)}
                disabled={isClearing}
                className="flex-1 px-4 py-3 rounded-lg font-bold bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  setIsClearing(true);
                  try {
                    await clearTestData();
                    alert("✅ Test users and predictions deleted successfully.");
                    window.location.reload();
                  } catch (err) {
                    console.error(err);
                    alert("Failed to clear data.");
                  } finally {
                    setIsClearing(false);
                    setShowClearConfirm(false);
                  }
                }}
                disabled={isClearing}
                className="flex-1 px-4 py-3 rounded-lg font-bold bg-red-600 hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isClearing ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  'Delete Everything'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AnimatedTransition>
  );
}
