import { NavLink, useLocation } from 'react-router-dom';
import { Trophy, PlaySquare, LayoutDashboard, GitCommit, CalendarDays, BarChart3 } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';
import { useIsLive } from '../hooks/useIsLive';
import { cn } from '../utils/cn';

export const Navigation = () => {
  const { isRegistered } = useUserStore();
  const location = useLocation();
  const isLive = useIsLive();

  const navItems = [
    ...(isRegistered ? [{
      label: 'Dashboard',
      icon: <LayoutDashboard size={24} />,
      to: '/dashboard',
      action: undefined
    }] : [{
      label: 'Analysis',
      icon: <BarChart3 size={24} />,
      to: '/analysis',
      action: undefined
    }]),
    {
      label: 'Bracket',
      icon: <GitCommit size={24} className="rotate-90" />,
      to: '/bracket',
      action: undefined
    },
    {
      label: 'Highlights',
      icon: <PlaySquare size={24} />,
      to: '/highlights',
      action: undefined,
      isSpecial: true
    },
    {
      label: 'Fixtures',
      icon: <CalendarDays size={24} />,
      to: '/fixtures',
      action: undefined
    },
    {
      label: 'Leaderboard',
      icon: <Trophy size={24} />,
      to: '/leaderboard',
      action: undefined
    }
  ];

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-bg-secondary/90 backdrop-blur-xl border-t border-[rgba(0,217,255,0.18)] z-50 pb-safe">
        <div className="flex items-center justify-around h-16 px-2 relative">
          {navItems.map((item, idx) => {
            const isActive = item.to !== '#' && location.pathname === item.to;
            const isSpecial = (item as any).isSpecial;

            return (
              <button
                key={idx}
                className={cn(
                  "flex flex-col items-center justify-center w-full space-y-1 transition-colors relative group h-full",
                  isActive && !isSpecial ? "text-cyan-primary" : "text-text-secondary hover:text-white"
                )}
              >
                {isSpecial ? (
                  <NavLink to={item.to} className="flex flex-col items-center justify-center absolute -top-6 left-1/2 -translate-x-1/2 group">
                    {isLive && (
                      <div className="absolute -top-3 bg-red-600 text-white text-[8px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap animate-pulse border border-white/20 shadow-[0_0_10px_rgba(220,38,38,0.8)] z-10">
                        LIVE NOW
                      </div>
                    )}
                    <div className={cn(
                      "w-16 h-16 rounded-full flex flex-col items-center justify-center shadow-[0_0_20px_rgba(0,217,255,0.5)] transition-all duration-300",
                      isActive ? "bg-cyan-primary scale-125 text-white shadow-[0_0_30px_#00d9ff] border-2 border-white" : "bg-cyan-primary text-navy-900 group-hover:bg-white group-hover:text-cyan-primary group-hover:scale-110"
                    )}>
                      <PlaySquare size={26} />
                    </div>
                    <span className={cn(
                      "text-[9px] font-bold uppercase tracking-wider mt-1 transition-all duration-300",
                      isActive ? "opacity-0 h-0 overflow-hidden" : "text-text-secondary opacity-100"
                    )}>Highlights</span>
                  </NavLink>
                ) : (
                  <>
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
                  </>
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
            const isSpecial = (item as any).isSpecial;
            return (
              <button
                key={idx}
                className={cn(
                  "flex flex-col items-center justify-center w-full py-4 transition-all relative group",
                  isActive ? "text-cyan-primary" : "text-text-secondary hover:text-white hover:bg-white/5"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-primary rounded-r-full shadow-[0_0_10px_rgba(0,217,255,0.8)]" />
                )}
                {item.to !== '#' ? (
                  <NavLink to={item.to} className="flex flex-col items-center w-full group-hover:scale-110 transition-transform relative">
                    {isSpecial && isLive && (
                      <div className="absolute -top-1 lg:right-2 right-1 bg-red-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap animate-pulse border border-white/20 shadow-[0_0_10px_rgba(220,38,38,0.8)] z-10">
                        LIVE NOW
                      </div>
                    )}
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
