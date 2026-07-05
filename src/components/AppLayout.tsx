import { Outlet } from 'react-router-dom';
import { Navigation } from './Navigation';

export const AppLayout = () => {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col md:flex-row relative">
      <Navigation />
      
      {/* Main Content Area */}
      <main className="flex-1 md:ml-24 pb-16 md:pb-0 min-h-screen relative overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
};
