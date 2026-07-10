import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useUserStore } from './store/useUserStore';
import { getUserData, fetchSettings } from './lib/services';
import LandingPage from './pages/LandingPage';
import RegistrationPage from './pages/RegistrationPage';
import DashboardPage from './pages/ProfilePage';
import BracketPage from './pages/BracketPage';
import FixturesPage from './pages/FixturesPage';
import PredictionFlow from './pages/PredictionFlow';
import ReviewPage from './pages/ReviewPage';
import LeaderboardPage from './pages/LeaderboardPage';
import AdminDashboard from './pages/AdminDashboard';
import SuccessPage from './pages/SuccessPage';
import MaintenancePage from './pages/MaintenancePage';
import HighlightsPage from './pages/HighlightsPage';
import AnalysisPage from './pages/AnalysisPage';
import StreamTestPage from './pages/StreamTestPage';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AppLayout } from './components/AppLayout';

import { Toaster } from 'react-hot-toast';

const MaintenanceGuard = ({ children, status }: { children: React.ReactNode, status: 'Open' | 'Maintenance' }) => {
  const location = useLocation();
  if (status === 'Maintenance' && location.pathname !== '/admin') {
    return <MaintenancePage />;
  }
  return <>{children}</>;
};

// Main App Component
function App() {
  const { entryId, setEntryId, resetDevice, isRegistered, hasSubmitted, setHasSubmitted } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [websiteStatus, setWebsiteStatus] = useState<'Open' | 'Maintenance'>('Open');

  useEffect(() => {
    const initApp = async () => {
      // Fetch global settings
      const settings = await fetchSettings();
      if (settings && settings.websiteStatus) {
        setWebsiteStatus(settings.websiteStatus);
      }

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
    initApp();
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
      <MaintenanceGuard status={websiteStatus}>
        <Routes>
          <Route path="/" element={!isRegistered ? <LandingPage /> : (hasSubmitted ? <Navigate to="/dashboard" replace /> : <Navigate to="/predict" replace />)} />
          <Route path="/register" element={!isRegistered ? <RegistrationPage /> : (hasSubmitted ? <Navigate to="/dashboard" replace /> : <Navigate to="/predict" replace />)} />
          <Route path="/predict" element={isRegistered && !hasSubmitted ? <PredictionFlow /> : (hasSubmitted ? <Navigate to="/dashboard" replace /> : <Navigate to="/" replace />)} />
          <Route path="/review" element={isRegistered && !hasSubmitted ? <ReviewPage /> : (hasSubmitted ? <Navigate to="/dashboard" replace /> : <Navigate to="/" replace />)} />
          <Route path="/success" element={isRegistered && hasSubmitted ? <SuccessPage /> : (isRegistered ? <Navigate to="/predict" replace /> : <Navigate to="/" replace />)} />
          
          {/* Main App Routes with Navigation */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={isRegistered && hasSubmitted ? <DashboardPage /> : (isRegistered ? <Navigate to="/predict" replace /> : <Navigate to="/" replace />)} />
            <Route path="/bracket" element={<BracketPage />} />
            <Route path="/fixtures" element={<FixturesPage />} />
            <Route path="/highlights" element={<HighlightsPage />} />
            <Route path="/highlights/:videoId" element={<HighlightsPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/analysis" element={<AnalysisPage />} />
          </Route>

          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/stream-test" element={<StreamTestPage />} />
        </Routes>
      </MaintenanceGuard>
    </BrowserRouter>
  );
}

export default App;
