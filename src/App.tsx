import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useUserStore } from './store/useUserStore';
import { getUserData } from './lib/services';
import LandingPage from './pages/LandingPage';
import RegistrationPage from './pages/RegistrationPage';
import Dashboard from './pages/Dashboard';
import PredictionFlow from './pages/PredictionFlow';
import ReviewPage from './pages/ReviewPage';
import LeaderboardPage from './pages/LeaderboardPage';
import AdminDashboard from './pages/AdminDashboard';
import SuccessPage from './pages/SuccessPage';
import { OfflineIndicator } from './components/OfflineIndicator';

import { Toaster } from 'react-hot-toast';

// Main App Component
function App() {
  const { entryId, setEntryId, resetDevice, isRegistered, hasSubmitted, setHasSubmitted } = useUserStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      if (entryId) {
        // Fetch user data from Firebase
        const data = await getUserData(entryId);
        if (data) {
          // If valid user exists in db, ensure local store is synced
          setEntryId(entryId);
          setHasSubmitted(!!data.submittedAt || data.status !== 'Still Alive' && data.status !== undefined);
        } else {
          // Invalid Entry ID: Remove it from localStorage
          resetDevice();
        }
      }
      setLoading(false);
    };
    checkUser();
  }, [entryId, setEntryId, resetDevice, setHasSubmitted]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-primary"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster position="top-center" toastOptions={{ style: { background: '#101722', color: '#fff', border: '1px solid #00D9FF' } }} />
      <OfflineIndicator />
      <Routes>
        <Route path="/" element={!isRegistered ? <LandingPage /> : (hasSubmitted ? <Navigate to="/dashboard" replace /> : <Navigate to="/predict" replace />)} />
        <Route path="/register" element={!isRegistered ? <RegistrationPage /> : (hasSubmitted ? <Navigate to="/dashboard" replace /> : <Navigate to="/predict" replace />)} />
        <Route path="/predict" element={isRegistered && !hasSubmitted ? <PredictionFlow /> : (hasSubmitted ? <Navigate to="/dashboard" replace /> : <Navigate to="/" replace />)} />
        <Route path="/review" element={isRegistered && !hasSubmitted ? <ReviewPage /> : (hasSubmitted ? <Navigate to="/dashboard" replace /> : <Navigate to="/" replace />)} />
        <Route path="/success" element={isRegistered && hasSubmitted ? <SuccessPage /> : (isRegistered ? <Navigate to="/predict" replace /> : <Navigate to="/" replace />)} />
        <Route path="/dashboard" element={isRegistered && hasSubmitted ? <Dashboard /> : (isRegistered ? <Navigate to="/predict" replace /> : <Navigate to="/" replace />)} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
