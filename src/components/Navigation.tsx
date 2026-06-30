import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Trophy, PlaySquare, User } from 'lucide-react';
import { cn } from '../utils/cn';

interface Props {
  onOpenLeaderboard: () => void;
  onOpenProfile: () => void;
}

export const Navigation = ({ onOpenLeaderboard, onOpenProfile }: Props) => {
  const location = useLocation();

  const navItems = [
    {
      label: 'Dashboard',
      icon: <LayoutDashboard size={24} />,
      to: '/dashboard',
      action: null
    },
    {
      label: 'Leaderboard',
      icon: <Trophy size={24} />,
      to: '#',
      action: onOpenLeaderboard
    },
    {
      label: 'Highlights',
      icon: <PlaySquare size={24} />,
      to: '/highlights',
      action: null
    },
    {
      label: 'Profile',
      icon: <User size={24} />,
      to: '#',
      action: onOpenProfile
    }
  ];

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-bg-secondary/90 backdrop-blur-xl border-t border-[rgba(0,217,255,0.18)] z-50 pb-safe">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item, idx) => {
            const isActive = item.to !== '#' && location.pathname === item.to;
            return (
              <button
                key={idx}
                onClick={() => {
                  if (item.action) item.action();
                }}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors relative group",
                  isActive ? "text-cyan-primary" : "text-text-secondary hover:text-white"
                )}
              >
                {item.to !== '#' ? (
                  <NavLink to={item.to} className="flex flex-col items-center w-full">
                    {item.icon}
                    <span className="text-[10px] font-bold uppercase tracking-wider mt-1">{item.label}</span>
                  </NavLink>
                ) : (
                  <div className="flex flex-col items-center w-full">
                    {item.icon}
                    <span className="text-[10px] font-bold uppercase tracking-wider mt-1">{item.label}</span>
                  </div>
                )}
                {isActive && (
                  <div className="absolute top-0 w-8 h-1 bg-cyan-primary rounded-b-full shadow-[0_0_10px_rgba(0,217,255,0.8)]" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Desktop Side/Top Navigation */}
      <nav className="hidden md:flex fixed top-0 left-0 h-screen w-24 bg-bg-secondary/90 backdrop-blur-xl border-r border-[rgba(0,217,255,0.18)] z-50 flex-col items-center py-8">
        <div className="mb-12">
          {/* Brand Icon or Logo could go here */}
          <div className="w-12 h-12 rounded-full bg-cyan-primary/20 border border-cyan-primary flex items-center justify-center text-cyan-primary font-display font-bold text-xl shadow-[0_0_15px_rgba(0,217,255,0.3)]">
            FR
          </div>
        </div>
        <div className="flex flex-col gap-8 w-full">
          {navItems.map((item, idx) => {
            const isActive = item.to !== '#' && location.pathname === item.to;
            return (
              <button
                key={idx}
                onClick={() => {
                  if (item.action) item.action();
                }}
                className={cn(
                  "flex flex-col items-center justify-center w-full py-4 transition-all relative group",
                  isActive ? "text-cyan-primary" : "text-text-secondary hover:text-white hover:bg-white/5"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-primary rounded-r-full shadow-[0_0_10px_rgba(0,217,255,0.8)]" />
                )}
                {item.to !== '#' ? (
                  <NavLink to={item.to} className="flex flex-col items-center w-full group-hover:scale-110 transition-transform">
                    {item.icon}
                    <span className="text-[10px] font-bold uppercase tracking-wider mt-2">{item.label}</span>
                  </NavLink>
                ) : (
                  <div className="flex flex-col items-center w-full group-hover:scale-110 transition-transform">
                    {item.icon}
                    <span className="text-[10px] font-bold uppercase tracking-wider mt-2">{item.label}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
